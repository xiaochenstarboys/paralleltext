const mockTranslatorManagerStart = jest.fn();
let mockIsIframe = false;

jest.mock("./config", () => ({
  OPT_HIGHLIGHT_WORDS_DISABLE: "-",
}));

jest.mock("./libs/storage", () => ({
  getSettingWithDefault: jest.fn(),
  getFabWithDefault: jest.fn(),
  runDataMigration: jest.fn(() => Promise.resolve()),
}));

jest.mock("./libs/iframe", () => ({
  get isIframe() {
    return mockIsIframe;
  },
}));

jest.mock("./libs/rules", () => ({
  matchRule: jest.fn(),
}));

jest.mock("./libs/blacklist", () => ({
  isInBlacklist: jest.fn(() => false),
}));

jest.mock("./libs/log", () => ({
  logger: {
    setLevel: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("./libs/translatorManager", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    start: mockTranslatorManagerStart,
  })),
}));

jest.mock("./libs/wordHighlight", () => ({
  initWordBookHighlight: jest.fn(),
}));

const { getSettingWithDefault, getFabWithDefault } = require("./libs/storage");
const { matchRule } = require("./libs/rules");
const { isInBlacklist } = require("./libs/blacklist");
const TranslatorManager = require("./libs/translatorManager").default;
const { run } = require("./common");

function setReadyState(value) {
  Object.defineProperty(document, "readyState", {
    configurable: true,
    value,
  });
}

function setContentType(value) {
  Object.defineProperty(document, "contentType", {
    configurable: true,
    value,
  });
}

describe("common iframe startup", () => {
  beforeEach(() => {
    document.documentElement.innerHTML = "<head></head><body></body>";
    setReadyState("complete");
    setContentType("text/html");
    mockIsIframe = false;
    jest.clearAllMocks();
    isInBlacklist.mockImplementation(() => false);

    TranslatorManager.mockImplementation(() => ({
      start: mockTranslatorManagerStart,
    }));
    getSettingWithDefault.mockResolvedValue({
      blacklist: "",
      tranboxSetting: { blacklist: "", transOpen: true },
      inputRule: { blacklist: "", transOpen: true },
      mouseHoverSetting: { blacklist: "", useMouseHover: true },
      logLevel: 1,
    });
    getFabWithDefault.mockResolvedValue({ isHide: false });
    matchRule.mockResolvedValue({
      transOpen: "true",
    });
  });

  test("starts translator manager for iframe with text", async () => {
    mockIsIframe = true;
    document.body.innerHTML = "<main>Hello iframe</main>";

    await run();

    expect(matchRule).toHaveBeenCalledTimes(1);
    expect(TranslatorManager).toHaveBeenCalledTimes(1);
    expect(mockTranslatorManagerStart).toHaveBeenCalledTimes(1);
  });

  test("skips empty iframe before rule matching and manager startup", async () => {
    mockIsIframe = true;
    document.body.innerHTML = `
      <script>const text = "ignored";</script>
      <style>.ignored { color: red; }</style>
      <textarea>ignored</textarea>
    `;

    await run();

    expect(matchRule).not.toHaveBeenCalled();
    expect(TranslatorManager).not.toHaveBeenCalled();
    expect(mockTranslatorManagerStart).not.toHaveBeenCalled();
  });

  test("waits for DOMContentLoaded before skipping loading iframe", async () => {
    mockIsIframe = true;
    setReadyState("loading");

    const running = run();
    await Promise.resolve();

    document.body.innerHTML = "<p>Late iframe text</p>";
    setReadyState("interactive");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    await running;

    expect(matchRule).toHaveBeenCalledTimes(1);
    expect(TranslatorManager).toHaveBeenCalledTimes(1);
    expect(mockTranslatorManagerStart).toHaveBeenCalledTimes(1);
  });

  test("does not apply empty-text gate to top-level pages", async () => {
    mockIsIframe = false;

    await run();

    expect(matchRule).toHaveBeenCalledTimes(1);
    expect(TranslatorManager).toHaveBeenCalledTimes(1);
    expect(mockTranslatorManagerStart).toHaveBeenCalledTimes(1);
  });

  test("inverts the FAB visibility when the top-level page matches its exception list", async () => {
    getFabWithDefault.mockResolvedValue({
      isHide: false,
      hideExceptionList: "kiss.example",
    });
    isInBlacklist.mockImplementation(
      (_href, blacklist) => blacklist === "kiss.example"
    );

    await run();

    expect(TranslatorManager.mock.calls[0][0].fabConfig).toEqual({
      isHide: true,
      hideExceptionList: "kiss.example",
    });
  });

  test("shows the FAB when a hidden global setting matches its exception list", async () => {
    getFabWithDefault.mockResolvedValue({
      isHide: true,
      hideExceptionList: "kiss.example",
    });
    isInBlacklist.mockImplementation(
      (_href, blacklist) => blacklist === "kiss.example"
    );

    await run();

    expect(TranslatorManager.mock.calls[0][0].fabConfig.isHide).toBe(false);
  });

  test("starts transbox-only manager for PDF documents", async () => {
    setContentType("application/pdf");

    await run();

    expect(matchRule).toHaveBeenCalledTimes(1);
    expect(TranslatorManager).toHaveBeenCalledTimes(1);
    expect(TranslatorManager.mock.calls[0][0].transboxOnly).toBe(true);
    expect(mockTranslatorManagerStart).toHaveBeenCalledTimes(1);
  });

  test("skips non-PDF media documents before rule matching and manager startup", async () => {
    setContentType("image/png");

    await run();

    expect(matchRule).not.toHaveBeenCalled();
    expect(TranslatorManager).not.toHaveBeenCalled();
    expect(mockTranslatorManagerStart).not.toHaveBeenCalled();
  });
});

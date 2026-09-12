const mockTranslatorInstances = [];
const mockTranslatorArgs = [];
const mockInputTranslatorInstances = [];
const activeManagers = [];

jest.mock("../config", () => ({
  EVENT_KISS_TRANSLATOR: "kiss-translator",
  MSG_HOVERNODE_TOGGLE: "hovernode-toggle",
  MSG_INPUT_TRANSLATE: "input-translate",
  MSG_TRANS_TOGGLE: "trans-toggle",
  MSG_TRANS_TOGGLE_ONLY: "trans-toggle-only",
  MSG_TRANS_TOGGLE_STYLE: "trans-toggle-style",
  MSG_TRANS_GETRULE: "trans-getrule",
  MSG_TRANS_PUTRULE: "trans-putrule",
  MSG_OPEN_TRANBOX: "open-tranbox",
  MSG_TRANSBOX_TOGGLE: "transbox-toggle",
  MSG_POPUP_TOGGLE: "popup-toggle",
  MSG_FAB_TOGGLE: "fab-toggle",
  MSG_MOUSEHOVER_TOGGLE: "mousehover-toggle",
  MSG_TRANSINPUT_TOGGLE: "transinput-toggle",
  STOKEY_FAB: "ParallelText_fab",
  STOKEY_SETTING: "ParallelText_setting",
  MSG_UI_SETTINGS_UPDATE: "ui-settings-update",
}));
jest.mock("./storage", () => ({
  STORAGE_CHANGE_EVENT: "setting-change",
  mergeSettingWithDefault: (setting) => setting,
  getSettingWithDefault: jest.fn(),
  storage: { getObj: jest.fn(async () => ({})), setObj: jest.fn() },
}));

jest.mock("./client", () => ({
  isExt: true,
}));

jest.mock("./browser", () => ({
  browser: {
    runtime: {
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      sendMessage: jest.fn(() => Promise.resolve(true)),
    },
    storage: {
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
  },
}));

                                                              
const mockSendUiCommand = jest.fn();
const mockEnsureContentUi = jest.fn(() => Promise.resolve());
const mockIsContentUiReady = jest.fn(() => false);
jest.mock("./uiBridge", () => ({
  initUiBridge: jest.fn(),
  sendUiCommand: (...args) => mockSendUiCommand(...args),
  ensureContentUi: (...args) => mockEnsureContentUi(...args),
  isContentUiReady: () => mockIsContentUiReady(),
}));

jest.mock("./translator", () => ({
  Translator: jest.fn(),
}));

jest.mock("./inputTranslate", () => ({
  InputTranslator: jest.fn(),
}));

jest.mock("./touch", () => ({
  touchTapListener: jest.fn(() => jest.fn()),
}));

jest.mock("./iframe", () => ({
  sendIframeMsg: jest.fn(),
}));

jest.mock("./log", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const { browser } = require("./browser");
const { Translator } = require("./translator");
const { InputTranslator } = require("./inputTranslate");
const { initUiBridge } = require("./uiBridge");
const TranslatorManager = require("./translatorManager").default;

function setupMockConstructors() {
  Translator.mockImplementation((args) => {
    mockTranslatorArgs.push(args);
    const instance = {
      setting: args.setting,
      rule: args.rule,
      stop: jest.fn(function stop() {
        this.rule.transOpen = "false";
      }),
      rescan: jest.fn(),
      toggle: jest.fn(),
      toggleTransOnly: jest.fn(),
      toggleStyle: jest.fn(),
      updateRule: jest.fn(),
      updateSetting: jest.fn(function updateSetting(setting) { this.setting = setting; }),
      toggleTransbox: jest.fn(function toggleTransbox(enabled) {
        this.setting.tranboxSetting.transOpen =
          typeof enabled === "boolean" ? enabled : !this.setting.tranboxSetting.transOpen;
      }),
      toggleMouseHover: jest.fn(),
      toggleInputTranslate: jest.fn(function toggleInputTranslate() {
        this.setting.inputRule.transOpen = !this.setting.inputRule.transOpen;
      }),
      toggleHoverNode: jest.fn(),
    };
    mockTranslatorInstances.push(instance);
    return instance;
  });

  InputTranslator.mockImplementation(() => {
    const instance = {
      disable: jest.fn(),
      toggle: jest.fn(),
      handleTranslate: jest.fn(),
    };
    mockInputTranslatorInstances.push(instance);
    return instance;
  });
}

function createManager({
  rule = { transOpen: "true" },
  setting = {},
  transboxOnly = false,
} = {}) {
  const manager = new TranslatorManager({
    setting: {
      touchModes: [],
      shortcuts: {},
      tranboxSetting: { transOpen: true },
      inputRule: { transOpen: true },
      contextMenuType: 0,
      ...setting,
    },
    rule,
    fabConfig: { isHide: false },
    favWords: [],
    isIframe: false,
    transboxOnly,
  });
  activeManagers.push(manager);
  return manager;
}

function replaceBody() {
  const newBody = document.createElement("body");
  document.body.replaceWith(newBody);
}

async function flushMutationObserver() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("TranslatorManager SPA lifecycle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.documentElement.innerHTML = "<head></head><body></body>";
    jest.clearAllMocks();

    mockTranslatorInstances.length = 0;
    mockTranslatorArgs.length = 0;
    mockInputTranslatorInstances.length = 0;
    activeManagers.length = 0;
    setupMockConstructors();
  });

  afterEach(() => {
    activeManagers.forEach((manager) => manager.stop());
    activeManagers.length = 0;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("restarts runtime modules when body is replaced", async () => {
    const manager = createManager();
    manager.start();

    replaceBody();
    await flushMutationObserver();
    jest.runOnlyPendingTimers();

    expect(Translator).toHaveBeenCalledTimes(2);
    expect(mockTranslatorInstances[0].stop).toHaveBeenCalledTimes(1);
    expect(browser.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  test("does not restart after stop", async () => {
    const manager = createManager();
    manager.start();
    manager.stop();

    replaceBody();
    await flushMutationObserver();
    jest.runOnlyPendingTimers();

    expect(Translator).toHaveBeenCalledTimes(1);
  });

  test("routes fab visibility toggle through the UI bridge", () => {
    const manager = createManager();
    manager.start();

    const handler = browser.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse = jest.fn();

    handler({ action: "fab-toggle", args: { isHide: true } }, {}, sendResponse);
    expect(mockSendUiCommand).toHaveBeenCalledWith(
      "fab-toggle",
      { isHide: true },
      expect.objectContaining({ fabConfig: expect.any(Object) })
    );

    handler(
      { action: "fab-toggle", args: { isHide: false } },
      {},
      sendResponse
    );
    expect(mockSendUiCommand).toHaveBeenCalledWith(
      "fab-toggle",
      { isHide: false },
      expect.anything()
    );
  });

  test("routes fab storage changes through the UI bridge", () => {
    const manager = createManager();
    manager.start();

    const storageHandler =
      browser.storage.onChanged.addListener.mock.calls[0][0];

    storageHandler(
      { ParallelText_fab: { newValue: { isHide: true } } },
      "local"
    );
    expect(mockSendUiCommand).toHaveBeenCalledWith(
      "fab-toggle",
      { isHide: true },
      expect.anything()
    );

    storageHandler(
      { ParallelText_fab: { newValue: { isHide: false } } },
      "local"
    );
    expect(mockSendUiCommand).toHaveBeenCalledWith(
      "fab-toggle",
      { isHide: false },
      expect.anything()
    );
  });

  test("storage updates reach an existing translator and selection UI without reopening", () => {
    const manager = createManager(); manager.start(); mockIsContentUiReady.mockReturnValue(true);
    const settings = { tranboxSetting: { transOpen: false, apiSlugs: ["DeepSeek"] },
      transApis: [{ apiSlug: "Qwen", isDisabled: true }, { apiSlug: "DeepSeek", isDisabled: false }] };
    browser.storage.onChanged.addListener.mock.calls.forEach(([handler]) => handler({
      ParallelText_setting: { newValue: JSON.stringify(settings) },
    }, "local"));
    expect(mockTranslatorInstances[0].setting).toEqual(settings);
    expect(mockSendUiCommand).toHaveBeenCalledWith("ui-settings-update", settings, expect.objectContaining({ setting: settings }));
    const messageHandler = browser.runtime.onMessage.addListener.mock.calls[0][0];
    messageHandler({ action: "transbox-toggle", args: { transOpen: true } }, {}, jest.fn());
    messageHandler({ action: "transbox-toggle", args: { transOpen: true } }, {}, jest.fn());
    expect(mockTranslatorInstances[0].setting.tranboxSetting.transOpen).toBe(true);
    expect(mockSendUiCommand).toHaveBeenLastCalledWith("transbox-toggle", { transOpen: true }, expect.objectContaining({
      setting: expect.objectContaining({ tranboxSetting: expect.objectContaining({ transOpen: true }) }),
    }));
  });

  test("preserves disabled translation settings across restart", async () => {
    const manager = createManager({
      rule: { transOpen: "false" },
      setting: {
        tranboxSetting: { transOpen: false },
        inputRule: { transOpen: false },
      },
    });
    manager.start();

    replaceBody();
    await flushMutationObserver();
    jest.runOnlyPendingTimers();

    expect(mockTranslatorArgs[1].rule.transOpen).toBe("false");
    expect(mockTranslatorArgs[1].setting.inputRule.transOpen).toBe(false);
  });

  test("coalesces navigation rescan and body replacement into one restart", async () => {
    const manager = createManager();
    manager.start();

    document.documentElement.dispatchEvent(new Event("turbo:load"));
    replaceBody();
    await flushMutationObserver();
    jest.runOnlyPendingTimers();

    expect(Translator).toHaveBeenCalledTimes(2);
    expect(mockTranslatorInstances[0].rescan).not.toHaveBeenCalled();
  });

  test("rescans on bfcache pageshow when the document container is unchanged", () => {
    const manager = createManager();
    manager.start();

    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true })
    );
    jest.runOnlyPendingTimers();

    expect(mockTranslatorInstances[0].rescan).toHaveBeenCalledTimes(1);
    expect(Translator).toHaveBeenCalledTimes(1);
  });

  test("transbox-only mode skips core modules and ensures UI injection", () => {
    const manager = createManager({ transboxOnly: true });
    manager.start();

    expect(Translator).not.toHaveBeenCalled();
    expect(InputTranslator).not.toHaveBeenCalled();
    expect(initUiBridge).toHaveBeenCalledTimes(1);
                                                                 
    expect(mockSendUiCommand).toHaveBeenCalledWith(
      null,
      null,
      expect.objectContaining({ transboxOnly: true })
    );
    expect(browser.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
  });

  test("routes open-tranbox through the UI bridge with args", () => {
    const manager = createManager({ transboxOnly: true });
    manager.start();

    const runtimeHandler =
      browser.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse = jest.fn();
    runtimeHandler(
      { action: "open-tranbox", args: { text: "hello" } },
      {},
      sendResponse
    );

    expect(mockSendUiCommand).toHaveBeenCalledWith(
      "open-tranbox",
      { text: "hello" },
      expect.anything()
    );
  });

  test("cleans up listeners on stop", () => {
    const manager = createManager({ transboxOnly: true });
    manager.start();
    manager.stop();

    expect(browser.runtime.onMessage.removeListener).toHaveBeenCalledWith(
      browser.runtime.onMessage.addListener.mock.calls[0][0]
    );
  });

  test("routes popup toggle through the UI bridge", () => {
    const manager = createManager();
    manager.start();

    const handler = browser.runtime.onMessage.addListener.mock.calls[0][0];
    handler({ action: "popup-toggle" }, {}, jest.fn());

    expect(mockSendUiCommand).toHaveBeenCalledWith(
      "popup-toggle",
      undefined,
      expect.anything()
    );
  });
});

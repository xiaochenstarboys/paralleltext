jest.mock("./browser", () => ({
  browser: {
    i18n: {
      detectLanguage: jest.fn(),
    },
  },
}));

jest.mock("../apis", () => ({
  apiGoogleLangdetect: jest.fn(),
}));

const { apiGoogleLangdetect } = require("../apis");
const { OPT_TRANS_GOOGLE } = require("../config");
const { browser } = require("./browser");
const { tryDetectLang, clearDetectCache } = require("./detect");

describe("tryDetectLang", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearDetectCache();                       
  });

  test.each([
    ["zh-Hant", "zh-TW"],
    ["zh-HK", "zh-TW"],
    ["en-US", "en"],
    ["pt-BR", "pt"],
  ])("normalizes browser result %s to %s", async (language, expected) => {
    browser.i18n.detectLanguage.mockResolvedValue({
      isReliable: true,
      languages: [{ language, percentage: 100 }],
    });

    await expect(tryDetectLang("sample text")).resolves.toBe(expected);
  });

  test("keeps Google's generic Chinese result as simplified Chinese", async () => {
    apiGoogleLangdetect.mockResolvedValue("zh");

    await expect(tryDetectLang("中文测试文本", OPT_TRANS_GOOGLE)).resolves.toBe(
      "zh-CN"
    );
    expect(browser.i18n.detectLanguage).not.toHaveBeenCalled();
  });

  test("falls back to the browser when a provider result is unsupported", async () => {
    apiGoogleLangdetect.mockResolvedValue("unknown-provider-code");
    browser.i18n.detectLanguage.mockResolvedValue({
      isReliable: true,
      languages: [{ language: "en-GB", percentage: 100 }],
    });

    await expect(
      tryDetectLang("English sample text", OPT_TRANS_GOOGLE)
    ).resolves.toBe("en");
  });
});

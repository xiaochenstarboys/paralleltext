import {
  STOKEY_SETTING,
  STOKEY_SETTING_BACKUP_V1_BEFORE_V2,
  SETTINGS_VERSION_V3,
  OPT_TRANS_DEEPSEEK,
  OPT_TRANS_OPENAI,
  APP_NAME,
} from "../config";
import { getSettingWithDefault, getRules, runDataMigration } from "./storage";

                                                
jest.mock("@streamparser/json", () => ({ JSONParser: jest.fn() }));
                                                          
jest.mock("webextension-polyfill", () => ({}));

const readStoredJson = (key) => JSON.parse(window.localStorage.getItem(key));

describe("settings storage migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("1.0 reads settings and webpage rules saved by 0.0.1", async () => {
    const previousSettings = {
      version: SETTINGS_VERSION_V3,
      uiLang: "zh_TW",
      colorTheme: "green",
      tranboxSetting: { transOpen: false, toLang: "ja" },
    };
    const previousRules = [
      { pattern: "example.com", toLang: "ja", transOpen: false },
    ];
    window.localStorage.setItem(
      `${APP_NAME}_setting_v0`,
      JSON.stringify(previousSettings)
    );
    window.localStorage.setItem(
      `${APP_NAME}_rules_v0`,
      JSON.stringify(previousRules)
    );
    await expect(getSettingWithDefault()).resolves.toMatchObject(
      previousSettings
    );
    await expect(getRules()).resolves.toEqual(previousRules);
  });

  test("upgrades direct selection once without enabling a disabled feature or overriding later choices", async () => {
    const stored = {
      version: SETTINGS_VERSION_V3,
      tranboxSetting: { transOpen: false, triggerMode: "click", toLang: "ja" },
    };
    window.localStorage.setItem(STOKEY_SETTING, JSON.stringify(stored));
    await runDataMigration();
    const migrated = readStoredJson(STOKEY_SETTING);
    expect(migrated.tranboxSetting).toMatchObject({
      transOpen: false,
      triggerMode: "select",
      toLang: "ja",
    });
    migrated.tranboxSetting.triggerMode = "dblclick";
    window.localStorage.setItem(STOKEY_SETTING, JSON.stringify(migrated));
    await runDataMigration();
    expect(readStoredJson(STOKEY_SETTING).tranboxSetting.triggerMode).toBe(
      "dblclick"
    );
  });

  test("runDataMigration backs up raw v1 settings and stores current settings", async () => {
    const oldSetting = {
      uiLang: "zh-CN",
      transApis: [
        {
          apiSlug: "openai",
          apiName: "OpenAI",
          systemPrompt: "custom batch prompt",
        },
      ],
    };
    window.localStorage.setItem(STOKEY_SETTING, JSON.stringify(oldSetting));

    await runDataMigration();

    const backup = readStoredJson(STOKEY_SETTING_BACKUP_V1_BEFORE_V2);
    const stored = readStoredJson(STOKEY_SETTING);

    expect(backup).toEqual(oldSetting);
    expect(stored.version).toBe(SETTINGS_VERSION_V3);
    expect(stored.transApis[0].batchPromptSlug).toMatch(
      /^prompt_migrated_batch_/
    );
    expect(stored.transApis[0]).not.toHaveProperty("systemPrompt");
  });

  test("getSettingWithDefault returns current settings for stored v1 data", async () => {
    const oldSetting = {
      uiLang: "zh",
      transApis: [
        {
          apiSlug: "openai",
          apiName: "OpenAI",
          apiType: OPT_TRANS_OPENAI,
          systemPrompt: "custom batch prompt",
        },
      ],
    };
    window.localStorage.setItem(STOKEY_SETTING, JSON.stringify(oldSetting));

    const setting = await getSettingWithDefault();

    expect(setting.version).toBe(SETTINGS_VERSION_V3);
    expect(setting.transApis[0].batchPromptSlug).toMatch(
      /^prompt_migrated_batch_/
    );
    expect(setting.transApis[0]).not.toHaveProperty("systemPrompt");
  });

  test("merges the language variant default without overriding an explicit choice", async () => {
    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({ version: SETTINGS_VERSION_V3, uiLang: "zh" })
    );
    await expect(getSettingWithDefault()).resolves.toMatchObject({
      translateVariants: true,
    });

    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({
        version: SETTINGS_VERSION_V3,
        translateVariants: false,
      })
    );
    await expect(getSettingWithDefault()).resolves.toMatchObject({
      translateVariants: false,
    });
  });

  test("keeps clipboard auto-translation opt-in for existing settings", async () => {
    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({ version: SETTINGS_VERSION_V3, uiLang: "zh" })
    );
    await expect(getSettingWithDefault()).resolves.toMatchObject({
      autoTranslateClipboard: false,
    });

    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({
        version: SETTINGS_VERSION_V3,
        autoTranslateClipboard: true,
      })
    );
    await expect(getSettingWithDefault()).resolves.toMatchObject({
      autoTranslateClipboard: true,
    });
  });

  test("does not replace explicitly stored custom entry points", async () => {
    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({
        version: SETTINGS_VERSION_V3,
        inputRule: { apiSlug: OPT_TRANS_DEEPSEEK },
        tranboxSetting: { apiSlugs: [OPT_TRANS_DEEPSEEK] },
      })
    );

    await expect(getSettingWithDefault()).resolves.toMatchObject({
      inputRule: { apiSlug: OPT_TRANS_DEEPSEEK },
      tranboxSetting: { apiSlugs: [OPT_TRANS_DEEPSEEK] },
    });
  });

  test("normalizes legacy default thinking effort only in the loaded setting", async () => {
    const storedSetting = {
      version: SETTINGS_VERSION_V3,
      transApis: [
        {
          apiSlug: "openai",
          apiType: OPT_TRANS_OPENAI,
          model: "gpt-5.6-sol",
          thinkingMode: "enabled",
          thinkingEffort: "_default",
        },
      ],
    };
    window.localStorage.setItem(STOKEY_SETTING, JSON.stringify(storedSetting));

    const setting = await getSettingWithDefault();

    expect(setting.transApis[0].thinkingEffort).toBeNull();
    expect(readStoredJson(STOKEY_SETTING)).toEqual(storedSetting);
  });

  test("normalizes thinking settings for a fresh installation", async () => {
    const setting = await getSettingWithDefault();
    const deepseek = setting.transApis.find(
      (api) => api.apiType === OPT_TRANS_DEEPSEEK
    );

    expect(deepseek).toMatchObject({
      thinkingMode: "disabled",
      thinkingEffort: null,
    });
  });
});

import {
  API_SPE_TYPES,
  DEFAULT_API_LIST,
  DEFAULT_API_TYPE,
  getThinkingCapability,
  normalizeThinkingSettings,
  normalizeApiThinkingSettings,
  normalizeApiModelListUrls,
  normalizeApiBuiltinModels,
  OPT_TRANS_QWEN,
  OPT_TRANS_DEEPSEEK,
  OPT_TRANS_OPENAI,
  OPT_TRANS_CUSTOMIZE,
} from "./api";

test("uses Qwen as the fallback default API", () => {
  expect(DEFAULT_API_TYPE).toBe(OPT_TRANS_QWEN);
});

test("includes Qwen in the built-in API list", () => {
  expect(DEFAULT_API_LIST.some((api) => api.apiType === OPT_TRANS_QWEN)).toBe(
    true
  );
});

test("all AI APIs define a thinking mode by default", () => {
  for (const apiType of API_SPE_TYPES.ai) {
    const api = DEFAULT_API_LIST.find((item) => item.apiType === apiType);
    expect(api).toBeDefined();
    expect(["auto", "enabled", "disabled"]).toContain(api.thinkingMode);
  }
});

test("keeps disabled as the initial thinking mode", () => {
  for (const apiType of API_SPE_TYPES.ai) {
    const api = DEFAULT_API_LIST.find((item) => item.apiType === apiType);
    expect(api.thinkingMode).toBe("disabled");
  }
});

describe("unified thinking capabilities", () => {
  test.each(["gpt-5.6-sol", "gpt-5.4-pro", "gpt-5.3-codex", "gpt-5"])(
    "keeps the OpenAI interface default for model %s",
    (model) => {
      expect(
        normalizeThinkingSettings({
          apiType: OPT_TRANS_OPENAI,
          model,
          thinkingMode: "enabled",
        }).thinkingEffort
      ).toBeNull();
      expect(
        normalizeThinkingSettings({
          apiType: OPT_TRANS_OPENAI,
          model,
          thinkingMode: "disabled",
        })
      ).toEqual({ thinkingMode: "disabled", thinkingEffort: "none" });
    }
  );

  test.each(["gpt-5.1", "gpt-5.1-2025-11-13"])(
    "enables GPT-5.1 with its lowest non-disabled effort for model %s",
    (model) => {
      expect(
        normalizeThinkingSettings({
          apiType: OPT_TRANS_OPENAI,
          model,
          thinkingMode: "enabled",
        })
      ).toEqual({ thinkingMode: "enabled", thinkingEffort: "low" });
      expect(
        normalizeThinkingSettings({
          apiType: OPT_TRANS_OPENAI,
          model,
          thinkingMode: "disabled",
        })
      ).toEqual({ thinkingMode: "disabled", thinkingEffort: "none" });
    }
  );

  test("does not guess thinking parameters for unknown models", () => {
    expect(
      getThinkingCapability({
        apiType: OPT_TRANS_OPENAI,
        model: "unknown-model",
      })
    ).toBeNull();
    expect(
      normalizeThinkingSettings({
        apiType: OPT_TRANS_OPENAI,
        model: "unknown-model",
        thinkingMode: "enabled",
      })
    ).toEqual({ thinkingMode: "enabled", thinkingEffort: "_default" });
  });

  test.each([[OPT_TRANS_DEEPSEEK, "deepseek"]])(
    "uses explicit thinking modes for %s",
    (apiType, adapter) => {
      const capability = getThinkingCapability({ apiType });
      expect(capability).toMatchObject({ adapter });
      expect(
        normalizeThinkingSettings({ apiType, thinkingMode: "auto" })
      ).toEqual({ thinkingMode: "auto", thinkingEffort: "_default" });
      expect(
        normalizeThinkingSettings({ apiType, thinkingMode: "enabled" })
      ).toEqual({ thinkingMode: "enabled", thinkingEffort: null });
      expect(
        normalizeThinkingSettings({ apiType, thinkingMode: "disabled" })
      ).toEqual({ thinkingMode: "disabled", thinkingEffort: null });
    }
  );

  test("normalizes loaded static settings once and preserves stable references", () => {
    const transApis = [
      {
        apiType: OPT_TRANS_OPENAI,
        model: "gpt-5.6-sol",
        thinkingMode: "enabled",
        thinkingEffort: "_default",
      },
      {
        apiType: OPT_TRANS_OPENAI,
        model: "provider/unknown-model",
        thinkingMode: "enabled",
        thinkingEffort: "_default",
      },
    ];

    const normalized = normalizeApiThinkingSettings(transApis);
    expect(normalized).not.toBe(transApis);
    expect(normalized[0]).toMatchObject({ thinkingEffort: null });
    expect(normalized[1]).toBe(transApis[1]);
    expect(normalizeApiThinkingSettings(normalized)).toBe(normalized);
  });
});

describe("normalizeApiModelListUrls", () => {
  test("旧数据缺少 modelListUrl 时按接口类型补充默认模型列表 URL", () => {
    const transApis = [
      {
        apiSlug: "OpenAI",
        apiType: OPT_TRANS_OPENAI,
      },
    ];

    const nextApis = normalizeApiModelListUrls(transApis);

    expect(nextApis).not.toBe(transApis);
    expect(nextApis[0]).toEqual({
      apiSlug: "OpenAI",
      apiType: OPT_TRANS_OPENAI,
      modelListUrl: "https://api.openai.com/v1/models",
    });
  });

  test("DeepSeek 走服务端中转，无模型列表接口时补为空字符串", () => {
    const nextApis = normalizeApiModelListUrls([
      { apiSlug: "DeepSeek", apiType: OPT_TRANS_DEEPSEEK },
    ]);
    expect(nextApis[0].modelListUrl).toBe("");
  });

  test("用户已明确保存为空字符串时不覆盖 modelListUrl", () => {
    const transApis = [
      {
        apiSlug: "OpenAI",
        apiType: OPT_TRANS_OPENAI,
        modelListUrl: "",
      },
    ];

    const nextApis = normalizeApiModelListUrls(transApis);

    expect(nextApis).toBe(transApis);
    expect(nextApis[0].modelListUrl).toBe("");
  });

  test("没有官方默认模型列表接口的旧数据补为空字符串", () => {
    const transApis = [
      {
        apiSlug: "Custom",
        apiType: OPT_TRANS_CUSTOMIZE,
      },
    ];

    const nextApis = normalizeApiModelListUrls(transApis);

    expect(nextApis).not.toBe(transApis);
    expect(nextApis[0].modelListUrl).toBe("");
  });

  test("没有需要补充的字段时保持原数组引用", () => {
    const transApis = [
      {
        apiSlug: "DeepSeek",
        apiType: OPT_TRANS_DEEPSEEK,
        modelListUrl: "https://custom.example.com/models",
      },
    ];

    expect(normalizeApiModelListUrls(transApis)).toBe(transApis);
  });
});

describe("normalizeApiBuiltinModels", () => {
  test("内置引擎模型强制跟随 DEFAULT_API_LIST（存量旧模型被刷新）", () => {
    const transApis = [
      { apiSlug: "Qwen", apiType: OPT_TRANS_QWEN, model: "qwen-plus" },
      { apiSlug: "DS", apiType: OPT_TRANS_DEEPSEEK, model: "deepseek-v4-flash" },
    ];
    const next = normalizeApiBuiltinModels(transApis);
    expect(next).not.toBe(transApis);
    expect(next[0].model).toBe("qwen3.8-flash");
    expect(next[1].model).toBe("deepseek-flash");            
  });

  test("自定义引擎（BYOK）的模型不被覆写", () => {
    const transApis = [
      { apiSlug: "my", apiType: OPT_TRANS_QWEN, model: "qwen3.8-max", custom: true },
    ];
    const next = normalizeApiBuiltinModels(transApis);
    expect(next).toBe(transApis);
    expect(next[0].model).toBe("qwen3.8-max");
  });

  test("无变更保持原数组引用", () => {
    const transApis = [
      { apiSlug: "Qwen", apiType: OPT_TRANS_QWEN, model: "qwen3.8-flash" },
    ];
    expect(normalizeApiBuiltinModels(transApis)).toBe(transApis);
  });
});

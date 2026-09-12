import {
  createModelListRequest,
  parseModelListResponse,
  detectProviderByKey,
  filterTranslateModels,
} from "./modelList";
import { OPT_TRANS_OPENAI, OPT_TRANS_CLAUDE } from "../config/api";

describe("modelList", () => {
  test("parses OpenAI-compatible model lists", () => {
    expect(
      parseModelListResponse({
        data: [
          { id: "gpt-4o" },
          { id: "gpt-4o" },
          { id: "deepseek-chat" },
          { id: "" },
        ],
      })
    ).toEqual(["gpt-4o", "deepseek-chat"]);
  });

  test("uses model IDs instead of also listing display names", () => {
    expect(
      parseModelListResponse({
        data: [
          {
            id: "qwen/qwen3.7-flash",
            name: "Qwen: Qwen3.7 Flash",
          },
          {
            id: "anthropic/claude-opus-5-fast",
            name: "Claude Opus 5 (Fast)",
          },
        ],
      })
    ).toEqual(["qwen/qwen3.7-flash", "anthropic/claude-opus-5-fast"]);
  });

  test("returns an empty list for invalid responses", () => {
    expect(parseModelListResponse(null)).toEqual([]);
    expect(parseModelListResponse({ data: "invalid" })).toEqual([]);
  });

  test("builds bearer auth requests by default", () => {
    expect(
      createModelListRequest({
        apiType: OPT_TRANS_OPENAI,
        modelListUrl: "https://api.openai.com/v1/models",
        key: "sk-test",
      })
    ).toEqual({
      input: "https://api.openai.com/v1/models",
      init: {
        method: "GET",
        headers: {
          Authorization: "Bearer sk-test",
        },
      },
    });
  });

  test("uses key placeholder without extra authorization", () => {
    expect(
      createModelListRequest({
        apiType: OPT_TRANS_OPENAI,
        modelListUrl: "https://example.com/models?api_key={{key}}",
        key: "key with space",
      })
    ).toEqual({
      input: "https://example.com/models?api_key=key%20with%20space",
      init: {
        method: "GET",
      },
    });
  });

  test("uses x-api-key auth for Anthropic", () => {
    expect(
      createModelListRequest({
        apiType: OPT_TRANS_CLAUDE,
        modelListUrl: "https://api.anthropic.com/v1/models",
        key: "sk-ant-test",
      })
    ).toEqual({
      input: "https://api.anthropic.com/v1/models",
      init: {
        method: "GET",
        headers: {
          "x-api-key": "sk-ant-test",
          "anthropic-version": "2023-06-01",
        },
      },
    });
  });
});

describe("detectProviderByKey", () => {
  const probes = [
    { apiType: "DeepSeek", modelsUrl: "https://api.deepseek.com/models" },
    { apiType: "Acme", modelsUrl: "https://api.acme.example/v1/models" },
    {
      apiType: "Acme",
      variant: "sub",
      label: "Acme 订阅版",
      keyPrefix: "sk-acmesub-",
      modelsUrl: "https://sub.acme.example/coding/v1/models",
      directUrl: "https://sub.acme.example/coding/v1/chat/completions",
      presetModels: ["acme-1", "acme-coding"],
    },
    { apiType: "OpenAI", modelsUrl: "https://api.openai.com/v1/models" },
  ];

                                               
  const fetcherFor = (hitUrl, models = ["acme-1", "acme-2"]) =>
    jest.fn(({ modelListUrl }) =>
      modelListUrl === hitUrl
        ? Promise.resolve(models)
        : Promise.reject(new Error("401"))
    );

  test("identifies the provider whose models endpoint accepts the key", async () => {
    const hit = await detectProviderByKey("sk-platform", {
      fetcher: fetcherFor("https://api.acme.example/v1/models"),
      probes,
      apiType: "Acme",
    });
    expect(hit).toMatchObject({
      apiType: "Acme",
      models: ["acme-1", "acme-2"],
    });
    expect(hit.variant).toBeUndefined();
  });

  test("hits the subscription variant endpoint for prefixed subscription keys", async () => {
    const fetcher = fetcherFor("https://sub.acme.example/coding/v1/models", [
      "acme-1",
      "acme-coding",
    ]);
    const hit = await detectProviderByKey("sk-acmesub-abc", {
      fetcher,
      probes,
    });
    expect(hit).toMatchObject({
      apiType: "Acme",
      variant: "sub",
      directUrl: "https://sub.acme.example/coding/v1/chat/completions",
      models: ["acme-1", "acme-coding"],
    });
                    
    expect(fetcher.mock.calls[0][0].modelListUrl).toBe(
      "https://sub.acme.example/coding/v1/models"
    );
  });

  test("does not invent available models when a prefixed provider is offline", async () => {
    const fetcher = jest.fn(() => Promise.reject(new Error("network")));
    const hit = await detectProviderByKey("sk-acmesub-abc", {
      fetcher,
      probes,
    });
    expect(hit).toMatchObject({
      variant: "sub",
      guessed: true,
      models: [],
    });
  });

  test("returns the first hit in probe order when several accept the key", async () => {
    const fetcher = jest.fn(({ modelListUrl }) =>
      modelListUrl.includes("openai")
        ? Promise.resolve([])
        : Promise.resolve(["m1"])
    );
    const hit = await detectProviderByKey("sk-multi", {
      fetcher,
      probes,
      apiType: "DeepSeek",
    });
                                             
    expect(hit.apiType).toBe("DeepSeek");
  });

  test("returns as soon as the first probe hits without waiting for slow ones", async () => {
    const fetcher = jest.fn(
      ({ modelListUrl }) =>
        modelListUrl.includes("deepseek")
          ? Promise.resolve(["deepseek-chat"])
          : new Promise(() => {})                      
    );
                           
    const hit = await detectProviderByKey("sk-fast", {
      fetcher,
      probes,
      apiType: "DeepSeek",
    });
    expect(hit.apiType).toBe("DeepSeek");
  });

  test("returns null when no provider accepts the key and no prefix matches", async () => {
    const fetcher = jest.fn(() => Promise.reject(new Error("401")));
    await expect(
      detectProviderByKey("sk-bad", { fetcher, probes })
    ).resolves.toBeNull();
  });

  test("returns null for an empty key without hitting the network", async () => {
    const fetcher = jest.fn();
    await expect(
      detectProviderByKey("  ", { fetcher, probes })
    ).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("filterTranslateModels", () => {
  test("filters out image/audio/embedding models (DashScope 249-model dump)", () => {
    expect(
      filterTranslateModels([
        "qwen3.8-2.4t-a95b",
        "qwen-image-3.0-pro",
        "qwen-audio-3.0-asr-flash",
        "text-embedding-v4",
        "deepseek-v4-flash-0731",
        "qwen-flash",
      ])
    ).toEqual(["qwen3.8-2.4t-a95b", "deepseek-v4-flash-0731", "qwen-flash"]);
  });

  test("puts preferred models first and keeps server order for the rest", () => {
    expect(
      filterTranslateModels(
        ["qwen3.8-max", "qwen3.7-flash-2026-07-15", "qwen-flash", "qwen-plus"],
        ["qwen-flash", "qwen-plus"]
      )
    ).toEqual([
      "qwen-flash",
      "qwen-plus",
      "qwen3.8-max",
      "qwen3.7-flash-2026-07-15",
    ]);
  });

  test("does not present image-only models as translation choices", () => {
    expect(filterTranslateModels(["qwen-image-3.0"])).toEqual([]);
  });

  test("handles empty input", () => {
    expect(filterTranslateModels([])).toEqual([]);
    expect(filterTranslateModels(null)).toEqual([]);
  });
});

describe("filterTranslateModels preferredOnly", () => {
                                        
  test("a legacy preferredOnly flag never hides new models", () => {
    expect(
      filterTranslateModels(
        [
          "qwen3.8-max",
          "qwen-image-3.0",
          "qwen-flash",
          "qwen-plus",
          "deepseek-v4-flash-0731",
        ],
        ["qwen-flash", "qwen-plus", "qwen-max-latest"],
        { preferredOnly: true }
      )
    ).toEqual([
      "qwen-flash",
      "qwen-plus",
      "qwen3.8-max",
      "deepseek-v4-flash-0731",
    ]);
  });

  test("falls back to the full chat list when no preferred model is online", () => {
    expect(
      filterTranslateModels(
        ["qwen9.9-ultra", "qwen-image-3.0"],
        ["qwen-flash"],
        { preferredOnly: true }
      )
    ).toEqual(["qwen9.9-ultra"]);
  });
});

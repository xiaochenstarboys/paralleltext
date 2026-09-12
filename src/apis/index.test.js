jest.mock("query-string", () => ({
  stringify: (obj) => new URLSearchParams(obj).toString(),
}));

jest.mock("../libs/fetch", () => ({
  fetchData: jest.fn(),
  fnPolyfill: jest.fn(),
}));

jest.mock("../libs/cache", () => ({
  getHttpCachePolyfill: jest.fn(),
  putHttpCachePolyfill: jest.fn(),
}));

jest.mock("../libs/docInfo", () => ({
  getDocInfo: () => ({ title: "Doc", description: "Desc", summary: "Summary" }),
}));

jest.mock("../libs/batchQueue", () => ({
  getBatchQueue: jest.fn(),
}));

const mockGetCacheDigest = jest.fn();

jest.mock("../libs/cacheDigest", () => ({
  getCacheDigest: (...args) => mockGetCacheDigest(...args),
}));

jest.mock("../libs/membership", () => ({
  assertRelayQuota: jest.fn(),
  handleQuotaError: jest.fn(async () => false),
  isRelayApiSetting: jest.fn(() => false),
}));

jest.mock("./trans", () => ({
  handleTranslate: jest.fn(),
  handleDict: jest.fn(),
}));

import { apiDict, apiTranslate } from "./index";
import { handleDict, handleTranslate } from "./trans";
import { getBatchQueue } from "../libs/batchQueue";
import { getHttpCachePolyfill, putHttpCachePolyfill } from "../libs/cache";
import { DEFAULT_API_LIST, OPT_TRANS_OPENAI } from "../config";

const getOpenAiApiSetting = (systemPrompt) => ({
  ...DEFAULT_API_LIST.find((api) => api.apiType === OPT_TRANS_OPENAI),
  apiSlug: "openai_test",
  key: "test-key",
  model: "test-model",
  useBatchFetch: true,
  useStream: false,
  systemPrompt,
});

describe("apiDict", () => {
  beforeEach(() => {
    mockGetCacheDigest.mockImplementation(async (text) =>
      text.includes("dictionary prompt B") ||
      text.includes("dictionary user prompt B")
        ? "b".repeat(64)
        : "a".repeat(64)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("delegates to dictionary handler with prompt and context", async () => {
    handleDict.mockResolvedValueOnce("## dictionary");

    const apiSetting = {
      ...getOpenAiApiSetting("batch prompt"),
      dictPrompt: "dictionary prompt {{context}} {{text}}",
    };
    const result = await apiDict({
      text: "library",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting,
      context: "The library is open.",
    });

    expect(result).toBe("## dictionary");
    expect(handleDict).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "library",
        fromLang: "en",
        toLang: "zh-CN",
        apiSetting,
        context: "The library is open.",
      })
    );
    expect(mockGetCacheDigest).toHaveBeenCalledWith(
      expect.stringContaining("The library is open."),
      "prompt-cache"
    );
    expect(getBatchQueue).not.toHaveBeenCalled();
  });

  test("returns cached dictionary markdown without calling handler", async () => {
    getHttpCachePolyfill.mockResolvedValueOnce({ markdown: "cached markdown" });

    const result = await apiDict({
      text: "library",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt"),
        dictPrompt: "dictionary prompt A",
      },
      context: "The library is open.",
    });

    expect(result).toBe("cached markdown");
    expect(handleDict).not.toHaveBeenCalled();
    expect(putHttpCachePolyfill).not.toHaveBeenCalled();
  });

  test("writes dictionary markdown cache using dictionary prompt signature", async () => {
    getHttpCachePolyfill.mockResolvedValue(null);
    handleDict.mockResolvedValueOnce("fresh markdown");

    await apiDict({
      text: "library",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt"),
        dictPrompt: "dictionary prompt B",
        dictUserPrompt: "dictionary user prompt A",
      },
      context: "The library is open.",
    });

    expect(putHttpCachePolyfill).toHaveBeenCalledWith(
      expect.stringContaining("promptSig=bbbbbbbbbbbbbbbb"),
      null,
      { markdown: "fresh markdown" }
    );
  });

  test("dictionary prompt signature includes dictionary user prompt", async () => {
    getHttpCachePolyfill.mockResolvedValue(null);
    handleDict.mockResolvedValueOnce("fresh markdown");

    await apiDict({
      text: "library",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt"),
        dictPrompt: "dictionary prompt A",
        dictUserPrompt: "dictionary user prompt B",
      },
      context: "The library is open.",
    });

    expect(putHttpCachePolyfill).toHaveBeenCalledWith(
      expect.stringContaining("promptSig=bbbbbbbbbbbbbbbb"),
      null,
      { markdown: "fresh markdown" }
    );
  });
});

describe("apiTranslate prompt queue isolation", () => {
  beforeEach(() => {
    mockGetCacheDigest.mockImplementation(async (text) =>
      text.includes("batch prompt B") ? "b".repeat(64) : "a".repeat(64)
    );
    getBatchQueue.mockImplementation(() => ({
      addTask: jest.fn().mockResolvedValue(["translated text", ""]),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("uses prompt signature in batch queue key", async () => {
    await apiTranslate({
      text: "hello",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: getOpenAiApiSetting("batch prompt A"),
      useCache: false,
    });
    await apiTranslate({
      text: "world",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: getOpenAiApiSetting("batch prompt B"),
      useCache: false,
    });

    const queueKeys = getBatchQueue.mock.calls.map(([key]) => key);

    expect(queueKeys).toHaveLength(2);
    expect(queueKeys[0]).toContain("_aaaaaaaaaaaaaaaa");
    expect(queueKeys[1]).toContain("_bbbbbbbbbbbbbbbb");
    expect(queueKeys[0]).not.toBe(queueKeys[1]);
  });

  test("includes translation style and glossary in the shared prompt signature", async () => {
    const glossary = { React: "React", component: "组件" };

    await apiTranslate({
      text: "hello",
      fromLang: "en",
      toLang: "zh-CN",
      glossary,
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt A"),
        tone: "technical",
        aiTerms: "API,接口",
      },
      useCache: false,
    });

    expect(mockGetCacheDigest).toHaveBeenCalledWith(
      [
        "batch",
        "batch prompt A",
        "technical",
        "API,接口",
        JSON.stringify(Object.entries(glossary).sort()),
      ].join("\n"),
      "prompt-cache"
    );
  });

  test("isolates plain-text and HTML batch queues", async () => {
    const apiSetting = getOpenAiApiSetting("batch prompt A");
    await apiTranslate({
      text: "plain text",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting,
      textFormat: "text",
      useCache: false,
    });
    await apiTranslate({
      text: "<p>HTML</p>",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting,
      textFormat: "html",
      useCache: false,
    });

    const queueKeys = getBatchQueue.mock.calls.map(([key]) => key);
    expect(queueKeys[0]).toContain("_text_");
    expect(queueKeys[1]).toContain("_html_");
    expect(queueKeys[0]).not.toBe(queueKeys[1]);
  });

  test("does not include prompt slug in batch queue key", async () => {
    await apiTranslate({
      text: "hello",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt A"),
        batchPromptSlug: "prompt_a",
      },
      useCache: false,
    });
    await apiTranslate({
      text: "world",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt A"),
        batchPromptSlug: "prompt_b",
      },
      useCache: false,
    });

    const queueKeys = getBatchQueue.mock.calls.map(([key]) => key);
    const signedTexts = mockGetCacheDigest.mock.calls.map(([text]) => text);

    expect(queueKeys).toHaveLength(2);
    expect(queueKeys[0]).toBe(queueKeys[1]);
    expect(signedTexts[0]).not.toContain("prompt_a");
    expect(signedTexts[1]).not.toContain("prompt_b");
  });

  test("passes configured batch concurrency and isolates its queue", async () => {
    await apiTranslate({
      text: "hello",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt A"),
        batchConcurrency: 3,
        useContext: false,
      },
      useCache: false,
    });

    expect(getBatchQueue).toHaveBeenCalledWith(
      expect.stringMatching(/_3_$/),
      handleTranslate,
      expect.objectContaining({ batchConcurrency: 3 })
    );
  });

  test("forces batch concurrency to one for context sessions", async () => {
    await apiTranslate({
      text: "hello",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt A"),
        batchConcurrency: 4,
        useContext: true,
      },
      useCache: false,
    });

    expect(getBatchQueue).toHaveBeenCalledWith(
      expect.stringMatching(/_1_$/),
      handleTranslate,
      expect.objectContaining({ batchConcurrency: 1 })
    );
  });
});

describe("apiTranslate non-batch stream", () => {
  beforeEach(() => {
    mockGetCacheDigest.mockResolvedValue("a".repeat(64));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("consumes non-batch stream results without the batch queue", async () => {
    const onStreamChunk = jest.fn();
    async function* streamResult() {
      yield { id: 0, partialText: "阶段译文", isComplete: false };
      yield { id: 0, result: ["最终译文", ""] };
    }
    handleTranslate.mockImplementationOnce(streamResult);

    const result = await apiTranslate({
      text: "hello",
      fromLang: "en",
      toLang: "zh-CN",
      apiSetting: {
        ...getOpenAiApiSetting("batch prompt A"),
        useBatchFetch: false,
        useStream: true,
        streamRenderMode: "realtime",
      },
      onStreamChunk,
      useCache: false,
    });

    expect(result.trText).toBe("最终译文");
    expect(getBatchQueue).not.toHaveBeenCalled();
    expect(handleTranslate).toHaveBeenCalledWith(
      ["hello"],
      expect.objectContaining({
        onStreamChunk,
        apiSetting: expect.objectContaining({
          useBatchFetch: false,
          useStream: true,
        }),
      })
    );
    expect(onStreamChunk).toHaveBeenCalledWith({
      id: 0,
      text: "阶段译文",
      isComplete: false,
    });
    expect(onStreamChunk).toHaveBeenCalledWith({
      id: 0,
      text: ["最终译文", ""],
      isComplete: true,
    });
  });
});

jest.mock("../libs/directTranslationQuota", () => ({
  admitDirectTranslation: jest.fn(async () => {}),
  usesDirectTranslationQuota: jest.fn(() => false),
}));
jest.mock("query-string", () => ({
  stringify: (obj) => new URLSearchParams(obj).toString(),
}));

jest.mock("@streamparser/json", () =>
  jest.requireActual("../../node_modules/@streamparser/json/dist/cjs/index.js")
);

const { TextDecoder, TextEncoder } = require("util");
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

jest.mock("../libs/fetch", () => ({
  fetchData: jest.fn(),
  fetchStream: jest.fn(),
}));

jest.mock("../libs/docInfo", () => ({
  getDocInfo: () => ({}),
}));

import { handleTranslate } from "./trans";
import { admitDirectTranslation, usesDirectTranslationQuota } from "../libs/directTranslationQuota";
import {
  DEFAULT_API_LIST,
  OPT_TRANS_DEEPSEEK,
  OPT_TRANS_OPENAI,
  OPT_TRANS_QWEN,
} from "../config";
import { fetchData, fetchStream } from "../libs/fetch";
import { trustedTypesHelper } from "../libs/trustedTypes";
import { clearMsgHistory } from "./history";

const getApiSetting = (apiType) => ({
  ...DEFAULT_API_LIST.find((api) => api.apiType === apiType),
  useStream: true,
  useBatchFetch: true,
  key: "test-key",
  model: "test-model",
  fetchInterval: 0,
  fetchLimit: 1,
  httpTimeout: 1000,
});

const getNobatchApiSetting = (update = {}) => ({
  ...getApiSetting(OPT_TRANS_OPENAI),
  useStream: false,
  useBatchFetch: false,
  systemPrompt: "batch system prompt",
  nobatchPrompt: "Translate {{text}}.",
  nobatchUserPrompt: "",
  ...update,
});

async function collectAsyncGenerator(generator) {
  const result = [];
  for await (const item of generator) {
    result.push(item);
  }
  return result;
}

describe("handleTranslate", () => {
  test("quota denial stops the upstream request instead of retrying the provider", async () => {
    const error = Object.assign(new Error("daily limit reached"), {
      nonRetryable: true,
    });
    admitDirectTranslation.mockRejectedValueOnce(error);
    usesDirectTranslationQuota.mockReturnValueOnce(true);
    await expect(
      collectAsyncGenerator(
        handleTranslate(["hello"], {
          from: "en",
          to: "zh-CN",
          fromLang: "English",
          toLang: "Chinese",
          apiSetting: getNobatchApiSetting(),
          usePool: false,
        })
      )
    ).rejects.toBe(error);
    expect(fetchData).not.toHaveBeenCalled();
  });
  afterEach(() => {
    clearMsgHistory(OPT_TRANS_OPENAI);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("applies all three thinking modes to OpenAI-compatible requests", async () => {
    fetchData.mockResolvedValue({
      choices: [{ message: { content: "你好" } }],
    });
    const translate = (thinkingMode, thinkingEffort = "_default") =>
      collectAsyncGenerator(
        handleTranslate(["hello"], {
          from: "en",
          to: "zh-CN",
          fromLang: "English",
          toLang: "Chinese",
          langMap: () => "",
          glossary: "",
          apiSetting: {
            ...getApiSetting(OPT_TRANS_OPENAI),
            useStream: false,
            model: "gpt-5",
            thinkingMode,
            thinkingEffort,
          },
          usePool: false,
        })
      );

    await translate("auto", "high");
    expect(JSON.parse(fetchData.mock.calls[0][1].body)).not.toHaveProperty(
      "reasoning_effort"
    );

    await translate("enabled", "medium");
    expect(JSON.parse(fetchData.mock.calls[1][1].body).reasoning_effort).toBe(
      "medium"
    );

    await translate("disabled", "none");
    expect(JSON.parse(fetchData.mock.calls[2][1].body).reasoning_effort).toBe(
      "none"
    );
  });

  test("does not inject thinking parameters for unknown models", async () => {
    fetchData.mockResolvedValue({
      choices: [{ message: { content: "你好" } }],
    });
    const translate = (thinkingMode) =>
      collectAsyncGenerator(
        handleTranslate(["hello"], {
          from: "en",
          to: "zh-CN",
          fromLang: "English",
          toLang: "Chinese",
          langMap: () => "",
          glossary: "",
          apiSetting: {
            ...getApiSetting(OPT_TRANS_OPENAI),
            useStream: false,
            model: "unknown-model",
            thinkingMode,
          },
          usePool: false,
        })
      );

    await translate("auto");
    expect(JSON.parse(fetchData.mock.calls[0][1].body)).not.toHaveProperty(
      "reasoning_effort"
    );
    await translate("enabled");
    expect(JSON.parse(fetchData.mock.calls[1][1].body)).not.toHaveProperty(
      "reasoning_effort"
    );
    await translate("disabled");
    expect(JSON.parse(fetchData.mock.calls[2][1].body)).not.toHaveProperty(
      "reasoning_effort"
    );
  });

  test("keeps DeepSeek enabled when a concrete effort is selected", async () => {
    fetchData.mockResolvedValue({
      choices: [{ message: { content: "你好" } }],
    });

    await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_DEEPSEEK),
          useStream: false,
          thinkingMode: "enabled",
          thinkingEffort: "max",
        },
        usePool: false,
      })
    );

    expect(JSON.parse(fetchData.mock.calls[0][1].body)).toMatchObject({
      thinking: { type: "enabled" },
      reasoning_effort: "max",
    });
  });

  test("falls back to non-stream request when stream reader is unsupported", async () => {
    async function* brokenStream() {
      throw new TypeError(
        "Cannot read properties of undefined (reading 'getReader')"
      );
    }

    fetchStream.mockReturnValueOnce(brokenStream());
    fetchData.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify([{ text: "你好", sourceLanguage: "en" }]),
          },
        },
      ],
    });

    const result = await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: getApiSetting(OPT_TRANS_OPENAI),
        usePool: false,
      })
    );

    expect(fetchStream).toHaveBeenCalledTimes(1);
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchStream.mock.calls[0][1].body).stream).toBe(true);
    expect(JSON.parse(fetchData.mock.calls[0][1].body).stream).toBe(false);
    expect(result).toEqual([
      {
        id: 0,
        result: ["你好", "en"],
      },
    ]);
  });

  test("parses non-stream OpenAI XML content and ignores reasoning content", async () => {
    fetchData.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: "stop",
          index: 0,
          logprobs: null,
          message: {
            content:
              '<root>\n    <t id="0" sourceLanguage="en">敏捷的棕色狐狸跳过了懒惰的狗。</t>\n</root>',
            reasoning_content:
              "This reasoning text should not be parsed as translation.",
            role: "assistant",
          },
        },
      ],
      created: 1782579027,
      id: "021782579025384c63a6ac480f44318ff02bbee696f61102e5957",
      model: "doubao-seed-2-0-mini-260428",
      object: "chat.completion",
    });

    const result = await collectAsyncGenerator(
      handleTranslate(["The quick brown fox jumps over the lazy dog."], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          useStream: false,
          useBatchFetch: true,
        },
        usePool: false,
      })
    );

    expect(fetchStream).not.toHaveBeenCalled();
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchData.mock.calls[0][1].body).stream).toBe(false);
    expect(result).toEqual([
      {
        id: 0,
        result: ["敏捷的棕色狐狸跳过了懒惰的狗。", "en"],
      },
    ]);
  });

  test("parses non-stream OpenAI-compatible XML content from DeepSeek-style response", async () => {
    fetchData.mockResolvedValueOnce({
      id: "a729d491-11e8-4a8c-bb6a-c780329e1f99",
      object: "chat.completion",
      created: 1782580528,
      model: "deepseek-v4-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              '<root>\n    <t id="0" sourceLanguage="en">敏捷的棕色狐狸跳过了懒惰的狗。</t>\n</root>',
          },
          logprobs: null,
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 544,
        completion_tokens: 30,
        total_tokens: 574,
        prompt_tokens_details: {
          cached_tokens: 512,
        },
        prompt_cache_hit_tokens: 512,
        prompt_cache_miss_tokens: 32,
      },
      system_fingerprint: "fp_8b330d02d0_prod0820_fp8_kvcache_20260402",
    });

    const result = await collectAsyncGenerator(
      handleTranslate(["The quick brown fox jumps over the lazy dog."], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          useStream: false,
          useBatchFetch: true,
        },
        usePool: false,
      })
    );

    expect(fetchStream).not.toHaveBeenCalled();
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchData.mock.calls[0][1].body).stream).toBe(false);
    expect(result).toEqual([
      {
        id: 0,
        result: ["敏捷的棕色狐狸跳过了懒惰的狗。", "en"],
      },
    ]);
  });

  test("parses OpenAI XML content before sanitized DOM fallback", async () => {
    const createHTMLSpy = jest
      .spyOn(trustedTypesHelper, "createHTML")
      .mockReturnValue("");

    fetchData.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content:
              '<root>\n    <t id="0" sourceLanguage="en">敏捷的棕色狐狸跳过了懒惰的狗。</t>\n</root>',
          },
        },
      ],
    });

    const result = await collectAsyncGenerator(
      handleTranslate(["The quick brown fox jumps over the lazy dog."], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          useStream: false,
          useBatchFetch: true,
        },
        usePool: false,
      })
    );

    expect(createHTMLSpy).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: 0,
        result: ["敏捷的棕色狐狸跳过了懒惰的狗。", "en"],
      },
    ]);
  });

  test("does not fall back when stream request is aborted", async () => {
    async function* abortedStream() {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    fetchStream.mockReturnValueOnce(abortedStream());

    await expect(
      collectAsyncGenerator(
        handleTranslate(["hello"], {
          from: "en",
          to: "zh-CN",
          fromLang: "English",
          toLang: "Chinese",
          langMap: () => "",
          glossary: "",
          apiSetting: getApiSetting(OPT_TRANS_OPENAI),
          usePool: false,
        })
      )
    ).rejects.toThrow("The operation was aborted.");

    expect(fetchData).not.toHaveBeenCalled();
  });

  test("streams non-batch plain text when batch fetch is disabled", async () => {
    async function* streamChunks() {
      yield JSON.stringify({ choices: [{ delta: { content: "你" } }] });
      yield JSON.stringify({ choices: [{ delta: { content: "好" } }] });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: getNobatchApiSetting({
          useStream: true,
          streamRenderMode: "realtime",
        }),
        usePool: false,
      })
    );

    expect(fetchStream).toHaveBeenCalledTimes(1);
    expect(fetchData).not.toHaveBeenCalled();
    expect(JSON.parse(fetchStream.mock.calls[0][1].body).stream).toBe(true);
    expect(result).toEqual([
      { id: 0, partialText: "你", isComplete: false },
      { id: 0, partialText: "你好", isComplete: false },
      { id: 0, result: ["你好"] },
    ]);
  });

  test("streams partial JSON text before a batched translation completes", async () => {
    async function* streamChunks() {
      yield JSON.stringify({
        choices: [
          { delta: { content: '{"translations":[{"id":0,"text":"你' } },
        ],
      });
      yield JSON.stringify({
        choices: [
          {
            delta: {
              content: '好","sourceLanguage":"zh"}]}',
            },
          },
        ],
      });
    }

    fetchStream.mockReturnValueOnce(streamChunks());

    const result = await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          streamRenderMode: "realtime",
        },
        usePool: false,
      })
    );

    expect(result).toEqual([
      { id: 0, partialText: "你", isComplete: false },
      { id: 0, partialText: "你好", isComplete: false },
      { id: 0, result: ["你好", "zh"] },
    ]);
  });

  test("does not append external docInfo to system prompt without placeholders", async () => {
    fetchData.mockResolvedValueOnce({
      choices: [{ message: { content: "你好" } }],
    });

    await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: getNobatchApiSetting(),
        usePool: false,
        docInfo: {
          title: "Doc title",
          description: "Doc description",
          summary: "Doc summary",
          context: "Doc context",
        },
      })
    );

    const body = JSON.parse(fetchData.mock.calls[0][1].body);

    expect(body.messages[0].content).toBe("Translate hello.");
    expect(body.messages[0].content).not.toContain("# Context");
    expect(body.messages[0].content).not.toContain("Doc context");
  });

  test("replaces external docInfo placeholders in user prompt", async () => {
    fetchData.mockResolvedValueOnce({
      choices: [{ message: { content: "你好" } }],
    });

    await collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: getNobatchApiSetting({
          nobatchUserPrompt: "Title: {{title}}\nContext: {{context}}",
        }),
        usePool: false,
        docInfo: {
          title: "Doc title",
          context: "Doc context",
        },
      })
    );

    const body = JSON.parse(fetchData.mock.calls[0][1].body);

    expect(body.messages[0].content).toBe("Translate hello.");
    expect(body.messages[body.messages.length - 1].content).toBe(
      "Title: Doc title\nContext: Doc context"
    );
  });
});

                                 
test("Qwen requests disable thinking for speed", async () => {
  fetchData.mockResolvedValueOnce({
    choices: [{ message: { content: "你好" } }],
  });
  await collectAsyncGenerator(
    handleTranslate(["hello"], {
      from: "en",
      to: "zh-CN",
      fromLang: "English",
      toLang: "Chinese",
      langMap: () => "",
      glossary: "",
      apiSetting: {
        ...getApiSetting(OPT_TRANS_QWEN),
        useStream: false,
        useBatchFetch: false,
      },
      usePool: false,
    })
  );
  expect(JSON.parse(fetchData.mock.calls[0][1].body).enable_thinking).toBe(
    false
  );
});

                                               
test("retries gateway errors (502/503/504) then succeeds", async () => {
  const gatewayErr = new Error(
    JSON.stringify({
      url: "https://relay.example.com/chat/completions",
      status: 502,
      statusText: "Bad Gateway",
      response: "<html>502 Bad Gateway</html>",
    })
  );
  fetchData.mockRejectedValueOnce(gatewayErr).mockResolvedValue({
    choices: [{ message: { content: "你好", role: "assistant" } }],
  });

  const result = await collectAsyncGenerator(
    handleTranslate(["hello"], {
      from: "en",
      to: "zh-CN",
      fromLang: "English",
      toLang: "Chinese",
      langMap: () => "",
      glossary: "",
      apiSetting: {
        ...getApiSetting(OPT_TRANS_OPENAI),
        useStream: false,
        useBatchFetch: true,
      },
      usePool: false,
    })
  );

  expect(fetchData).toHaveBeenCalledTimes(2);
  expect(result?.[0]?.result?.[0]).toBe("你好");
}, 10000);

                                    
test("throws friendly message after gateway retries exhausted", async () => {
  const gatewayErr = new Error(
    JSON.stringify({
      url: "https://relay.example.com/chat/completions",
      status: 503,
      statusText: "Service Unavailable",
      response: "<html>503</html>",
    })
  );
  fetchData.mockRejectedValue(gatewayErr);

  await expect(
    collectAsyncGenerator(
      handleTranslate(["hello"], {
        from: "en",
        to: "zh-CN",
        fromLang: "English",
        toLang: "Chinese",
        langMap: () => "",
        glossary: "",
        apiSetting: {
          ...getApiSetting(OPT_TRANS_OPENAI),
          useStream: false,
          useBatchFetch: true,
        },
        usePool: false,
      })
    )
  ).rejects.toThrow(/翻译服务暂时不可用/);
                    
  expect(fetchData).toHaveBeenCalledTimes(3);
}, 15000);

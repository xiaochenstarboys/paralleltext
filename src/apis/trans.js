import {
  admitDirectTranslation,
  usesDirectTranslationQuota,
} from "../libs/directTranslationQuota";
import queryString from "query-string";
import {
  OPT_TRANS_GOOGLE,
  OPT_TRANS_GOOGLE_2,
  OPT_TRANS_QWEN,
  OPT_TRANS_DEEPSEEK,
  OPT_TRANS_OPENAI,
  OPT_TRANS_CLAUDE,
  OPT_TRANS_GEMINI,
  OPT_TRANS_GROK,
  OPT_TRANS_CUSTOMIZE,
  API_SPE_TYPES,
  INPUT_PLACE_FROM,
  INPUT_PLACE_TO,
  INPUT_PLACE_TEXT,
  defaultSystemPrompt,
  defaultNobatchPrompt,
  defaultNobatchUserPrompt,
  defaultDictUserPrompt,
  INPUT_PLACE_TONE,
  INPUT_PLACE_TITLE,
  INPUT_PLACE_DESCRIPTION,
  INPUT_PLACE_TO_LANG,
  INPUT_PLACE_FROM_LANG,
  INPUT_PLACE_GLOSSARY,
  defaultSystemPromptXml,
  defaultSystemPromptLines,
  INPUT_PLACE_SUMMARY,
  INPUT_PLACE_CONTEXT,
  THINKING_API_REGISTRY,
} from "../config";
import { interpreter } from "../libs/interpreter";
import {
  parseJsonObj,
  extractJson,
  stripMarkdownCodeBlock,
  parseAITerms,
} from "../libs/utils";
import {
  decodeHTMLEntities,
  encodeHTMLTranslationText,
  decodeHTMLTranslationText,
} from "../libs/html";
import { parseCompleteTranslationSegments } from "../libs/aiResponseParser";
import {
  parseStreamingSegments,
  createStreamingJsonParser,
  createRealtimeStreamParser,
  detectStreamFormat,
  getStreamDelta,
} from "../libs/stream";
import { kissLog } from "../libs/log";
import { sleep } from "../libs/utils";
import { fetchData, fetchStream } from "../libs/fetch";
import { getMsgHistory } from "./history";
import { getDocInfo } from "../libs/docInfo";

const keyMap = new Map();

            
                     
                                                     
const keyPick = (apiSlug, key = "", cacheMap) => {
  const keys = key
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    return "";
  }

                                                       
  const preIndex = cacheMap.get(apiSlug) ?? -1;
  const curIndex = (preIndex + 1) % keys.length;
  cacheMap.set(apiSlug, curIndex);

  return keys[curIndex];
};

   
                                   
   
const genSystemPrompt = ({
  systemPrompt,
  tone,
  from,
  to,
  fromLang,
  toLang,
  texts,
  docInfo: { title = "", description = "", summary = "", context = "" } = {},
}) =>
  String(systemPrompt || "")
    .replaceAll(INPUT_PLACE_TITLE, title)
    .replaceAll(INPUT_PLACE_DESCRIPTION, description)
    .replaceAll(INPUT_PLACE_SUMMARY, summary)
    .replaceAll(INPUT_PLACE_CONTEXT, context)
    .replaceAll(INPUT_PLACE_TONE, tone)
    .replaceAll(INPUT_PLACE_FROM, from)
    .replaceAll(INPUT_PLACE_TO, to)
    .replaceAll(INPUT_PLACE_FROM_LANG, fromLang)
    .replaceAll(INPUT_PLACE_TO_LANG, toLang)
    .replaceAll(INPUT_PLACE_TEXT, texts[0]);

const genUserPrompt = ({
  nobatchUserPrompt,
  useBatchFetch,
  tone,
  glossary = {},              
  aiTerms = "",              
  from,
  to,
  fromLang,
  toLang,
  texts,
  docInfo: { title = "", description = "", summary = "", context = "" } = {},
}) => {
                    
  if (aiTerms) {
    const aiGlossary = parseAITerms(aiTerms);
    glossary = { ...glossary, ...aiGlossary };
  }

  if (useBatchFetch) {
    const promptObj = {
      targetLanguage: toLang,
      segments: texts.map((text, i) => ({ id: i, text })),
    };

    title && (promptObj.title = title);
    description && (promptObj.description = description);

    Object.keys(glossary).length !== 0 && (promptObj.glossary = glossary);
    tone && (promptObj.tone = tone);

    return JSON.stringify(promptObj);
  }

  const glossaryStr = Object.entries(glossary)
    .map(([term, definition]) => `- ${term}: ${definition}`)
    .join("\n");

  return String(nobatchUserPrompt || "")
    .replaceAll(INPUT_PLACE_TITLE, title)
    .replaceAll(INPUT_PLACE_DESCRIPTION, description)
    .replaceAll(INPUT_PLACE_SUMMARY, summary)
    .replaceAll(INPUT_PLACE_CONTEXT, context)
    .replaceAll(INPUT_PLACE_TONE, tone)
    .replaceAll(INPUT_PLACE_GLOSSARY, glossaryStr)
    .replaceAll(INPUT_PLACE_FROM, from)
    .replaceAll(INPUT_PLACE_TO, to)
    .replaceAll(INPUT_PLACE_FROM_LANG, fromLang)
    .replaceAll(INPUT_PLACE_TO_LANG, toLang)
    .replaceAll(INPUT_PLACE_TEXT, texts[0]);
};

   
                                             
                                                             
                                    
                                           
                                                             
   
const parseAIRes = (raw, useBatchFetch = true) => {
  if (!raw) {
    return [];
  }

                   
  if (!useBatchFetch) {
    return [[raw]];
  }

                                        
  let content = stripMarkdownCodeBlock(raw).trim();

                                        
                                                              
                               
  const structuredSegments = parseCompleteTranslationSegments(content, {
    decodeText: decodeHTMLEntities,
  });
  if (structuredSegments.length > 0) {
    return structuredSegments.map((segment) => segment.translation);
  }

                   
  return content.split("\n").map((line) => {
    const text = decodeHTMLEntities(line.replace(/<br\s*\/?>/gi, "\n").trim());
    return [text, ""];
  });
};

   
                            
                                
                                      
                                                              
                                                       
                  
   
const applyDeepSeekThinking = (body, { thinkingMode, thinkingEffort }) => {
  body.thinking = { type: thinkingMode };
  if (thinkingMode === "enabled" && thinkingEffort) {
    body.reasoning_effort = thinkingEffort;
  }
};

   
                          
                                
                                      
                                                           
                  
   
const applyOpenAIThinking = (body, { thinkingEffort }) => {
  if (thinkingEffort !== null) body.reasoning_effort = thinkingEffort;
};

const THINKING_ADAPTERS = {
  deepseek: applyDeepSeekThinking,
  openai: applyOpenAIThinking,
};

   
                              
                                
                                      
                                          
                                        
                                          
                                                                         
                                                                        
                                        
   
const applyThinkingParameters = (body, options) => {
  const registration = THINKING_API_REGISTRY[options.apiType];
  if (
    !registration ||
    options.thinkingMode === "auto" ||
    options.thinkingEffort === "_default" ||
    options.thinkingEffort === undefined
  ) {
    return;
  }

                                     
                                            
                                         
  const capability = registration.resolveCapability({
    apiType: options.apiType,
    url: options.url,
    model: options.model,
  });
  if (!capability) {
    return;
  }

  THINKING_ADAPTERS[registration.adapter]?.(body, options);
};

                                              
                                                                     
const genGoogle = ({ texts, from, to, url, key, textFormat = "text" }) => {
  const requestTexts =
    textFormat === "html" ? texts : texts.map(encodeHTMLTranslationText);
  const body = [[requestTexts, from, to], "wt_lib"];
  const headers = {
    "Content-Type": "application/json+protobuf",
    "X-Goog-API-Key": key,
  };

  return { url, body, headers };
};

                                               
const genGoogle2 = ({ texts, from, to, url, key }) => {
  const params = queryString.stringify({
    client: "gtx",
    dt: "t",
    dj: 1,
    ie: "UTF-8",
    sl: from,
    tl: to,
    q: texts.join(" "),
  });
  url = `${url}?${params}`;
  const headers = {
    "Content-type": "application/json",
  };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  return { url, headers, method: "GET" };
};

const genOpenAI = ({
  url,
  key,
  systemPrompt,
  userPrompt,
  model,
  temperature,
  maxTokens,
  hisMsgs = [],
  useStream = false,
  apiType,
  thinkingMode,
  thinkingEffort,
}) => {
  const userMsg = {
    role: "user",
    content: userPrompt,
  };
  const body = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...hisMsgs,
      userMsg,
    ],
    temperature,
    max_completion_tokens: maxTokens,
    stream: useStream,
  };

                                                  
                             
  if (apiType === OPT_TRANS_QWEN) {
    body.enable_thinking = false;
  }

  applyThinkingParameters(body, {
    apiType,
    url,
    model,
    thinkingMode,
    thinkingEffort,
  });

  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${key}`,          
                                      
  };

  return { url, body, headers, userMsg };
};

const genCustom = ({ texts, fromLang, toLang, url, key, useBatchFetch }) => {
  const body = useBatchFetch
    ? { texts, from: fromLang, to: toLang }
    : { text: texts[0], from: fromLang, to: toLang };
  const headers = {
    "Content-type": "application/json",
    Authorization: `Bearer ${key}`,
  };

  return { url, body, headers };
};

const genReqFuncs = {
  [OPT_TRANS_GOOGLE]: genGoogle,
  [OPT_TRANS_GOOGLE_2]: genGoogle2,
  [OPT_TRANS_QWEN]: genOpenAI,
  [OPT_TRANS_DEEPSEEK]: genOpenAI,
  [OPT_TRANS_OPENAI]: genOpenAI,
                                                                
                                                                        
  [OPT_TRANS_GROK]: genOpenAI,
  [OPT_TRANS_GEMINI]: genOpenAI,
  [OPT_TRANS_CLAUDE]: genOpenAI,
  [OPT_TRANS_CUSTOMIZE]: genCustom,
};

   
                       
                
   
const genInit = ({
  url = "",
  body = null,
  headers = {},
  userMsg = null,
  method = "POST",
}) => {
  if (!url) {
    throw new Error("genInit: url is empty");
  }

  const init = {
    method,
    headers,
  };
  if (method !== "GET" && method !== "HEAD" && body) {
    let payload = JSON.stringify(body);
    const id = body?.params?.id;

                                          
                                                         
                                                         
                                         
    if (id) {
      payload = payload.replace(
        'method":"',
        (id + 3) % 13 === 0 || (id + 5) % 29 === 0
          ? 'method" : "'
          : 'method": "'
      );
    }
    Object.assign(init, { body: payload });
  }

  return [url, init, userMsg];
};

   
             
             
           
   
export const genTransReq = async ({ reqHook, ...args }) => {
  const {
    apiType,
    apiSlug,
    key,
    systemPrompt,
                  
    nobatchPrompt = defaultNobatchPrompt,
    nobatchUserPrompt = defaultNobatchUserPrompt,
    useBatchFetch,
    from,
    to,
    fromLang,
    toLang,
    texts,
    glossary,
    aiTerms,
    customHeader,
    customBody,
    tone,
    docInfo: externalDocInfo,
  } = args;

  if (API_SPE_TYPES.mulkeys.has(apiType)) {
    args.key = keyPick(apiSlug, key, keyMap);
  }

                                                                                      
  if (
    [
      OPT_TRANS_QWEN,
      OPT_TRANS_DEEPSEEK,
      OPT_TRANS_OPENAI,
      OPT_TRANS_GROK,
      OPT_TRANS_GEMINI,
      OPT_TRANS_CLAUDE,
    ].includes(apiType) &&
    !String(args.model ?? "").trim()
  ) {
    throw new Error(
      "translate api requires a model, please select or input one"
    );
  }

  if (API_SPE_TYPES.ai.has(apiType)) {
    const docInfo = externalDocInfo || getDocInfo();

    args.systemPrompt = genSystemPrompt({
      systemPrompt: useBatchFetch ? systemPrompt : nobatchPrompt,
      from,
      to,
      fromLang,
      toLang,
      texts,
      docInfo,
      tone,
    });
    args.userPrompt = genUserPrompt({
      nobatchUserPrompt,
      useBatchFetch,
      from,
      to,
      fromLang,
      toLang,
      texts,
      docInfo,
      tone,
      glossary,
      aiTerms,
    });
  }

  const {
    url = "",
    body = null,
    headers = {},
    userMsg = null,
    method = "POST",
  } = genReqFuncs[apiType](args);

                        
  if (customHeader?.trim()) {
    Object.assign(headers, parseJsonObj(customHeader));
  }
  if (customBody?.trim()) {
                                    
                                             
                                                  
    if (body && typeof body === "object" && !Array.isArray(body)) {
      Object.assign(body, parseJsonObj(customBody));
    } else {
      kissLog(
        `customBody is not supported for ${apiType} (body is not a plain object), ignored`
      );
    }
  }

                    
  if (reqHook?.trim()) {
    try {
      const req = {
        url,
        body,
        headers,
        userMsg,
        method,
      };
      interpreter.run(`exports.reqHook = ${reqHook}`);
      const hookResult = await interpreter.exports.reqHook(
        {
          ...args,
          defaultSystemPrompt,
          defaultSystemPromptXml,
          defaultSystemPromptLines,
          defaultNobatchPrompt,
          defaultNobatchUserPrompt,
          req,
        },
        req
      );
      if (hookResult && hookResult.url) {
        return genInit(hookResult);
      }
    } catch (err) {
      kissLog("run req hook", err);
      throw new Error(`Request hook error: ${err.message}`);
    }
  }

  return genInit({ url, body, headers, userMsg, method });
};

   
             
                 
                    
           
   
export const parseTransRes = async (
  res,
  {
    texts,
    from,
    to,
    fromLang,
    toLang,
    langMap,
    resHook,
                   
    history,
    userMsg,
    apiType,
    useBatchFetch,
    textFormat = "text",
  }
) => {
                     
  if (resHook?.trim()) {
    try {
      interpreter.run(`exports.resHook = ${resHook}`);
      const hookResult = await interpreter.exports.resHook({
        apiType,
        userMsg,
        res,
        texts,
        from,
        to,
        fromLang,
        toLang,
        langMap,
        extractJson,
        parseAIRes,
      });
      if (hookResult && Array.isArray(hookResult.translations)) {
        if (history && userMsg && hookResult.modelMsg) {
          history.add(userMsg, hookResult.modelMsg);
        }
        return hookResult.translations;
      } else if (Array.isArray(hookResult)) {
        return hookResult;
      }
    } catch (err) {
      kissLog("run res hook", err);
      throw new Error(`Response hook error: ${err.message}`);
    }
  }

                                                          
                                     
  if (res && typeof res.code === "number" && res.code !== 0 && res.msg) {
    const bizErr = new Error(res.msg);
    bizErr.bizCode = res.code;
    throw bizErr;
  }

  let modelMsg = "";

                       
  switch (apiType) {
    case OPT_TRANS_GOOGLE:
                                                       
      return res?.[0]?.map((_, i) => [
        textFormat === "text"
          ? decodeHTMLTranslationText(res?.[0]?.[i])
          : res?.[0]?.[i],
        res?.[1]?.[i],
      ]);
    case OPT_TRANS_GOOGLE_2:
                                             
      return [[res?.sentences?.map((item) => item.trans).join(" "), res?.src]];
    case OPT_TRANS_OPENAI:
    case OPT_TRANS_DEEPSEEK:
    case OPT_TRANS_QWEN:
                                                         
    case OPT_TRANS_GROK:
    case OPT_TRANS_GEMINI:
    case OPT_TRANS_CLAUDE:
      modelMsg = res?.choices?.[0]?.message;
      if (history && userMsg && modelMsg) {
        history.add(userMsg, {
          role: modelMsg.role,
          content: modelMsg.content,
        });
      }
      return parseAIRes(modelMsg?.content, useBatchFetch);
    case OPT_TRANS_CUSTOMIZE:
      if (useBatchFetch) {
        return (res?.translations ?? res)?.map((item) => [item.text, item.src]);
      }
      return [[res.text, res.src || res.from]];
    default:
  }

  throw new Error("parse translate result: apiType not matched", apiType);
};

   
                          
  
                                            
                                      
  
                        
                                 
                                      
   
function parseDictRes(res, apiType) {
  switch (apiType) {
    case OPT_TRANS_OPENAI:
    case OPT_TRANS_DEEPSEEK:
    case OPT_TRANS_QWEN:
                                                         
    case OPT_TRANS_GROK:
    case OPT_TRANS_GEMINI:
    case OPT_TRANS_CLAUDE:
      return res?.choices?.[0]?.message?.content || "";
    case OPT_TRANS_CUSTOMIZE:
      if (typeof res === "string") return res;
      return res?.text || res?.result || "";
    default:
  }

  throw new Error("parse dictionary result: apiType not matched", apiType);
}

   
                             
  
                          
                                                 
  
                                
                                      
                                               
                                              
                                        
                                       
                                               
                                              
                                               
                                                  
                                            
                                                
   
export const handleDict = async ({
  text,
  from,
  to,
  fromLang,
  toLang,
  apiSetting,
  docInfo,
  context = "",
  onStreamChunk,
  signal,
}) => {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  const {
    apiType,
    fetchInterval,
    fetchLimit,
    httpTimeout,
    dictPrompt,
    dictUserPrompt,
  } = apiSetting;
  const enableStream =
    Boolean(onStreamChunk) &&
    apiSetting.useStream &&
    API_SPE_TYPES.stream.has(apiType);
  if (!dictPrompt) {
    throw new Error("AI dictionary prompt is empty.");
  }

                                              
  const requestApiSetting = {
    ...apiSetting,
    useBatchFetch: false,
    useStream: enableStream,
    nobatchPrompt: dictPrompt,
    nobatchUserPrompt: dictUserPrompt ?? defaultDictUserPrompt,
  };
  const dictDocInfo = docInfo || getDocInfo();

                                                            
  const [input, init] = await genTransReq({
    ...requestApiSetting,
    texts: [text],
    from,
    to,
    fromLang,
    toLang,
    docInfo: {
      ...(dictDocInfo || {}),
      context,
    },
  });

  if (apiSetting._translationOperation && input === apiSetting.url)
    init.headers = {
      ...init.headers,
      "X-Translation-Operation": apiSetting._translationOperation,
    };

  if (enableStream) {
    try {
      let fullContent = "";

      for await (const rawData of fetchStream(input, init, {
        useCache: false,
        usePool: true,
        fetchInterval,
        fetchLimit,
        httpTimeout,
        signal,
      })) {
        try {
          const json = JSON.parse(rawData);
          const delta = getStreamDelta(json, apiType);
          if (!delta) continue;

          fullContent += delta;
                                                           
          fullContent = stripMarkdownCodeBlock(fullContent, true);
          onStreamChunk({ markdown: fullContent });
        } catch (error) {
          if (error?.isAIStreamTerminal) throw error;
                                        
        }
      }

      const markdown = stripMarkdownCodeBlock(fullContent).trim();
      if (!markdown) {
        throw new Error("dictionary got empty content");
      }

      return markdown;
    } catch (err) {
      if (err?.name === "AbortError") {
        throw err;
      }

      kissLog("dictionary stream failed, fallback to non-stream", err);
    }

                                      
    const [fallbackInput, fallbackInit] = await genTransReq({
      ...requestApiSetting,
      useStream: false,
      texts: [text],
      from,
      to,
      fromLang,
      toLang,
      docInfo: {
        ...(dictDocInfo || {}),
        context,
      },
    });

    const fallbackRes = await fetchData(fallbackInput, fallbackInit, {
      useCache: false,
      usePool: true,
      fetchInterval,
      fetchLimit,
      httpTimeout,
      signal,
    });
    if (!fallbackRes) {
      throw new Error("dictionary got empty response");
    }

    const fallbackMarkdown = parseDictRes(fallbackRes, apiType);
    if (!fallbackMarkdown) {
      throw new Error("dictionary got empty content");
    }

    return fallbackMarkdown;
  }

  const res = await fetchData(input, init, {
    useCache: false,
    usePool: true,
    fetchInterval,
    fetchLimit,
    httpTimeout,
    signal,
  });
  if (!res) {
    throw new Error("dictionary got empty response");
  }

  const markdown = parseDictRes(res, apiType);
  if (!markdown) {
    throw new Error("dictionary got empty content");
  }

  return markdown;
};

   
            
               
                           
                          
                                                               
                                           
   
   
                                            
                                                          
   
const isGatewayError = (err) => {
  const raw = err?.message || "";
  const i = raw.indexOf("{");
  if (i === -1) return false;
  try {
    const { status } = JSON.parse(raw.slice(i));
    return [502, 503, 504].includes(status);
  } catch {
    return false;
  }
};

                                           
const GATEWAY_RETRY_DELAYS = [1500, 4000];

export async function* handleTranslate(
  texts = [],
  {
    from,
    to,
    fromLang,
    toLang,
    langMap,
    glossary,
    apiSetting,
    usePool,
    docInfo,
    textFormat = "text",
    signal,
  }
) {
  if (signal?.aborted) return;

  let history = null;
  let hisMsgs = [];
  const {
    apiType,
    apiSlug,
    contextSize,
    useContext,
    fetchInterval,
    fetchLimit,
    httpTimeout,
    useStream,
  } = apiSetting;
  if (useContext && API_SPE_TYPES.context.has(apiType)) {
    history = getMsgHistory(apiSlug, contextSize);
    hisMsgs = history.getAll();
  }

  const enableStream = useStream && API_SPE_TYPES.stream.has(apiType);

  const getRequest = async (requestUseStream) => {
    const request = await genTransReq({
      ...apiSetting,
      texts,
      from,
      to,
      fromLang,
      toLang,
      langMap,
      glossary,
      textFormat,
      hisMsgs,
      useStream: requestUseStream,
      docInfo,
    });
    if (apiSetting._translationOperation && request[0] === apiSetting.url)
      request[1].headers = {
        ...request[1].headers,
        "X-Translation-Operation": apiSetting._translationOperation,
      };
    return request;
  };

  const runNonStream = async function* (input, init, userMsg) {
                                               
                                        
    let response;
    let directRequestId;
    for (let attempt = 0; ; attempt++) {
      try {
        if (usesDirectTranslationQuota(apiSetting))
          directRequestId = await admitDirectTranslation(
            apiSetting,
            signal,
            texts.reduce(
              (n, text) => n + new TextEncoder().encode(text).length,
              0
            )
          );
        response = await fetchData(input, init, {
          useCache: false,
          usePool,
          fetchInterval,
          fetchLimit,
          httpTimeout,
          signal,
        });
        break;
      } catch (err) {
        if (
          signal?.aborted ||
          attempt >= GATEWAY_RETRY_DELAYS.length ||
          !isGatewayError(err)
        ) {
          if (isGatewayError(err)) {
            kissLog("translate gateway retry exhausted", err);
            throw new Error(
              "翻译服务暂时不可用（服务器重启/维护中，约 1 分钟内恢复），请稍后重试 / Translation service is temporarily unavailable (server restarting), please retry shortly."
            );
          }
          throw err;
        }
        await sleep(GATEWAY_RETRY_DELAYS[attempt]);
      }
    }
    if (!response) {
      throw new Error("translate got empty response");
    }

    const result = await parseTransRes(response, {
      texts,
      from,
      to,
      fromLang,
      toLang,
      langMap,
      history,
      userMsg,
      ...apiSetting,
      textFormat,
    });
    if (!result?.length) {
      throw new Error("translate got an unexpected result");
    }

    if (directRequestId)
      apiSetting._renderTask.directSucceeded(directRequestId);
    for (let i = 0; i < result.length; i++) {
      yield { id: i, result: result[i] };
    }
  };

  const [input, init, userMsg] = await getRequest(enableStream);

  if (enableStream) {
    try {
      yield* handleTranslateStreamInternal(texts, input, init, {
        apiType,
        history,
        userMsg,
        useBatchFetch: apiSetting.useBatchFetch,
        usePool,
        fetchInterval,
        fetchLimit,
        httpTimeout,
        signal,
        streamRenderMode: apiSetting.streamRenderMode || "disabled",
      });
      return;
    } catch (err) {
      if (err?.name === "AbortError") {
        throw err;
      }
      kissLog("translate stream failed, fallback to non-stream", err);
    }

    const [fallbackInput, fallbackInit, fallbackUserMsg] =
      await getRequest(false);
    yield* runNonStream(fallbackInput, fallbackInit, fallbackUserMsg);
    return;
  }

  yield* runNonStream(input, init, userMsg);
}

   
           
   
async function* handleTranslateStreamInternal(
  texts,
  input,
  init,
  {
    apiType,
    history,
    userMsg,
    useBatchFetch,
    usePool,
    fetchInterval,
    fetchLimit,
    httpTimeout,
    signal,
    streamRenderMode,
  }
) {
  const results = new Array(texts.length).fill(null);
  let fullContent = "";
  const processedIds = new Set();

  const jsonParser = createStreamingJsonParser();
  const realtimeParser =
    streamRenderMode === "realtime" ? createRealtimeStreamParser() : null;
  let isJsonFormat = false;
  let formatDetected = false;

  try {
    for await (const rawData of fetchStream(input, init, {
      useCache: false,
      usePool,
      fetchInterval,
      fetchLimit,
      httpTimeout,
      signal,
    })) {
      try {
        const json = JSON.parse(rawData);
        const delta = getStreamDelta(json, apiType);

        if (delta) {
          fullContent += delta;
          fullContent = stripMarkdownCodeBlock(fullContent, true);

          if (!useBatchFetch) {
            if (streamRenderMode === "realtime") {
              yield { id: 0, partialText: fullContent, isComplete: false };
            }
            continue;
          }

                                              
                         
          if (realtimeParser && streamRenderMode === "realtime") {
            const items = realtimeParser.write(delta);
            for (const { id, partialText, isComplete } of items) {
              if (!isComplete) {
                yield { id, partialText, isComplete: false };
              }
            }
          }

          if (!formatDetected) {
            const { isJson, detected } = detectStreamFormat(fullContent);
            if (detected) {
              formatDetected = true;
              isJsonFormat = isJson;
                                    
              if (isJsonFormat) {
                for (const { id, translation } of jsonParser.write(
                  fullContent
                )) {
                  results[id] = translation;
                  yield { id, result: translation };
                }
              }
            }
          } else if (isJsonFormat) {
            for (const { id, translation } of jsonParser.write(delta)) {
              results[id] = translation;
              yield { id, result: translation };
            }
          } else {
            for (const { id, translation } of parseStreamingSegments(
              fullContent,
              processedIds
            )) {
              results[id] = translation;
              yield { id, result: translation };
            }
          }
        }
      } catch (e) {
        if (e?.isAIStreamTerminal) throw e;
                 
      }
    }

    if (isJsonFormat) {
      jsonParser.end();
    }
  } catch (error) {
    kissLog("handleTranslateStream error", error);
    throw error;
  }

                                 
                             
  if (!fullContent) {
    throw new Error("stream got empty content");
  }

                      
  const hasEmpty = results.some((r) => !r);
  if (hasEmpty) {
    const parsed = parseAIRes(fullContent, useBatchFetch);
    for (let i = 0; i < texts.length && i < parsed.length; i++) {
      if (!results[i]) {
        results[i] = parsed[i];
        yield { id: i, result: results[i] };
      }
    }
  }

  if (history && userMsg) {
    history.add(userMsg, {
      role: "assistant",
      content: fullContent,
    });
  }
}

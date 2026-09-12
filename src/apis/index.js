import queryString from "query-string";
import { fetchData } from "../libs/fetch";
import {
  URL_CACHE_TRAN,
  URL_CACHE_BINGDICT,
  URL_CACHE_DICT,
  OPT_LANGS_TO_SPEC,
  OPT_LANGS_FROM_SPEC,
  OPT_LANGS_SPEC_DEFAULT,
  API_SPE_TYPES,
  DEFAULT_API_SETTING,
  OPT_LANGS_TO_CODE,
  TRANSLATE_RELAY_BASE,
  defaultNobatchUserPrompt,
  defaultDictUserPrompt,
  normalizeApiBuiltinModels,
} from "../config";
import {
  isSameTranslationLanguage,
  normalizeLanguageCode,
} from "../libs/language";
import { getCacheDigest } from "../libs/cacheDigest";
import {
  assertRelayQuota,
  handleQuotaError,
  isRelayApiSetting,
} from "../libs/membership";
import { getAccount } from "../libs/account";
import { refreshTranslationQuota } from "../libs/translationQuota";
import { usesDirectTranslationQuota } from "../libs/directTranslationQuota";
import { createTranslationOperation } from "../libs/translationOperation";
import { recordAccountActivity } from "../libs/activity";
import { handleTranslate, handleDict } from "./trans";
import { getHttpCachePolyfill, putHttpCachePolyfill } from "../libs/cache";
import { getBatchQueue } from "../libs/batchQueue";
import { trustedTypesHelper } from "../libs/trustedTypes";
import { getDocInfo } from "../libs/docInfo";
import { refreshBuiltinModels } from "../libs/builtinModelSync";

const PROMPT_CACHE_SALT = "prompt-cache";
const PROMPT_CACHE_SCOPE_BATCH = "batch";
const PROMPT_CACHE_SCOPE_NOBATCH = "nobatch";
const PROMPT_CACHE_SCOPE_DICT = "dict";
const PROMPT_CACHE_SCOPE_PLAIN = "plain";

const isGenericChineseLanguageCode = (code) =>
  typeof code === "string" && /^zh$/i.test(code.trim());

   
                                          
                                              
                                                                       
   
const resolveRelayApiSetting = async (apiSetting) => {
  if (!isRelayApiSetting(apiSetting)) {
    return apiSetting;
  }
  const provider = apiSetting.apiType.toLowerCase();
  await refreshBuiltinModels({ force: true }).catch(() => {});
  apiSetting = normalizeApiBuiltinModels([apiSetting])[0];
  const account = await getAccount();
  return {
    ...apiSetting,
    url: `${TRANSLATE_RELAY_BASE}/${provider}/chat/completions`,
    key: account?.accessToken || "",
  };
};

const getTranslationLanguageMatch = ({
  fromLang,
  toLang,
  to,
  srLang,
  srCode,
  translateVariants,
}) => {
  if (fromLang !== "auto") return false;

  const isGenericChinese = isGenericChineseLanguageCode(srLang);
  const normalizedSource =
    isGenericChinese && translateVariants
      ? ""
      : normalizeLanguageCode(srCode || srLang);
  const normalizedTarget = normalizeLanguageCode(toLang);

  return (
    isSameTranslationLanguage(
      normalizedSource,
      normalizedTarget,
      translateVariants
    ) ||
    (!isGenericChinese &&
      (!normalizedSource || !normalizedTarget) &&
      srLang === to)
  );
};

function getTranslatePromptCacheScope(apiSetting = {}) {
  if (!API_SPE_TYPES.ai.has(apiSetting.apiType)) {
    return PROMPT_CACHE_SCOPE_PLAIN;
  }

  return apiSetting.useBatchFetch && API_SPE_TYPES.batch.has(apiSetting.apiType)
    ? PROMPT_CACHE_SCOPE_BATCH
    : PROMPT_CACHE_SCOPE_NOBATCH;
}

function getPromptCacheFields(apiSetting = {}, promptScope, glossary = {}) {
  let fields = [];

  if (promptScope === PROMPT_CACHE_SCOPE_BATCH) {
    fields = [apiSetting.systemPrompt || ""];
  } else if (promptScope === PROMPT_CACHE_SCOPE_NOBATCH) {
    fields = [
      apiSetting.nobatchPrompt || "",
      apiSetting.nobatchUserPrompt ?? defaultNobatchUserPrompt,
    ];
  } else if (promptScope === PROMPT_CACHE_SCOPE_DICT) {
    return [
      apiSetting.dictPrompt || "",
      apiSetting.dictUserPrompt ?? defaultDictUserPrompt,
    ];
  } else {
    return [];
  }

  fields.push(apiSetting.tone || "", apiSetting.aiTerms || "");
  const glossaryEntries = Object.entries(glossary || {}).sort();
  if (glossaryEntries.length) {
    fields.push(JSON.stringify(glossaryEntries));
  }
  return fields;
}

async function getPromptCacheSig(apiSetting = {}, promptScope, glossary) {
  const promptText = [
    promptScope,
    ...getPromptCacheFields(apiSetting, promptScope, glossary),
  ].join("\n");

  return (await getCacheDigest(promptText, PROMPT_CACHE_SALT)).slice(0, 16);
}

   
              
                                
                                                         
   
export const apiGoogleLangdetect = async (text) => {
  const params = {
    client: "gtx",
    dt: "t",
    dj: 1,
    ie: "UTF-8",
    sl: "auto",
    tl: "zh-CN",
    q: text,
  };
  const input = `https://translate.googleapis.com/translate_a/single?${queryString.stringify(params)}`;
  const init = {
    headers: {
      "Content-type": "application/json",
    },
  };
                                          
  const res = await fetchData(input, init, { useCache: true });

  if (res?.src) {
    await putHttpCachePolyfill(input, init, res);
    return res.src;
  }

  return "";
};

   
                                     
                                            
                                
                                                    
   
export const apiMicrosoftDict = async (text) => {
  const cacheOpts = { text };
  const cacheInput = `${URL_CACHE_BINGDICT}?${queryString.stringify(cacheOpts)}`;

                                 
  const cache = await getHttpCachePolyfill(cacheInput);
  if (cache) {
    return cache;
  }

  const host = "https://www.bing.com";
  const url = `${host}/dict/search?q=${text}&FORM=BDVSP6&cc=cn`;
  const str = await fetchData(
    url,
    { credentials: "include" },                               
    { useCache: false }
  );
  if (!str) {
    return null;
  }

                                          
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    trustedTypesHelper.createHTML(str),
    "text/html"
  );

  const word = doc.querySelector("#headword > h1")?.textContent.trim();
  if (!word) {
    return null;
  }

                      
  const trs = [];
  doc.querySelectorAll("div.qdef > ul > li").forEach(($li) => {
    const pos = $li.querySelector(".pos")?.textContent?.trim();
    const def = $li.querySelector(".def")?.textContent?.trim();
    trs.push({ pos, def });
  });

                            
  const presents = [];
  doc.querySelectorAll("div.hd_div1>.hd_if>.p1-5").forEach(($li) => {
    const present = $li.textContent?.trim();
    presents.push(present);
  });

                        
  const ecs = [];
  doc.querySelectorAll(".each_seg>.li_pos").forEach(($li) => {
    const pos = $li.querySelector(".pos_lin>.pos")?.textContent?.trim();
    const lis = [];
    $li.querySelectorAll(".de_seg>.se_lis").forEach(($l) => {
      lis.push($l.querySelector(".de_co")?.textContent?.trim());
    });
    ecs.push({ pos, lis });
  });

                            
  const sentences = [];
  doc.querySelectorAll("#sentenceSeg .se_li").forEach(($li) => {
    const eng = $li.querySelector(".sen_en")?.textContent?.trim();
    const chs = $li.querySelector(".sen_cn")?.textContent?.trim();
    if (eng && chs) {
      sentences.push({ eng, chs });
    }
  });

                             
  const aus = [];
  const $audioUK = doc.querySelector("#bigaud_uk");
  const $audioUS = doc.querySelector("#bigaud_us");

                     
  if ($audioUK) {
    const audioUK = host + $audioUK?.dataset?.mp3link;
    const $phoneticUK = $audioUK.parentElement?.previousElementSibling;
    const phoneticUK = $phoneticUK?.textContent
      ?.trim()
      ?.match(/\[(.*?)\]/)?.[1];
    aus.push({ key: "英", audio: audioUK, phonetic: phoneticUK });
  }

                     
  if ($audioUS) {
    const audioUS = host + $audioUS?.dataset?.mp3link;
    const $phoneticUS = $audioUS.parentElement?.previousElementSibling;
    const phoneticUS = $phoneticUS?.textContent
      ?.trim()
      ?.match(/\[(.*?)\]/)?.[1];
    aus.push({ key: "美", audio: audioUS, phonetic: phoneticUS });
  }

                             
  if (aus.length === 0) {
    const $pronInfo = doc.querySelector(".hd_pr");
    const $pronInfoUS = doc.querySelector(".hd_prUS");

    if ($pronInfo) {
      const phoneticText = $pronInfo.textContent?.trim();
      const phoneticMatch = phoneticText?.match(/\[([^\]]+)\]/);
      if (phoneticMatch) {
        aus.push({ key: "英", phonetic: phoneticMatch[1] });
      }
    }

    if ($pronInfoUS) {
      const phoneticText = $pronInfoUS.textContent?.trim();
      const phoneticMatch = phoneticText?.match(/\[([^\]]+)\]/);
      if (phoneticMatch) {
        aus.push({ key: "美", phonetic: phoneticMatch[1] });
      }
    }
  }

  const res = { word, trs, aus, ecs, sentences, presents };
             
  putHttpCachePolyfill(cacheInput, null, res);

  return res;
};

   
                         
                              
                                         
   
export const apiBaiduSuggest = async (text) => {
  const input = "https://fanyi.baidu.com/sug";
  const init = {
    headers: {
      "Content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      kw: text,
    }),
  };
  const res = await fetchData(input, init, { useCache: true });

  if (res?.errno === 0) {
    await putHttpCachePolyfill(input, init, res);
    return res.data;
  }

  return [];
};

   
              
                           
                                             
   
export const apiYoudaoSuggest = async (text) => {
  const params = {
    num: 5,
    ver: 3.0,
    doctype: "json",
    cache: false,
    le: "en",
    q: text,
  };
  const input = `https://dict.youdao.com/suggest?${queryString.stringify(params)}`;
  const init = {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,ja;q=0.6",
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "GET",
  };
  const res = await fetchData(input, init, { useCache: true });

  if (res?.result?.code === 200) {
    await putHttpCachePolyfill(input, init, res);
    return res.data.entries;
  }

  return [];
};

   
            
                            
                                                  
   
export const apiYoudaoDict = async (text) => {
  const params = {
    doctype: "json",
    jsonversion: 4,
  };
  const input = `https://dict.youdao.com/jsonapi_s?${queryString.stringify(params)}`;
  const body = queryString.stringify({
    q: text,
    le: "en",
    t: 3,
    client: "web",
    keyfrom: "webdict",
  });
  const init = {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,ja;q=0.6",
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    body,
  };
  const res = await fetchData(input, init, { useCache: true });

  if (res) {
    await putHttpCachePolyfill(input, init, res);
    return res;
  }

  return null;
};

   
                
                                           
                         
                                                                 
                                                 
                                       
                                               
                                             
                                                                    
                                                   
                                                        
                                                      
                                                          
                                                             
                                                               
                                                                           
   
export const apiTranslate = async ({
  text,
  fromLang = "auto",
  toLang,
  apiSetting = DEFAULT_API_SETTING,
  glossary,
  onStreamChunk,
  docInfo,
  useCache = true,
  usePool = true,
  translateVariants = true,
  textFormat = "text",
  signal,
  translationOperation,
}) => {
  if (!text) {
    throw new Error("The text cannot be empty.");
  }
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  const { apiType, apiSlug, useBatchFetch } = apiSetting;
  const usesRelay = isRelayApiSetting(apiSetting);
  const usesTask = usesRelay || usesDirectTranslationQuota(apiSetting);

                                              
  await assertRelayQuota(apiSetting);

                                          
  apiSetting = await resolveRelayApiSetting(apiSetting);

  const langMap = OPT_LANGS_TO_SPEC[apiType] || OPT_LANGS_SPEC_DEFAULT;
  const fromMap = OPT_LANGS_FROM_SPEC[apiType] || langMap;
  const from = fromMap.get(fromLang);
  const to = langMap.get(toLang);
  if (!to) {
    throw new Error(`The target lang: ${toLang} not support`);
  }

                                        
                                                     
                                                           
                                                      
  const [v1, v2] = process.env.REACT_APP_VERSION.split(".");
  const promptSig = await getPromptCacheSig(
    apiSetting,
    getTranslatePromptCacheScope(apiSetting),
    glossary
  );
  const cacheOpts = {
    apiSlug,
    text,
    fromLang,
    toLang,
    textFormat,
    translateVariants,
    version: [v1, v2].join("."),
    promptSig,
                                                 
    model: apiSetting.model,
    url: apiSetting.url,
    ...(docInfo?.summary && { ctx: docInfo.summary.slice(0, 50) }),
  };
  const cacheInput = `${URL_CACHE_TRAN}?${queryString.stringify(cacheOpts)}`;

                                 
  if (useCache) {
    const cache = await getHttpCachePolyfill(cacheInput);
    if (cache?.trText) {
      if (!signal?.aborted) void recordAccountActivity();
      return {
        ...cache,
        isSame: getTranslationLanguageMatch({
          fromLang,
          toLang,
          to,
          srLang: cache.srLang,
          srCode: cache.srCode,
          translateVariants,
        }),
      };
    }
  }
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

                      
  let operation = translationOperation;
  if (usesTask) {
    operation ||= createTranslationOperation("single");
    try {
      const lease = await operation.prepare();
      apiSetting = {
        ...apiSetting,
        ...(usesRelay
          ? { key: lease.token, _translationOperation: lease.operationId }
          : {}),
        _renderTask: operation,
        _renderTaskId: lease.operationId,
      };
    } catch (error) {
      await handleQuotaError(error).catch(() => {});
      throw error;
    }
  }
  let translation = [];
  if (useBatchFetch && API_SPE_TYPES.batch.has(apiType)) {
                                   
                                                       
    const {
      apiSlug,
      batchInterval,
      batchSize,
      batchLength,
      batchConcurrency,
      useStream,
      useContext,
    } = apiSetting;
    const enableStream = useStream && API_SPE_TYPES.stream.has(apiType);
    const configuredBatchConcurrency = Number(batchConcurrency);
    const effectiveBatchConcurrency =
      useContext && API_SPE_TYPES.context.has(apiType)
        ? 1
        : Number.isFinite(configuredBatchConcurrency) &&
            configuredBatchConcurrency >= 1
          ? Math.floor(configuredBatchConcurrency)
          : 1;
    const key = `${apiSlug}_${fromLang}_${toLang}_${textFormat}_${enableStream ? "stream" : "batch"}_${promptSig}_${effectiveBatchConcurrency}_${apiSetting._renderTaskId || apiSetting._translationOperation || ""}`;
    const queue = getBatchQueue(key, handleTranslate, {
      batchInterval,
      batchSize,
      batchLength,
      batchConcurrency: effectiveBatchConcurrency,
    });

    translation = await queue
      .addTask(text, {
        from,
        to,
        fromLang,
        toLang,
        langMap,
        glossary,
        textFormat,
        apiSetting,
        usePool,
        onStreamChunk,
        docInfo,
        signal,
      })
      .catch(async (err) => {
                                           
        await handleQuotaError(err).catch(() => {});
        throw err;
      });
  } else {
                                               
    const generator = handleTranslate([text], {
      from,
      to,
      fromLang,
      toLang,
      langMap,
      glossary,
      textFormat,
      apiSetting,
      usePool,
      docInfo,
      onStreamChunk,
      signal,
    });

    try {
      for await (const item of generator) {
        if (item.id !== 0) {
          continue;
        }

        const isComplete = item.isComplete !== false;
        if (!isComplete) {
          if (onStreamChunk) {
            onStreamChunk({
              id: item.id,
              text: item.partialText,
              isComplete: false,
            });
          }
          continue;
        }

        if (onStreamChunk) {
          onStreamChunk({
            id: item.id,
            text: item.result,
            isComplete: true,
          });
        }
        translation = item.result;
      }
    } catch (err) {
                                         
      await handleQuotaError(err).catch(() => {});
      throw err;
    }
  }

  if (usesRelay) void refreshTranslationQuota().catch(() => {});

                           
  let trText = "";
  let srLang = "";
  let srCode = "";
  if (Array.isArray(translation)) {
    [trText, srLang = ""] = translation;
    if (srLang) {
      srCode = OPT_LANGS_TO_CODE[apiType].get(srLang) || "";
    }
  } else if (typeof translation === "string") {
    trText = translation;
  }

  if (!trText) {
    throw new Error("tanslate api got empty trtext");
  }

                                            
  const isSame = getTranslationLanguageMatch({
    fromLang,
    toLang,
    to,
    srLang,
    srCode,
    translateVariants,
  });

                       
  if (useCache) {
    putHttpCachePolyfill(cacheInput, null, { trText, isSame, srLang, srCode });
  }

  if (!signal?.aborted) void recordAccountActivity();
  return {
    trText,
    srLang,
    srCode,
    isSame,
    translationOperation: usesTask ? operation : null,
  };
};

   
             
  
                                       
                                                  
  
                              
                                            
                                                 
                                       
                                                      
                                                
                                               
                                                            
                                                   
                                            
                                                  
   
export const apiDict = async ({
  text,
  fromLang = "auto",
  toLang,
  apiSetting = DEFAULT_API_SETTING,
  docInfo,
  context = "",
  onStreamChunk,
  useCache = true,
  signal,
  translationOperation,
  onOperation,
}) => {
  if (!text) {
    throw new Error("The text cannot be empty.");
  }
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  const { apiType } = apiSetting;
  if (!API_SPE_TYPES.ai.has(apiType)) {
    throw new Error("AI dictionary only supports AI APIs.");
  }

  const usesRelay = isRelayApiSetting(apiSetting);
  await assertRelayQuota(apiSetting);
                               
  apiSetting = await resolveRelayApiSetting(apiSetting);

                                                   
  const langMap = OPT_LANGS_TO_SPEC[apiType] || OPT_LANGS_SPEC_DEFAULT;
  const from = langMap.get(fromLang);
  const to = langMap.get(toLang);
  if (!to) {
    throw new Error(`The target lang: ${toLang} not support`);
  }

  const [v1, v2] = process.env.REACT_APP_VERSION.split(".");
  const effectiveDocInfo = docInfo || getDocInfo();
                                         
  const contextSig = await getCacheDigest(
    [
      effectiveDocInfo?.title || "",
      effectiveDocInfo?.description || "",
      effectiveDocInfo?.summary || "",
      context || "",
    ].join("\n"),
    PROMPT_CACHE_SALT
  );
  const cacheOpts = {
    apiSlug: apiSetting.apiSlug,
    text,
    fromLang,
    toLang,
    version: [v1, v2].join("."),
    promptSig: await getPromptCacheSig(apiSetting, PROMPT_CACHE_SCOPE_DICT),
    contextSig: contextSig.slice(0, 16),
  };
  const cacheInput = `${URL_CACHE_DICT}?${queryString.stringify(cacheOpts)}`;

  if (useCache) {
    const cache = await getHttpCachePolyfill(cacheInput);
    if (cache?.markdown) {
      return cache.markdown;
    }
  }
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  if (usesRelay) {
    const operation =
      translationOperation || createTranslationOperation("dictionary");
    const lease = await operation.prepare();
    apiSetting = {
      ...apiSetting,
      key: lease.token,
      _translationOperation: lease.operationId,
    };
    onOperation?.(operation);
  }
  const markdown = await handleDict({
    text,
    from,
    to,
    fromLang,
    toLang,
    apiSetting,
    docInfo: effectiveDocInfo,
    context,
    onStreamChunk,
    signal,
  });

  if (useCache) {
    putHttpCachePolyfill(cacheInput, null, { markdown });
  }

  return markdown;
};

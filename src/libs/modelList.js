                                                    
const MODEL_KEY_PLACEHOLDER = "{{key}}";

                                                                          
const X_API_KEY_TYPES = new Set(["Claude"]);

   
                                
  
                                       
                                         
                                 
                  
   
const addUniqueModel = (models, seen, model) => {
  const normalizedModel = typeof model === "string" ? model.trim() : "";

                               
  if (!normalizedModel || seen.has(normalizedModel)) {
    return;
  }

  seen.add(normalizedModel);
  models.push(normalizedModel);
};

   
                                     
  
                                                        
  
                                           
                                      
   
export function parseModelListResponse(
  data,
  { apiType, translationOnly = false } = {}
) {
  if (!data || typeof data !== "object") {
    return [];
  }

  const models = [];
  const seen = new Set();
  const lists = [
    Array.isArray(data) ? data : null,
    data.data,
    data.models,
    data.output?.models,
    data.data?.models,
    data.data?.data,
    data.result?.models,
  ].filter(Array.isArray);

  lists.forEach((list) => {
    list.forEach((item) => {
      if (typeof item === "string") {
        if (!translationOnly || isTranslationModel(item))
          addUniqueModel(models, seen, item);
        return;
      }

                                    
      if (!item || typeof item !== "object") {
        return;
      }

                                          
                                                
                                     
      if (translationOnly) {
        const methods =
          item.supportedGenerationMethods || item.supported_actions;
        if (
          Array.isArray(methods) &&
          !methods.some((method) =>
            /generateContent|generateMessage|chat/i.test(method)
          )
        )
          return;
        const outputs =
          item.architecture?.output_modalities || item.output_modalities;
        if (
          Array.isArray(outputs) &&
          outputs.length &&
          !outputs.includes("text")
        )
          return;
      }
      let model = [
        item.id,
        item.model_id,
        item.model,
        item.name,
        item.baseModelId,
      ].find((value) => typeof value === "string" && value.trim());
      if (apiType === "Gemini" && typeof model === "string")
        model = model.replace(/^models\//, "");
      if (translationOnly && !isTranslationModel(model)) return;
      addUniqueModel(models, seen, model);
    });
  });

  return models;
}

   
                            
  
        
                                                    
                                                             
                                                     
  
                               
                                            
                                                
                                      
                                                                        
   
export function createModelListRequest({ apiType, modelListUrl, key }) {
  const trimmedUrl = (modelListUrl || "").trim();
  const trimmedKey = (key || "").trim();

                                      
  if (!trimmedUrl || !trimmedKey) {
    return null;
  }

                                                 
  if (trimmedUrl.includes(MODEL_KEY_PLACEHOLDER)) {
    return {
      input: trimmedUrl.replaceAll(
        MODEL_KEY_PLACEHOLDER,
        encodeURIComponent(trimmedKey)
      ),
      init: {
        method: "GET",
      },
    };
  }

                                     
  if (X_API_KEY_TYPES.has(apiType)) {
    return {
      input: trimmedUrl,
      init: {
        method: "GET",
        headers: {
          "x-api-key": trimmedKey,
          "anthropic-version": "2023-06-01",
        },
      },
    };
  }

  if (
    apiType === "Gemini" &&
    new URL(trimmedUrl).hostname === "generativelanguage.googleapis.com"
  ) {
    return {
      input: trimmedUrl,
      init: { method: "GET", headers: { "x-goog-api-key": trimmedKey } },
    };
  }

                                     
  return {
    input: trimmedUrl,
    init: {
      method: "GET",
      headers: {
        Authorization: `Bearer ${trimmedKey}`,
      },
    },
  };
}

                                     
                                                                         
                                                         
const NON_CHAT_MODEL_RE =
  /(?:^|[-_/])(?:embeddings?|rerank(?:er)?|moderation|asr|tts|transcrib\w*|speech|whisper|realtime)(?:$|[-_/])|(?:^|\/)(?:gpt-image|chatgpt-image|dall-e|qwen-image|z-image|wan\d|flux(?:-|$)|stable-diffusion|imagen(?:-|$)|veo(?:-|$)|sora(?:-|$))/i;
export const isTranslationModel = (id) =>
  typeof id === "string" && Boolean(id.trim()) && !NON_CHAT_MODEL_RE.test(id);

                                
const PROVIDER_FAMILIES = {
  DeepSeek: /^(?:deepseek\/)?deepseek/i,
  Qwen: /^(?:qwen\/)?qwen/i,
  OpenAI: /^(?:openai\/)?(?:gpt|chatgpt|o\d)/i,
  Claude: /^(?:anthropic\/)?claude/i,
  Gemini: /^(?:google\/)?gemini/i,
  Grok: /^(?:x-ai\/)?grok/i,
};
export const chooseDefaultModel = (models, apiType) => {
  const chatModels = models.filter(isTranslationModel);
  const ownModels = chatModels.filter((id) =>
    PROVIDER_FAMILIES[apiType]?.test(id)
  );
  const candidates = ownModels.length ? ownModels : chatModels;
  return (
    candidates.find(
      (id) =>
        /(?:^|[-_/])(?:flash|mini|nano|lite|haiku)(?:$|[-_/])/i.test(id) &&
        !/(?:preview|experimental|exp)(?:$|[-_/])/i.test(id)
    ) ||
    candidates[0] ||
    ""
  );
};

                                                                                                  
export function deriveModelListUrl(value, apiType) {
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    if (
      apiType === "Gemini" &&
      url.hostname === "generativelanguage.googleapis.com"
    ) {
      url.pathname = "/v1beta/models";
      url.search = "";
    } else if (/\/(chat\/completions|messages)\/?$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(
        /\/(chat\/completions|messages)\/?$/,
        "/models"
      );
    } else if (/\/models\/?$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/$/, "");
    } else if (/^(?:\/|\/v\d+(?:beta\d*)?\/?)$/.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/$/, "") + "/models";
    } else return null;
    return url.toString();
  } catch {
    return null;
  }
}

   
                       
                              
                                               
  
                                            
                                                  
                            
                                                       
                                   
   
export function filterTranslateModels(
  models,
  preferred = [],
  { includeNonChat = false } = {}
) {
  if (!Array.isArray(models) || models.length === 0) {
    return [];
  }
  const list = [
    ...new Set(
      models
        .filter((id) => typeof id === "string")
        .map((id) => id.trim())
        .filter((id) => id && (includeNonChat || isTranslationModel(id)))
    ),
  ];
  const pref = preferred.filter((id) => list.includes(id));
  if (pref.length === 0) {
    return list;
  }
  const prefSet = new Set(pref);
  return [...pref, ...list.filter((id) => !prefSet.has(id))];
}

   
                         
  
                                                             
                            
  
                               
                                            
                                                
                                      
                                                 
                                                 
   
export async function fetchModelList({
  apiType,
  modelListUrl,
  key,
  httpTimeout,
  translationOnly = false,
  fetcher,
  maxPages = 50,
  isCurrent = () => true,
}) {
                                                     
  const request = createModelListRequest({ apiType, modelListUrl, key });

  if (!request) {
    return [];
  }

  let send = fetcher;
  if (!send) {
    const { fetchHandle, fnPolyfill } = await import("./request");
    send = (options) => fnPolyfill({ fn: fetchHandle, ...options });
  }
  const base = new URL(request.input);
  const visited = new Set(),
    result = [],
    seen = new Set();
  let next = base.toString();
  for (let page = 0; next && page < maxPages; page++) {
    if (!isCurrent()) throw new Error("模型请求已取消");
    if (visited.has(next))
      throw new Error("模型接口重复返回同一页，请检查模型列表地址");
    visited.add(next);
    const data = await send({
      input: next,
      init: { ...request.init, cache: "no-store", redirect: "error" },
      opts: { httpTimeout: httpTimeout ?? 15, expect: "json" },
    });
    if (!isCurrent()) throw new Error("模型请求已取消");
    if (
      data?.error ||
      data?.success === false ||
      (typeof data?.code === "number" && data.code !== 0 && data.code !== 200)
    )
      throw new Error("服务商未能返回模型列表，请检查 Key 与接口地址");
    parseModelListResponse(data, { apiType, translationOnly }).forEach((id) =>
      addUniqueModel(result, seen, id)
    );
    const url = new URL(next);
    next = null;
    if (data?.nextPageToken) {
      url.searchParams.set("pageToken", String(data.nextPageToken));
      next = url.toString();
    } else if (data?.has_more === true) {
      const cursor = data.last_id || data.data?.[data.data.length - 1]?.id;
      if (!cursor) throw new Error("模型接口缺少下一页标识");
      url.searchParams.set(apiType === "Claude" ? "after_id" : "after", cursor);
      next = url.toString();
    } else if (
      data?.output?.page_no &&
      data.output.page_size &&
      data.output.total > data.output.page_no * data.output.page_size
    ) {
      url.searchParams.set("page_no", String(Number(data.output.page_no) + 1));
      next = url.toString();
    } else if (
      typeof data?.next === "string" ||
      typeof data?.links?.next === "string"
    ) {
      const candidate = new URL(data.next || data.links.next, url);
      if (
        candidate.origin !== base.origin ||
        candidate.pathname !== base.pathname
      )
        throw new Error("模型分页地址超出当前接口范围");
      next = candidate.toString();
    }
  }
  if (next)
    throw new Error("模型列表分页过多，请缩小列表范围或手动填写模型 ID");
  return result;
}

   
                                     
                                         
                                          
  
                                     
                                          
                                              
                                                                   
                                                                        
                                                           
                                                             
                                                                                 
                        
   
export async function detectProviderByKey(key, options = {}) {
  const trimmedKey = (key || "").trim();
  if (!trimmedKey) {
    return null;
  }

                                                      
  const probes = options.probes || require("../config/api").PROVIDER_KEY_PROBES;
  const fetcher = options.fetcher || fetchModelList;
  const httpTimeout = options.httpTimeout ?? 8000;

                                               
  const eligible = options.apiType
    ? probes.filter((p) => p.apiType === options.apiType)
    : probes.filter((p) => p.keyPrefix && trimmedKey.startsWith(p.keyPrefix));
  const ordered = [...eligible].sort((a, b) => {
    const ap = a.keyPrefix && trimmedKey.startsWith(a.keyPrefix) ? 0 : 1;
    const bp = b.keyPrefix && trimmedKey.startsWith(b.keyPrefix) ? 0 : 1;
    return ap - bp;
  });

                                           
  const probeOne = (probe) =>
    Promise.resolve(
      fetcher({
        apiType: probe.apiType,
        modelListUrl: probe.modelsUrl,
        key: trimmedKey,
        httpTimeout,
      })
    )
      .then((models) =>
        Array.isArray(models) && models.length > 0 ? { ...probe, models } : null
      )
      .catch(() => null);

                                       
  const hit = await new Promise((resolve) => {
    let pending = ordered.length;
    if (pending === 0) {
      resolve(null);
      return;
    }
    ordered.forEach((probe) =>
      probeOne(probe).then((candidate) => {
        if (candidate) {
          resolve(candidate);
        } else if (--pending === 0) {
          resolve(null);
        }
      })
    );
  });
  if (hit) {
    return hit;
  }

                                  
  const guessed = ordered.find(
    (p) => p.keyPrefix && trimmedKey.startsWith(p.keyPrefix)
  );
  if (guessed) return { ...guessed, models: [], guessed: true };
  return null;
}

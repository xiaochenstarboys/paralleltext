   
               
                                                                      
   
import { getBuiltinModels } from "./builtinModels";

                   
export const DEFAULT_HTTP_TIMEOUT = 30;                 
export const DEFAULT_FETCH_LIMIT = 10;                 
export const DEFAULT_FETCH_INTERVAL = 100;                    
export const DEFAULT_BATCH_INTERVAL = 400;                          
export const DEFAULT_BATCH_SIZE = 20;                          
export const DEFAULT_BATCH_LENGTH = 10000;                    
export const DEFAULT_BATCH_CONCURRENCY = 10;               
export const DEFAULT_CONTEXT_SIZE = 3;                      

                    
export const INPUT_PLACE_FROM = "{{from}}";          
export const INPUT_PLACE_TO = "{{to}}";           
export const INPUT_PLACE_FROM_LANG = "{{fromLang}}";            
export const INPUT_PLACE_TO_LANG = "{{toLang}}";             
export const INPUT_PLACE_TEXT = "{{text}}";            
export const INPUT_PLACE_TONE = "{{tone}}";                                    
export const INPUT_PLACE_TITLE = "{{title}}";           
export const INPUT_PLACE_DESCRIPTION = "{{description}}";                        
export const INPUT_PLACE_SUMMARY = "{{summary}}";                    
export const INPUT_PLACE_CONTEXT = "{{context}}";                  
export const INPUT_PLACE_KEY = "{{key}}";               
export const INPUT_PLACE_MODEL = "{{model}}";              
export const INPUT_PLACE_GLOSSARY = "{{glossary}}";            

                    
                                         
export const OPT_DICT_BING = "Bing";        
export const OPT_DICT_YOUDAO = "Youdao";        
export const OPT_DICT_ALL = [OPT_DICT_BING, OPT_DICT_YOUDAO];
export const OPT_DICT_MAP = new Set(OPT_DICT_ALL);

                        
export const OPT_SUG_BAIDU = "Baidu";          
export const OPT_SUG_YOUDAO = "Youdao";          
export const OPT_SUG_ALL = [OPT_SUG_BAIDU, OPT_SUG_YOUDAO];
export const OPT_SUG_MAP = new Set(OPT_SUG_ALL);

                      
export const OPT_TRANS_GOOGLE = "Google";                           
export const OPT_TRANS_GOOGLE_2 = "Google2";                                        
export const OPT_TRANS_QWEN = "Qwen";                                    
export const OPT_TRANS_DEEPSEEK = "DeepSeek";                       
export const OPT_TRANS_OPENAI = "OpenAI";                       
                                     
export const OPT_TRANS_CLAUDE = "Claude";                        
export const OPT_TRANS_GEMINI = "Gemini";                     
export const OPT_TRANS_GROK = "Grok";                
export const OPT_TRANS_CUSTOMIZE = "Custom";             

                                                     
                  
export const REMOVED_TRANS_TYPES = new Set(["Kimi"]);

                                         
export const TRANSLATE_RELAY_BASE = `${(
  process.env.REACT_APP_ACCOUNT_API || ""
).replace(/\/$/, "")}/app-api/member/translate/relay`;

                            
                                          
export const PROVIDER_DIRECT_URLS = {
  [OPT_TRANS_QWEN]:
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  [OPT_TRANS_DEEPSEEK]: "https://api.deepseek.com/chat/completions",
  [OPT_TRANS_OPENAI]: "https://api.openai.com/v1/chat/completions",
  [OPT_TRANS_CLAUDE]: "https://api.anthropic.com/v1/messages",
                                                                           
  [OPT_TRANS_GEMINI]:
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  [OPT_TRANS_GROK]: "https://api.x.ai/v1/chat/completions",
};

                                 
                                                                                           
                                       
                                                        
export const PROVIDER_MODELS_URLS = {
  [OPT_TRANS_QWEN]: "https://dashscope.aliyuncs.com/compatible-mode/v1/models",
  [OPT_TRANS_DEEPSEEK]: "https://api.deepseek.com/models",
  [OPT_TRANS_OPENAI]: "https://api.openai.com/v1/models",
  [OPT_TRANS_CLAUDE]: "https://api.anthropic.com/v1/models",
  [OPT_TRANS_GEMINI]: "https://generativelanguage.googleapis.com/v1beta/models",
  [OPT_TRANS_GROK]: "https://api.x.ai/v1/models",
};

                                           
                                                           
                              
                                                                     
export const PROVIDER_KEY_PROBES = [
  {
    apiType: OPT_TRANS_DEEPSEEK,
    modelsUrl: PROVIDER_MODELS_URLS[OPT_TRANS_DEEPSEEK],
    directUrl: PROVIDER_DIRECT_URLS[OPT_TRANS_DEEPSEEK],
  },
  {
    apiType: OPT_TRANS_QWEN,
    modelsUrl: PROVIDER_MODELS_URLS[OPT_TRANS_QWEN],
    directUrl: PROVIDER_DIRECT_URLS[OPT_TRANS_QWEN],
  },
  {
    apiType: OPT_TRANS_OPENAI,
    modelsUrl: PROVIDER_MODELS_URLS[OPT_TRANS_OPENAI],
    directUrl: PROVIDER_DIRECT_URLS[OPT_TRANS_OPENAI],
  },
  {
    apiType: OPT_TRANS_CLAUDE,
    modelsUrl: PROVIDER_MODELS_URLS[OPT_TRANS_CLAUDE],
    directUrl: PROVIDER_DIRECT_URLS[OPT_TRANS_CLAUDE],
  },
  {
    apiType: OPT_TRANS_GEMINI,
    modelsUrl: PROVIDER_MODELS_URLS[OPT_TRANS_GEMINI],
    directUrl: PROVIDER_DIRECT_URLS[OPT_TRANS_GEMINI],
  },
  {
    apiType: OPT_TRANS_GROK,
    modelsUrl: PROVIDER_MODELS_URLS[OPT_TRANS_GROK],
    directUrl: PROVIDER_DIRECT_URLS[OPT_TRANS_GROK],
  },
];

                                
                                               
                                           
                                               
export const OPT_ALL_TRANS_TYPES = [
  OPT_TRANS_QWEN,
  OPT_TRANS_DEEPSEEK,
  OPT_TRANS_OPENAI,
  OPT_TRANS_CLAUDE,
  OPT_TRANS_GEMINI,
  OPT_TRANS_GROK,
];

                                       
export const OPT_TRANS_COMING_SOON = new Set([
  OPT_TRANS_CLAUDE,
  OPT_TRANS_GEMINI,
  OPT_TRANS_GROK,
]);

                                      
                                                
export const OPT_TRANS_PREMIUM = new Set([OPT_TRANS_OPENAI]);

export const OPT_LANGDETECTOR_ALL = [OPT_TRANS_GOOGLE];

export const OPT_LANGDETECTOR_MAP = new Set(OPT_LANGDETECTOR_ALL);

                      
export const API_SPE_TYPES = {
           
  builtin: new Set(OPT_ALL_TRANS_TYPES),
                                  
  machine: new Set(),
                                         
                                                   
  ai: new Set([
    OPT_TRANS_QWEN,
    OPT_TRANS_DEEPSEEK,
    OPT_TRANS_OPENAI,
    OPT_TRANS_CLAUDE,
    OPT_TRANS_GEMINI,
    OPT_TRANS_GROK,
  ]),
                         
  mulkeys: new Set([OPT_TRANS_QWEN, OPT_TRANS_DEEPSEEK, OPT_TRANS_OPENAI]),
                       
  batch: new Set([OPT_TRANS_DEEPSEEK, OPT_TRANS_OPENAI]),
                            
  context: new Set([OPT_TRANS_QWEN, OPT_TRANS_DEEPSEEK, OPT_TRANS_OPENAI]),
                                               
  stream: new Set([OPT_TRANS_QWEN, OPT_TRANS_DEEPSEEK, OPT_TRANS_OPENAI]),
                  
  sponsors: new Set(),
              
  darkIcon: new Set([OPT_TRANS_OPENAI]),
};

const THINKING_EFFORT_LABELS = {
  max: "Max",
  xhigh: "X-High",
  high: "High",
  medium: "Medium",
  low: "Low",
  minimal: "Minimal",
};
const THINKING_EFFORT_RANK = {
  none: 0,
  minimal: 1,
  low: 2,
  medium: 3,
  high: 4,
  xhigh: 5,
  max: 6,
};

   
                        
                                          
                                                               
   
const toThinkingEffortOptions = (efforts = []) =>
  efforts.map((effort) => ({
    value: effort,
    label: THINKING_EFFORT_LABELS[effort] || effort,
  }));

   
                 
                                                          
                                        
                                 
   
const createThinkingCapability = (efforts, extra = {}) => ({
  efforts: efforts ? toThinkingEffortOptions(efforts) : null,
  ...extra,
});

   
                                                    
                                       
                                          
                                        
   
const createOpenAIThinkingCapability = (efforts, defaults = {}) =>
  createThinkingCapability(efforts, {
    enable: "effort",
    disable: "none",
    ...defaults,
  });

   
                            
                                                   
                                                
   
const getOpenAIThinkingCapability = (model = "") => {
  const normalizedModel = String(model)
    .trim()
    .toLowerCase()
    .replace(/^openai\//, "");

  if (/^gpt-5\.6(?:-|$)/.test(normalizedModel)) {
    return createOpenAIThinkingCapability([
      "max",
      "xhigh",
      "high",
      "medium",
      "low",
    ]);
  }
  if (/^gpt-5\.(?:4|2)-pro(?:-|$)/.test(normalizedModel)) {
    return createOpenAIThinkingCapability(["xhigh", "high", "medium"]);
  }
  if (/^gpt-5-pro(?:-|$)/.test(normalizedModel)) {
    return createOpenAIThinkingCapability(["high"]);
  }
  if (/^gpt-5\.[23]-codex(?:-|$)/.test(normalizedModel)) {
    return createOpenAIThinkingCapability(["xhigh", "high", "medium", "low"]);
  }
  if (/^gpt-5\.(?:5|4|2)(?:-|$)/.test(normalizedModel)) {
    return createOpenAIThinkingCapability(["xhigh", "high", "medium", "low"]);
  }
  if (/^gpt-5\.1(?:-\d{4}-\d{2}-\d{2})?$/.test(normalizedModel)) {
    return createOpenAIThinkingCapability(["high", "medium", "low"], {
                                              
      defaultEnabled: false,
      defaultEffort: "none",
    });
  }
  if (/^gpt-5\.1(?:-|$)/.test(normalizedModel)) {
    return createOpenAIThinkingCapability(["high", "medium", "low"]);
  }
  if (/^gpt-5(?:-|$)/.test(normalizedModel)) {
    return createOpenAIThinkingCapability(["high", "medium", "low", "minimal"]);
  }

  return null;
};

   
                          
                                              
                                      
                                                 
   
const resolveFixedCapability = (efforts, extra) => () =>
  createThinkingCapability(efforts, extra);

                                             
export const THINKING_API_REGISTRY = {
  [OPT_TRANS_DEEPSEEK]: {
    adapter: "deepseek",
    resolveCapability: resolveFixedCapability(["max", "high"], {
      enable: "explicit",
      disable: "explicit",
    }),
  },
  [OPT_TRANS_OPENAI]: {
    adapter: "openai",
    resolveCapability: ({ model }) => getOpenAIThinkingCapability(model),
  },
};

   
                     
                                  
                                          
                                        
                                          
                                                          
   
export const getThinkingCapability = ({ apiType, url = "", model = "" }) => {
  const registration = THINKING_API_REGISTRY[apiType];
  if (!registration) return null;

  const capability = registration.resolveCapability({
    apiType,
    url,
    model,
  });
  return capability ? { adapter: registration.adapter, ...capability } : null;
};

   
                           
                                              
                                                              
                                                   
   
export const normalizeThinkingEffort = (effort, supportedEfforts = []) => {
  const supported = supportedEfforts.map((item) => item.value);
  if (!supported.length) return null;
                                
  if (effort === null || effort === undefined || effort === "_default") {
    return null;
  }
  if (supported.includes(effort)) return effort;

  const targetRank = THINKING_EFFORT_RANK[effort];
  if (targetRank === undefined) return null;
  return supported.reduce((closest, candidate) => {
    const distance = Math.abs(THINKING_EFFORT_RANK[candidate] - targetRank);
    const closestDistance = Math.abs(
      THINKING_EFFORT_RANK[closest] - targetRank
    );
    return distance < closestDistance ? candidate : closest;
  });
};

   
                                   
                                          
                                                    
   
const getDefaultThinkingEffort = (capability) => {
  const efforts = capability.efforts || [];
  const lowestEffort = efforts[efforts.length - 1]?.value ?? null;
  if (
    capability.defaultEnabled === false ||
    capability.defaultEffort === "none"
  ) {
                                     
    return lowestEffort;
  }
  if (capability.defaultEffort === null) return null;
  if (typeof capability.defaultEffort === "number") {
    return capability.defaultEffort;
  }
  return efforts.some((effort) => effort.value === capability.defaultEffort)
    ? capability.defaultEffort
    : null;
};

   
                                        
                                
                                     
                                          
                                        
                                          
                                                                         
                                                                       
                                                                                       
   
export const normalizeThinkingSettings = ({
  apiType,
  url = "",
  model = "",
  thinkingMode = "disabled",
  thinkingEffort = "_default",
}) => {
  if (thinkingMode === "auto") {
    return { thinkingMode, thinkingEffort: "_default" };
  }

  const capability = getThinkingCapability({
    apiType,
    url,
    model,
  });
  if (!capability) {
    return { thinkingMode, thinkingEffort: "_default" };
  }

  const hasExplicitEffort =
    thinkingEffort !== null &&
    thinkingEffort !== undefined &&
    thinkingEffort !== "_default";
  const normalizedEffort =
    hasExplicitEffort && thinkingEffort === capability.defaultEffort
      ? thinkingEffort
      : normalizeThinkingEffort(thinkingEffort, capability.efforts || []);
  if (thinkingMode === "enabled") {
    return {
      thinkingMode,
      thinkingEffort:
        capability.enable === "explicit" && !hasExplicitEffort
          ? null
          : hasExplicitEffort
            ? normalizedEffort
            : getDefaultThinkingEffort(capability),
    };
  }

  const efforts = capability.efforts || [];
  return {
    thinkingMode,
    thinkingEffort:
      capability.disable === "explicit" || capability.disable === "omit"
        ? null
        : (capability.disable ?? efforts[efforts.length - 1]?.value ?? null),
  };
};

   
                      
                                     
                                             
   
export const normalizeApiThinkingSetting = (apiSetting = {}) => {
  if (!THINKING_API_REGISTRY[apiSetting.apiType]) return apiSetting;

  const normalized = normalizeThinkingSettings(apiSetting);
  if (
    normalized.thinkingMode === apiSetting.thinkingMode &&
    normalized.thinkingEffort === apiSetting.thinkingEffort
  ) {
    return apiSetting;
  }
  return { ...apiSetting, ...normalized };
};

   
                                  
                                               
                                                  
   
export const normalizeApiThinkingSettings = (transApis = []) => {
  if (!Array.isArray(transApis)) return transApis;

  let hasChanges = false;
  const normalizedApis = transApis.map((apiSetting) => {
    const normalized = normalizeApiThinkingSetting(apiSetting);
    if (normalized !== apiSetting) hasChanges = true;
    return normalized;
  });
  return hasChanges ? normalizedApis : transApis;
};

export const BUILTIN_STONES = [
  "formal",        
  "casual",        
  "neutral",        
  "technical",        
  "marketing",        
  "Literary",        
  "academic",        
  "legal",        
  "literal",        
  "idiomatic",        
  "transcreation",        
  "machine-like",        
  "concise",        
];
export const BUILTIN_PLACEHOLDERS = ["{ }", "{{ }}", "[ ]", "[[ ]]"];
export const BUILTIN_PLACETAGS = ["i", "a", "b", "x", "span"];
export const PLACETAG_FORMATS = ["compact", "attribute"];                   

export const OPT_LANGS_TO = [
  ["en", "English - English"],
  ["zh-CN", "Simplified Chinese - 简体中文"],
  ["zh-TW", "Traditional Chinese - 繁體中文"],
  ["ar", "Arabic - العربية"],
  ["bg", "Bulgarian - Български"],
  ["ca", "Catalan - Català"],
  ["hr", "Croatian - Hrvatski"],
  ["cs", "Czech - Čeština"],
  ["da", "Danish - Dansk"],
  ["nl", "Dutch - Nederlands"],
  ["fa", "Persian - فارسی"],
  ["fi", "Finnish - Suomi"],
  ["fr", "French - Français"],
  ["de", "German - Deutsch"],
  ["el", "Greek - Ελληνικά"],
  ["hi", "Hindi - हिन्दी"],
  ["hu", "Hungarian - Magyar"],
  ["id", "Indonesian - Indonesia"],
  ["it", "Italian - Italiano"],
  ["ja", "Japanese - 日本語"],
  ["ko", "Korean - 한국어"],
  ["ms", "Malay - Melayu"],
  ["mt", "Maltese - Malti"],
  ["nb", "Norwegian - Norsk Bokmål"],
  ["pl", "Polish - Polski"],
  ["pt", "Portuguese - Português"],
  ["ro", "Romanian - Română"],
  ["ru", "Russian - Русский"],
  ["sk", "Slovak - Slovenčina"],
  ["sl", "Slovenian - Slovenščina"],
  ["es", "Spanish - Español"],
  ["sv", "Swedish - Svenska"],
  ["ta", "Tamil - தமிழ்"],
  ["te", "Telugu - తెలుగు"],
  ["th", "Thai - ไทย"],
  ["tr", "Turkish - Türkçe"],
  ["uk", "Ukrainian - Українська"],
  ["vi", "Vietnamese - Tiếng Việt"],
];
export const OPT_LANGS_LIST = OPT_LANGS_TO.map(([lang]) => lang);
export const OPT_LANGS_FROM = [
  ["auto", "AutoDetect - AutoDetect"],
  ...OPT_LANGS_TO,
];
export const OPT_LANGS_MAP = new Map(OPT_LANGS_TO);
export const OPT_LANGS_TO_REVERSED = OPT_LANGS_TO.map(([code, name]) => [
  code,
  name.split(" - ").reverse().join(" - "),
]);
export const OPT_LANGS_FROM_REVERSED = OPT_LANGS_FROM.map(([code, name]) => [
  code,
  name.split(" - ").reverse().join(" - "),
]);

           
export const OPT_LANGS_SPEC_NAME = new Map(
  OPT_LANGS_FROM.map(([key, val]) => [key, val.split(" - ")[0]])
);
export const OPT_LANGS_SPEC_DEFAULT = new Map(
  OPT_LANGS_FROM.map(([key]) => [key, key])
);
export const OPT_LANGS_TO_SPEC = {
  [OPT_TRANS_GOOGLE]: OPT_LANGS_SPEC_DEFAULT,
  [OPT_TRANS_GOOGLE_2]: OPT_LANGS_SPEC_DEFAULT,
  [OPT_TRANS_QWEN]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_DEEPSEEK]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_OPENAI]: OPT_LANGS_SPEC_NAME,
  [OPT_TRANS_CUSTOMIZE]: OPT_LANGS_SPEC_NAME,
};

export const OPT_LANGS_FROM_SPEC = { ...OPT_LANGS_TO_SPEC };

const specToCode = (m) =>
  new Map(
    Array.from(m.entries()).map(([k, v]) => {
      if (v === "") {
        return ["auto", "auto"];
      }
      if (v === "zh" || v === "ZH") {
        return [v, "zh-CN"];
      }
      return [v, k];
    })
  );

           
export const OPT_LANGS_TO_CODE = {};
Object.entries(OPT_LANGS_TO_SPEC).forEach(([t, m]) => {
  OPT_LANGS_TO_CODE[t] = specToCode(m);
});

export const defaultNobatchPrompt = `You are a professional, authentic machine translation engine.`;
export const defaultNobatchUserPrompt = `# Context
Title: ${INPUT_PLACE_TITLE}
Description: ${INPUT_PLACE_DESCRIPTION}
Summary: ${INPUT_PLACE_SUMMARY}
Tone: ${INPUT_PLACE_TONE}

# Glossary:
${INPUT_PLACE_GLOSSARY}

# Task
Translate the Source Text below to ${INPUT_PLACE_TO}.
1. Use the Context to ensure accuracy.
2. Adapt the wording to match the specified Tone.
3. Output ONLY the translated text. No markdown, no explanations.

Source Text: ${INPUT_PLACE_TEXT}

Translated Text:`;

export const defaultSystemPrompt = `Act as a translation API. Output a single raw JSON object only. No extra text or fences.

Input:
{"targetLanguage":"<lang>","title":"<context>","description":"<context>","summary":"<context>","segments":[{"id":1,"text":"..."}],"glossary":{"sourceTerm":"targetTerm"},"tone":"<formal|casual>"}

Output:
{"translations":[{"id":1,"text":"...","sourceLanguage":"<detected>"}]}

Rules:
1.  Use title/description for context only; do not output them.
2.  Keep id, order, and count of segments.
3.  Preserve whitespace, HTML entities, and all HTML-like tags (e.g., <i1>, <a1>). Translate inner text only.
4.  Highest priority: Follow 'glossary'. Use value for translation; if value is "", keep the key.
5.  Do not translate: content in <code>, <pre>, text enclosed in backticks, or placeholders like {1}, {{1}}, [1], [[1]].
6.  Apply the specified tone to the translation.
7.  Detect sourceLanguage for each segment.
8.  Return empty or unchanged inputs as is.

Example:
Input: {"targetLanguage":"zh-CN","segments":[{"id":1,"text":"A <b>React</b> component."}],"glossary":{"component":"组件","React":""}}
Output: {"translations":[{"id":1,"text":"一个<b>React</b>组件","sourceLanguage":"en"}]}

Fail-safe: On any error, return {"translations":[]}.`;

export const defaultSystemPromptXml = `Act as a translation API. Output raw XML-like format only. No Markdown fences (xml). No conversational filler.

Input:
{"targetLanguage":"<lang>","title":"<context>","description":"<context>","summary":"<context>","segments":[{"id":1,"text":"..."}],"glossary":{"sourceTerm":"targetTerm"},"tone":"<formal|casual>"}

Output Format:
<root>
    <t id="0" sourceLanguage="<detected_source_lang>">Translated text content...</t>
    <t id="1" sourceLanguage="<detected_source_lang>">Translated text content...</t>
</root>

Rules:
1.  **Strict Format**: Output ONLY the <root> element and its children. Do not include "xml" version declarations or markdown code blocks.
2.  **Structure**: Maintain the exact "id" from the input in the "id" attribute. Detect the source language for the "sourceLanguage" attribute.
3.  **HTML & Whitespace**: Preserve all HTML tags (e.g., <b>, <span>, <br>) and whitespace exactly as they appear in the structure. Only translate the text content inside them.
4.  **Glossary**: Highest priority. Use the glossary value for translation. If the value is "", keep the source term as is.
5.  **Do Not Translate**: Content inside <code>, <pre>, text in backticks ("code"), and placeholders like {1}, {{1}}, [1], [[1]].
6.  **Context**: Use the "title" and "description" fields to understand the context for better translation accuracy, but do not output them.
7.  **Tone**: Apply the specified "tone" (formal/casual).

Example:
Input:
{"targetLanguage":"zh-CN","segments":[{"id":0,"text":"Hello <b>World</b>!"}],"glossary":{"World":"世界"},"tone":"formal"}

Output:
<root>
    <t id="0" sourceLanguage="en">你好 <b>世界</b>！</t>
</root>`;

export const defaultSystemPromptLines = `Act as a translation API. Output raw text lines in "ID | Text" format. No Markdown. No conversational filler.

Input:
{"targetLanguage":"<lang>","title":"<context>","description":"<context>","summary":"<context>","segments":[{"id":1,"text":"..."}],"glossary":{"sourceTerm":"targetTerm"},"tone":"<formal|casual>"}

Output Format:
<id> | <Translation for Segment>
<id> | <Translation for Segment>
...

Rules:
1.  **Strict Format**: Output exactly one line per segment using the format: "{id} | {translated_text}".
2.  **ID Mapping**: You MUST copy the exact "id" from the input segment to the output line.
3.  **Newline Handling**: If the translated text contains a newline, replace it with the HTML tag "<br>" to ensure it stays on a single line.
4.  **Separator**: Use the pipe symbol " | " strictly to separate the ID and the text.
5.  **Context**: Use title/description for context only; do not output them.
6.  **HTML/Tags**: Preserve whitespace, HTML entities, and all HTML-like tags (e.g., <i1>, <b>). Translate inner text only.
7.  **Glossary**: Highest priority. Follow 'glossary'. Use value for translation; if value is "", keep the key.
8.  **Do Not Translate**: content in <code>, <pre>, text enclosed in backticks, or placeholders like {1}, {{1}}, [1].
9.  **Tone**: Apply the specified tone.

Example:
Input: {"targetLanguage":"zh-CN","segments":[{"id":0,"text":"Hello."},{"id":1,"text":"Line 1\nLine 2"}],"glossary":{}}
Output:
0 | 你好。
1 | 第一行<br>第二行

Fail-safe: On error, return "{id} | {original_text}" line by line.`;

               
export const defaultDictPrompt = createEnglishDictionaryPrompt({
  targetLanguage: "Chinese",
  translationExample: "用于 Web 和原生用户界面的库",
  labels: {
    entry: "词条",
    essentials: "基础形态与音标",
    pronunciation: "发音标注",
    meanings: "词性与核心义项",
    context: "语境精析",
    contextMeaning: "当前语义锁定",
    register: "语境色调",
    replacements: "原句平替词",
    deepDive: "词源深度解构与辨析",
    etymology: "词源与记忆锚点",
    collocations: "高频搭配",
    synonyms: "同义词微观辨析",
    examples: "语料库双解例句",
    translation: "中文翻译",
    scene: "场景标签",
  },
});

function createEnglishDictionaryPrompt({
  targetLanguage,
  translationExample,
  labels,
}) {
  return `# Role
You are an expert English-${targetLanguage} lexicographer specializing in contrastive linguistics and modern corpus linguistics. Analyze the user's English text with academic rigor and clear, elegant formatting, or translate it naturally into ${targetLanguage} when dictionary analysis is not appropriate.

# Execution Rules
1. **Smart routing (CRITICAL)**: Choose the mode strictly from the length and nature of \`[Target]\`:
   - **Dictionary mode**: Use the dictionary output format only when \`[Target]\` is clearly a single English word, an idiom, or a fixed collocation of no more than 3 words.
   - **Pure translation mode**: Use pure translation for complete sentences, clauses, natural-language phrases, paragraphs, long text, or any continuous text longer than 3 words. When uncertain, choose pure translation mode.
2. **Context first**: In dictionary mode, if \`[Context]\` contains useful information, put the contextually correct sense first.
3. **Target-language contract**: All headings, labels, definitions, explanations, usage notes, and example translations in dictionary mode must be written in ${targetLanguage}. Keep English only for the entry, English examples, pronunciation, and English words being compared.
4. **No extra framing**: Follow the selected format exactly. Do not add greetings, prefaces, or closing summaries.

---

# Pure Translation Output Contract (only for pure translation mode)

Your entire response must contain only the ${targetLanguage} translation itself:
- Do not output the source text, bilingual comparison, headings, labels, language names, quotation marks, Markdown, or explanations.
- Do not add prefixes such as "Translation:" or include pronunciation, etymology, collocations, examples, or acknowledgements.
- If the source has one paragraph, output one paragraph. Preserve paragraph breaks only when the source has multiple paragraphs.

Example:
- Input: The library for web and native user interfaces
- Correct output: ${translationExample}

# Output Format (only for dictionary mode)

## ${labels.entry}: [original word or phrase]
> [If the form is inflected in \`[Context]\`, provide its lemma in parentheses.]

### 1. ${labels.essentials}
- **${labels.pronunciation}**: 🇺🇸 [US IPA] ｜ 🇬🇧 [UK IPA]
- **${labels.meanings}**:
  - \`[part of speech]\` ① [primary ${targetLanguage} definition] ② [secondary ${targetLanguage} definition]
  - \`[part of speech]\` ① [primary ${targetLanguage} definition]

### 2. ${labels.context} *[include only when useful Context exists]*
- **${labels.contextMeaning}**: State the part of speech and precise meaning in the given context.
- **${labels.register}**: Describe sentiment, register, formality, and tone.
- **${labels.replacements}**: Give 1-2 English synonyms that can replace the entry in this context without changing the meaning.

### 3. ${labels.deepDive}
- **${labels.etymology}**: Explain roots, affixes, historical development, or provide a logical memory aid.
- **${labels.collocations}**:
  * \`[collocation 1]\` ➔ [precise ${targetLanguage} translation]
  * \`[collocation 2]\` ➔ [precise ${targetLanguage} translation]
- **${labels.synonyms}**:
  * **[entry] vs [synonym 1] vs [synonym 2]**: Explain their differences in context, intensity, register, or collocation habits in 1-2 sentences.

### 4. ${labels.examples}
[Provide 2-3 natural examples from publications, news, professional writing, or everyday English.]

1. **[natural English example]**
   - 💡 *${labels.translation}*: [accurate, idiomatic ${targetLanguage} translation]
   - 📌 *${labels.scene}*: \`[localized scene label]\``;
}

export const defaultDictPromptEnJa = createEnglishDictionaryPrompt({
  targetLanguage: "Japanese",
  translationExample:
    "Webおよびネイティブのユーザーインターフェース向けライブラリ",
  labels: {
    entry: "見出し語",
    essentials: "基本情報と発音",
    pronunciation: "発音",
    meanings: "品詞と主要な意味",
    context: "文脈分析",
    contextMeaning: "文脈上の意味",
    register: "語調と使用域",
    replacements: "文脈に合う言い換え",
    deepDive: "語源・用法・類義語",
    etymology: "語源と記憶の手がかり",
    collocations: "頻出コロケーション",
    synonyms: "類義語の使い分け",
    examples: "コーパス用例",
    translation: "日本語訳",
    scene: "使用場面",
  },
});

export const defaultDictPromptEnKo = createEnglishDictionaryPrompt({
  targetLanguage: "Korean",
  translationExample: "웹 및 네이티브 사용자 인터페이스용 라이브러리",
  labels: {
    entry: "표제어",
    essentials: "기본 정보와 발음",
    pronunciation: "발음",
    meanings: "품사와 핵심 의미",
    context: "문맥 분석",
    contextMeaning: "문맥상 의미",
    register: "어조와 사용역",
    replacements: "문맥에 맞는 대체어",
    deepDive: "어원·용법·유의어",
    etymology: "어원과 기억 단서",
    collocations: "주요 연어",
    synonyms: "유의어 뉘앙스 비교",
    examples: "말뭉치 예문",
    translation: "한국어 번역",
    scene: "사용 상황",
  },
});

export const defaultDictPromptEnVi = createEnglishDictionaryPrompt({
  targetLanguage: "Vietnamese",
  translationExample: "Thư viện dành cho giao diện người dùng web và native",
  labels: {
    entry: "Mục từ",
    essentials: "Thông tin cơ bản và phát âm",
    pronunciation: "Phát âm",
    meanings: "Từ loại và nghĩa cốt lõi",
    context: "Phân tích ngữ cảnh",
    contextMeaning: "Nghĩa trong ngữ cảnh",
    register: "Sắc thái và phong cách",
    replacements: "Từ thay thế phù hợp",
    deepDive: "Từ nguyên, cách dùng và từ đồng nghĩa",
    etymology: "Từ nguyên và mẹo ghi nhớ",
    collocations: "Cụm từ thường gặp",
    synonyms: "Phân biệt từ đồng nghĩa",
    examples: "Ví dụ ngữ liệu",
    translation: "Bản dịch tiếng Việt",
    scene: "Ngữ cảnh sử dụng",
  },
});

export const defaultDictPromptEnRu = createEnglishDictionaryPrompt({
  targetLanguage: "Russian",
  translationExample:
    "Библиотека для веб-интерфейсов и нативных пользовательских интерфейсов",
  labels: {
    entry: "Словарная статья",
    essentials: "Основная информация и произношение",
    pronunciation: "Произношение",
    meanings: "Часть речи и основные значения",
    context: "Контекстный анализ",
    contextMeaning: "Значение в контексте",
    register: "Тональность и регистр",
    replacements: "Контекстные замены",
    deepDive: "Этимология, употребление и синонимы",
    etymology: "Этимология и подсказка для запоминания",
    collocations: "Частотные сочетания",
    synonyms: "Различия между синонимами",
    examples: "Корпусные примеры",
    translation: "Перевод на русский",
    scene: "Сфера употребления",
  },
});

               
export const defaultDictUserPrompt = `# Input Data

## [Context] (Optional)
> Use this information to identify the target text's meaning in context:
- Document title: ${INPUT_PLACE_TITLE}
- Document description: ${INPUT_PLACE_DESCRIPTION}
- Document summary: ${INPUT_PLACE_SUMMARY}
- Surrounding paragraph: ${INPUT_PLACE_CONTEXT}

## [Target] (Required)
> Use this text to choose between dictionary mode and pure translation mode:
${INPUT_PLACE_TEXT}`;

const defaultRequestHook = `async (args, { url, body, headers, userMsg, method } = {}) => {
  console.log("request hook args:", { args, url, body, headers, userMsg, method });
  // return { url, body, headers, userMsg, method };
};`;

const defaultResponseHook = `async ({ res, ...args }) => {
  console.log("reaponse hook args:", { res, args });
  // const translations = [["你好", "zh"]];
  // const modelMsg = "";
  // return { translations, modelMsg };
};`;

           
const defaultApi = {
  apiSlug: "",        
  apiName: "",        
  apiType: "",        
  url: "",
  key: "",
  model: "",        
  modelListUrl: "",            
  systemPrompt: "",
  batchPromptSlug: "batch-translation-json",
  dictPrompt: "",
  dictUserPrompt: "",
  dictPromptSlug: "dictionary-en-zh",
  nobatchPrompt: "",
  nobatchUserPrompt: "",
  nobatchPromptSlug: "nobatch-translation",
  userPrompt: "",
  tone: BUILTIN_STONES[0],        
  placeholder: BUILTIN_PLACEHOLDERS[0],       
  placetag: BUILTIN_PLACETAGS[0],        
  aiTerms: "",                       
  customHeader: "",
  customBody: "",
  reqHook: "",                
  resHook: "",                 
  fetchLimit: DEFAULT_FETCH_LIMIT,          
  fetchInterval: DEFAULT_FETCH_INTERVAL,          
  httpTimeout: DEFAULT_HTTP_TIMEOUT,          
  batchInterval: DEFAULT_BATCH_INTERVAL,             
  batchSize: DEFAULT_BATCH_SIZE,              
  batchLength: DEFAULT_BATCH_LENGTH,              
  batchConcurrency: DEFAULT_BATCH_CONCURRENCY,               
  useBatchFetch: false,              
  useStream: false,            
  streamRenderMode: "disabled",                                    
  transAllnow: false,            
  rootMargin: 2000,              
  useContext: false,             
  contextSize: DEFAULT_CONTEXT_SIZE,              
  temperature: 0.0,
  maxTokens: 20480,
  thinkingMode: "disabled",                                  
  thinkingEffort: "_default",                            
  isDisabled: false,          
  sortOrder: 0,                
  placetagFormat: "compact",                                            
};

              
const defaultAiApiOpts = {
  useBatchFetch: true,              
  thinkingMode: "disabled",                                  
  thinkingEffort: "_default",                            
  useStream: true,            
  streamRenderMode: "realtime",                                    
};

const defaultApiOpts = {
  [OPT_TRANS_GOOGLE]: {
    ...defaultApi,
                                                                          
    url: "https://translate-pa.googleapis.com/v1/translateHtml",
    key: "",                                
    useBatchFetch: true,
    placetag: "a",
    placetagFormat: "attribute",
  },
  [OPT_TRANS_GOOGLE_2]: {
    ...defaultApi,
    url: "https://translate.googleapis.com/translate_a/single",
  },
  [OPT_TRANS_QWEN]: {
    ...defaultApi,
                                   
    url: `${TRANSLATE_RELAY_BASE}/qwen/chat/completions`,
    model: "qwen3.8-flash",                                          
    ...defaultAiApiOpts,
                                                                    
    useBatchFetch: false,
    useStream: false,
    useContext: false,
  },
  [OPT_TRANS_DEEPSEEK]: {
    ...defaultApi,
                                    
    url: `${TRANSLATE_RELAY_BASE}/deepseek/chat/completions`,
    model: "deepseek-flash",
    ...defaultAiApiOpts,
  },
  [OPT_TRANS_OPENAI]: {
    ...defaultApi,
    url: `${TRANSLATE_RELAY_BASE}/openai/chat/completions`,
    modelListUrl: "https://api.openai.com/v1/models",
    model: "gpt-5.6-terra",                                                                      
    modelLabel: "gpt-5.6",                                         
    isDisabled: true,                    
    ...defaultAiApiOpts,
  },
                                   
  [OPT_TRANS_CLAUDE]: {
    ...defaultApi,
    url: "",
    model: "claude-opus-5",                                    
    comingSoon: true,
    isDisabled: true,
    ...defaultAiApiOpts,
  },
  [OPT_TRANS_GEMINI]: {
    ...defaultApi,
    url: "",
    model: "gemini-3.8-flash",                                                                   
    comingSoon: true,
    isDisabled: true,
    ...defaultAiApiOpts,
  },
  [OPT_TRANS_GROK]: {
    ...defaultApi,
    url: "",
    model: "grok-4.6",                                            
    comingSoon: true,
    isDisabled: true,
    ...defaultAiApiOpts,
  },
  [OPT_TRANS_CUSTOMIZE]: {
    ...defaultApi,
    reqHook: defaultRequestHook,
    resHook: defaultResponseHook,
  },
};

                
export const DEFAULT_API_LIST = OPT_ALL_TRANS_TYPES.map((apiType) =>
  normalizeApiThinkingSetting({
    ...defaultApiOpts[apiType],
    apiSlug: apiType,
    apiName: apiType,
    apiType,
  })
);

   
                     
  
                                             
                                           
                         
  
                                      
                                             
   
export function fillDefaultApiModelListUrl(apiSetting) {
  if (!apiSetting || typeof apiSetting !== "object") {
    return apiSetting;
  }
                                                
  if (apiSetting.modelListUrl !== undefined) {
    return apiSetting;
  }

                                      
  const defaultApiOpt =
    DEFAULT_API_LIST.find((item) => item.apiType === apiSetting.apiType) || {};
  return {
    ...apiSetting,
    modelListUrl: defaultApiOpt.modelListUrl || "",
  };
}

   
                        
  
                                              
                                     
                      
  
                                            
                                       
   
export function normalizeApiModelListUrls(transApis = []) {
  if (!Array.isArray(transApis)) {
    return transApis;
  }

  let hasChanges = false;
  const nextApis = transApis.map((api) => {
    const nextApi = fillDefaultApiModelListUrl(api);
                                        
    if (nextApi !== api) {
      hasChanges = true;
    }
    return nextApi;
  });

                               
  return hasChanges ? nextApis : transApis;
}

export const DEFAULT_API_TYPE = OPT_TRANS_QWEN;
export const DEFAULT_API_SETTING = DEFAULT_API_LIST.find(
  (a) => a.apiType === DEFAULT_API_TYPE
);

   
                                                
                                                                
                              
                             
   
export function normalizeApiBuiltinModels(transApis = []) {
  if (!Array.isArray(transApis)) {
    return transApis;
  }
  let hasChanges = false;
  const nextApis = transApis.map((api) => {
    if (api?.custom) return api;                       
    const def = DEFAULT_API_LIST.find((a) => a.apiType === api?.apiType);
    const remote = getBuiltinModels()?.[api?.apiType];
    if (remote && def) {
      const url = [
        OPT_TRANS_QWEN,
        OPT_TRANS_DEEPSEEK,
        OPT_TRANS_OPENAI,
      ].includes(api.apiType)
        ? def.url
        : api.url;
      if (
        api.model === remote.model &&
        !api.modelLabel &&
        api.builtinModelAvailable === remote.available &&
        api.builtinModelRevision === remote.revision &&
        api.url === url &&
        Boolean(api.comingSoon) === !remote.available
      )
        return api;
      hasChanges = true;
      const next = {
        ...api,
        model: remote.model,
        url,
        builtinModelAvailable: remote.available,
        builtinModelRevision: remote.revision,
      };
      delete next.modelLabel;
      if (!remote.available) next.comingSoon = true;
      else next.comingSoon = false;
      return next;
    }
    if (!def?.model) return api;
    if (
      api.model === def.model &&
      (api.modelLabel || undefined) === def.modelLabel
    )
      return api;
    hasChanges = true;
                                                        
    const next = { ...api, model: def.model };
    if (def.modelLabel) next.modelLabel = def.modelLabel;
    else delete next.modelLabel;
    return next;
  });
  return hasChanges ? nextApis : transApis;
}

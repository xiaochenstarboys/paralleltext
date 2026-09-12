import {
  defaultNobatchPrompt,
  defaultNobatchUserPrompt,
  defaultSystemPrompt,
  defaultSystemPromptLines,
  defaultSystemPromptXml,
  defaultDictPrompt,
  defaultDictPromptEnJa,
  defaultDictPromptEnKo,
  defaultDictPromptEnRu,
  defaultDictPromptEnVi,
  defaultDictUserPrompt,
  API_SPE_TYPES,
} from "./api";

                         
export const PROMPT_SLUG_NOBATCH_TRANSLATION = "nobatch-translation";
export const PROMPT_SLUG_BATCH_TRANSLATION_JSON = "batch-translation-json";
export const PROMPT_SLUG_BATCH_TRANSLATION_XML = "batch-translation-xml";
export const PROMPT_SLUG_BATCH_TRANSLATION_LINE = "batch-translation-line";
export const PROMPT_SLUG_DICTIONARY_EN_ZH = "dictionary-en-zh";
export const PROMPT_SLUG_DICTIONARY_EN_JA = "dictionary-en-ja";
export const PROMPT_SLUG_DICTIONARY_EN_KO = "dictionary-en-ko";
export const PROMPT_SLUG_DICTIONARY_EN_VI = "dictionary-en-vi";
export const PROMPT_SLUG_DICTIONARY_EN_RU = "dictionary-en-ru";

                             
export const PROMPT_MODE_FOLLOW_API = "follow_api";

                             
export const PROMPT_CATEGORY_BATCH_SYSTEM = "batch system prompt";
export const PROMPT_CATEGORY_USER = "user prompt";
export const PROMPT_CATEGORY_DICTIONARY = "dictionary prompt";
                            
export const PROMPT_TEMPLATE_CATEGORIES = [
  PROMPT_CATEGORY_USER,
  PROMPT_CATEGORY_BATCH_SYSTEM,
  PROMPT_CATEGORY_DICTIONARY,
];

                                 
export const DEFAULT_NOBATCH_PROMPT_SLUG = PROMPT_SLUG_NOBATCH_TRANSLATION;
export const DEFAULT_BATCH_PROMPT_SLUG = PROMPT_SLUG_BATCH_TRANSLATION_JSON;
export const DEFAULT_DICTIONARY_PROMPT_SLUG = PROMPT_SLUG_DICTIONARY_EN_ZH;

                              
export const SETTINGS_VERSION_V1 = 1;
export const SETTINGS_VERSION_V2 = 2;
export const SETTINGS_VERSION_V3 = 3;
export const CURRENT_SETTINGS_VERSION = SETTINGS_VERSION_V3;

   
                                
                                
   
export const PRESET_PROMPTS = [
  {
    slug: PROMPT_SLUG_NOBATCH_TRANSLATION,
    category: PROMPT_CATEGORY_USER,
    nameKey: "preset_prompt_nobatch_translation",
    name: "Non-batch translation",
    systemPrompt: defaultNobatchPrompt,
    userPrompt: defaultNobatchUserPrompt,
  },
  {
    slug: PROMPT_SLUG_BATCH_TRANSLATION_JSON,
    category: PROMPT_CATEGORY_BATCH_SYSTEM,
    nameKey: "preset_prompt_batch_translation_json",
    name: "Batch translation (JSON)",
    systemPrompt: defaultSystemPrompt,
    userPrompt: "",
  },
  {
    slug: PROMPT_SLUG_BATCH_TRANSLATION_XML,
    category: PROMPT_CATEGORY_BATCH_SYSTEM,
    nameKey: "preset_prompt_batch_translation_xml",
    name: "Batch translation (XML)",
    systemPrompt: defaultSystemPromptXml,
    userPrompt: "",
  },
  {
    slug: PROMPT_SLUG_BATCH_TRANSLATION_LINE,
    category: PROMPT_CATEGORY_BATCH_SYSTEM,
    nameKey: "preset_prompt_batch_translation_line",
    name: "Batch translation (LINE)",
    systemPrompt: defaultSystemPromptLines,
    userPrompt: "",
  },
  {
    slug: PROMPT_SLUG_DICTIONARY_EN_ZH,
    category: PROMPT_CATEGORY_DICTIONARY,
    nameKey: "preset_prompt_dictionary_en_zh",
    name: "AI English-Chinese Dictionary",
    systemPrompt: defaultDictPrompt,
    userPrompt: defaultDictUserPrompt,
  },
  {
    slug: PROMPT_SLUG_DICTIONARY_EN_JA,
    category: PROMPT_CATEGORY_DICTIONARY,
    nameKey: "preset_prompt_dictionary_en_ja",
    name: "AI English-Japanese Dictionary",
    systemPrompt: defaultDictPromptEnJa,
    userPrompt: defaultDictUserPrompt,
  },
  {
    slug: PROMPT_SLUG_DICTIONARY_EN_KO,
    category: PROMPT_CATEGORY_DICTIONARY,
    nameKey: "preset_prompt_dictionary_en_ko",
    name: "AI English-Korean Dictionary",
    systemPrompt: defaultDictPromptEnKo,
    userPrompt: defaultDictUserPrompt,
  },
  {
    slug: PROMPT_SLUG_DICTIONARY_EN_VI,
    category: PROMPT_CATEGORY_DICTIONARY,
    nameKey: "preset_prompt_dictionary_en_vi",
    name: "AI English-Vietnamese Dictionary",
    systemPrompt: defaultDictPromptEnVi,
    userPrompt: defaultDictUserPrompt,
  },
  {
    slug: PROMPT_SLUG_DICTIONARY_EN_RU,
    category: PROMPT_CATEGORY_DICTIONARY,
    nameKey: "preset_prompt_dictionary_en_ru",
    name: "AI English-Russian Dictionary",
    systemPrompt: defaultDictPromptEnRu,
    userPrompt: defaultDictUserPrompt,
  },
];

const PRESET_PROMPT_SLUGS = new Set(
  PRESET_PROMPTS.map((prompt) => prompt.slug)
);
const PROMPT_STORAGE_FIELDS = [
  "slug",
  "category",
  "name",
  "systemPrompt",
  "userPrompt",
];

   
                           
                              
  
                                 
                               
   
export function normalizePrompt(prompt = {}) {
  return {
    slug: String(prompt.slug || ""),
    category: String(prompt.category || ""),
    nameKey: String(prompt.nameKey || ""),
    name: String(prompt.name || ""),
    systemPrompt: String(prompt.systemPrompt || ""),
    userPrompt: String(prompt.userPrompt || ""),
  };
}

   
                          
  
                                    
                              
   
export function isPresetPromptSlug(promptSlug) {
  return PRESET_PROMPT_SLUGS.has(promptSlug);
}

   
                                  
  
                                        
                             
   
export function getAllPrompts(userPrompts = []) {
  const customPrompts = normalizeCustomPrompts(userPrompts);

  return [...PRESET_PROMPTS, ...customPrompts];
}

   
                                  
  
                                        
                                
   
export function normalizeCustomPrompts(userPrompts = []) {
  return (Array.isArray(userPrompts) ? userPrompts : [])
    .map(normalizePrompt)
    .filter((prompt) => prompt.slug && !isPresetPromptSlug(prompt.slug))
    .map(({ slug, category, name, systemPrompt, userPrompt }) => ({
      slug,
      category,
      name,
      systemPrompt,
      userPrompt,
    }));
}

   
                                  
  
                                        
                                           
                                             
   
export function findPromptBySlug(userPrompts = [], promptSlug) {
  if (!promptSlug) {
    return null;
  }

  return getAllPrompts(userPrompts).find(
    (prompt) => prompt?.slug === promptSlug
  );
}

function findPromptBySlugOrDefault(userPrompts, promptSlug, defaultPromptSlug) {
  return (
    findPromptBySlug(userPrompts, promptSlug) ||
    findPromptBySlug(userPrompts, defaultPromptSlug)
  );
}

   
                             
  
                                        
                                    
                                     
   
function hasOwn(source = {}, fieldName) {
  return Object.prototype.hasOwnProperty.call(source, fieldName);
}

function getPromptFieldValue(source = {}, fieldName, defaultValue = "") {
  if (!hasOwn(source, fieldName)) {
    return defaultValue;
  }

  return source[fieldName];
}

function hasPromptReferenceField(source = {}, promptSlugFieldName) {
  return hasOwn(source, promptSlugFieldName);
}

function getPromptText(source = {}, fieldName) {
  return String(source[fieldName] || "");
}

function isSamePromptContent(prompt, sourcePrompt) {
  const normalizedPrompt = normalizePrompt(prompt);
  const normalizedSourcePrompt = normalizePrompt(sourcePrompt);

  return (
    normalizedPrompt.category === normalizedSourcePrompt.category &&
    normalizedPrompt.systemPrompt === normalizedSourcePrompt.systemPrompt &&
    normalizedPrompt.userPrompt === normalizedSourcePrompt.userPrompt
  );
}

function findPresetPromptByContent(sourcePrompt) {
  return PRESET_PROMPTS.find((prompt) =>
    isSamePromptContent(prompt, sourcePrompt)
  );
}

function createStablePromptHash(sourceText) {
  const text = String(sourceText);
  let hashA = 0x811c9dc5;
  let hashB = 0x01000193;

                                   
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    hashA = Math.imul(hashA ^ code, 0x01000193);
    hashB = Math.imul(hashB ^ (code + index), 0x811c9dc5);
  }

  return `${(hashA >>> 0).toString(36)}${(hashB >>> 0).toString(36)}`;
}

function createMigratedPromptName(apiSetting = {}, promptLabel) {
  const apiName = String(apiSetting.apiName || apiSetting.apiSlug || "API");
  return `${apiName} ${promptLabel}`;
}

function createMigratedPromptSlug(apiSetting = {}, promptType, sourcePrompt) {
  const hash = createStablePromptHash(
    JSON.stringify({
      apiSlug: String(apiSetting.apiSlug || ""),
      promptType,
      category: sourcePrompt.category,
      systemPrompt: sourcePrompt.systemPrompt,
      userPrompt: sourcePrompt.userPrompt,
    })
  );

  return `prompt_migrated_${promptType}_${hash}`;
}

function getAvailableMigratedPromptSlug(promptBySlug, sourcePrompt, baseSlug) {
  let index = 1;
  let promptSlug = baseSlug;

  while (promptBySlug.has(promptSlug)) {
    if (isSamePromptContent(promptBySlug.get(promptSlug), sourcePrompt)) {
      return promptSlug;
    }

    index += 1;
    promptSlug = `${baseSlug}_${index}`;
  }

  return promptSlug;
}

   
                                 
  
                               
                                 
                            
   
export function getPromptDisplayName(prompt = {}, i18n) {
  const normalizedPrompt = normalizePrompt(prompt);
  if (normalizedPrompt.nameKey && typeof i18n === "function") {
    return i18n(normalizedPrompt.nameKey, normalizedPrompt.name);
  }

  return normalizedPrompt.name || normalizedPrompt.slug;
}

   
                           
  
                                   
                                 
                            
   

function getPromptOptions(prompts = [], category) {
  return (Array.isArray(prompts) ? prompts : []).filter(
    (prompt) => prompt?.category === category
  );
}

   
                                  
  
                                   
                   
   
export function getNobatchPromptOptions(prompts = []) {
  return getPromptOptions(prompts, PROMPT_CATEGORY_USER);
}

   
                             
  
                                   
                   
   
export function getBatchPromptOptions(prompts = []) {
  return getPromptOptions(prompts, PROMPT_CATEGORY_BATCH_SYSTEM);
}

   
                   
  
                             
  
                                            
                                           
   
export function getDictionaryPromptOptions(prompts = []) {
  return getPromptOptions(prompts, PROMPT_CATEGORY_DICTIONARY);
}

function hasPromptReference(source = {}, promptSlugFieldName, promptSlug) {
  return (
    hasOwn(source, promptSlugFieldName) &&
    source[promptSlugFieldName] === promptSlug
  );
}

export function removeLegacyApiPromptIds(apiSetting = {}) {
  if (!apiSetting) {
    return apiSetting;
  }

  if (
    !hasOwn(apiSetting, "batchPromptId") &&
    !hasOwn(apiSetting, "nobatchPromptId") &&
    !hasOwn(apiSetting, "dictPromptId")
  ) {
    return apiSetting;
  }

  const nextApiSetting = { ...apiSetting };
  delete nextApiSetting.batchPromptId;
  delete nextApiSetting.nobatchPromptId;
  delete nextApiSetting.dictPromptId;

  return nextApiSetting;
}

const LEGACY_API_PROMPT_MIGRATIONS = [
  {
    promptType: "batch",
    promptLabel: "Batch prompt",
    category: PROMPT_CATEGORY_BATCH_SYSTEM,
    systemPromptFieldName: "systemPrompt",
    userPromptFieldName: "",
    promptSlugFieldName: "batchPromptSlug",
  },
  {
    promptType: "nobatch",
    promptLabel: "Non-batch prompt",
    category: PROMPT_CATEGORY_USER,
    systemPromptFieldName: "nobatchPrompt",
    userPromptFieldName: "nobatchUserPrompt",
    promptSlugFieldName: "nobatchPromptSlug",
  },
  {
    promptType: "dict",
    promptLabel: "Dictionary prompt",
    category: PROMPT_CATEGORY_DICTIONARY,
    systemPromptFieldName: "dictPrompt",
    userPromptFieldName: "dictUserPrompt",
    promptSlugFieldName: "dictPromptSlug",
  },
];

function createLegacyApiPromptSource(apiSetting, migration) {
  if (!hasOwn(apiSetting, migration.systemPromptFieldName)) {
    return null;
  }

  return {
    slug: "",
    category: migration.category,
    nameKey: "",
    name: createMigratedPromptName(apiSetting, migration.promptLabel),
    systemPrompt: getPromptText(apiSetting, migration.systemPromptFieldName),
    userPrompt: migration.userPromptFieldName
      ? getPromptText(apiSetting, migration.userPromptFieldName)
      : "",
  };
}

function createPromptSlugIndex(prompts = []) {
  const promptBySlug = new Map();

  prompts.forEach((prompt) => {
    const promptSlug = prompt?.slug;
    if (promptSlug && !promptBySlug.has(promptSlug)) {
      promptBySlug.set(promptSlug, prompt);
    }
  });

  return promptBySlug;
}

function isStoredPromptListNormalized(sourcePrompts = [], normalizedPrompts) {
  if (!Array.isArray(sourcePrompts)) {
    return normalizedPrompts.length === 0;
  }

  if (sourcePrompts.length !== normalizedPrompts.length) {
    return false;
  }

  return sourcePrompts.every((prompt, index) => {
    if (!prompt || typeof prompt !== "object") {
      return false;
    }

    const hasOnlyPromptStorageFields = Object.keys(prompt).every((fieldName) =>
      PROMPT_STORAGE_FIELDS.includes(fieldName)
    );

    return (
      hasOnlyPromptStorageFields &&
      JSON.stringify(normalizePrompt(prompt)) ===
        JSON.stringify(normalizedPrompts[index])
    );
  });
}

function removeApiPromptTextFields(apiSetting, migration) {
  const nextApiSetting = { ...apiSetting };
  delete nextApiSetting[migration.systemPromptFieldName];
  if (migration.userPromptFieldName) {
    delete nextApiSetting[migration.userPromptFieldName];
  }
  return nextApiSetting;
}

function migrateLegacyApiPrompt(apiSetting, migration, customPromptState) {
  if (hasPromptReferenceField(apiSetting, migration.promptSlugFieldName)) {
    return "";
  }

  const sourcePrompt = createLegacyApiPromptSource(apiSetting, migration);
  if (!sourcePrompt) {
    return "";
  }

  const presetPrompt = findPresetPromptByContent(sourcePrompt);
  if (presetPrompt) {
    return presetPrompt.slug;
  }

  const baseSlug = createMigratedPromptSlug(
    apiSetting,
    migration.promptType,
    sourcePrompt
  );
  const promptSlug = getAvailableMigratedPromptSlug(
    customPromptState.promptBySlug,
    sourcePrompt,
    baseSlug
  );

  if (!customPromptState.promptBySlug.has(promptSlug)) {
    const migratedPrompt = {
      ...sourcePrompt,
      slug: promptSlug,
    };
    customPromptState.prompts.push(migratedPrompt);
    customPromptState.promptBySlug.set(promptSlug, migratedPrompt);
    customPromptState.hasPromptChanges = true;
  }

  return promptSlug;
}

   
                  
                            
  
                               
                            
   
export function getSettingVersion(setting = {}) {
  const version = Number(setting?.version || SETTINGS_VERSION_V1);
  return Number.isFinite(version) && version >= SETTINGS_VERSION_V1
    ? version
    : SETTINGS_VERSION_V1;
}

   
                                      
                                                              
                                                                     
  
                                   
                                      
   
export function migrateSettingPromptsToV2(setting = {}) {
  if (!setting || typeof setting !== "object") {
    return setting;
  }

  if (!Array.isArray(setting.transApis)) {
    return { ...setting, version: SETTINGS_VERSION_V2 };
  }

  const storedCustomPrompts = Array.isArray(setting.prompts)
    ? setting.prompts
    : [];
  const customPrompts = normalizeCustomPrompts(storedCustomPrompts);
  const hasCustomPromptChanges = !isStoredPromptListNormalized(
    storedCustomPrompts,
    customPrompts
  );
  const customPromptState = {
    prompts: [...customPrompts],
    promptBySlug: createPromptSlugIndex([...PRESET_PROMPTS, ...customPrompts]),
    hasPromptChanges: hasCustomPromptChanges,
  };
  let hasApiChanges = false;

  const transApis = setting.transApis.map((apiSetting) => {
    if (!apiSetting || typeof apiSetting !== "object") {
      return apiSetting;
    }

    let nextApiSetting = removeLegacyApiPromptIds(apiSetting);
    if (nextApiSetting !== apiSetting) {
      hasApiChanges = true;
    }

    LEGACY_API_PROMPT_MIGRATIONS.forEach((migration) => {
      const hasApiType = Boolean(nextApiSetting.apiType);
      const isNonAiApi =
        hasApiType && !API_SPE_TYPES.ai.has(nextApiSetting.apiType);

      const sysVal =
        typeof nextApiSetting[migration.systemPromptFieldName] === "string"
          ? nextApiSetting[migration.systemPromptFieldName].trim()
          : "";
      const userVal =
        migration.userPromptFieldName &&
        typeof nextApiSetting[migration.userPromptFieldName] === "string"
          ? nextApiSetting[migration.userPromptFieldName].trim()
          : "";
      const isEmpty = !sysVal && !userVal;

      if (isNonAiApi || isEmpty) {
        if (
          hasOwn(nextApiSetting, migration.systemPromptFieldName) ||
          (migration.userPromptFieldName &&
            hasOwn(nextApiSetting, migration.userPromptFieldName))
        ) {
          if (nextApiSetting === apiSetting) {
            nextApiSetting = { ...apiSetting };
          }
          nextApiSetting = removeApiPromptTextFields(nextApiSetting, migration);
          hasApiChanges = true;
        }
        return;
      }

      const promptSlug = migrateLegacyApiPrompt(
        nextApiSetting,
        migration,
        customPromptState
      );

      if (
        promptSlug &&
        nextApiSetting[migration.promptSlugFieldName] !== promptSlug
      ) {
        if (nextApiSetting === apiSetting) {
          nextApiSetting = { ...apiSetting };
        }

                                                      
        nextApiSetting[migration.promptSlugFieldName] = promptSlug;
        delete nextApiSetting[migration.systemPromptFieldName];
        if (migration.userPromptFieldName) {
          delete nextApiSetting[migration.userPromptFieldName];
        }
        hasApiChanges = true;
      }
    });

    return nextApiSetting;
  });

  const nextSetting = { ...setting };

  nextSetting.version = SETTINGS_VERSION_V2;
  nextSetting.transApis = hasApiChanges ? transApis : setting.transApis;
  nextSetting.prompts = customPromptState.hasPromptChanges
    ? customPromptState.prompts
    : customPrompts;

  return nextSetting;
}

   
                                               
                       
   
export function migrateSettingToV3(setting = {}) {
  if (!setting || typeof setting !== "object") {
    return setting;
  }

  const v2Setting =
    getSettingVersion(setting) < SETTINGS_VERSION_V2
      ? migrateSettingPromptsToV2(setting)
      : setting;
  if (getSettingVersion(v2Setting) >= SETTINGS_VERSION_V3) {
    return v2Setting;
  }

  const REMOVED_API_TYPES = new Set(["DeepL", "Gemini", "Claude"]);
  const transApis = Array.isArray(v2Setting.transApis)
    ? v2Setting.transApis.filter(
        (apiSetting) => !REMOVED_API_TYPES.has(apiSetting?.apiType)
      )
    : v2Setting.transApis;

  return {
    ...v2Setting,
    transApis,
    version: SETTINGS_VERSION_V3,
  };
}

   
                                  
                                                    
                                                  
  
                                  
                                          
                                 
   
export function removePromptReferences(setting = {}, promptSlug) {
  if (!promptSlug || isPresetPromptSlug(promptSlug)) {
    return setting;
  }

  let hasApiChanges = false;

  const transApis = (
    Array.isArray(setting?.transApis) ? setting.transApis : []
  ).map((api) => {
    let nextApi = api;

    if (hasPromptReference(api, "batchPromptSlug", promptSlug)) {
      nextApi = {
        ...nextApi,
        batchPromptSlug: DEFAULT_BATCH_PROMPT_SLUG,
      };
      delete nextApi.systemPrompt;
      hasApiChanges = true;
    }

    if (hasPromptReference(api, "nobatchPromptSlug", promptSlug)) {
      nextApi = {
        ...nextApi,
        nobatchPromptSlug: DEFAULT_NOBATCH_PROMPT_SLUG,
      };
      delete nextApi.nobatchPrompt;
      delete nextApi.nobatchUserPrompt;
      hasApiChanges = true;
    }

    if (hasPromptReference(api, "dictPromptSlug", promptSlug)) {
      nextApi = {
        ...nextApi,
        dictPromptSlug: DEFAULT_DICTIONARY_PROMPT_SLUG,
      };
      delete nextApi.dictPrompt;
      delete nextApi.dictUserPrompt;
      hasApiChanges = true;
    }

    return nextApi;
  });

  const hasTranboxDictPromptReference = hasPromptReference(
    setting?.tranboxSetting,
    "aiDictPromptSlug",
    promptSlug
  );

  if (!hasApiChanges && !hasTranboxDictPromptReference) {
    return setting;
  }

  const nextSetting = { ...setting };

  if (hasApiChanges) {
    nextSetting.transApis = transApis;
  }

  if (hasTranboxDictPromptReference) {
    nextSetting.tranboxSetting = {
      ...(setting?.tranboxSetting || {}),
      aiDictPromptSlug: PROMPT_MODE_FOLLOW_API,
    };
  }

  return nextSetting;
}

   
                               
                                                                
                                                                     
  
                                    
                                        
                                         
   
export function resolveApiPromptSettings(apiSetting = {}, userPrompts = []) {
  if (!apiSetting) {
    return apiSetting;
  }

  const cleanedApiSetting = removeLegacyApiPromptIds(apiSetting);
  const nextApiSetting =
    cleanedApiSetting === apiSetting ? { ...apiSetting } : cleanedApiSetting;
  const hasBatchPromptReference = hasPromptReferenceField(
    nextApiSetting,
    "batchPromptSlug"
  );
  const hasBatchPromptInlineValue = hasOwn(nextApiSetting, "systemPrompt");
  const batchPromptSlug = getPromptFieldValue(
    nextApiSetting,
    "batchPromptSlug",
    DEFAULT_BATCH_PROMPT_SLUG
  );
  const batchPrompt = findPromptBySlugOrDefault(
    userPrompts,
    batchPromptSlug,
    DEFAULT_BATCH_PROMPT_SLUG
  );

  if (batchPrompt && (hasBatchPromptReference || !hasBatchPromptInlineValue)) {
    nextApiSetting.batchPromptSlug = batchPrompt.slug;
    nextApiSetting.systemPrompt = batchPrompt.systemPrompt;
  }

  const hasNobatchPromptReference = hasPromptReferenceField(
    nextApiSetting,
    "nobatchPromptSlug"
  );
  const hasNobatchPromptInlineValue =
    hasOwn(nextApiSetting, "nobatchPrompt") ||
    hasOwn(nextApiSetting, "nobatchUserPrompt");
  const nobatchPromptSlug = getPromptFieldValue(
    nextApiSetting,
    "nobatchPromptSlug",
    DEFAULT_NOBATCH_PROMPT_SLUG
  );
  const nobatchPrompt = findPromptBySlugOrDefault(
    userPrompts,
    nobatchPromptSlug,
    DEFAULT_NOBATCH_PROMPT_SLUG
  );

  if (
    nobatchPrompt &&
    (hasNobatchPromptReference || !hasNobatchPromptInlineValue)
  ) {
    nextApiSetting.nobatchPromptSlug = nobatchPrompt.slug;
    nextApiSetting.nobatchPrompt = nobatchPrompt.systemPrompt;
    nextApiSetting.nobatchUserPrompt = nobatchPrompt.userPrompt;
  }

  const hasDictPromptReference = hasPromptReferenceField(
    nextApiSetting,
    "dictPromptSlug"
  );
  const hasDictPromptInlineValue =
    hasOwn(nextApiSetting, "dictPrompt") ||
    hasOwn(nextApiSetting, "dictUserPrompt");
  const dictPromptSlug = getPromptFieldValue(
    nextApiSetting,
    "dictPromptSlug",
    DEFAULT_DICTIONARY_PROMPT_SLUG
  );
  const dictPrompt = findPromptBySlugOrDefault(
    userPrompts,
    dictPromptSlug,
    DEFAULT_DICTIONARY_PROMPT_SLUG
  );

  if (dictPrompt && (hasDictPromptReference || !hasDictPromptInlineValue)) {
    nextApiSetting.dictPromptSlug = dictPrompt.slug;
    nextApiSetting.dictPrompt = dictPrompt.systemPrompt;
    nextApiSetting.dictUserPrompt = dictPrompt.userPrompt;
  }

  return nextApiSetting;
}

   
                      
                                                           
  
                                  
                                        
                              
   
export function resolveApiPromptList(transApis = [], userPrompts = []) {
  return (Array.isArray(transApis) ? transApis : []).map((api) =>
    resolveApiPromptSettings(api, userPrompts)
  );
}

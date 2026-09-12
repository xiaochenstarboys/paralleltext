import {
  STOKEY_SETTING,
  STOKEY_SETTING_BACKUP_V1_BEFORE_V2,
  STOKEY_MIG_TRANSOPEN_V1,
  STOKEY_MIG_TRANBOX_V1,
  STOKEY_MIG_TRANBOX_V2,
  STOKEY_MIG_TRANBOX_V3,
  STOKEY_MIG_TRANBOX_V4,
  STOKEY_MIG_TRANBOX_V5,
  OPT_TRANBOX_TRIGGER_SELECT,
  STOKEY_RULES,
  STOKEY_FAB,
  STOKEY_TRANBOX,
  DEFAULT_SETTING,
  DEFAULT_RULES,
  DEFAULT_RULE,
  getSettingVersion,
  migrateSettingPromptsToV2,
  migrateSettingToV3,
  SETTINGS_VERSION_V2,
  CURRENT_SETTINGS_VERSION,
  DEFAULT_TRANBOX_SETTING,
  normalizeApiThinkingSettings,
  normalizeApiBuiltinModels,
  OPT_ALL_TRANS_TYPES,
  OPT_LANGDETECTOR_MAP,
  DEFAULT_API_TYPE,
  GLOBAL_KEY,
} from "../config";
import { isExt } from "./client";
import { reconcileEngineSettings } from "./engineSettings";
import { browser } from "./browser";
import { kissLog } from "./log";
import { debounce } from "./utils";
import {
  BUILTIN_MODEL_STORAGE_KEY,
  installBuiltinModels,
} from "../config/builtinModels";

   
                                           
                                                 
   
export const STORAGE_CHANGE_EVENT = "paralleltext_storage_change";

                                                     
const emitStorageChange = (key) => {
  try {
    window.dispatchEvent(
      new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key } })
    );
  } catch (err) {
           
  }
};

   
               
                                                                          
                         
                           
   
async function set(key, val) {
  if (isExt) {
    await browser.storage.local.set({ [key]: val });
  } else {
    window.localStorage.setItem(key, val);
  }
  emitStorageChange(key);
}

   
               
                         
                                              
   
async function get(key) {
  if (isExt) {
    const val = await browser.storage.local.get([key]);
    return val[key];
  }
  return window.localStorage.getItem(key);
}

   
               
                         
   
async function del(key) {
  if (isExt) {
    await browser.storage.local.remove([key]);
  } else {
    window.localStorage.removeItem(key);
  }
  emitStorageChange(key);
}

   
               
                         
                                            
   
async function setObj(key, obj) {
  await set(key, JSON.stringify(obj));
}

   
                                  
                         
                                  
   
async function trySetObj(key, obj) {
  if (!(await get(key))) {
    await setObj(key, obj);
  }
}

   
                             
                         
                                                                     
   
async function getObj(key) {
  const val = await get(key);
  if (val === null || val === undefined) return null;
  try {
    return JSON.parse(val);
  } catch (err) {
    kissLog("parse json in storage err: ", key);
  }
  return null;
}

   
                  
                                                 
                                          
                         
                               
   
async function putObj(key, obj) {
  const cur = (await getObj(key)) ?? {};
  await setObj(key, { ...cur, ...obj });
}

   
                         
   
export const storage = {
  get,
  set,
  del,
  setObj,
  trySetObj,
  getObj,
  putObj,
};

                               
export const getSetting = () => getObj(STOKEY_SETTING);
const writeSettingBackupBeforeV2 = (setting) =>
  setObj(STOKEY_SETTING_BACKUP_V1_BEFORE_V2, setting);
   
                                 
                                     
                                        
   
const sanitizeApiSlugs = (setting) => {
  const transApis = (
    Array.isArray(setting.transApis) ? setting.transApis : []
  ).filter((api) => OPT_ALL_TRANS_TYPES.includes(api?.apiType));
  const finalApis = transApis.length ? transApis : DEFAULT_SETTING.transApis;
  const validSlugs = new Set(finalApis.map((api) => api.apiSlug));

  const fixSlug = (slug, allow = []) =>
    allow.includes(slug) || validSlugs.has(slug) ? slug : DEFAULT_API_TYPE;
  const fixSlugList = (slugs) => {
    const list = (Array.isArray(slugs) ? slugs : []).filter((slug) =>
      validSlugs.has(slug)
    );
    return list.length ? list : [DEFAULT_API_TYPE];
  };

  return {
    ...setting,
    transApis: finalApis,
    inputRule: {
      ...setting.inputRule,
      apiSlug: fixSlug(setting.inputRule?.apiSlug),
                           
      transOpen: false,
    },
    tranboxSetting: {
      ...setting.tranboxSetting,
      apiSlugs: fixSlugList(setting.tranboxSetting?.apiSlugs),
      aiDictApiSlug: fixSlug(setting.tranboxSetting?.aiDictApiSlug, ["-"]),
    },
    mouseHoverSetting: {
      ...setting.mouseHoverSetting,
      apiSlug: fixSlug(setting.mouseHoverSetting?.apiSlug, [GLOBAL_KEY]),
                            
      useMouseHover: false,
    },
    langDetector:
      setting.langDetector === "-" ||
      OPT_LANGDETECTOR_MAP.has(setting.langDetector)
        ? setting.langDetector
        : "-",
  };
};

export const mergeSettingWithDefault = (setting) => {
  const mergedSetting = {
    ...DEFAULT_SETTING,
    ...(setting || {}),
    tranboxSetting: {
      ...DEFAULT_TRANBOX_SETTING,
      ...(setting?.tranboxSetting || {}),
    },
    version: setting?.version ?? DEFAULT_SETTING.version,
  };
  const sanitizedSetting = sanitizeApiSlugs(mergedSetting);

                                    
                                                  
  return reconcileEngineSettings({
    ...sanitizedSetting,
    transApis: normalizeApiBuiltinModels(
      normalizeApiThinkingSettings(sanitizedSetting.transApis)
    ),
  });
};
export const migrateStoredSettingToV2 = async (
  setting,
  backupSetting = setting
) => {
  if (getSettingVersion(setting) >= SETTINGS_VERSION_V2) {
    return setting;
  }

  await writeSettingBackupBeforeV2(backupSetting);
  return migrateSettingPromptsToV2(setting);
};

export const runDataMigration = async () => {
  const rawSetting = await getSetting();
  if (rawSetting && getSettingVersion(rawSetting) < CURRENT_SETTINGS_VERSION) {
    try {
      const v2Setting = await migrateStoredSettingToV2(rawSetting, rawSetting);
      const nextSetting = migrateSettingToV3(v2Setting);
      await setObj(STOKEY_SETTING, nextSetting);
      kissLog(`Migration to V${CURRENT_SETTINGS_VERSION} completed.`);
    } catch (err) {
      kissLog(`Data migration to V${CURRENT_SETTINGS_VERSION} failed:`, err);
    }
  }

                                                   
                                      
  if (!(await getObj(STOKEY_MIG_TRANSOPEN_V1))) {
    try {
      const rules = await getObj(STOKEY_RULES);
      if (Array.isArray(rules)) {
        const globalRule = rules.find((rule) => rule?.pattern === "*");
        if (globalRule?.transOpen === "false") {
          await setObj(
            STOKEY_RULES,
            rules.map((rule) =>
              rule?.pattern === "*" ? { ...rule, transOpen: "true" } : rule
            )
          );
        }
      }
      await setObj(STOKEY_MIG_TRANSOPEN_V1, true);
    } catch (err) {
      kissLog("transOpen default-on migration failed:", err);
    }
  }

                                    
                                                     
  if (!(await getObj(STOKEY_MIG_TRANBOX_V1))) {
    try {
      const setting = await getObj(STOKEY_SETTING);
      if (
        setting?.tranboxSetting &&
        typeof setting.tranboxSetting === "object"
      ) {
        await setObj(STOKEY_SETTING, {
          ...setting,
          tranboxSetting: {
            ...setting.tranboxSetting,
            hideClickAway: true,
            simpleStyle: false,
            autoHeight: true,
          },
        });
      }
      await setObj(STOKEY_MIG_TRANBOX_V1, true);
    } catch (err) {
      kissLog("tranbox interaction migration failed:", err);
    }
  }

                                              
                            
  if (!(await getObj(STOKEY_MIG_TRANBOX_V2))) {
    try {
      const setting = await getObj(STOKEY_SETTING);
      if (
        setting?.tranboxSetting &&
        typeof setting.tranboxSetting === "object"
      ) {
        await setObj(STOKEY_SETTING, {
          ...setting,
          tranboxSetting: {
            ...setting.tranboxSetting,
            autoFavWord: true,
          },
        });
      }
      await setObj(STOKEY_MIG_TRANBOX_V2, true);
    } catch (err) {
      kissLog("tranbox autoFavWord migration failed:", err);
    }
  }

                                    
                                           
                            
  if (!(await getObj(STOKEY_MIG_TRANBOX_V3))) {
    try {
      const setting = await getObj(STOKEY_SETTING);
      if (
        setting?.tranboxSetting &&
        typeof setting.tranboxSetting === "object"
      ) {
        await setObj(STOKEY_SETTING, {
          ...setting,
          tranboxSetting: {
            ...setting.tranboxSetting,
            autoFavWord: false,
          },
        });
      }
      await setObj(STOKEY_MIG_TRANBOX_V3, true);
    } catch (err) {
      kissLog("tranbox manual-collect migration failed:", err);
    }
  }

                                                
  if (!(await getObj(STOKEY_MIG_TRANBOX_V4))) {
    try {
      const setting = await getObj(STOKEY_SETTING);
      if (
        setting?.tranboxSetting &&
        typeof setting.tranboxSetting === "object"
      ) {
        await setObj(STOKEY_SETTING, {
          ...setting,
          tranboxSetting: {
            ...setting.tranboxSetting,
            followSelection: true,
          },
        });
      }
      await setObj(STOKEY_MIG_TRANBOX_V4, true);
    } catch (err) {
      kissLog("tranbox follow-selection migration failed:", err);
    }
  }
                                                                                  
  if (!(await getObj(STOKEY_MIG_TRANBOX_V5))) {
    try {
      const setting = await getObj(STOKEY_SETTING);
      if (
        setting?.tranboxSetting &&
        typeof setting.tranboxSetting === "object"
      ) {
        await setObj(STOKEY_SETTING, {
          ...setting,
          tranboxSetting: {
            ...setting.tranboxSetting,
            triggerMode: OPT_TRANBOX_TRIGGER_SELECT,
          },
        });
      }
      await setObj(STOKEY_MIG_TRANBOX_V5, true);
    } catch (err) {
      kissLog("tranbox direct-selection migration failed:", err);
    }
  }
};

export const getSettingWithDefault = async () => {
  installBuiltinModels(await getObj(BUILTIN_MODEL_STORAGE_KEY));
  const rawSetting = await getSetting();
  if (!rawSetting) {
                                       
    return mergeSettingWithDefault(DEFAULT_SETTING);
  }

  const setting =
    getSettingVersion(rawSetting) < CURRENT_SETTINGS_VERSION
      ? migrateSettingToV3(rawSetting)
      : rawSetting;

  return mergeSettingWithDefault(setting);
};

                              
export const getRules = () => getObj(STOKEY_RULES);
export const getRulesWithDefault = async () => {
  const rules = (await getRules()) || DEFAULT_RULES;

                                     
                                   
  try {
    const { transApis } = await getSettingWithDefault();
    const validSlugs = new Set((transApis ?? []).map((api) => api.apiSlug));
    return rules.map((rule) => {
      const slug = rule?.apiSlug;
      if (!slug || slug === GLOBAL_KEY || validSlugs.has(slug)) {
        return rule;
      }
      return {
        ...rule,
        apiSlug: rule.pattern === "*" ? DEFAULT_API_TYPE : GLOBAL_KEY,
      };
    });
  } catch (err) {
    kissLog("sanitize rules apiSlug error", err);
    return rules;
  }
};
export const setRules = (val) => setObj(STOKEY_RULES, val);

   
                                             
                                            
                                    
                                  
   
export const upsertRule = async (pattern, fields) => {
  if (!pattern) return;
  const rules = (await getRules()) || DEFAULT_RULES;
  const exists = rules.some((rule) => rule.pattern === pattern);
  const next = exists
    ? rules.map((rule) =>
        rule.pattern === pattern ? { ...rule, ...fields } : rule
      )
    : [...rules, { ...DEFAULT_RULE, pattern, ...fields }];
  await setRules(next);
};

                                   
export const getFabWithDefault = async () => (await getObj(STOKEY_FAB)) || {};
export const putFab = (obj) => putObj(STOKEY_FAB, obj);

                                     
export const getTranBox = () => getObj(STOKEY_TRANBOX);
export const putTranBox = (obj) => putObj(STOKEY_TRANBOX, obj);
                         
export const debouncePutTranBox = debounce(putTranBox, 300);

   
                            
                                   
   
export const tryInitDefaultData = async (uiLang) => {
  try {
    await trySetObj(STOKEY_SETTING, { ...DEFAULT_SETTING, uiLang });
    await trySetObj(STOKEY_RULES, DEFAULT_RULES);
  } catch (err) {
    kissLog("init default", err);
  }
};

import { OPT_LANGS_LIST } from "../config/api";

const INTERNAL_LANGUAGE_CODES = new Map(
  OPT_LANGS_LIST.map((code) => [code.toLowerCase(), code])
);

const CHINESE_SIMPLIFIED_TAGS = new Set(["cn", "sg", "hans"]);
const CHINESE_TRADITIONAL_TAGS = new Set(["tw", "hk", "mo", "hant"]);

   
                               
                                             
               
  
                              
                                         
   
export function normalizeLanguageCode(code) {
  if (typeof code !== "string") return "";

  const normalized = code.trim().replaceAll("_", "-").toLowerCase();
  if (!normalized || normalized === "und") return "";

  const parts = normalized.split("-").filter(Boolean);
  const base = parts[0];

  if (base === "zh") {
    if (parts.length === 1) return "zh-CN";
    if (parts.some((part) => CHINESE_TRADITIONAL_TAGS.has(part))) {
      return "zh-TW";
    }
    if (parts.some((part) => CHINESE_SIMPLIFIED_TAGS.has(part))) {
      return "zh-CN";
    }
    return "";
  }

  if (base === "no") return "nb";

  return (
    INTERNAL_LANGUAGE_CODES.get(normalized) ||
    INTERNAL_LANGUAGE_CODES.get(base) ||
    ""
  );
}

   
                               
                              
  
                                       
                                        
                                                   
                            
   
export function isSameTranslationLanguage(
  sourceLanguage,
  targetLanguage,
  translateVariants = true
) {
  const source = normalizeLanguageCode(sourceLanguage);
  const target = normalizeLanguageCode(targetLanguage);
  if (!source || !target) return false;
  if (source === target) return true;

  return !translateVariants && source.split("-")[0] === target.split("-")[0];
}

   
                      
                                                      
                                      
   

import { browser } from "./browser";
import { kissLog } from "./log";
import { normalizeLanguageCode } from "./language";

const DETECT_CACHE_LIMIT = 100;                        
const DETECT_TIMEOUT = 100;                   
const MAX_DETECT_TEXT_LEN = 300;               
const detectCache = new Map();

             
const RE_CJK = /[\u4e00-\u9fff]/g;
const RE_HIRAGANA = /[\u3040-\u309f]/g;
const RE_KATAKANA = /[\u30a0-\u30ff]/g;
const RE_HANGUL = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/g;
const RE_CYRILLIC = /[\u0400-\u04ff]/g;
const RE_GREEK = /[\u0370-\u03ff]/g;
const RE_LATIN = /[a-zA-Z]/g;

                   
const SIMP_CHARS = new Set(
  "国华门车东发风见机体为还这各个样时经长运边开来后别问应当设过对给现进们动两从远义学话谁网达问题单数业农产说认门".split(
    ""
  )
);
const TRAD_CHARS = new Set(
  "國華門車東發風見機體為還這各個樣時經長運邊開來後別問應當設過對給現進們動兩從遠義學話誰網達問題單數業農產說認門".split(
    ""
  )
);

   
                       
                             
                                                                                            
   
   
                       
                       
                             
                                                                                            
   
export function quickDetectLang(text) {
  const count = (re) => (text.match(re) || []).length;
  const cjk = count(RE_CJK);
  const hiragana = count(RE_HIRAGANA);
  const katakana = count(RE_KATAKANA);
  const hangul = count(RE_HANGUL);
  const cyrillic = count(RE_CYRILLIC);
  const greek = count(RE_GREEK);
  const latin = count(RE_LATIN);

               
  if (hiragana > 0 || katakana > 0) return "ja";
  if (hangul > 0) return "ko";
  if (cyrillic > 0) return "ru";
  if (greek > 0) return "el";
  if (cjk > 0) return detectZhVariant(text);

                                
  return detectLatinVariant(text, latin) || "";
}

function detectZhVariant(text) {
  let trad = 0;
  let simp = 0;
  for (const ch of text) {
    if (TRAD_CHARS.has(ch)) trad++;
    else if (SIMP_CHARS.has(ch)) simp++;
  }
  return trad > simp ? "zh-TW" : "zh-CN";
}

function detectLatinVariant(text, latinCount) {
  if (!latinCount) return "";
  const lower = text.toLowerCase();
  const countWord = (re) => (lower.match(re) || []).length;
  const score = { en: 0, de: 0, fr: 0, es: 0 };

  score.en += countWord(/\b(the|and|is|of|to|in|that|it|you|for|with|on)\b/g);
  score.de +=
    countWord(/\b(der|die|das|und|ist|nicht|ein|eine|mit|auf|ich)\b/g) +
    countWord(/[äöüß]/g);
  score.fr +=
    countWord(/\b(le|la|les|de|des|et|un|une|est|que|pour)\b/g) +
    countWord(/[çœàâêîôûëïü]/g);
  score.es +=
    countWord(/\b(el|la|los|las|de|que|y|no|en|un|por|es)\b/g) +
    countWord(/[ñ¿¡]/g);

  let best = "";
  let bestScore = 0;
  for (const [lang, s] of Object.entries(score)) {
    if (s > bestScore) {
      best = lang;
      bestScore = s;
    }
  }
                        
  return bestScore >= 2 ? best : "";
}

   
                                    
                            
                              
   
export const normalizeZhLang = (lang) => {
  if (typeof lang !== "string" || !lang) return "";
  return /^zh(-|$)/i.test(lang) ? "zh" : lang;
};

   
                             
                             
                           
   
export const isPureNumberText = (text) => {
  if (typeof text !== "string" || !text.trim()) return false;
  return /^[\d\s.,，、\-/:：%]+$/.test(text.trim()) && /\d/.test(text);
};

function setCache(key, value) {
  if (detectCache.size >= DETECT_CACHE_LIMIT) {
    const oldestKey = detectCache.keys().next().value;
    detectCache.delete(oldestKey);
  }
  detectCache.set(key, value);
}

   
                      
                                         
                                  
                             
                                           
   
export const detectLangFast = async (text) => {
  if (typeof text !== "string" || !text.trim()) return "";

  const key =
    text.length <= MAX_DETECT_TEXT_LEN
      ? text
      : text.slice(0, MAX_DETECT_TEXT_LEN);
  if (detectCache.has(key)) return detectCache.get(key);

  const sample = text.slice(0, MAX_DETECT_TEXT_LEN);
  let lang = quickDetectLang(sample);

  if (!lang) {
    try {
      const res = await Promise.race([
        Promise.resolve(browser?.i18n?.detectLanguage?.(sample)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("detect timeout")), DETECT_TIMEOUT)
        ),
      ]);
      const detected = res?.languages?.[0]?.language;
      const normalizedLang = normalizeLanguageCode(detected);
      if (
        normalizedLang &&
        (res?.isReliable || /^zh(?:[-_]|$)/i.test(detected))
      ) {
        lang = normalizedLang;
      }
    } catch (err) {
      kissLog("detect lang fast", err);
    }
  }

                                  
                       
  if (lang) {
    setCache(key, lang);
  }
  return lang || "";
};

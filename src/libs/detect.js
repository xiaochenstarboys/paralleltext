   
                  
                                                                      
   

import {
  OPT_TRANS_GOOGLE,
  OPT_LANGS_TO_CODE,
  OPT_LANGDETECTOR_MAP,
} from "../config";
import { browser } from "./browser";
import { apiGoogleLangdetect } from "../apis";
import { kissLog } from "./log";
import { normalizeLanguageCode } from "./language";

                 
const langdetectFns = {
  [OPT_TRANS_GOOGLE]: apiGoogleLangdetect,
};

                               
                                                      
const DETECT_CACHE_MAX = 500;
const detectCache = new Map();

   
                 
                                
                                                                  
                                                                   
  
          
                                                                            
                                                                
                                          
   
export const tryDetectLang = async (text, langDetector = "-") => {
                                    
  const cacheKey = langDetector + "|" + (text.length > 200 ? text.slice(0, 200) : text);
  const cached = detectCache.get(cacheKey);
  if (cached !== undefined) {
                  
    detectCache.delete(cacheKey);
    detectCache.set(cacheKey, cached);
    return cached;
  }

  let deLang = "";

                                          
  if (OPT_LANGDETECTOR_MAP.has(langDetector)) {
    try {
      const lang = await langdetectFns[langDetector](text);
      if (lang) {
                          
        const mappedLang = OPT_LANGS_TO_CODE[langDetector].get(lang) || lang;
        deLang = normalizeLanguageCode(mappedLang);
      }
    } catch (err) {
      kissLog("detect lang remote", err);
    }
  }

                                                 
  if (!deLang) {
    try {
      const res = await browser?.i18n?.detectLanguage(text);
      const lang = res?.languages?.[0]?.language;
      const normalizedLang = normalizeLanguageCode(lang);
                                          
      if (normalizedLang && (res?.isReliable || /^zh(?:[-_]|$)/i.test(lang))) {
        deLang = normalizedLang;
      }
    } catch (err) {
      kissLog("detect lang local", err);
    }
  }

                                     
  if (detectCache.size >= DETECT_CACHE_MAX) {
    detectCache.delete(detectCache.keys().next().value);
  }
  detectCache.set(cacheKey, deLang);

  return deLang;
};

                                
export const clearDetectCache = () => detectCache.clear();

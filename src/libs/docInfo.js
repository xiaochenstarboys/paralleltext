import { truncateWords } from "./utils";

             
const cleanText = (text) => {
  if (!text) return "";
  return text.trim().replace(/\s+/g, " ");
};

const getTitle = () => {
  try {
    return truncateWords(cleanText(document.title));
  } catch (err) {
    return "";
  }
};

const getDescription = () => {
  try {
    const meta = document.querySelector('meta[name="description"]');
    const description = meta?.getAttribute("content") || "";
    return truncateWords(cleanText(description));
  } catch (err) {
    return "";
  }
};

   
                               
                                                
   
const getSummary = () => {
                 
  let summary = "";

  try {
    const href = document?.location?.href || "";
    const youtubeUrl = "https://www.youtube.com";
    if (href.startsWith(youtubeUrl)) {
                               
      const $el =
        document.querySelector("#collapsed-title") ||
        document.querySelector("#description-inline-expander");              
      if ($el) {
                                                             
        summary = ($el.textContent || "").slice(0, 5000);
      }
    }

                         
    if (!summary) {
      summary =
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content") || "";
    }
    if (!summary) {
      summary =
        document
          .querySelector('meta[name="keywords"]')
          ?.getAttribute("content") || "";
    }
  } catch (err) {
             
  }

  return truncateWords(cleanText(summary));
};

                                                         
                                        
let docInfoCache = null;

export const getDocInfo = () => {
  const cacheKey =
    (document?.location?.href || "") + "|" + (document?.title || "");
  if (docInfoCache && docInfoCache.key === cacheKey) {
    return docInfoCache.info;
  }

  const title = getTitle();
  const description = getDescription();
  const summary = getSummary();

  const info = { title, description, summary };
  docInfoCache = { key: cacheKey, info };

  return info;
};

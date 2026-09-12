import { trustedTypesHelper } from "./trustedTypes";

   
                                                                           
                          
                          
                    
   
export const getHtmlText = (htmlStr, skipTag = "") => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    trustedTypesHelper.createHTML(htmlStr),
    "text/html"
  );

  if (skipTag) {
    doc.querySelectorAll(skipTag).forEach((el) => el.remove());
  }

  return doc.body.innerText.trim();
};

   
                                             
                      
                    
   
export function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

   
                                           
                      
                    
   
export function decodeHTMLEntities(str) {
  if (!str || typeof str !== "string") return str;

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    trustedTypesHelper.createHTML(str),
    "text/html"
  );

  return doc.documentElement.textContent || "";
}

export const encodeHTMLTranslationText = (text) =>
  String(text || "").replace(/\r\n|\r|\n/g, "<br>");

export const decodeHTMLTranslationText = (text) =>
  decodeHTMLEntities(String(text || "").replace(/<br\s*\/?>[\t ]*/gi, "\n"));

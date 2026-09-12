import { trustedTypesHelper } from "./trustedTypes";

                           
                                                                     
export const injectInlineJs = (code, id = "kiss-translator-inline-js") => {
                    
  if (document.getElementById(id)) {
    return;
  }

  const el = document.createElement("script");
  el.setAttribute("data-source", "kiss-inject injectInlineJs");
  el.type = "text/javascript";
  el.id = id;
                                     
  el.textContent = trustedTypesHelper.createScript(code);
  (document.head || document.documentElement).appendChild(el);
};

                                         
                                                                 
                                                                          
                             
export const injectInlineJsBg = (code, id = "kiss-translator-inline-js") => {
  if (document.getElementById(id)) {
    return;
  }

  const el = document.createElement("script");
  el.setAttribute("data-source", "kiss-inject injectInlineJsBg");
  el.type = "text/javascript";
  el.id = id;
  el.textContent = code;
                                                                       
  (document.head || document.documentElement).appendChild(el);
};

                              
export const injectExternalJs = (src, id = "kiss-translator-external-js") => {
  if (document.getElementById(id)) {
    return;
  }

  const el = document.createElement("script");
  el.setAttribute("data-source", "kiss-inject injectExternalJs");
  el.type = "text/javascript";
  el.id = id;
                                                 
  el.src = trustedTypesHelper.createScriptURL(src);
  (document.head || document.documentElement).appendChild(el);
};

                  
export const injectInternalCss = (styles) => {
  const el = document.createElement("style");
  el.setAttribute("data-source", "kiss-inject injectInternalCss");
  el.textContent = styles;
  document.head?.appendChild(el);
};

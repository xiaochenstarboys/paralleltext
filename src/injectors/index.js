import { browser } from "../libs/browser";
import { isExt } from "../libs/client";
import { injectExternalJs, injectInlineJs } from "../libs/injector";
import { shadowRootInjector } from "./shadowroot";

             
export const INJECTOR = {
  shadowroot: "injector-shadowroot.js",                      
};

             
const injectorMap = {
  [INJECTOR.shadowroot]: shadowRootInjector,
};

   
                   
                                                          
                                                              
                              
                                         
   
export function injectJs(name, id = "kiss-translator-inject-js") {
  const injector = injectorMap[name];
  if (!injector) return;

  if (isExt) {
                           
    const src = browser.runtime.getURL(name);
    injectExternalJs(src, id);
  } else {
                                      
    injectInlineJs(`(${injector})()`, id);
  }
}

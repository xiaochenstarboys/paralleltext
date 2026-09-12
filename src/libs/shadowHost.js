   
                       
  
                                                            
                                      
                                                                                  
                                                  
  
      
                                                                   
                                                  
                                             
  
                                                       
   
const SHADOW_HOST_RESET_STYLE = [
  "position: fixed !important",
  "top: 0 !important",
  "left: 0 !important",
  "width: 0 !important",
  "height: 0 !important",
  "margin: 0 !important",
  "padding: 0 !important",
  "border: none !important",
  "background: none !important",
  "float: none !important",
  "transform: none !important",
  "filter: none !important",
  "perspective: none !important",
  "contain: none !important",
  "will-change: auto !important",
  "z-index: 2147483647 !important",
].join("; ");

                                                       
export function getShadowHostMountRoot() {
  return document.documentElement || document.body;
}

                    
export function hardenShadowHost(host) {
  if (host) {
    host.style.cssText = SHADOW_HOST_RESET_STYLE;
  }
}

                 
export function isShadowHostAttached(host) {
  return Boolean(host && (document.documentElement || document).contains(host));
}

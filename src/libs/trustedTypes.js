   
                        
                                                                                         
   

import DOMPurify from "dompurify";

                                
export const trustedTypesHelper = (() => {
  const POLICY_NAME = "kiss-translator-policy";
  let policy = null;
  let policyUnavailable = false;

  const createPolicy = () => {
    if (policy || policyUnavailable) {
      return policy;
    }

    if (!globalThis.trustedTypes || !globalThis.trustedTypes.createPolicy) {
      policyUnavailable = true;
      return null;
    }

    try {
      policy = globalThis.trustedTypes.createPolicy(POLICY_NAME, {
                                                
        createHTML: (string) => DOMPurify.sanitize(string),

                                                                                         
                                               
        createScript: (string) => string,
        createScriptURL: (string) => string,
      });
    } catch (err) {
                                        
      if (err?.message?.includes("already exists")) {
        policy = globalThis.trustedTypes.policies?.get(POLICY_NAME) || null;
      }

      if (!policy) {
        policyUnavailable = true;
      }
    }

    return policy;
  };

  return {
       
                                      
                                 
       
    createHTML: (htmlString) => {
      const trustedPolicy = createPolicy();
      return trustedPolicy
        ? trustedPolicy.createHTML(htmlString)
        : DOMPurify.sanitize(htmlString);
    },
       
                                                     
                                                             
                                 
                                  
       
    createFragment: (htmlString) =>
      DOMPurify.sanitize(htmlString, { RETURN_DOM_FRAGMENT: true }),
       
                                    
                                   
       
    createScript: (scriptString) => {
      const trustedPolicy = createPolicy();
      return trustedPolicy
        ? trustedPolicy.createScript(scriptString)
        : scriptString;
    },
       
                                         
                                
       
    createScriptURL: (urlString) => {
      const trustedPolicy = createPolicy();
      return trustedPolicy
        ? trustedPolicy.createScriptURL(urlString)
        : urlString;
    },
       
                                
                         
       
    isEnabled: () => policy !== null,
  };
})();

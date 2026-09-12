import { browser } from "./browser";

   
                                
                                                
   
export const getCurTab = async () => {
  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
};

   
                 
                                              
   
export const getCurTabId = async () => {
  const tab = await getCurTab();
  return tab?.id;
};

   
                                               
                                                                                        
                                 
                                
                              
                                
   
export const sendBgMsg = (action, args) =>
  browser?.runtime.sendMessage({ action, args });

   
                   
                                
                              
                                                     
   
export const sendTabMsg = async (action, args) => {
  const tabId = await getCurTabId();
  if (!tabId) return;

                                       
  return browser.tabs.sendMessage(tabId, { action, args }).catch((err) => {
                             
                                                                            
                                                                                    
                                          
    if (
      err?.message?.includes("Could not establish connection") ||
      err?.message?.includes("Receiving end does not exist")
    ) {
      return;
    } else {
      throw err;
    }
  });
};

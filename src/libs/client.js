   
                  
                                                                          
   

import { CLIENT_EXTS, CLIENT_CHROME, CLIENT_FIREFOX } from "../config/client";

export const client = process.env.REACT_APP_CLIENT;              
export const isExt = CLIENT_EXTS.includes(client);                                                     
                                                   
export const isAutoTranslateClipboardSupported =
  client === CLIENT_CHROME || client === CLIENT_FIREFOX;

   
                     
                                                                 
   

import { isMatch } from "./utils";

   
                           
                                                     
                                                      
                                                 
  
          
                                       
                                                                       
                                                                             
   
export const isInBlacklist = (href, blacklist = "") =>
  blacklist.split(/\n|,/).some((url) => isMatch(href, url.trim()));

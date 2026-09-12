import { useSetting } from "./Setting";
import { I18N } from "../config";

   
               
                                                  
                           
                                     
                            
   
export const getI18n = (uiLang, key, defaultText = "") => {
  return I18N?.[key]?.[uiLang] ?? defaultText;
};

                                
export const useLangMap = (uiLang) => {
  return (key, defaultText = "") => getI18n(uiLang, key, defaultText);
};

   
                    
                                                  
   
export const useI18n = () => {
  const {
    setting: { uiLang },
  } = useSetting();
  return useLangMap(uiLang);
};

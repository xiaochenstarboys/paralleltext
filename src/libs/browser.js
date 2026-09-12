   
                   
                                                                                                                 
   

   
                               
                                                                       
   
function _browser() {
  try {
    return require("webextension-polyfill");
  } catch (err) {
                                   
                               
  }
}

                    
export const browser = _browser();

   
                          
                                                                                    
  
          
                                                                      
                                                                      
                             
                                                                    
   
export const getContext = () => {
  const context = globalThis.__KISS_CONTEXT__;
  if (context) return context;

                                                                            
                           
      

                                                        
                                                             
                        
      

                                               
                                                    
                                                        
                                                            
                                                              

  return "undefined";
};

           
export const isBg = () => getContext() === "background";

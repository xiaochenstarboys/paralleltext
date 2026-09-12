import { DEFAULT_CONTEXT_SIZE } from "../config";

                          
const historyMap = new Map();

   
                      
                                             
                                                   
   
const MsgHistory = (maxSize = DEFAULT_CONTEXT_SIZE) => {
  const messages = [];
  let limit = maxSize;

     
                            
     
  const add = (...msgs) => {
    messages.push(...msgs.filter(Boolean));
    const extra = messages.length - limit;
    if (extra > 0) {
                     
      messages.splice(0, extra);
    }
  };

     
                       
     
  const getAll = () => {
    return [...messages];
  };

     
                                   
     
  const resize = (nextSize) => {
    if (Number.isInteger(nextSize) && nextSize > 0) {
      limit = nextSize;
      const extra = messages.length - limit;
      if (extra > 0) {
        messages.splice(0, extra);
      }
    }
  };

     
             
     
  const clear = () => {
    messages.length = 0;
  };

  return {
    add,
    getAll,
    resize,
    clear,
  };
};

   
                        
                                                             
                                     
                              
   
export const getMsgHistory = (apiSlug, maxSize) => {
  if (historyMap.has(apiSlug)) {
    const existing = historyMap.get(apiSlug);
                                     
    existing.resize(maxSize);
    return existing;
  }

  const msgHistory = MsgHistory(maxSize);
  historyMap.set(apiSlug, msgHistory);
  return msgHistory;
};

   
                     
                                   
   
export const clearMsgHistory = (apiSlug) => {
  historyMap.delete(apiSlug);
};

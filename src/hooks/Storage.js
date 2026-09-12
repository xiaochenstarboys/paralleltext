import { useCallback, useEffect, useRef, useState } from "react";
import { storage, STORAGE_CHANGE_EVENT } from "../libs/storage";
import { kissLog } from "../libs/log";

                                                   
                                                  
const extBrowser =
  globalThis.browser?.storage?.onChanged != null
    ? globalThis.browser
    : globalThis.chrome?.storage?.onChanged != null
      ? globalThis.chrome
      : null;

function isSameStorageValue(a, b) {
  if (Object.is(a, b)) return true;

  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    Array.isArray(a) === Array.isArray(b)
  ) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch (err) {
      return false;
    }
  }

  return false;
}

   
                                                       
  
                            
                                                                                     
                                                                               
                                                                                    
                                                                                                   
                                                    
  
                                         
                                         
              
           
                                                             
                                                                              
                               
                               
                     
     
   
export function useStorage(key, defaultVal = null) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(defaultVal);
                                     
                                                       
                                  
  const dirtyRef = useRef(false);
                                                   
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

                       
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const storedVal = await storage.getObj(key);
        if (storedVal === undefined || storedVal === null) {
                             
                                                                     
                                                  
                                    
          if (defaultVal !== undefined && defaultVal !== null) {
            await storage.setObj(key, defaultVal);
          }
        } else if (isMounted) {
          setData(storedVal);
        }
      } catch (err) {
        kissLog(`storage load error for key: ${key}`, err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [key, defaultVal]);

                                                      
  useEffect(() => {
    if (isLoading || !dirtyRef.current) {
      return;
    }
    dirtyRef.current = false;

    if (data === null) {
      return;
    }

    storage.setObj(key, data).catch((err) => {
      kissLog(`storage save error for key: ${key}`, err);
    });
  }, [key, isLoading, data]);

     
                      
                                                                     
     
  const save = useCallback((valueOrFn) => {
    dirtyRef.current = true;
    setData((prevData) =>
      typeof valueOrFn === "function" ? valueOrFn(prevData) : valueOrFn
    );
  }, []);

     
                            
                                                                                        
     
  const update = useCallback((partialDataOrFn) => {
    dirtyRef.current = true;
    setData((prevData) => {
      const partialData =
        typeof partialDataOrFn === "function"
          ? partialDataOrFn(prevData)
          : partialDataOrFn;
                                               
      const baseObj =
        typeof prevData === "object" && prevData !== null ? prevData : {};
      return { ...baseObj, ...partialData };
    });
  }, []);

     
                                           
     
  const remove = useCallback(async () => {
    try {
      await storage.del(key);
      setData(null);
    } catch (err) {
      kissLog(`storage remove error for key: ${key}`, err);
    }
  }, [key]);

     
                             
                                                                
     
  const reload = useCallback(async () => {
    try {
      const storedVal = await storage.getObj(key);
      const nextData = storedVal ?? defaultVal;
      if (isSameStorageValue(dataRef.current, nextData)) {
        return;
      }
      setData(nextData);
    } catch (err) {
      kissLog(`storage reload error for key: ${key}`, err);
    }
  }, [key, defaultVal]);

                                         
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

                              
                                               
                                                               
                                  
  useEffect(() => {
    const handleCustomEvent = (e) => {
      if (e?.detail?.key === key) {
        reloadRef.current();
      }
    };
    const handleWindowStorage = (e) => {
      if (e?.key === key) {
        reloadRef.current();
      }
    };
    const handleBrowserChange = (changes, areaName) => {
      if (areaName === "local" && changes && changes[key]) {
        reloadRef.current();
      }
    };

    window.addEventListener(STORAGE_CHANGE_EVENT, handleCustomEvent);
    window.addEventListener("storage", handleWindowStorage);
    extBrowser?.storage?.onChanged?.addListener?.(handleBrowserChange);
    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleCustomEvent);
      window.removeEventListener("storage", handleWindowStorage);
      extBrowser?.storage?.onChanged?.removeListener?.(handleBrowserChange);
    };
  }, [key]);

  return { data, save, update, remove, reload, isLoading };
}

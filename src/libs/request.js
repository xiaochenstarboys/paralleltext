   
                   
                                              
                                                                 
   

import { isExt } from "./client";
import { sendBgMsg } from "./msg";
import { getSettingWithDefault } from "./storage";
import { MSG_FETCH, DEFAULT_HTTP_TIMEOUT } from "../config";
import { isBg } from "./browser";
import { kissLog } from "./log";
import { parseResponse } from "./response";

   
                        
  
                                                        
                                    
   
export const normalizeHttpTimeout = (timeout) => {
  const normalizedTimeout = timeout || DEFAULT_HTTP_TIMEOUT;
                                                 
  return normalizedTimeout > 600 ? normalizedTimeout : normalizedTimeout * 1000;
};

   
                        
  
                               
                                                   
                                             
   
export const resolveHttpTimeout = async (opts = {}) => {
  let timeout = opts?.httpTimeout;
  if (!timeout) {
    try {
      timeout = (await getSettingWithDefault())?.httpTimeout;
    } catch (err) {
      kissLog("getSettingWithDefault", err);
    }
  }

  return normalizeHttpTimeout(timeout);
};

   
                                        
  
                                                                 
                                                               
   
export const mergeAbortSignals = (signals = []) => {
  const activeSignals = signals.filter(Boolean);
  if (activeSignals.length === 0) return undefined;
  if (activeSignals.length === 1) return activeSignals[0];
  if (AbortSignal?.any) return AbortSignal.any(activeSignals);

  const controller = new AbortController();
  const abort = (signal) => {
    if (!controller.signal.aborted) {
      controller.abort(signal?.reason);
    }
  };

  for (const signal of activeSignals) {
    if (signal.aborted) {
      abort(signal);
      break;
    }
                                                
    signal.addEventListener("abort", () => abort(signal), { once: true });
  }

  return controller.signal;
};

   
                        
  
                                     
                                                                   
   
export const createTimeoutSignal = (timeout) =>
  AbortSignal?.timeout && timeout ? AbortSignal.timeout(timeout) : undefined;

   
                                       
  
                                
                                         
                               
                                           
                                             
                                               
   
export const fetchPatcher = async (input, init = {}, opts) => {
  const timeout = await resolveHttpTimeout(opts);
  const signal = mergeAbortSignals([
    init.signal,
    opts?.signal,
    createTimeoutSignal(timeout),
  ]);
  const requestInit = { ...init, signal };

  return fetch(input, requestInit);
};

   
               
  
                               
                                       
                                           
                                    
                                  
   
export const fetchHandle = async ({ input, init, opts = {} }) => {
  const res = await fetchPatcher(input, init, opts);
  return parseResponse(res, opts.expect);
};

   
                 
  
                               
                                         
                                                          
                              
   
export const fnPolyfill = ({ fn, msg = MSG_FETCH, ...args }) => {
  if (isExt && !isBg()) {
    const signal = args.opts?.signal;
    const safeArgs = {
      ...args,
      opts: { ...args.opts, signal: undefined },
    };
    const requestPromise = sendBgMsg(msg, safeArgs);
    if (signal) {
      const abortPromise = new Promise((_, reject) => {
        if (signal.aborted) {
          reject(new DOMException("The operation was aborted.", "AbortError"));
          return;
        }
                                                                        
        signal.addEventListener(
          "abort",
          () =>
            reject(
              new DOMException("The operation was aborted.", "AbortError")
            ),
          { once: true }
        );
      });
      return Promise.race([requestPromise, abortPromise]);
    }
                                                      
    return requestPromise;
  }

  return fn({ ...args });
};

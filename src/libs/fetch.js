   
                 
                                                                           
                                             
   

import { getFetchPool } from "./pool";
import { getHttpCachePolyfill } from "./cache";
import { createAsyncQueue } from "./stream";
import {
  fetchPatcher,
  fetchHandle,
  fnPolyfill,
  mergeAbortSignals,
} from "./request";
import { fetchStreamNative, requestStream } from "./requestStream";

export { fetchPatcher, fetchHandle, fnPolyfill, fetchStreamNative };

   
                            
  
                                
                                    
                                     
                                                      
                                                
                                                   
                                                
                                                             
                                    
   
export const fetchData = async (
  input,
  init,
  { useCache, usePool, fetchInterval, fetchLimit, ...opts } = {}
) => {
  if (!input?.trim()) {
    throw new Error("URL is empty");
  }

  if (useCache) {
    const resCache = await getHttpCachePolyfill(input, init);
    if (resCache) {
      return resCache;
    }
  }

  if (usePool) {
    const fetchPool = getFetchPool(fetchInterval, fetchLimit);
    return fetchPool.push(fnPolyfill, { fn: fetchHandle, input, init, opts });
  }

  return fnPolyfill({ fn: fetchHandle, input, init, opts });
};

   
                                 
  
                                
                                    
                                     
                                                      
                                                
                                                   
                                                
                                                           
                                  
   
export async function* fetchStream(
  input,
  init,
  { useCache, usePool, fetchInterval, fetchLimit, ...opts } = {}
) {
  if (!input?.trim()) {
    throw new Error("URL is empty");
  }

  if (useCache) {
    const resCache = await getHttpCachePolyfill(input, init);
    if (resCache) {
      yield resCache;
      return;
    }
  }

  if (usePool) {
    const fetchPool = getFetchPool(fetchInterval, fetchLimit);
    const asyncQueue = createAsyncQueue();
    const streamController = new AbortController();
    const streamOpts = {
      ...opts,
      signal: mergeAbortSignals([opts.signal, streamController.signal]),
    };

    const streamPromise = fetchPool.push(async () => {
                                    
                               
      if (streamOpts.signal?.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError");
      }
      try {
        for await (const chunk of requestStream(input, init, streamOpts)) {
          asyncQueue.push(chunk);
        }
        asyncQueue.finish();
      } catch (e) {
        asyncQueue.error(e);
      }
      return null;
    });

    try {
      yield* asyncQueue.iterate();
    } finally {
                                           
      streamController.abort();
      await streamPromise.catch(() => {});
    }
    return;
  }

  yield* requestStream(input, init, opts);
}

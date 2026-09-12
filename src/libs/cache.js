   
                 
                                                                                                                       
   

import {
  CACHE_NAME,
  DEFAULT_CACHE_TIMEOUT,
  MSG_CLEAR_CACHES,
  MSG_GET_CACHES_SIZE,
  MSG_GET_HTTPCACHE,
  MSG_PUT_HTTPCACHE,
} from "../config";
import { kissLog } from "./log";
import { isExt } from "./client";
import { isBg } from "./browser";
import { sendBgMsg } from "./msg";
import { parseResponse } from "./response";

   
                
   
export const tryClearCaches = async () => {
  try {
    if (isExt && !isBg()) {
      await sendBgMsg(MSG_CLEAR_CACHES);
    } else {
      await caches.delete(CACHE_NAME);
    }
  } catch (err) {
    kissLog("clean caches", err);
  }
};

   
                              
                                                 
   
export const getCachesSize = async () => {
  try {
    if (isExt && !isBg()) {
      return (await sendBgMsg(MSG_GET_CACHES_SIZE)) ?? 0;
    }
    if (!(await caches.has(CACHE_NAME))) {
      return 0;
    }
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    let size = 0;
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        size += (await response.blob()).size;
      }
    }
    return size;
  } catch (err) {
    kissLog("get caches size", err);
    return 0;
  }
};

   
                      
                                                                          
                                                         
                                          
  
          
                                                       
                                                                                            
                           
                                                                               
                            
                        
                       
                                                       
   
const newCacheReq = async (input, init) => {
  let request = new Request(input, init);
  if (request.method !== "GET") {
    const body = await request.text();
    const cacheUrl = new URL(request.url);
    cacheUrl.pathname += body;
    request = new Request(cacheUrl.toString(), { method: "GET" });
  }

  return request;
};

   
                                   
                        
                       
                                                   
                                              
   
export const getHttpCache = async ({ input, init, expect }) => {
  try {
    const request = await newCacheReq(input, init);
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(request);
    if (response) {
                                                                
                                  
      const cachedAt = Number(response.headers.get("x-cache-time"));
      const maxAgeMatch = /max-age=(\d+)/.exec(
        response.headers.get("Cache-Control") || ""
      );
      if (cachedAt && maxAgeMatch) {
        const maxAge = Number(maxAgeMatch[1]);
        if (Date.now() - cachedAt > maxAge * 1000) {
          await cache.delete(request);
          return null;
        }
      }
      const res = await parseResponse(response, expect);
      return res;
    }
  } catch (err) {
    kissLog("get cache", err);
  }
  return null;
};

   
                                     
                        
                       
                              
                                                           
   
export const putHttpCache = async ({
  input,
  init,
  data,
  maxAge = DEFAULT_CACHE_TIMEOUT,                       
}) => {
  try {
    const req = await newCacheReq(input, init);
    const cache = await caches.open(CACHE_NAME);
    const res = new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `max-age=${maxAge}`,
                                                      
        "x-cache-time": String(Date.now()),
      },
    });
    await cache.put(req, res);
  } catch (err) {
    kissLog("put cache", err);
  }
};

   
                                                           
                        
                       
                        
   
export const getHttpCachePolyfill = (input, init) => {
                
  if (isExt && !isBg()) {
    return sendBgMsg(msgGetCacheName(), { input, init });
  }

                   
  return getHttpCache({ input, init });
};

   
                      
   
function msgGetCacheName() {
  return MSG_GET_HTTPCACHE;
}

   
                                                           
                        
                       
                       
                           
   
export const putHttpCachePolyfill = (input, init, data) => {
                
  if (isExt && !isBg()) {
    return sendBgMsg(MSG_PUT_HTTPCACHE, { input, init, data });
  }

                   
  return putHttpCache({ input, init, data });
};

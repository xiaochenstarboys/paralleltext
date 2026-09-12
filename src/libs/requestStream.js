   
                         
                                                     
                                             
   

import browser from "webextension-polyfill";
import { isExt } from "./client";
import { isBg } from "./browser";
import { PORT_STREAM_FETCH } from "../config";
import { createSSEParser, createAsyncQueue } from "./stream";
import {
  createTimeoutSignal,
  mergeAbortSignals,
  normalizeHttpTimeout,
  resolveHttpTimeout,
} from "./request";

   
                          
  
                                
                                         
                                                             
                                           
                                             
                                                      
   
export async function* fetchStreamNative(input, init = {}, opts = {}) {
  const options = typeof opts === "number" ? { httpTimeout: opts } : opts || {};
  const timeout = normalizeHttpTimeout(options.httpTimeout);
  const signal = mergeAbortSignals([
    init.signal,
    options.signal,
    createTimeoutSignal(timeout),
  ]);
  const response = await fetch(input, { ...init, signal });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

                                                        
                                     
                                              
                                              
  const contentType = response.headers?.get?.("Content-Type") || "";
  if (contentType.includes("application/json")) {
    let json = null;
    try {
      json = await response.clone().json();
    } catch {
                             
    }
    if (json && typeof json.code === "number" && json.code !== 0 && json.msg) {
      const err = new Error(json.msg);
      err.bizCode = json.code;
      throw err;
    }
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parseSSE = createSSEParser();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const data of parseSSE(decoder.decode(value, { stream: true }))) {
        yield data;
      }
    }
  } finally {
                                                         
    await reader.cancel?.();
  }
}

   
                                                   
  
                                
                                    
                             
                                                                     
   
async function* fetchStreamViaPort(input, init, opts) {
  const asyncQueue = createAsyncQueue();
  const { signal, ...serializableOpts } = opts || {};

  let port;
  try {
    port = browser.runtime.connect({ name: PORT_STREAM_FETCH });
  } catch (e) {
    throw new Error("Failed to connect to background: " + e.message);
  }
  const disconnectPort = () => {
    try {
      port.disconnect();
    } catch {
                                         
    }
  };

  port.onMessage.addListener((message) => {
    switch (message.type) {
      case "delta":
        asyncQueue.push(message.data);
        break;
      case "done":
        asyncQueue.finish();
        break;
      case "error": {
                                
        const err = new Error(message.error);
        if (message.bizCode) err.bizCode = message.bizCode;
        asyncQueue.error(err);
        break;
      }
      default:
        break;
    }
  });

  port.onDisconnect.addListener(() => {
    const lastError = browser.runtime.lastError;
    if (lastError) {
      asyncQueue.error(new Error(lastError.message || "Port disconnected"));
    } else {
                                                            
                                     
      asyncQueue.finish();
    }
  });

  const abortBySignal = () => {
    asyncQueue.error(
      new DOMException("The operation was aborted.", "AbortError")
    );
    disconnectPort();
  };

  const alreadyAborted = signal?.aborted;
  if (alreadyAborted) {
    abortBySignal();
  } else {
    signal?.addEventListener?.("abort", abortBySignal, { once: true });
  }

  if (!alreadyAborted) {
    port.postMessage({
      action: "start",
                                                                 
      args: { input, init, opts: serializableOpts },
    });
  }

  try {
    yield* asyncQueue.iterate();
  } finally {
    signal?.removeEventListener?.("abort", abortBySignal);
                                                              
    disconnectPort();
  }
}

   
                            
  
                                
                                    
                             
                                                      
   
export async function* requestStream(input, init, opts = {}) {
  const httpTimeout = await resolveHttpTimeout(opts);
  opts = {
    ...opts,
    httpTimeout,
  };

  if (isExt && !isBg()) {
    yield* fetchStreamViaPort(input, init, opts);
    return;
  }

  yield* fetchStreamNative(input, init, opts);
}

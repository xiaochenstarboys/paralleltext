   
                  
                                                                                 
   

import { JSONParser } from "@streamparser/json";
import { OPT_TRANS_OPENAI, OPT_TRANS_DEEPSEEK, OPT_TRANS_QWEN } from "../config";
import {
  normalizeTranslationItem,
  parseLineTranslationSegments,
  parseXmlTranslationSegments,
} from "./aiResponseParser";
   
                                       
                                                                        
                                                                
   
export const createSSEParser = () => {
  let buffer = "";

  return function* (chunk = "") {
    buffer += chunk;
    buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    let boundaryIndex = buffer.indexOf("\n\n");
    while (boundaryIndex !== -1) {
      const frame = buffer.slice(0, boundaryIndex);
                                                    
      buffer = buffer.slice(boundaryIndex + 2);

      const dataLines = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith(":")) continue;
        if (!line.startsWith("data:")) continue;

        let data = line.slice(5);
        if (data.startsWith(" ")) data = data.slice(1);
        dataLines.push(data);
      }

      if (dataLines.length) {
        const data = dataLines.join("\n");
        if (data.trim() !== "[DONE]") {
          yield data;
        }
      }

      boundaryIndex = buffer.indexOf("\n\n");
    }
  };
};

   
                                                                
                                                      
                                                               
   
export const createAsyncQueue = () => {
  const queue = [];
  let resolve = null;
  let done = false;
  let error = null;

  return {
                               
    push: (data) => {
      queue.push(data);
      if (resolve) {
        resolve();
        resolve = null;
      }
    },
                         
    finish: () => {
      done = true;
      if (resolve) {
        resolve();
        resolve = null;
      }
    },
                    
    error: (e) => {
      error = e;
      done = true;
      if (resolve) {
        resolve();
        resolve = null;
      }
    },
                                                                     
    async *iterate() {
      const setResolve = (r) => {
        resolve = r;
      };
      while (!done || queue.length > 0) {
        if (queue.length > 0) {
          yield queue.shift();
        } else if (!done) {
          await new Promise(setResolve);                          
        }
      }
      if (error) throw error;
    },
  };
};

   
                                                      
                                        
                                   
                                       
   
export function getStreamDelta(json, apiType) {
  switch (apiType) {
    case OPT_TRANS_OPENAI:
    case OPT_TRANS_DEEPSEEK:
    case OPT_TRANS_QWEN:
                                                                      
      return json.choices?.[0]?.delta?.content || "";
    default:
      return "";
  }
}

   
                                                 
                                              
                                       
                                                                 
                                                                          
   
export function* parseStreamingSegments(content, processedIds) {
  if (!content) return;

                                                        
                                                               
  const xmlSegments = parseXmlTranslationSegments(content);
  if (xmlSegments.length > 0) {
    for (const { id, translation } of xmlSegments) {
      if (!processedIds.has(id)) {
        processedIds.add(id);
        yield { id, translation };
      }
    }
    return;
  }

                                
                                    
  for (const { id, translation } of parseLineTranslationSegments(content, {
    requireCompleteLine: true,
  })) {
    if (!processedIds.has(id)) {
      processedIds.add(id);
      yield { id, translation };
    }
  }
}

   
                                                 
                                    
        
                                                     
                                   
                                                 
   
export function createStreamingJsonParser() {
  const pending = [];
                 
  const parser = new JSONParser({
    paths: ["$.translations.*", "$.*"],
    keepStack: false,
  });

                     
  parser.onValue = ({ value }) => {
                                                                
    const segment = normalizeTranslationItem(value, NaN);
    if (segment) {
      pending.push(segment);
    }
  };

  parser.onError = () => {};

  return {
       
                                                      
                            
       
    *write(delta) {
      try {
        parser.write(delta);
      } catch (e) {
                                  
      }
      while (pending.length > 0) {
        yield pending.shift();
      }
    },
       
                 
       
    end() {
      try {
        parser.end();
      } catch (e) {
             
      }
    },
  };
}

   
                                        
                                          
                                   
                                                                      
   
export function detectStreamFormat(content) {
  const stripped = content.trim();

                 
  const jsonStart = stripped.search(/[{[]/);
  const xmlStart = stripped.search(/<(t|item|seg)\s/i);
  const lineStart = stripped.search(/^\d+\s*\|/m);

  if (jsonStart === -1 && xmlStart === -1 && lineStart === -1) {
    return { isJson: false, detected: false };
  }

                           
  const positions = [
    { type: "json", pos: jsonStart },
    { type: "xml", pos: xmlStart },
    { type: "line", pos: lineStart },
  ].filter((p) => p.pos !== -1);

  if (positions.length === 0) {
    return { isJson: false, detected: false };
  }

  const first = positions.reduce((a, b) => (a.pos < b.pos ? a : b));
  return { isJson: first.type === "json", detected: true };
}

   
               
                                     
                                                            
                                           
                                                                           
   
export function createRealtimeStreamParser() {
  let format = null;                                         
  let buffer = "";
  const pendingJsonItems = [];
  const lastJsonTextById = new Map();
  const jsonParser = new JSONParser({
    paths: [
      "$.translations.*.text",
      "$.translations.*.translation",
      "$.*.text",
      "$.*.translation",
      "$.text",
      "$.translation",
    ],
    keepStack: true,
    emitPartialTokens: true,
    emitPartialValues: true,
  });

                                          
                             
  jsonParser.onValue = ({ value, key, parent }) => {
    if (value === undefined) return;

    const segment = normalizeTranslationItem({ ...parent, [key]: value }, NaN);
    if (!segment) return;

    const [partialText] = segment.translation;
    if (!partialText || lastJsonTextById.get(segment.id) === partialText) {
      return;
    }

    lastJsonTextById.set(segment.id, partialText);
    pendingJsonItems.push({
      id: segment.id,
      partialText,
      isComplete: false,
    });
  };
  jsonParser.onError = () => {};

            
  const detect = (content) => {
    const stripped = content.trim();
    if (stripped.search(/[{[]/) !== -1) return "json";
    if (stripped.search(/<(t|item|seg)\s/i) !== -1) return "xml";
    if (stripped.search(/^\d+\s*\|/m) !== -1) return "line";
    return null;
  };

                    
  const parseXml = (content) => {
    const results = [];
                            
    const closedRegex =
      /<(t|item|seg)\s+id="(\d+)"(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = closedRegex.exec(content)) !== null) {
      const id = parseInt(match[2], 10);
      results.push({ id, partialText: match[3], isComplete: true });
    }
                                                    
    let remaining = content;
    remaining = remaining.replace(
      /<(t|item|seg)\s+id="\d+"(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi,
      ""
    );
    const openRegex = /<(t|item|seg)\s+id="(\d+)"(?:\s[^>]*)?>([^]*)$/;
    const openMatch = remaining.match(openRegex);
    if (openMatch) {
      const id = parseInt(openMatch[2], 10);
                       
      const partialText = openMatch[3].replace(/<\/[^>]*$/, "");
      results.push({ id, partialText, isComplete: false });
    }
    return results;
  };

            
  const parseLine = (content) => {
    const results = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const pipeMatch = trimmed.match(/^(\d+)\s*\|\s*(.*)/);
      if (pipeMatch) {
        const id = parseInt(pipeMatch[1], 10);
        const text = pipeMatch[2].trim().replace(/<br\s*\/?>/gi, "\n");
        const isComplete = i < lines.length - 1;
        results.push({ id, partialText: text, isComplete });
      }
    }
    return results;
  };

  const parseJson = (delta) => {
    try {
      jsonParser.write(delta);
    } catch (e) {
                                             
    }

    return pendingJsonItems.splice(0);
  };

  return {
    write(delta) {
      buffer += delta;
      if (!format) {
        format = detect(buffer);
        if (!format) return [];
      }

      switch (format) {
        case "xml":
          return parseXml(buffer);
        case "line":
          return parseLine(buffer);
        case "json":
          return parseJson(delta);
        default:
          return [];
      }
    },
    getFormat() {
      return format;
    },
    getBuffer() {
      return buffer;
    },
  };
}

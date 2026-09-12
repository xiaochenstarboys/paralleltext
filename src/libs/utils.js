   
                 
                                                           
   

   
                                     
                            
                                     
                                
   
export function stripMarkdownCodeBlock(text, startOnly = false) {
  if (!text) return "";
  if (startOnly) {
                             
                                   
                                               
    return text.replace(/^```[a-z]*\n/i, "");
  }
  return text.replace(/^```[a-z]*\s*\n?/i, "").replace(/\n?```$/i, "");
}

   
            
                     
                          
                          
                    
   
export const limitNumber = (num, min = 0, max = 100) => {
  const number = parseInt(num);
  if (Number.isNaN(number) || number < min) {
    return min;
  } else if (number > max) {
    return max;
  }
  return number;
};

   
             
                     
                          
                          
                    
   
export const limitFloat = (num, min = 0.0, max = 100.0) => {
  const number = parseFloat(num);
  if (Number.isNaN(number) || number < min) {
    return min;
  } else if (number > max) {
    return max;
  }
  return number;
};

   
             
                              
                           
   
export const sleep = (delay) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, delay);
  });

   
                 
                                
                                   
                                
   
export const debounce = (func, delay = 200) => {
  let timer = null;

  const debouncedFunc = (...args) => {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
      timer = null;
    }, delay);
  };

                   
  debouncedFunc.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  return debouncedFunc;
};

   
                           
                          
                             
                                 
                     
   
export const isAllchar = (s, c, i = 0) => {
  while (i < s.length) {
    if (s[i] !== c) {
      return false;
    }
    i++;
  }
  return true;
};

   
                                 
                                      
                                                 
                     
  
          
                                  
                                   
                                               
                                 
                                            
   
export const isMatch = (s, p) => {
  if (s.length === 0 || p.length === 0) {
    return false;
  }

  p = "*" + p + "*";

  let [sIndex, pIndex] = [0, 0];
  let [sRecord, pRecord] = [-1, -1];
  while (sIndex < s.length && pRecord < p.length) {
    if (p[pIndex] === "*") {
      pIndex++;
      [sRecord, pRecord] = [sIndex, pIndex];
    } else if (s[sIndex] === p[pIndex]) {
      sIndex++;
      pIndex++;
    } else if (sRecord + 1 < s.length) {
      sRecord++;
      [sIndex, pIndex] = [sRecord, pRecord];
    } else {
      return false;
    }
  }

  if (p.length === pIndex) {
    return true;
  }

  return isAllchar(p, "*", pIndex);
};

   
                          
                     
                                                              
   
export const type = (o) => {
  const s = Object.prototype.toString.call(o);
  return s.match(/\[object (.*?)\]/)[1].toLowerCase();
};

   
                                               
                            
                         
                                                     
   
export const sha256 = async (text, salt) => {
  const data = new TextEncoder().encode(text + salt);
  const digest = await crypto.subtle.digest({ name: "SHA-256" }, data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

   
                                  
                    
   
export const genEventName = () => `kiss-${btoa(Math.random()).slice(3, 11)}`;

   
                       
                 
                 
                     
   
export const isSameSet = (a, b) => {
  const s = new Set([...a, ...b]);
  return s.size === a.size && s.size === b.size;
};

   
              
               
               
                   
           
   
   
                 
                          
                               
                                    
                    
   
export const removeEndchar = (s, c, count = 1) => {
  if (!s) return "";

  let i = s.length;
  while (i > s.length - count && s[i - 1] === c) {
    i--;
  }
  return s.slice(0, i);
};

   
                                    
                                    
                                                     
                                   
   
export const matchInputStr = (str, sign) => {
  switch (sign) {
    case "//":
      return str.match(/\/\/([\w-]+)\s+([^]+)/);                                     
    case "\\":
      return str.match(/\\([\w-]+)\s+([^]+)/);
    case "\\\\":
      return str.match(/\\\\([\w-]+)\s+([^]+)/);
    case ">":
      return str.match(/>([\w-]+)\s+([^]+)/);
    case ">>":
      return str.match(/>>([\w-]+)\s+([^]+)/);
    default:
  }
  return str.match(/\/([\w-]+)\s+([^]+)/);            
};

   
                                               
                            
                     
   
export const isValidWord = (str) => {
  const regex = /^[a-zA-Z-]+$/;
  return regex.test(str);
};

   
                                      
                     
                             
   
export const blobToBase64 = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

   
                                        
                               
                                        
   
export const parseJsonObj = (str) => {
  if (!str || type(str) !== "string") {
    return {};
  }

  try {
    if (str.trim()[0] !== "{") {
      str = `{${str}}`;                
    }
    return JSON.parse(str);
  } catch (err) {
             
  }

  return {};
};

   
                                           
                                     
                                      
   
export const extractJson = (raw) => {
  const jsonRegex = /({.*}|\[.*\])/s;                                  
  const match = raw.match(jsonRegex);
  return match ? match[0] : null;
};

   
                                                         
                       
                                 
                          
   
export const scheduleIdle = (cb, timeout = 200) => {
  if (window.requestIdleCallback) {
    return requestIdleCallback(cb, { timeout });
  }
  return setTimeout(cb, timeout);
};

   
                        
                      
                            
                    
   
export const truncateWords = (str, maxLength = 300) => {
  if (typeof str !== "string") return "";
  if (str.length <= maxLength) return str;
  const truncated = str.slice(0, maxLength);
  return truncated.slice(0, truncated.lastIndexOf(" ")) + " …";
};

   
                                            
                               
                             
   
function getMimeTypeFromFilename(filename) {
  const defaultType = "application/octet-stream";
  if (!filename || filename.indexOf(".") === -1) {
    return defaultType;
  }

  const extension = filename.split(".").pop().toLowerCase();
  const mimeMap = {
         
    txt: "text/plain;charset=utf-8",
    html: "text/html;charset=utf-8",
    css: "text/css;charset=utf-8",
    js: "text/javascript;charset=utf-8",
    json: "application/json;charset=utf-8",
    xml: "application/xml;charset=utf-8",
    md: "text/markdown;charset=utf-8",
    vtt: "text/vtt;charset=utf-8",

         
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",

            
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    webm: "video/webm",
    wav: "audio/wav",

              
    pdf: "application/pdf",
    zip: "application/zip",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return mimeMap[extension] || defaultType;
}

   
                                              
                              
                                    
   
export function downloadBlobFile(str, filename = "kiss-file.txt") {
  const mimeType = getMimeTypeFromFilename(filename);
  const blob = new Blob([str], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename || `kiss-file.txt`;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

   
                                            
                              
                                            
   
export function parseAITerms(termsString) {
  if (typeof termsString !== "string" || termsString.trim() === "") return {};

  try {
    return Object.fromEntries(
      termsString
        .split(/\n|;/)
        .map((line) => {
          const [k = "", v = ""] = line.split(",").map((s) => s.trim());
          return [k, v];
        })
        .filter(([k]) => k)
    );
  } catch (err) {
    return {};
  }
}

   
                     
                      
                     
   
export const isSingleChineseChar = (str) => {
  return /^[\u4e00-\u9fa5]$/.test(str || "");
};

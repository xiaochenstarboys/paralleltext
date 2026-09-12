   
                    
                                                                 
                                                     
   

import { blobToBase64 } from "./utils";

   
                            
  
                                              
                                                                         
                                                                 
                                                            
   
export const parseResponse = async (res, expect = null) => {
  if (!res) {
    throw new Error("Response object does not exist");
  }

  if (!res.ok) {
    const msg = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
    };

    try {
      const errorText = await res.clone().text();
      try {
        msg.response = JSON.parse(errorText);
      } catch {
        msg.response = errorText;
      }
    } catch (e) {
      msg.response = "Unable to read error body";
    }

    throw new Error(JSON.stringify(msg));
  }

  const contentType = res.headers.get("Content-Type") || "";
  if (expect === "blob") return res.blob();
  if (expect === "text") return res.text();
  if (expect === "json") return res.json();

  if (
    expect === "audio" ||
    contentType.includes("audio") ||
    contentType.includes("image") ||
    contentType.includes("video")
  ) {
    const blob = await res.blob();
    return blobToBase64(blob);
  }

  if (contentType.includes("text/event-stream")) {
                                                         
    throw new Error(
      "Received text/event-stream in a non-stream request. Use fetchStream instead."
    );
  }

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    return text;
  }
};

   
                         
                                                                        
                                                       
                           
                              
   
export const extractRequestErrorMessage = (err) => {
  const raw = err?.message || "request_failed";
  try {
    const jsonText = raw.includes("{") ? raw.slice(raw.indexOf("{")) : raw;
    const parsed = JSON.parse(jsonText);
    const response = parsed?.response;
    return (
      (typeof response === "string" ? response : response?.msg) ||
      `request_failed_${parsed?.status ?? "unknown"}`
    );
  } catch {
                                           
    return raw;
  }
};

import { MSG_SHA256 } from "../config/msg";
import { isExt } from "./client";
import { sendBgMsg } from "./msg";
import { sha256 } from "./utils";

const simpleHash = (text) => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
};

const getSimpleCacheDigest = (text, salt = "") => simpleHash(`${text}${salt}`);

   
                                                    
                                                 
   
export const getCacheDigest = async (text, salt = "") => {
  if (globalThis.crypto?.subtle?.digest) {
    return sha256(text, salt);
  }

  if (isExt) {
    try {
      const digest = await sendBgMsg(MSG_SHA256, { text, salt });
      if (typeof digest === "string" && digest) {
        return digest;
      }
    } catch (err) {
                                      
    }
  }

  return getSimpleCacheDigest(text, salt);
};

function normalizeLang(lang) {
  const value = String(lang || "")
    .trim()
    .replace(/_/g, "-");
  const lowerValue = value.toLowerCase();

                                        
  if (
    !value ||
    lowerValue === "en" ||
    lowerValue === "auto" ||
    lowerValue === "detect" ||
    lowerValue === "und" ||
    lowerValue === "unknown"
  ) {
    return "en-US";
  }

                                                   
  if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(value)) {
    return "en-US";
  }

  return value;
}

function hasChromeTts() {
  return typeof globalThis.chrome?.tts?.speak === "function";
}

function hasWebSpeech() {
  return (
    typeof globalThis.speechSynthesis?.speak === "function" &&
    typeof globalThis.SpeechSynthesisUtterance === "function"
  );
}

const FINAL_CHROME_TTS_EVENTS = new Set([
  "end",
  "interrupted",
  "cancelled",
  "error",
]);

                                               
function speakWithWebSpeech(text, lang, callbacks = {}) {
  if (!hasWebSpeech()) return false;

  try {
    const utterance = new globalThis.SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = callbacks.onEnd;
    utterance.onerror = callbacks.onEnd;
    globalThis.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    return false;
  }
}

export function canSpeak() {
  return hasChromeTts() || hasWebSpeech();
}

export function speak(text, lang = "en-US", callbacks = {}) {
  const utteranceText = text?.trim();
  if (!utteranceText) return false;

  const normalizedLang = normalizeLang(lang);
  let ended = false;

                                                   
  const onEnd = () => {
    if (ended) return;
    ended = true;
    callbacks.onEnd?.();
  };

  if (hasChromeTts()) {
    try {
      globalThis.chrome.tts.speak(
        utteranceText,
        {
          lang: normalizedLang,
          onEvent: (event) => {
            if (FINAL_CHROME_TTS_EVENTS.has(event?.type)) {
              onEnd();
            }
          },
        },
        () => {
                                                                      
          if (globalThis.chrome?.runtime?.lastError) {
            if (!speakWithWebSpeech(utteranceText, normalizedLang, { onEnd })) {
              onEnd();
            }
          }
        }
      );
      return true;
    } catch (err) {
      return speakWithWebSpeech(utteranceText, normalizedLang, { onEnd });
    }
  }

  return speakWithWebSpeech(utteranceText, normalizedLang, { onEnd });
}

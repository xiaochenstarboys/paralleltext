import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { apiTranslate } from "../../apis";
import {
  createTranslationOperation,
  confirmTranslationPaint,
} from "../../libs/translationOperation";
import { API_SPE_TYPES, OPT_TRANS_GOOGLE } from "../../config";
import { useI18n } from "../../hooks/I18n";
import CopyBtn from "./CopyBtn";
import { isValidWord } from "../../libs/utils";
import { addWordToBook } from "../../libs/wordBook";

   
                         
  
                                     
                                                   
   
const canRenderStream = (apiSetting) =>
  Boolean(
    apiSetting?.useStream &&
      API_SPE_TYPES.stream.has(apiSetting.apiType) &&
      (apiSetting.streamRenderMode || "disabled") !== "disabled"
  );

   
                 
  
                                                    
                                     
   
const normalizeChunkText = (text) => {
  if (Array.isArray(text)) {
    return text[0] || "";
  }

  return text || "";
};

   
                           
  
                                  
                                  
                                      
                                  
   
const normalizeTranslationText = (text, apiType, sourceText) => {
  const normalizedText = normalizeChunkText(text);
  if (apiType === OPT_TRANS_GOOGLE) {
    return normalizedText.replace(/[\t ]*(\r\n|\r|\n)[\t ]*/g, "\n");
  }

  if (API_SPE_TYPES.ai.has(apiType) && /\r\n|\r|\n/.test(sourceText)) {
    return normalizedText.replace(/\\r\\n|\\n|\\r/g, "\n");
  }

  return normalizedText;
};

   
                                  
  
                              
                                        
                                        
                                       
                                                
                                                        
                                                           
                                            
   
export default function TranCont({
  text,
  fromLang,
  toLang,
  apiSlug,
  transApis,
  translateVariants = true,
  simpleStyle = false,
  autoFavWord = false,
  onTranslated,
  translationOperation,
}) {
  const i18n = useI18n();
  const [trText, setTrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [renderReceipt, setRenderReceipt] = useState(null);
  useEffect(() => {
    if (!renderReceipt || loading || error || !trText) return;
    return confirmTranslationPaint(renderReceipt);
  }, [renderReceipt, loading, error, trText]);

                                 
  const apiSetting = useMemo(
    () => transApis.find((api) => api.apiSlug === apiSlug),
    [transApis, apiSlug]
  );

  useEffect(() => {
    if (!text?.trim() || !apiSetting) {
      setTrText("");
      setLoading(false);
      setError("");
      return;
    }

    let active = true;
    const controller = new AbortController();
    const operation =
      translationOperation || createTranslationOperation("selection");
    setRenderReceipt(null);
    const enableStreamRender = canRenderStream(apiSetting);

       
                                   
      
                                    
                                                         
       
    const handleStreamChunk = enableStreamRender
      ? ({ text: chunkText }) => {
                                           
          if (!active || controller.signal.aborted) {
            return;
          }

          const nextText = normalizeTranslationText(
            chunkText,
            apiSetting.apiType,
            text
          );
          if (nextText) {
            setTrText(nextText);
          }
        }
      : undefined;

    (async () => {
      try {
        setLoading(true);
        setTrText("");
        setError("");

        const translate = (requestText) =>
          apiTranslate({
            text: requestText,
            fromLang,
            toLang,
            apiSetting,
            textFormat: "text",
            translateVariants,
            onStreamChunk: handleStreamChunk,
                                                       
            signal: controller.signal,
            translationOperation: operation,
          });
        const {
          trText,
          isSame,
          translationOperation: receipt,
        } = await translate(text);

        if (active) {
          const normalizedText = normalizeTranslationText(
            trText,
            apiSetting.apiType,
            text
          );
          setTrText(isSame ? "" : normalizedText);
          if (!isSame && normalizedText) setRenderReceipt(receipt || null);
                                   
          if (!isSame && trText) {
            onTranslated?.(normalizedText);
          }
                                                      
                                           
          if (trText && !isSame) {
                                            
            if (autoFavWord && isValidWord(text.trim())) {
              addWordToBook({
                word: text.trim(),
                trText: normalizeTranslationText(
                  trText,
                  apiSetting.apiType,
                  text
                ),
                apiName: apiSetting.apiName || apiSetting.apiSlug,
              });
            }
                                                     
          }
        }
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }

        if (active) {
                                                  
          const raw = err?.message || String(err);
          setError(
            raw.includes("Extension context invalidated")
              ? i18n("ext_reloaded_hint", "插件已更新，请刷新本页（F5）后重试")
              : raw
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
                                                 
      controller.abort();
      if (!translationOperation) operation.close();
    };
  }, [
    text,
    fromLang,
    toLang,
    apiSetting,
    translateVariants,
    autoFavWord,
    onTranslated,
    translationOperation,
  ]);

  if (!apiSetting) {
    return null;
  }

  if (simpleStyle) {
                                      
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    return (
      <Box>
        {         }
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontWeight: 600, letterSpacing: 0.5 }}
        >
          {i18n("original_text")}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: "pre-line", mt: 0.25 }}
        >
          {text}
        </Typography>

        <Divider sx={{ my: 1 }} />

        {                      }
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography
            variant="caption"
            color="primary"
            sx={{ fontWeight: 600, letterSpacing: 0.5 }}
          >
            {`${i18n("translated_text")} · ${apiSetting.apiName || apiSlug}`}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.25}>
            {trText ? <CopyBtn text={trText} title={i18n("copy")} /> : null}
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {loading && (
            <CircularProgress
              size={12}
              sx={{ flex: "0 0 auto", mt: "0.35em" }}
            />
          )}
          <Typography sx={{ whiteSpace: "pre-line", fontWeight: 500 }}>
            {trText}
          </Typography>
        </Stack>
      </Box>
    );
  }

                                                    
  return (
    <Box>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {loading && (
            <CircularProgress
              size={12}
              sx={{ flex: "0 0 auto", mt: "0.35em" }}
            />
          )}
          <Typography
            sx={{
              whiteSpace: "pre-line",
              wordBreak: "break-word",
                                              
              fontSize: "1.05rem",
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            {trText}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

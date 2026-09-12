import {
  createTranslationOperation,
  confirmTranslationPaint,
} from "../../libs/translationOperation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { apiDict } from "../../apis";
import { useI18n } from "../../hooks/I18n";
import { useMembership } from "../../hooks/Membership";
import { useAccount } from "../../hooks/Account";
import { getPricingUrl } from "../../libs/account";
import { BrowserTtsBtn } from "./AudioBtn";
import CopyBtn from "./CopyBtn";

const pendingRequests = new Map();

   
                    
  
                                             
                                      
   
function getRequestKey({ text, fromLang, toLang, apiSettingKey, context }) {
  return JSON.stringify({
    text,
    fromLang,
    toLang,
    apiSettingKey,
    context,
  });
}

   
               
  
                                            
                                          
   
export default function AiDictCont({
  text,
  fromLang,
  speechLang,
  toLang,
  apiSetting,
  context = "",
  translationOperation,
}) {
  const i18n = useI18n();
  const { isMember } = useMembership();
  const { account } = useAccount();
  const [markdown, setMarkdown] = useState("");
  const [renderOperation, setRenderOperation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (renderOperation && markdown && !loading && !error)
      return confirmTranslationPaint(renderOperation);
  }, [renderOperation, markdown, loading, error]);

  const apiSettingKey = JSON.stringify(apiSetting || {});

  useEffect(() => {
                            
    if (!isMember) {
      setMarkdown("");
      setLoading(false);
      setError("");
      return;
    }
    if (!text?.trim() || !apiSetting?.apiSlug) {
      setMarkdown("");
      setLoading(false);
      setError("");
      return;
    }

    let active = true;
    const requestKey =
      (account?.userId || account?.accessToken || "guest") +
      ":" +
      getRequestKey({
        text,
        fromLang,
        toLang,
        apiSettingKey,
        context,
      });

    const handleStreamChunk = ({ markdown: chunkMarkdown }) => {
      if (active && chunkMarkdown) {
        setMarkdown(chunkMarkdown);
      }
    };

    (async () => {
      try {
        setLoading(true);
        setMarkdown("");
        setRenderOperation(null);
        setError("");

                                           
        let pending = pendingRequests.get(requestKey);
        if (!pending) {
          pending = {
            subscribers: new Set(),
            promise: null,
            operation:
              translationOperation || createTranslationOperation("dictionary"),
            receipt: null,
          };
          pending.promise = apiDict({
            translationOperation: pending.operation,
            onOperation: (operation) => {
              pending.receipt = operation;
            },
            text,
            fromLang,
            toLang,
            apiSetting,
            context,
            onStreamChunk: (chunk) => {
              pending.subscribers.forEach((subscriber) => subscriber(chunk));
            },
          }).finally(() => {
            pendingRequests.delete(requestKey);
          });
          pendingRequests.set(requestKey, pending);
        }

        pending.subscribers.add(handleStreamChunk);
        const result = await pending.promise;

        if (active) {
          setMarkdown(result);
          setRenderOperation(pending.receipt);
        }
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }

        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      pendingRequests.get(requestKey)?.subscribers.delete(handleStreamChunk);
    };
  }, [
    isMember,
    text,
    fromLang,
    toLang,
    apiSettingKey,
    context,
    account?.accessToken,
    translationOperation,
  ]);                                                   

                                               
  if (!isMember) {
    return (
      <Alert
        severity="info"
        action={
          <Button
            size="small"
            variant="contained"
            sx={{ whiteSpace: "nowrap" }}
            onClick={() =>
              window.open(getPricingUrl(account), "_blank", "noopener")
            }
          >
            {i18n("upgrade_membership", "开通会员")}
          </Button>
        }
      >
        {i18n("ai_dict_pro_hint", "AI 词典释义为会员专属功能")}
      </Alert>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (loading && !markdown) {
    return <CircularProgress size={16} />;
  }

  if (!markdown) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "relative",
        pr: 8,
        "& > :first-of-type": { mt: 0 },
        "& > :last-child": { mb: 0 },
        "& h1, & h2, & h3, & h4, & h5, & h6": {
          fontSize: "1em",
          fontWeight: 700,
          lineHeight: 1.55,
          mt: 1.25,
          mb: 0.75,
        },
        "& p": { my: 1 },
        "& ul, & ol": { pl: 3, my: 1 },
        "& blockquote": {
          m: 0,
          pl: 1.5,
          borderLeft: "3px solid",
          borderColor: "divider",
          color: "text.secondary",
        },
        "& code": {
          px: 0.5,
          py: 0.1,
          borderRadius: 0.5,
          bgcolor: "action.hover",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <BrowserTtsBtn text={text} lang={speechLang || fromLang || "en-US"} />
        <CopyBtn text={markdown} title={i18n("copy")} />
      </Box>
      {loading && <CircularProgress size={12} sx={{ mr: 1 }} />}
      <Typography component="div">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </Typography>
    </Box>
  );
}

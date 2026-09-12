import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import { sendBgMsg, sendTabMsg } from "../../libs/msg";
import Header from "./Header";
import {
  MSG_OPEN_OPTIONS,
  MSG_TRANS_GETRULE,
  STOKEY_SETTING,
  GLOBLA_RULE,
  resolveApiPromptList,
} from "../../config";
import { kissLog } from "../../libs/log";
import PopupCont from "./PopupCont";
import TranForm from "../Selection/TranForm";
import { useSetting } from "../../hooks/Setting";
import { browser } from "../../libs/browser";
import { isAutoTranslateClipboardSupported } from "../../libs/client";
import { readClipboardTextIfAllowed } from "../../libs/clipboard";

   
                                   
   
export function Trantab({ isSeparate = false }) {
  const [text, setText] = useState("");
           
  const { setting } = useSetting();
  const shouldReadClipboardInitially =
    isAutoTranslateClipboardSupported &&
    (setting.autoTranslateClipboard ?? false);
  const [autoTranslateClipboard, setAutoTranslateClipboard] = useState(
    setting.autoTranslateClipboard ?? false
  );
  const [autoFocusInput, setAutoFocusInput] = useState(
    !shouldReadClipboardInitially
  );
  const initialClipboardReadRef = useRef(shouldReadClipboardInitially);
  const readingClipboardRef = useRef(false);
  const lastClipboardTextRef = useRef("");
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    setAutoTranslateClipboard(setting.autoTranslateClipboard ?? false);
  }, [setting.autoTranslateClipboard]);

  useEffect(() => {
    const handleStorageChange = (changes, areaName) => {
      if (areaName !== "local") return;
      const nextSetting = changes?.[STOKEY_SETTING]?.newValue;
      if (nextSetting) {
        setAutoTranslateClipboard(nextSetting.autoTranslateClipboard ?? false);
      }
    };
    browser?.storage?.onChanged?.addListener?.(handleStorageChange);
    return () => {
      browser?.storage?.onChanged?.removeListener?.(handleStorageChange);
    };
  }, []);

  const translateClipboard = useCallback(async () => {
    if (
      !isAutoTranslateClipboardSupported ||
      !autoTranslateClipboard ||
      readingClipboardRef.current
    ) {
      return;
    }

    readingClipboardRef.current = true;
    let hasClipboardText = false;
    try {
      const clipboardText = await readClipboardTextIfAllowed();
      if (clipboardText === null) return;

      const normalizedText = clipboardText.trim();
      hasClipboardText = Boolean(normalizedText);
      if (
        !normalizedText ||
        normalizedText === lastClipboardTextRef.current ||
        normalizedText === textRef.current
      ) {
        lastClipboardTextRef.current = normalizedText;
        return;
      }

      lastClipboardTextRef.current = normalizedText;
      setText(normalizedText);
    } finally {
      if (initialClipboardReadRef.current) {
        initialClipboardReadRef.current = false;
        setAutoFocusInput(!hasClipboardText);
      }
      readingClipboardRef.current = false;
    }
  }, [autoTranslateClipboard]);

  useEffect(() => {
    translateClipboard();
    if (!isSeparate) return;

    window.addEventListener("focus", translateClipboard);
    return () => window.removeEventListener("focus", translateClipboard);
  }, [isSeparate, translateClipboard]);

                                                                                                                                                                                                 
  const {
    tranboxSetting: {
      enDict,
      enSug,
      apiSlugs,
      fromLang,
      toLang,
      toLang2,
      aiDictApiSlug,
      aiDictPromptSlug,
    },
    transApis,
    langDetector,
    prompts,
    translateVariants,
  } = setting;
  const resolvedTransApis = useMemo(
    () => resolveApiPromptList(transApis, prompts),
    [prompts, transApis]
  );

  return (
    <Box sx={{ p: 2 }}>
      {                    }
      <TranForm
        text={text}
        setText={setText}
        apiSlugs={apiSlugs}
        fromLang={fromLang}
        toLang={toLang}
        toLang2={toLang2}
        transApis={resolvedTransApis}
        simpleStyle={false}
        langDetector={langDetector}
        enDict={enDict}
        enSug={enSug}
        aiDictApiSlug={aiDictApiSlug}
        aiDictPromptSlug={aiDictPromptSlug}
        prompts={prompts}
        translateVariants={translateVariants}
        autoFocusInput={autoFocusInput}
        syncExternalTextWhileEditing
      />
    </Box>
  );
}

   
                  
   
export default function Popup() {
                                                   
  const [rule, setRule] = useState({ ...GLOBLA_RULE });
           
  const [setting, setSetting] = useState(null);
                                             
  const [isSeparate, setIsSeparate] = useState(false);
                                     
  const { setting: storedSetting } = useSetting();

                    
  const handleOpenSetting = useCallback(() => {
    sendBgMsg(MSG_OPEN_OPTIONS);
  }, []);

                               
                                                          
                                        
  const queryCurrentTab = useCallback(async () => {
    try {
      const cleanHash = window.location.hash.slice(1);
      if (cleanHash === "tranbox") {
        setIsSeparate(true);
        return;
      }

                                   
      let res;
      for (let i = 0; i < 3 && !res; i++) {
        res = await sendTabMsg(MSG_TRANS_GETRULE);
        if (!res) {
          await new Promise((r) => setTimeout(r, 250));
        }
      }
      if (res && !res.error) {
        setRule(res.rule);
        setSetting(res.setting);
      }
                                            
                                
    } catch (err) {
      kissLog("query rule", err);
    }
  }, []);

                                     
                                 
  useEffect(() => {
    queryCurrentTab();
    const onTabActivated = () => queryCurrentTab();
    const onTabUpdated = (tabId, changeInfo) => {
      if (changeInfo?.status === "complete") queryCurrentTab();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") queryCurrentTab();
    };
    browser?.tabs?.onActivated?.addListener?.(onTabActivated);
    browser?.tabs?.onUpdated?.addListener?.(onTabUpdated);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      browser?.tabs?.onActivated?.removeListener?.(onTabActivated);
      browser?.tabs?.onUpdated?.removeListener?.(onTabUpdated);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queryCurrentTab]);

                        
  if (isSeparate) {
    return (
      <Box>
        <Trantab isSeparate />
      </Box>
    );
  }

  return (
                                           
    <Box
      sx={{
        width: "100%",
        minWidth: 320,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {          }
      <Header />
      {                  }
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        {rule && (
          <PopupCont
            rule={rule}
            setting={setting ?? storedSetting}
            setRule={setRule}
            setSetting={setSetting}
            handleOpenSetting={handleOpenSetting}
          />
        )}
      </Box>
    </Box>
  );
}

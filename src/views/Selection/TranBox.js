import { SettingProvider, useSetting } from "../../hooks/Setting";
import { useMembership } from "../../hooks/Membership";
import { isEngineAvailable, resolveEngineChain } from "../../libs/engineChain";
import ThemeProvider from "../../hooks/Theme";
import DraggableResizable from "./DraggableResizable";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useI18n } from "../../hooks/I18n";
import { useEffect, useMemo, useState } from "react";
import TranForm from "./TranForm.js";
import TranActions from "./TranActions";
import { useTheme, alpha } from "@mui/material/styles";
import Logo from "../../components/Logo";
import { isValidWord } from "../../libs/utils";

   
                
                               
  
                        
                                                               
                                               
                                                        
                                                  
   
function TranBoxHeader({
  setShowBox,
  transApis = [],
  apiSlugs = [],
  onApiChange,
  actions,
  isProActive,
}) {
  const theme = useTheme();
  const i18n = useI18n();

  const iconColor = theme.palette.text.secondary;

                   
  const blurOnLeave = (e) => e.currentTarget.blur();

                      
  const baseBtnStyle = {
    borderRadius: "6px",
    padding: "5px",
    minWidth: "30px",
    minHeight: "30px",
    transition: "all 0.2s ease",
    backgroundColor: "transparent",
    "& svg": {
      color: iconColor,
    },
  };

                                           
  const enabledApis = transApis.filter((api) => !api.isDisabled);
  const currentSlug = enabledApis.some((api) => api.apiSlug === apiSlugs?.[0])
    ? apiSlugs[0]
    : enabledApis[0]?.apiSlug || "";

  return (
    <Box
      onMouseUp={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      sx={{
        backgroundColor: theme.palette.background.default,
        padding: "4px 8px 4px 12px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        minHeight: "auto",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        sx={{
          width: "100%",
          height: "100%",
          minWidth: 0,
        }}
      >
        {                      }
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ minWidth: 0, flex: "1 1 auto", overflow: "hidden" }}
        >
          <Box
            sx={{
              width: 18,
              height: 18,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: theme.shadows[2],
                transform: "translateY(-1px)",
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Logo size={16} />
          </Box>

          <Typography
            variant="caption"
            sx={{
              minWidth: 0,
              fontWeight: 500,
              fontSize: "12px",
              color: theme.palette.text.secondary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {`${process.env.REACT_APP_NAME} v${process.env.REACT_APP_VERSION}`}
          </Typography>
        </Stack>

        {                                   }
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ flexShrink: 0 }}
        >
          {                               }
          {actions}

          {                            }
          {isProActive ? (
            <TextField
              select
              size="small"
              value={currentSlug}
              onChange={(e) => onApiChange?.([e.target.value])}
              SelectProps={{ MenuProps: { disablePortal: true } }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              sx={{
                minWidth: 92,
                maxWidth: 150,
                "& .MuiInputBase-root": {
                  height: 26,
                  fontSize: 12,
                  borderRadius: "8px",
                  backgroundColor: theme.palette.background.paper,
                },
                "& .MuiSelect-select": {
                  py: "3px",
                  px: "8px",
                  pr: "22px !important",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.divider,
                },
              }}
            >
              {enabledApis.map((api) => (
                <MenuItem
                  key={api.apiSlug}
                  value={api.apiSlug}
                  sx={{ fontSize: 13 }}
                >
                  {api.apiName || api.apiSlug}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Chip
              size="small"
              label={i18n("engine_auto", "自动")}
              color="primary"
              variant="outlined"
            />
          )}

          {           }
          <IconButton
            size="small"
            title={i18n("close")}
            onMouseLeave={blurOnLeave}
            onClick={() => setShowBox(false)}
            sx={{
              ...baseBtnStyle,
              "&:hover": {
                backgroundColor: theme.palette.error.light + "20",
                transform: "scale(1.05)",
                boxShadow: theme.shadows[2],
                "& svg": { color: theme.palette.error.main },
              },
              "&:active": {
                transform: "scale(0.95)",
                backgroundColor: theme.palette.error.light + "40",
              },
            }}
          >
            <CloseIcon sx={{ width: 16, height: 16 }} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}

   
                     
   
function TranBoxContent({
  simpleStyle,
  text,
  setText,
  apiSlugs,
  fromLang,
  toLang,
  toLang2,
  transApis,
  langDetector,
  translateVariants,
  enDict,
  enSug,
  aiDictApiSlug,
  aiDictPromptSlug,
  autoFavWord,
  onTranslated,
  prompts,
  selectionContext,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const scrollbarTrackColor =
    theme.palette.mode === "dark" ? "#1f1f23" : theme.palette.background.paper;
  const scrollbarThumbColor =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.text.primary, 0.28)
      : alpha(theme.palette.text.primary, 0.24);

  return (
    <Box
      sx={{
        p: simpleStyle ? 1 : 2,
        backgroundColor: theme.palette.background.paper,

        "&::-webkit-scrollbar": {
          width: 10,
          height: 10,
        },
        "&::-webkit-scrollbar-track": {
          background: scrollbarTrackColor,
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: scrollbarThumbColor,
          borderRadius: 8,
          border: `2px solid ${theme.palette.background.paper}`,
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: alpha(theme.palette.text.primary, 0.36),
        },
                  
        scrollbarWidth: "thin",
        scrollbarColor: `${scrollbarThumbColor} ${scrollbarTrackColor}`,

        color: isDark
          ? "rgba(255,255,255,0.82)"                     
          : theme.palette.text.primary,

        lineHeight: 1.55,
      }}
    >
      {                                  }
      <TranForm
        text={text}
        setText={setText}
        apiSlugs={apiSlugs}
        fromLang={fromLang}
        toLang={toLang}
        toLang2={toLang2}
        transApis={transApis}
        prompts={prompts}
        simpleStyle={simpleStyle}
        hideConfigBar
        readonlyText
        langDetector={langDetector}
        translateVariants={translateVariants}
        enDict={enDict}
        enSug={enSug}
        aiDictApiSlug={aiDictApiSlug}
        aiDictPromptSlug={aiDictPromptSlug}
        autoFavWord={autoFavWord}
        onTranslated={onTranslated}
        selectionContext={selectionContext}
      />
    </Box>
  );
}

   
                              
   
function TranBoxPanel(props) {
  const { setting, updateSetting } = useSetting();
  const { isProActive } = useMembership();
  const simpleStyle = props.simpleStyle;
                                             
  const hasText =
    typeof props.text === "string" && props.text.trim().length > 0;

  const enabledApis = useMemo(
    () =>
      (props.transApis || []).filter((api) =>
        isEngineAvailable(api, isProActive)
      ),
    [props.transApis, isProActive]
  );
  const selectedSlugs =
    setting?.tranboxSetting?.apiSlugs || props.tranboxSetting.apiSlugs;
  const apiSlugs = useMemo(
    () =>
      resolveEngineChain({
        apis: enabledApis,
        saved: selectedSlugs,
        isProActive,
        automatic: !isProActive,
      }).slice(0, 1),
    [enabledApis, selectedSlugs, isProActive]
  );
                                            
  const [trText, setTrText] = useState("");

                               
  useEffect(() => {
    setTrText("");
  }, [props.text, apiSlugs[0]]);

  const handleApiSlugsChange = (slugs) => {
    if (!isProActive) return;
    updateSetting((prev) => ({
      ...prev,
      tranboxSetting: { ...prev.tranboxSetting, apiSlugs: slugs },
      engineChain: [
        ...slugs,
        ...(prev.engineChain || enabledApis.map((api) => api.apiSlug)).filter(
          (slug) => !slugs.includes(slug)
        ),
      ],
    }));
  };

  let realApiSlugs = apiSlugs;
                                                  
  if (props.tranboxSetting.singleWordNoTrans && isValidWord(props.text)) {
                             
    realApiSlugs = [];
  }

                         
  const currentApiSlug = apiSlugs?.[0];
  const currentApi = (props.transApis || []).find(
    (api) => api.apiSlug === currentApiSlug
  );
  const currentApiName = currentApi?.apiName || currentApiSlug || "";

  return (
    <>
      {props.showBox && hasText && (
                                      
        <DraggableResizable
          position={props.boxPosition}
          anchor={props.boxAnchor}
          size={props.boxSize}
          setSize={props.setBoxSize}
          setPosition={props.setBoxPosition}
                                                            
          autoHeight={true}
          header={
            <TranBoxHeader
              setShowBox={props.setShowBox}
              transApis={enabledApis}
              isProActive={isProActive}
              apiSlugs={apiSlugs}
              onApiChange={handleApiSlugsChange}
              actions={
                <TranActions
                  text={props.text}
                  trText={trText}
                  fromLang={props.tranboxSetting.fromLang}
                  toLang={props.tranboxSetting.toLang}
                  apiName={currentApiName}
                />
              }
            />
          }
          onClick={(e) => e.stopPropagation()}
          sx={{
            "@keyframes tranboxDropIn": {
              from: {
                opacity: 0,
                transform: "translateY(-14px) scale(0.96)",
              },
              to: {
                opacity: 1,
                transform: "translateY(0) scale(1)",
              },
            },
            animation: "tranboxDropIn 0.6s cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          <TranBoxContent
            simpleStyle={simpleStyle}
            text={props.text}
            setText={props.setText}
            apiSlugs={realApiSlugs}
            fromLang={props.tranboxSetting.fromLang}
            toLang={props.tranboxSetting.toLang}
            toLang2={props.tranboxSetting.toLang2}
            transApis={enabledApis}
            prompts={props.prompts}
            langDetector={props.langDetector}
            translateVariants={props.translateVariants}
            enDict={props.tranboxSetting.enDict}
            enSug={props.tranboxSetting.enSug}
            aiDictApiSlug={props.tranboxSetting.aiDictApiSlug}
            aiDictPromptSlug={props.tranboxSetting.aiDictPromptSlug}
            autoFavWord={props.tranboxSetting.autoFavWord}
            onTranslated={setTrText}
            selectionContext={props.selectionContext}
          />
        </DraggableResizable>
      )}
    </>
  );
}

export default function TranBox(props) {
  return (
    <SettingProvider context="tranbox">
      <ThemeProvider styles={props.extStyles}>
        <TranBoxPanel {...props} />
      </ThemeProvider>
    </SettingProvider>
  );
}

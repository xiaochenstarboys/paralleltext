import { useState, useEffect, useMemo } from "react";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import GTranslateIcon from "@mui/icons-material/GTranslate";
import {
  ParallelColumnsIcon,
  SelectTextIcon,
  DragMoveIcon,
  ReadBookIcon,
  TagsOutlineIcon,
} from "../../components/MainFeatureIcons";
import HistoryIcon from "../../components/HistoryActionIcon";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FavRatingStars from "./FavRatingStars";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { sendBgMsg, sendTabMsg } from "../../libs/msg";
import { mergeChainOrder, resolveEngineChain } from "../../libs/engineChain";
import {
  canDeselectEngine,
  isConfiguredEngine,
} from "../../libs/engineSettings";
import EngineChainList from "./EngineChainList";
import ProBenefitsDialog from "./ProBenefitsDialog";
import PopupAdSlots from "./PopupAdSlots";
import ReferralDialog from "./ReferralDialog";
import { useI18n } from "../../hooks/I18n";
import {
  MSG_TRANS_TOGGLE,
  MSG_TRANS_PUTRULE,
  MSG_TRANSBOX_TOGGLE,
  MSG_FAB_TOGGLE,
  MSG_OPEN_OPTIONS,
  OPT_TRANS_PREMIUM,
  OPT_LANGS_FROM,
  OPT_LANGS_TO,
} from "../../config";
import { GOOGLE_STYLE } from "../../config/brand";
import { useMembership } from "../../hooks/Membership";
import { useApiList } from "../../hooks/Api";
import { useAccount } from "../../hooks/Account";
import { getPricingUrl, pullWebAccountFromActiveTab } from "../../libs/account";
import LoginDrawer from "./LoginDrawer";
import AccountDrawer from "./AccountDrawer";
import HistoryDrawer from "./HistoryDrawer";
import WordBookDrawer from "./WordBookDrawer";
import ReadingReportDrawer from "./ReadingReportDrawer";
import WordCloudOverlay from "./WordCloudOverlay";
import { getTransHistoryPage } from "../../libs/transHistory";
import { getTopWords, extractWordFreq } from "../../libs/wordFreq";
import { getDueWords } from "../../libs/memoryCurve";
import LanguageSelect, { CompactSelect } from "./LanguageSelect";
import { getWordBookPage } from "../../libs/wordBook";
import { upsertRule } from "../../libs/storage";
import { kissLog } from "../../libs/log";
import { useSetting } from "../../hooks/Setting";
import { useFab } from "../../hooks/Fab";
import { usePageFavorite } from "../../hooks/PageFavorite";
import { useDataSyncReload } from "../../hooks/useDataSync";
import TranslationQuotaSummary from "../../components/TranslationQuotaSummary";
import { useAllTextStyles } from "../../hooks/CustomStyles";

                                          
const MOTION_DECELERATE = "cubic-bezier(0.2, 0, 0, 1)";
const MOTION_STANDARD = "cubic-bezier(0.3, 0, 0.8, 0.15)";

                                           
const cardEnterSx = (index = 0) => ({
  "@keyframes popupCardIn": {
    from: { opacity: 0, transform: "translateY(10px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  animation: `popupCardIn 250ms ${MOTION_DECELERATE} both`,
  animationDelay: `${index * 60}ms`,
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

                                         
const iconCircleSx = (active) => (theme) => {
  const dark = theme.palette.mode === "dark";
  return {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    bgcolor: active
      ? dark
        ? GOOGLE_STYLE.darkBlueTint
        : GOOGLE_STYLE.blueTint
      : dark
        ? "rgba(255,255,255,0.06)"
        : "rgba(60,64,67,0.06)",
    color: active ? (dark ? "#A8C7FA" : GOOGLE_STYLE.blue) : "text.secondary",
    transition: `background-color 200ms ${MOTION_STANDARD}, color 200ms ${MOTION_STANDARD}`,
  };
};

                                   
const statusPillSx = (on) => (theme) => {
  const dark = theme.palette.mode === "dark";
  return {
    height: 22,
    fontSize: 12,
    fontWeight: on ? 600 : 400,
    bgcolor: on
      ? dark
        ? GOOGLE_STYLE.darkBlueTint
        : GOOGLE_STYLE.blueTint
      : "transparent",
    color: on ? (dark ? "#A8C7FA" : GOOGLE_STYLE.blue) : "text.secondary",
    transition: `background-color 200ms ${MOTION_STANDARD}, color 200ms ${MOTION_STANDARD}`,
    "& .MuiChip-label": { px: 1 },
  };
};

                             
function ExpandChevron({ open }) {
  return (
    <ExpandMoreIcon
      color="action"
      fontSize="small"
      sx={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: `transform 200ms ${MOTION_DECELERATE}`,
      }}
    />
  );
}

   
                                           
                      
   
function FeatureCard({ label, index = 0, children }) {
  return (
    <Box
      sx={[
        (theme) => {
          const dark = theme.palette.mode === "dark";
          return {
            bgcolor: dark ? GOOGLE_STYLE.darkCardBg : GOOGLE_STYLE.cardBg,
            borderRadius: GOOGLE_STYLE.cardRadius,
            border: "1px solid",
            borderColor: dark
              ? "rgba(255,255,255,0.08)"
              : "rgba(26,115,232,0.10)",
            overflow: "hidden",
          };
        },
        cardEnterSx(index),
      ]}
    >
      {label && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.secondary",
            fontWeight: 600,
            letterSpacing: 1,
            px: 1.25,
            pt: 1,
            pb: 0.15,
          }}
        >
          {label}
        </Typography>
      )}
      {children}
    </Box>
  );
}

                                
function RowDivider() {
  return <Divider sx={{ ml: 6.25 }} />;
}

   
                                     
   
function FeatureRow({
  icon,
  active = false,
  title,
  subtitle,
  status,
  statusOn = false,
  onClick,
  chevron = false,
}) {
  return (
    <Box
      onClick={onClick}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.58,
        cursor: onClick ? "pointer" : "default",
        bgcolor: active
          ? theme.palette.mode === "dark"
            ? "rgba(168,199,250,0.08)"
            : "rgba(26,115,232,0.04)"
          : "transparent",
        transition: `background-color 150ms ${MOTION_STANDARD}, transform 100ms ${MOTION_STANDARD}`,
        "&:hover": onClick
          ? {
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(26,115,232,0.05)",
            }
          : {},
                                 
        "&:active": {
          transform: "scale(0.98)",
        },
      })}
    >
      <Box sx={[iconCircleSx(active), { width: 32, height: 32 }]}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: active ? 600 : 500,
            lineHeight: 1.3,
            color: active ? "primary.main" : "text.primary",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.2, fontSize: 11.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {status && (
        <Chip
          size="small"
          label={status}
          sx={[statusPillSx(statusOn), { height: 20 }]}
        />
      )}
      {chevron}
    </Box>
  );
}

   
                                           
  
                        
                                                                
                                                                   
                                                             
                                                              
                                                                                   
   
export default function PopupCont({
  rule,
  setting: initialSetting,
  setRule,
  processActions,
}) {
  const i18n = useI18n();
                                   
  const { setting: storedSetting, updateSetting } = useSetting();
  const setting = storedSetting ?? initialSetting;
                    
  const { fab, updateFab } = useFab();
  const fabEnabled = !(fab?.isHide ?? false);
                                 
                  
  const [engineOpen, setEngineOpen] = useState(false);
                     
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [wordsDrawerOpen, setWordsDrawerOpen] = useState(false);
               
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);
                                        
  const [topWords, setTopWords] = useState([]);
  const [wordFreqAll, setWordFreqAll] = useState([]);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [dueWords, setDueWords] = useState([]);

                                           
                                             
  const TOP_WORD_COLORS = ["#1A73E8", "#2E9E6B", "#E65100"];
  const topWordsNode =
    topWords.length > 0 ? (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          gap: 0.5,
          flexWrap: "nowrap",
          overflow: "hidden",
          maxWidth: "100%",
          mt: 0.4,
        }}
      >
        {topWords.map(([w, c], i) => {
          const color = TOP_WORD_COLORS[i % TOP_WORD_COLORS.length];
          return (
            <Box
              component="span"
              key={w}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                px: 0.8,
                py: 0.15,
                borderRadius: "8px",
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.6,
                color,
                bgcolor: `${color}1A`,
                border: `1px solid ${color}40`,
              }}
            >
              {w}
              <Box
                component="span"
                sx={{ fontSize: 10, opacity: 0.7, fontWeight: 500 }}
              >
                ×{c}
              </Box>
            </Box>
          );
        })}
      </Box>
    ) : null;
                        
  const [wordTotal, setWordTotal] = useState(0);
                      
  const [favPaywallOpen, setFavPaywallOpen] = useState(false);
  const [proBenefitsOpen, setProBenefitsOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [resumeReferral, setResumeReferral] = useState(false);
            
  const [loginOpen, setLoginOpen] = useState(false);
           
  const [accountOpen, setAccountOpen] = useState(false);
                
  const { allTextStyles } = useAllTextStyles();

  const { transOpen, apiSlug, fromLang, toLang, textStyle } = rule || {};
  const translateEnabled = transOpen === "true";
  const tranboxEnabled = setting?.tranboxSetting?.transOpen;

                                        
  const dispatchAction = async (action, args) => {
    if (!processActions) {
      await sendTabMsg(action, args);
    } else {
      processActions(args ? { action, args } : { action });
    }
  };

                                         
  const handleTransToggle = async () => {
    try {
      const next = !translateEnabled;
      setRule({ ...rule, transOpen: next ? "true" : "false" });
      await upsertRule(rule.pattern, { transOpen: next ? "true" : "false" });
      await dispatchAction(MSG_TRANS_TOGGLE);
    } catch (err) {
      kissLog("toggle trans", err);
    }
  };

                                  
  const handleTransboxToggle = async () => {
    try {
      const next = !tranboxEnabled;
      updateSetting((pre) => ({
        ...pre,
        tranboxSetting: { ...(pre?.tranboxSetting || {}), transOpen: next },
      }));
      await dispatchAction(MSG_TRANSBOX_TOGGLE, { transOpen: next });
    } catch (err) {
      kissLog("toggle transbox", err);
    }
  };

                                   
  const handleFabToggle = async () => {
    try {
      const next = !fabEnabled;
      await updateFab({ isHide: !next });
      await dispatchAction(MSG_FAB_TOGGLE, { isHide: !next });
    } catch (err) {
      kissLog("toggle fab", err);
    }
  };

                                            
  const updateRuleField = async (name, value) => {
    try {
      setRule((pre) => ({ ...pre, [name]: value }));
      await upsertRule(rule.pattern, { [name]: value });
      await dispatchAction(MSG_TRANS_PUTRULE, { [name]: value });
    } catch (err) {
      kissLog("update rule", err);
    }
  };

                                          
  const updateRuleFields = async (fields) => {
    try {
      setRule((pre) => ({ ...pre, ...fields }));
      await upsertRule(rule.pattern, fields);
      await dispatchAction(MSG_TRANS_PUTRULE, fields);
    } catch (err) {
      kissLog("update rule fields", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateRuleField(name, value);
  };

                                                    
                                            
                                                  
  const handleLangChange = (e) => {
    const { name, value } = e.target;
    if (name === "fromLang" && value !== "auto" && value === toLang) {
      const fallback =
        fromLang === "auto" ? (value === "en" ? "zh-CN" : "en") : fromLang;
      updateRuleFields({ fromLang: value, toLang: fallback });
      return;
    }
    if (name === "toLang" && fromLang !== "auto" && value === fromLang) {
      updateRuleFields({ fromLang: toLang, toLang: value });
      return;
    }
    updateRuleField(name, value);
  };

                                       
  const handleSwapLangs = () => {
    if (fromLang === "auto" || !fromLang || !toLang) return;
    updateRuleFields({ fromLang: toLang, toLang: fromLang });
  };

                                    
  const setEngineChain = (next) => {
    if (!next.length) return;
    const primary = resolveEngineChain({
      apis: setting?.transApis || [],
      saved: next,
      isProActive,
      primarySlug: apiSlug,
    })[0];
    updateSetting((prev) => ({
      ...prev,
      engineChain: mergeChainOrder(prev.engineChain || engineOrder, next),
    }));
    if (primary && primary !== apiSlug) updateRuleField("apiSlug", primary);
  };

  const toggleChainEngine = (api) => {
    const locked =
      OPT_TRANS_PREMIUM.has(api.apiType) && !api.custom && !isProActive;
    if (locked) {
      if (!isMember) {
        setProBenefitsOpen(true);
        return;
      }
      setProEnabled(true);
    }
    updateSetting((prev) => {
      const current = prev.transApis?.find(
        (item) => item.apiSlug === api.apiSlug
      );
      if (
        !isConfiguredEngine(current) ||
        (!current.chainDisabled &&
          !canDeselectEngine(prev.transApis, current.apiSlug))
      )
        return prev;
      return {
        ...prev,
                                       
        engineChain: Array.isArray(prev.engineChain)
          ? prev.engineChain
          : engineOrder,
        transApis: prev.transApis.map((item) =>
          item.apiSlug === api.apiSlug
            ? { ...item, chainDisabled: !current.chainDisabled }
            : item
        ),
      };
    });
  };

                          
  const reloadWords = async () => {
    const { total } = await getWordBookPage({
      pageNo: 1,
      pageSize: 1,
      mastered: false,
    });
    setWordTotal(total);
  };

                                            
  const reloadWordFreq = async () => {
    try {
      const { list } = await getTransHistoryPage({ pageNo: 1, pageSize: 50 });
      const texts = (list || []).map((h) => h.text);
      setTopWords(getTopWords(texts, 3));
      setWordFreqAll([...extractWordFreq(texts).entries()]);
    } catch {
      setTopWords([]);
      setWordFreqAll([]);
    }
  };

                                         
  const reloadDueWords = async () => {
    try {
      const { list } = await getWordBookPage({
        pageNo: 1,
        pageSize: 100,
        mastered: false,
      });
      setDueWords(getDueWords(list, Date.now(), 5));
    } catch {
      setDueWords([]);
    }
  };

                                                  
  const {
    member,
    isMember,
    proEnabled,
    setProEnabled,
    isProActive,
    reload: reloadMembership,
  } = useMembership();
                                    
  useApiList();                        
                                     
  const proSwitchOn = isMember ? proEnabled : false;
                      
  const {
    account,
    isLoggedIn,
    syncMembership,
    reload: reloadAccount,
  } = useAccount();
                                     
  const [trialEligibleAccount, setTrialEligibleAccount] = useState(null);
  const showWelcomeTrial = Boolean(
    isLoggedIn &&
      !isMember &&
      account?.accessToken &&
      trialEligibleAccount === account.accessToken
  );
                                         
                                
  useEffect(() => {
    let cancelled = false;
    let syncSequence = 0;
    setTrialEligibleAccount(null);
    const sync = () => {
      if (account?.accessToken) {
        const sequence = ++syncSequence;
        Promise.resolve(syncMembership())
          .then((next) => {
            if (!cancelled && sequence === syncSequence)
              setTrialEligibleAccount(
                next?.welcomeEligible === true ? account.accessToken : null
              );
          })
          .catch((err) => {
            if (!cancelled && sequence === syncSequence)
              setTrialEligibleAccount(null);
            kissLog("sync membership", err);
          });
      }
    };
    sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
                                                           
  }, [account?.accessToken]);

  useEffect(() => {
    if (isLoggedIn) return;
    setAccountOpen(false);
    setHistoryDrawerOpen(false);
    setWordsDrawerOpen(false);
    setReportDrawerOpen(false);
    setCloudOpen(false);
    setReferralOpen(false);
    setFavPaywallOpen(false);
  }, [isLoggedIn]);

                                        
                                    
                                    
  useEffect(() => {
    if (isLoggedIn) return;
    const pull = () => {
      Promise.resolve(pullWebAccountFromActiveTab()).catch((err) =>
        kissLog("pull web account", err)
      );
    };
    pull();
    const onVisible = () => {
      if (document.visibilityState === "visible") pull();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isLoggedIn]);

                                               
                                    
  const {
    favItem,
    favOpen,
    favLoading,
    favError,
    handleRate,
    newTag,
    setNewTag,
    handleFavClick,
    updateFavTags,
    handleAddTag,
  } = usePageFavorite({
    isLoggedIn,
    rule,
    setting,
    apiSlug,
    onNeedLogin: () => setLoginOpen(true),
                               
    favTrialExhausted: !isMember && member?.favoriteTrialLeft === 0,
    onTrialExhausted: () => setFavPaywallOpen(true),
  });

                                 
  useEffect(() => {
    if (!isLoggedIn) {
      setWordTotal(0);
      setTopWords([]);
      setWordFreqAll([]);
      setDueWords([]);
      return;
    }
    reloadWords().catch(() => {});
    reloadWordFreq();
    reloadDueWords();
                                                           
  }, [isLoggedIn]);

                                   
  useDataSyncReload(() => {
    if (!isLoggedIn) return;
    reloadWords().catch(() => {});
    reloadWordFreq();
    reloadDueWords();
  });
                                              
                                           
  useEffect(() => {
    if (fromLang && toLang && fromLang !== "auto" && fromLang === toLang) {
      updateRuleFields({ toLang: fromLang === "en" ? "zh-CN" : "en" });
    }
                                                           
  }, [fromLang, toLang]);

  const groupedApis = useMemo(() => {
    const all = (setting?.transApis || [])
      .filter(isConfiguredEngine)
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const apis = all;
    return {
                                     
      free: apis.filter(
        (api) => !api.custom && !OPT_TRANS_PREMIUM.has(api.apiType)
      ),
                                     
      pro: apis.filter(
        (api) => OPT_TRANS_PREMIUM.has(api.apiType) && !api.custom
      ),
                                
      custom: apis.filter((api) => api.custom),
    };
  }, [setting?.transApis]);

                                    
                                         
  const selectableApis = useMemo(
    () => [...groupedApis.free, ...groupedApis.pro, ...groupedApis.custom],
    [groupedApis]
  );
  const engineChain = useMemo(
    () =>
      resolveEngineChain({
        apis: selectableApis,
        saved: isProActive ? setting?.engineChain : null,
        isProActive,
        primarySlug: apiSlug,
        automatic: !isProActive,
      }),
    [selectableApis, setting?.engineChain, isProActive, apiSlug]
  );
  const engineOrder = useMemo(() => {
    const known = new Set(selectableApis.map((api) => api.apiSlug));
    return [
      ...new Set([
        ...(Array.isArray(setting?.engineChain)
          ? setting.engineChain
          : engineChain),
        ...known,
      ]),
    ].filter((slug) => known.has(slug));
  }, [selectableApis, setting?.engineChain, engineChain]);
                 
  const currentApiName = useMemo(() => {
    if (
      !isProActive &&
      !setting?.transApis?.some(
        (api) => api.custom && api.apiSlug === engineChain[0]
      )
    )
      return i18n("engine_auto", "自动");
    const apis = setting?.transApis || [];
    const current = apis.find((api) => api.apiSlug === engineChain[0]);
    return current?.apiName || apiSlug || "";
  }, [setting?.transApis, apiSlug, engineChain, isProActive, i18n]);

  return (
    <Stack
      spacing={0.75}
      sx={(theme) => ({
        position: "relative",                                   
        bgcolor:
          theme.palette.mode === "dark"
            ? GOOGLE_STYLE.darkPageBg
            : GOOGLE_STYLE.pageBg,
        px: 1.25,
        py: 1.25,
      })}
    >
      {                                             }
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 0.5,
          py: 0.5,
          ...cardEnterSx(0),
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          onClick={() =>
            isLoggedIn ? setAccountOpen(true) : setLoginOpen(true)
          }
          sx={(theme) => ({
            cursor: "pointer",
            minWidth: 0,
            borderRadius: "10px",
            px: 0.75,
            py: 0.25,
            ml: -0.75,
            transition: `background-color 150ms ${MOTION_STANDARD}, transform 100ms ${MOTION_STANDARD}`,
            "&:hover": {
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(26,115,232,0.05)",
            },
            "&:active": { transform: "scale(0.97)" },
          })}
        >
          <Box sx={iconCircleSx(isLoggedIn)}>
            <AccountCircleIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
            {isLoggedIn
              ? account?.email || account?.mobile
              : i18n("login", "登录")}
          </Typography>
        </Stack>
        {isMember ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ flexShrink: 0 }}
          >
            <Typography
              sx={{
                fontSize: 12,
                color: proSwitchOn ? "primary.main" : "text.secondary",
              }}
            >
              {i18n("pro_mode", "Pro 模式")}
            </Typography>
            <Switch
              size="small"
              checked={proSwitchOn}
              onChange={(event) => setProEnabled(event.target.checked)}
              inputProps={{ "aria-label": i18n("pro_mode", "Pro 模式") }}
            />
          </Stack>
        ) : (
          <Button
            size="small"
            onClick={() => setProBenefitsOpen(true)}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            sx={{ flexShrink: 0, borderRadius: "10px", fontSize: 12, px: 1 }}
          >
            {i18n("learn_about_pro", "了解 Pro")}
          </Button>
        )}
      </Box>
      <TranslationQuotaSummary account={account} member={member} />
      <ProBenefitsDialog
        open={proBenefitsOpen}
        onClose={() => setProBenefitsOpen(false)}
        onViewPlans={() => {
          setProBenefitsOpen(false);
          window.open(getPricingUrl(account), "_blank", "noopener");
        }}
      />
      {                                }
      <Dialog
        open={favPaywallOpen}
        onClose={() => setFavPaywallOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          {i18n("fav_paywall_title", "想继续收藏好内容？")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            {i18n(
              "fav_paywall_body",
              "你已用完 30 次免费收藏。已有收藏仍可随时查看；Pro 支持继续收藏新资料，按标签整理。"
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => {
              setFavPaywallOpen(false);
              sendBgMsg(MSG_OPEN_OPTIONS, { hash: "#/favorites" });
            }}
          >
            {i18n("fav_view_records", "查看记录")}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              setFavPaywallOpen(false);
              window.open(getPricingUrl(account), "_blank", "noopener");
            }}
          >
            {i18n("view_pro_plans", "查看 Pro 方案")}
          </Button>
        </DialogActions>
      </Dialog>

      <LoginDrawer
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          setResumeReferral(false);
        }}
        onSuccess={() => {
          reloadAccount();
          reloadMembership();
          if (resumeReferral) {
            setResumeReferral(false);
            setReferralOpen(true);
          }
        }}
      />
      {isLoggedIn && referralOpen && (
        <ReferralDialog
          onClose={() => setReferralOpen(false)}
          onLogin={() => {
            setReferralOpen(false);
            setResumeReferral(true);
            setLoginOpen(true);
          }}
        />
      )}
      <AccountDrawer
        open={isLoggedIn && accountOpen}
        onClose={() => setAccountOpen(false)}
      />
      {                    }
      <HistoryDrawer
        open={isLoggedIn && historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
      />
      <WordBookDrawer
        open={isLoggedIn && wordsDrawerOpen}
        onClose={() => setWordsDrawerOpen(false)}
      />
      {              }
      <ReadingReportDrawer
        open={isLoggedIn && reportDrawerOpen}
        onClose={() => setReportDrawerOpen(false)}
      />
      {                                    }
      {isLoggedIn && cloudOpen && (
        <WordCloudOverlay
          words={wordFreqAll}
          onClose={() => setCloudOpen(false)}
        />
      )}

      {                                }
      <FeatureCard index={1}>
        <FeatureRow
          icon={<GTranslateIcon fontSize="small" />}
          active
          title={i18n("translate_engine")}
          status={currentApiName}
          statusOn
          chevron={<ExpandChevron open={engineOpen} />}
          onClick={() => setEngineOpen((pre) => !pre)}
        />
        <Collapse in={!isProActive && engineOpen} timeout="auto" unmountOnExit>
          <Box sx={{ px: 1.5, pb: 1.25 }}>
            <Select
              size="small"
              fullWidth
              value={
                selectableApis.some(
                  (api) =>
                    api.custom &&
                    !api.isDisabled &&
                    !api.chainDisabled &&
                    api.apiSlug === engineChain[0]
                )
                  ? engineChain[0]
                  : "auto"
              }
              inputProps={{
                "aria-label": i18n("basic_engine_choice", "基础翻译引擎"),
              }}
              onChange={(event) =>
                updateRuleField(
                  "apiSlug",
                  event.target.value === "auto"
                    ? resolveEngineChain({
                        apis: selectableApis,
                        automatic: true,
                      })[0]
                    : event.target.value
                )
              }
            >
              <MenuItem value="auto">
                {i18n("builtin_auto_engine", "内置引擎 · 自动")}
              </MenuItem>
              {selectableApis
                .filter(
                  (api) => api.custom && !api.isDisabled && !api.chainDisabled
                )
                .map((api) => (
                  <MenuItem key={api.apiSlug} value={api.apiSlug}>
                    {api.apiName || api.apiSlug}
                  </MenuItem>
                ))}
            </Select>
            <Typography variant="caption" color="text.secondary">
              {i18n(
                "basic_byok_hint",
                "自带 Key 可用于基础翻译；高级排序属于 Pro。"
              )}
            </Typography>
            <Button
              size="small"
              onClick={() => sendBgMsg(MSG_OPEN_OPTIONS, { hash: "#/engines" })}
            >
              {i18n("custom_engine_section", "自定义引擎")}
            </Button>
          </Box>
        </Collapse>
        <Collapse in={isProActive && engineOpen} timeout="auto" unmountOnExit>
          <Box>
            <RowDivider />
            <Box sx={{ py: 0.5 }}>
              <EngineChainList
                apis={selectableApis}
                chain={engineChain}
                order={engineOrder}
                isProActive={isProActive}
                onChange={setEngineChain}
                onToggle={toggleChainEngine}
              />
            </Box>
          </Box>
        </Collapse>
      </FeatureCard>

      {                                       }
      <FeatureCard index={2} label={i18n("main_features")}>
        {                                   
                                             }
        <FeatureRow
          icon={<ParallelColumnsIcon fontSize="small" />}
          active={translateEnabled}
          title={i18n("immersive_translate")}
          status={translateEnabled ? i18n("status_on") : i18n("status_off")}
          statusOn={translateEnabled}
          onClick={handleTransToggle}
        />
        <RowDivider />

        {            }
        <FeatureRow
          icon={<SelectTextIcon fontSize="small" />}
          active={tranboxEnabled}
          title={i18n("selection_translate")}
          status={tranboxEnabled ? i18n("status_on") : i18n("status_off")}
          statusOn={tranboxEnabled}
          onClick={handleTransboxToggle}
        />
        <RowDivider />

        {           }
        <FeatureRow
          icon={<DragMoveIcon fontSize="small" />}
          active={fabEnabled}
          title={i18n("fab_button")}
          status={fabEnabled ? i18n("status_on") : i18n("status_off")}
          statusOn={fabEnabled}
          onClick={handleFabToggle}
        />
        <RowDivider />

        {                            
                                                    }
        <FeatureRow
          icon={<HistoryIcon fontSize="small" />}
          title={i18n("history_title")}
          subtitle={
            !isLoggedIn
              ? i18n("history_login_hint", "登录后查看翻译历史")
              : topWordsNode || undefined
          }
          chevron={
            isLoggedIn && topWords.length > 0 ? (
              <IconButton
                size="small"
                aria-label={i18n("wordcloud_open", "打开高频词云")}
                title={i18n("wordcloud_open", "打开高频词云")}
                onClick={(e) => {
                  e.stopPropagation();              
                  setCloudOpen(true);
                }}
                sx={{ color: "text.secondary" }}
              >
                <BubbleChartIcon sx={{ fontSize: 17 }} />
              </IconButton>
            ) : undefined
          }
          onClick={
            isLoggedIn
              ? () => setHistoryDrawerOpen(true)
              : () => setLoginOpen(true)
          }
        />
        <RowDivider />

        {                           
                                     }
        <FeatureRow
          icon={<ReadBookIcon fontSize="small" />}
          title={i18n("word_book")}
          subtitle={
            !isLoggedIn
              ? i18n("wordbook_login_hint", "登录后使用生词本")
              : dueWords.length > 0
                ? `${i18n("review_due_prefix", "待复习")}: ${dueWords
                    .map((w) => w.word)
                    .join(" · ")}`
                : i18n("word_book_hint")
          }
          status={
            isLoggedIn
              ? dueWords.length > 0
                ? `${dueWords.length}${i18n("due_suffix", " 到期")}`
                : wordTotal
                  ? String(wordTotal)
                  : undefined
              : undefined
          }
          statusOn={isLoggedIn && (dueWords.length > 0 || Boolean(wordTotal))}
          onClick={
            isLoggedIn
              ? () => setWordsDrawerOpen(true)
              : () => setLoginOpen(true)
          }
        />
        <RowDivider />

        {                                          
                                                        }
        <FeatureRow
          icon={<TagsOutlineIcon fontSize="small" />}
          active={isLoggedIn && Boolean(favItem)}
          title={i18n("fav_page", "分类标签")}
          subtitle={
            !isLoggedIn
              ? i18n("fav_login_hint", "登录后可收藏页面")
              : favError || undefined
          }
          chevron={
            !isLoggedIn ? undefined : favLoading ? (
              <CircularProgress size={16} />
            ) : (
              <FavRatingStars
                rating={favItem?.rating ?? 0}
                onRate={handleRate}
              />
            )
          }
          onClick={handleFavClick}
        />
        <Collapse
          in={isLoggedIn && Boolean(favItem) && favOpen}
          timeout="auto"
          unmountOnExit
        >
          <Box>
            <RowDivider />
            <Box sx={{ px: 1.5, py: 1 }}>
              {                                  }
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {(favItem?.tags || []).map((tag) => (
                  <Chip
                    key={tag}
                    size="small"
                    label={tag}
                    onDelete={() =>
                      updateFavTags(favItem.tags.filter((item) => item !== tag))
                    }
                  />
                ))}
              </Stack>
              {                                 }
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ mt: 1 }}
              >
                <TextField
                  size="small"
                  fullWidth
                  placeholder={i18n(
                    "fav_add_tag_placeholder",
                    "输入新标签，回车添加"
                  )}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={i18n("fav_organize", "整理")}
                  onClick={() =>
                    sendBgMsg(MSG_OPEN_OPTIONS, { hash: "#/favorites" })
                  }
                />
              </Stack>
            </Box>
          </Box>
        </Collapse>
        <RowDivider />

        {                                          }
        <FeatureRow
          icon={<AssessmentIcon fontSize="small" />}
          title={i18n("reading_report", "阅读周报")}
          subtitle={
            isLoggedIn
              ? i18n("reading_report_hint", "本周阅读数据与 AI 关键词")
              : i18n("reading_report_login_hint", "登录后查看阅读周报")
          }
          onClick={
            isLoggedIn
              ? () => setReportDrawerOpen(true)
              : () => setLoginOpen(true)
          }
        />
      </FeatureCard>

      {                               }
      <PopupAdSlots
        isLoggedIn={isLoggedIn}
        onPricingClick={() => setProBenefitsOpen(true)}
        onOwnClick={() => {
          if (isLoggedIn) setReferralOpen(true);
          else {
            setResumeReferral(true);
            setLoginOpen(true);
          }
        }}
      />

      {                                        }
      <FeatureCard index={3} label={i18n("lang_style_group", "语言与样式")}>
        <Box sx={{ px: 1.5, pt: 0.5, pb: 1.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <LanguageSelect
                label={i18n("from_lang")}
                name="fromLang"
                value={fromLang}
                options={OPT_LANGS_FROM.map(([code]) => code)}
                suggested={["auto", "zh-CN", "en", "ja", "ko"]}
                onChange={handleLangChange}
              />
            </Box>
            {                                }
            <IconButton
              size="small"
              onClick={handleSwapLangs}
              disabled={fromLang === "auto" || !fromLang}
              aria-label={i18n("swap_langs", "交换语言")}
              sx={{
                flexShrink: 0,
                color: "primary.main",
                "&.Mui-disabled": { color: "action.disabled" },
              }}
            >
              <SwapHorizIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <LanguageSelect
                label={i18n("to_lang")}
                name="toLang"
                value={toLang}
                options={OPT_LANGS_TO.map(([code]) => code)}
                suggested={["zh-CN", "en", "ja", "ko", "fr"]}
                onChange={handleLangChange}
              />
            </Box>
          </Stack>
          <Box sx={{ mt: 1 }}>
            <CompactSelect
              label={i18n("text_style_alt")}
              name="textStyle"
              value={textStyle}
              options={allTextStyles.map((item) => ({
                value: item.styleSlug,
                label: item.styleName,
              }))}
              onChange={handleChange}
            />
          </Box>
        </Box>
      </FeatureCard>

      {                                         }
      {(!isLoggedIn || showWelcomeTrial) && (
        <Box
          component="button"
          type="button"
          data-testid="account-entry-banner"
          onClick={() =>
            isLoggedIn
              ? window.open(getPricingUrl(account), "_blank", "noopener")
              : setLoginOpen(true)
          }
          sx={[
            {
              border: 0,
              textAlign: "left",
              fontFamily: "inherit",
              width: "100%",
            },
            (theme) => {
              const dark = theme.palette.mode === "dark";
              return {
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                borderRadius: GOOGLE_STYLE.cardRadius,
                cursor: "pointer",
                color: "#fff",
                background: dark
                  ? "linear-gradient(135deg, #1A3A6B 0%, #0B57D0 100%)"
                  : "linear-gradient(135deg, #4C8DFF 0%, #0B57D0 100%)",
                boxShadow: "0 2px 10px rgba(11,87,208,0.25)",
                transition: `box-shadow 150ms ${MOTION_STANDARD}, transform 100ms ${MOTION_STANDARD}`,
                "&:hover": {
                  boxShadow: "0 4px 14px rgba(11,87,208,0.35)",
                  transform: "translateY(-1px)",
                },
                "&:active": {
                  transform: "translateY(0) scale(0.98)",
                },
              };
            },
            cardEnterSx(4),
          ]}
        >
          <CardGiftcardIcon sx={{ fontSize: 28 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} noWrap>
              {showWelcomeTrial
                ? i18n("login_promo_title", "先试试 Pro，再决定")
                : i18n("account_login_title", "登录，继续你的阅读")}
            </Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}>
              {showWelcomeTrial
                ? i18n(
                    "login_promo_subtitle",
                    "新用户可领取 7 天体验，无需支付"
                  )
                : i18n("account_login_subtitle", "同步翻译历史、生词本和收藏")}
            </Typography>
          </Box>
          <ArrowForwardIcon sx={{ fontSize: 18 }} />
        </Box>
      )}

      {                               }
      <Box
        data-testid="more-settings"
        onClick={() => sendBgMsg(MSG_OPEN_OPTIONS, { hash: "#/engines" })}
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          mt: 0.25,
          borderTop: `1px solid ${theme.palette.divider}`,
          color: "text.secondary",
          cursor: "pointer",
          borderRadius: "10px",
          "&:hover": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.06)"
                : GOOGLE_STYLE.blueTint,
            color: "primary.main",
          },
        })}
      >
        <SettingsIcon sx={{ fontSize: 17 }} />
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 13 }} noWrap>
          {i18n("more_settings", "更多设置")}
        </Typography>
        <OpenInNewIcon sx={{ fontSize: 14 }} />
      </Box>
    </Stack>
  );
}

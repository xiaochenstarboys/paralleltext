import { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Logo from "../../components/Logo";
import SunglassesIcon from "../../components/SunglassesIcon";
import { getColorPreset } from "../../config/brand";
import { useColorTheme } from "../../hooks/ColorMode";
import { sendBgMsg } from "../../libs/msg";
import { browser } from "../../libs/browser";
import { MSG_TRANS_COLORBLIND } from "../../config";
import { kissLog } from "../../libs/log";

   
                                             
  
                                             
                                              
                                     
  
                        
                                                               
   
export default function Header({ onClose }) {
  const { colorTheme, setColorTheme, presets } = useColorTheme();
  const gradient = getColorPreset(colorTheme).gradient;
                             
  const [cbHint, setCbHint] = useState("");
                                      
                                                             
  const [inSidePanel, setInSidePanel] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const contexts = await browser?.runtime?.getContexts?.({
          contextTypes: ["SIDE_PANEL"],
        });
        if (
          !cancelled &&
          contexts?.some((c) => c.documentUrl === window.location.href)
        ) {
          setInSidePanel(true);
        }
      } catch {
                                      
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

                                              
                                                                    
  const handleColorblind = async () => {
    try {
      const res = await sendBgMsg(MSG_TRANS_COLORBLIND);
      if (res == null || res?.mode === undefined) {
        setCbHint("当前页面没有可调整的译文（请先刷新页面并开启对照翻译）");
        return;
      }
      setCbHint(
        {
          red: "红适配已开启：译文改为醒目的蓝色",
          green: "绿适配已开启：译文改为醒目的橙色",
          off: "已关闭红绿适配，译文恢复默认颜色",
        }[res.mode] || ""
      );
    } catch (err) {
      kissLog("colorblind toggle", err);
      setCbHint("当前页面没有可调整的译文（请先刷新页面并开启对照翻译）");
    }
  };

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        background: gradient,
        px: 1.5,
        py: 1.25,
        transition: "background 240ms ease",
      }}
    >
      {                                       }
      <Stack
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        spacing={1}
      >
        {!inSidePanel && (
          <>
            <Logo size={22} style={{ borderRadius: 6 }} />
            <Typography
              component="div"
              sx={{
                userSelect: "none",
                WebkitUserSelect: "none",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 0.3,
              }}
            >
              {process.env.REACT_APP_NAME_CN}
            </Typography>
          </>
        )}

        {                                             }
        <Stack direction="row" alignItems="center" spacing={0.4} sx={{ ml: 0.75 }}>
          {Object.entries(presets).map(([key, preset]) => (
            <Tooltip key={key} title={preset.label} arrow>
              <Box
                component="button"
                aria-label={`配色-${preset.label}`}
                onClick={() => setColorTheme(key)}
                sx={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  border: "none",
                  p: 0,
                  cursor: "pointer",
                  bgcolor: preset.swatch,
                  outline:
                    colorTheme === key
                      ? "2px solid rgba(255,255,255,0.95)"
                      : "1.5px solid rgba(255,255,255,0.35)",
                  outlineOffset: 1,
                  transition: "transform 120ms ease, outline 120ms ease",
                  "&:hover": { transform: "scale(1.18)" },
                }}
              />
            </Tooltip>
          ))}
        </Stack>

        {                          }
        <Typography
          component="div"
          sx={{
            userSelect: "none",
            WebkitUserSelect: "none",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.5,
            lineHeight: 1,
            color: "rgba(255,255,255,0.65)",
            ml: 0.25,
          }}
        >
          {process.env.REACT_APP_NAME}
        </Typography>
      </Stack>

      {                          }
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {                             }
        <Tooltip title="红绿适配（译文改蓝橙高对比色）" arrow>
          <IconButton
            size="small"
            aria-label="红绿适配"
            onClick={handleColorblind}
            sx={{ color: "#fff", p: 0.5, fontSize: 21 }}
          >
            <SunglassesIcon />
          </IconButton>
        </Tooltip>

        {onClose && (
          <IconButton
            onClick={() => {
              onClose();
            }}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Stack>

      {                }
      <Snackbar
        open={Boolean(cbHint)}
        autoHideDuration={2200}
        onClose={() => setCbHint("")}
        message={cbHint}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Stack>
  );
}

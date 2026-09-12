import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useState } from "react";
import { useI18n } from "../../hooks/I18n";

   
                                          
  
                        
                                          
                                                
   
export default function CopyBtn({ text, title = "copy" }) {
  const i18n = useI18n();
                             
  const [copied, setCopied] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
              
    await navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1200);
  };

  return (
    <Box
      component="button"
      type="button"
      onClick={handleClick}
      title={title}
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        border: "none",
        outline: "none",
        cursor: "pointer",
        px: "6px",
        py: "3px",
        borderRadius: "8px",
        fontFamily: "inherit",
        color: copied
          ? theme.palette.success.main
          : theme.palette.text.secondary,
        backgroundColor: "transparent",
        transition: "all 0.2s ease",
        "&:hover": {
          color: copied
            ? theme.palette.success.main
            : theme.palette.primary.main,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(26,115,232,0.08)",
        },
        "&:active": {
          transform: "scale(0.95)",
        },
      })}
    >
      {copied ? (
        <CheckRoundedIcon sx={{ fontSize: 14 }} />
      ) : (
        <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
      )}
      <Typography
        component="span"
        sx={{ fontSize: 12, lineHeight: 1, userSelect: "none" }}
      >
        {copied ? i18n("copied") : i18n("copy")}
      </Typography>
    </Box>
  );
}

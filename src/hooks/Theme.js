import { useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { useDarkMode, useColorTheme } from "./ColorMode";
import { THEME_DARK, THEME_LIGHT } from "../config";
import { getColorPreset } from "../config/brand";
import { googleComponentStyles } from "../config/componentStyles";

   
                     
                                                  
                                                      
   
export default function Theme({ children, options = {}, styles = {} }) {
                                            
  const { darkMode } = useDarkMode();
                         
  const { colorTheme } = useColorTheme();
                                
  const [systemMode, setSystemMode] = useState(THEME_LIGHT);

                                                     
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setSystemMode(mediaQuery.matches ? THEME_DARK : THEME_LIGHT);
    };
    handleChange();              
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

                                                   
  const theme = useMemo(() => {
    let htmlFontSize = 16;
    try {
                                                                  
      const s = window.getComputedStyle(document.documentElement).fontSize;
      htmlFontSize = parseInt(s.replace("px", ""));
    } catch (err) {
                            
    }

                       
    const isDarkMode =
      darkMode === "dark" || (darkMode === "auto" && systemMode === THEME_DARK);

    return createTheme({
      palette: {
        mode: isDarkMode ? THEME_DARK : THEME_LIGHT,
        primary: {
          main: getColorPreset(colorTheme).primary,              
        },
      },
      typography: {
        htmlFontSize,
      },
      ...options,
                                                                  
      components: { ...googleComponentStyles, ...(options.components || {}) },
    });
  }, [colorTheme, darkMode, options, systemMode]);

  return (
    <ThemeProvider theme={theme}>
      {                                            }
      <CssBaseline />
      {                     }
      <GlobalStyles styles={styles} />
      {children}
    </ThemeProvider>
  );
}

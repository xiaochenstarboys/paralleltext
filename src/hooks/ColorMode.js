import { useCallback } from "react";
import { useSetting } from "./Setting";
import { COLOR_THEME_PRESETS, DEFAULT_COLOR_THEME } from "../config/brand";

   
                      
                                                                   
   
export function useDarkMode() {
                                 
  const {
    setting: { darkMode },
    updateSetting,
  } = useSetting();

                                                    
  const toggleDarkMode = useCallback(() => {
    const nextMode = {
      light: "dark",
      dark: "auto",
      auto: "light",
    };
    updateSetting({ darkMode: nextMode[darkMode] || "light" });
  }, [darkMode, updateSetting]);

  return { darkMode, toggleDarkMode };
}

   
                                                                    
                                                                                           
   
export function useColorTheme() {
  const {
    setting: { colorTheme },
    updateSetting,
  } = useSetting();

  const setColorTheme = useCallback(
    (key) => {
      if (COLOR_THEME_PRESETS[key]) {
        updateSetting({ colorTheme: key });
      }
    },
    [updateSetting]
  );

  return {
    colorTheme: COLOR_THEME_PRESETS[colorTheme] ? colorTheme : DEFAULT_COLOR_THEME,
    setColorTheme,
    presets: COLOR_THEME_PRESETS,
  };
}

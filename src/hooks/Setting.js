import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
} from "react";
import Alert from "@mui/material/Alert";
import {
  STOKEY_SETTING,
  DEFAULT_SETTING,
  MSG_SET_LOGLEVEL,
  CURRENT_SETTINGS_VERSION,
  getSettingVersion,
  migrateSettingToV3,
} from "../config";
import { useStorage } from "./Storage";
import { normalizeApiBuiltinModels } from "../config";
import Loading from "./Loading";
import { logger } from "../libs/log";
import { sendBgMsg } from "../libs/msg";
import { isExt } from "../libs/client";
import { reconcileEngineSettings } from "../libs/engineSettings";
import useBuiltinModels from "./useBuiltinModels";

                                       
const SettingContext = createContext({
  setting: DEFAULT_SETTING,
  updateSetting: () => {},
  reloadSetting: () => {},
});

   
                                                     
   
export function SettingProvider({ children, context }) {
  const builtinModels = useBuiltinModels(context);
                                     
  const isOptionsPage = useMemo(() => context === "options", [context]);

                               
  const {
    data: setting,
    isLoading,
    update,
    reload,
  } = useStorage(STOKEY_SETTING, DEFAULT_SETTING);
  const hasSetting = !!setting;
  const settingVersion = getSettingVersion(setting);
  const logLevel = setting?.logLevel;

  useEffect(() => {
    if (reconcileEngineSettings(setting) !== setting) {
      update((current) => reconcileEngineSettings(current));
    }
  }, [setting, update]);

                                                    
  useEffect(() => {
    if (!hasSetting || settingVersion >= CURRENT_SETTINGS_VERSION) {
      return;
    }

    update((currentSetting) => {
      if (
        !currentSetting ||
        getSettingVersion(currentSetting) >= CURRENT_SETTINGS_VERSION
      ) {
        return currentSetting;
      }

      return migrateSettingToV3(currentSetting);
    });
  }, [hasSetting, settingVersion, update]);

                                                                          
  useEffect(() => {
    if (typeof setting?.darkMode === "boolean") {
      update((currentSetting) => ({
        ...currentSetting,
        darkMode: currentSetting.darkMode ? "dark" : "light",
      }));
    }
  }, [setting?.darkMode, update]);

                                               
                                                           
  useEffect(() => {
    if (!isOptionsPage) return;

    (async () => {
      try {
        logger.setLevel(logLevel);
        if (isExt) {
          await sendBgMsg(MSG_SET_LOGLEVEL, logLevel);
        }
      } catch (error) {
        logger.error("Failed to fetch log level, using default.", error);
      }
    })();
  }, [isOptionsPage, logLevel]);

                
  const updateSetting = useCallback(
    (objOrFn) => {
      update((current) =>
        reconcileEngineSettings(
          {
            ...current,
            ...(typeof objOrFn === "function" ? objOrFn(current) : objOrFn),
          },
          current
        )
      );
    },
    [update]
  );

                                                     
                                                                
                                                                            
  const updateChild = useCallback(
    (key) => async (obj) => {
      updateSetting((prev) => ({
        ...prev,
        [key]: { ...(prev?.[key] || {}), ...obj },
      }));
    },
    [updateSetting]
  );

                        
                                                 
                                                    
  const value = useMemo(
    () => ({
      context,
      setting: setting
        ? reconcileEngineSettings({
            ...setting,
            transApis: normalizeApiBuiltinModels(setting.transApis),
          })
        : setting,
      updateSetting,
      updateChild,
      reloadSetting: reload,
    }),
    [context, setting, updateSetting, updateChild, reload, builtinModels]
  );

                                                                 
  if (isLoading) {
    return isOptionsPage ? <Loading /> : null;
  }

                                                  
  if (!setting) {
    return isOptionsPage ? (
      <center>
        <Alert severity="error" sx={{ maxWidth: 600, margin: "60px auto" }}>
          <p>数据加载出错，请刷新页面或卸载后重新安装。</p>
          <p>
            Data loading error, please refresh the page or uninstall and
            reinstall.
          </p>
        </Alert>
      </center>
    ) : null;
  }

  return (
    <SettingContext.Provider value={value}>{children}</SettingContext.Provider>
  );
}

                        
export function useSetting() {
  return useContext(SettingContext);
}

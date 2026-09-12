import { browser } from "./browser";
import { Translator } from "./translator";
import { InputTranslator } from "./inputTranslate";
import { sendIframeMsg } from "./iframe";
import {
  EVENT_KISS_TRANSLATOR,
  MSG_HOVERNODE_TOGGLE,
  MSG_INPUT_TRANSLATE,
} from "../config";
import { touchTapListener } from "./touch";
import { isExt } from "./client";
import { initUiBridge, sendUiCommand, ensureContentUi, isContentUiReady } from "./uiBridge";
import {
  MSG_TRANS_TOGGLE,
  MSG_TRANS_TOGGLE_ONLY,
  MSG_TRANS_TOGGLE_STYLE,
  MSG_TRANS_COLORBLIND,
  MSG_TRANS_GETRULE,
  MSG_TRANS_PUTRULE,
  MSG_OPEN_TRANBOX,
  MSG_TRANSBOX_TOGGLE,
  MSG_POPUP_TOGGLE,
  MSG_FAB_TOGGLE,
  MSG_MOUSEHOVER_TOGGLE,
  MSG_TRANSINPUT_TOGGLE,
  STOKEY_FAB,
  STOKEY_RULES,
  STOKEY_SETTING,
  MSG_UI_SETTINGS_UPDATE,
} from "../config";
import { storage, STORAGE_CHANGE_EVENT, getSettingWithDefault, mergeSettingWithDefault } from "./storage";
import { matchRule } from "./rules";
import { isInBlacklist } from "./blacklist";
import { logger } from "./log";

   
                   
  
                                
                          
                                                
                                           
   
export default class TranslatorManager {
                                                  
  #clearTouchListeners = [];
  #isActive = false;

                               
  #uiIdleHandle = null;             
  #uiTriggerHandler = null;           

                                         
  #setting;
  #rule;
  #fabConfig;
  #favWords;
  #isIframe;
  #transboxOnly;

                                                             
  #documentObserver = null;
  #documentElementObserver = null;
  #knownDocumentElement = null;
  #knownBody = null;

                                                       
  #spaRefreshTimer = null;
  #pendingSpaRefresh = null;
  #pendingSpaRefreshReason = "";

                                                     
  #innerMessageHandler = null;
  #browserMessageHandler = null;
  #windowMessageHandler = null;
  #pageRestoreHandler = null;
  #spaNavigationHandler = null;
  #fabStorageHandler = null;
  #rulesStorageHandler = null;
  #settingsStorageHandler = null;
  #webSettingsHandler = null;
  #settingsReadVersion = 0;

                                           
                                                      
                                                                 
  _translator = null;
  _inputTranslator = null;

     
                         
    
                                             
                                                    
                                
     
  constructor({
    setting,
    rule,
    fabConfig,
    favWords,
    isIframe,
    transboxOnly = false,
  }) {
    this.#setting = this.#cloneConfig(setting);
    this.#rule = this.#cloneConfig(rule);
    this.#fabConfig = this.#cloneConfig(fabConfig);
    this.#favWords = this.#cloneConfig(favWords);
    this.#isIframe = isIframe;
    this.#transboxOnly = transboxOnly;

    this.#innerMessageHandler = this.#handleInnerMessage.bind(this);
    this.#browserMessageHandler = this.#handleBrowserMessage.bind(this);
    this.#windowMessageHandler = this.#handleWindowMessage.bind(this);
    this.#pageRestoreHandler = this.#handlePageRestore.bind(this);
    this.#spaNavigationHandler = this.#handleSpaNavigation.bind(this);
    this.#fabStorageHandler = this.#handleFabStorageChange.bind(this);
    this.#rulesStorageHandler = this.#handleRulesStorageChange.bind(this);
    this.#settingsStorageHandler = this.#handleSettingsStorageChange.bind(this);
    this.#webSettingsHandler = (event) => {
      if ((event.detail?.key || event.key) !== STOKEY_SETTING) return;
      const version = ++this.#settingsReadVersion;
      getSettingWithDefault().then((setting) => {
        if (this.#isActive && version === this.#settingsReadVersion) this.#applySettings(setting);
      }).catch((err) => logger.warn("sync settings", err));
    };
  }

     
              
    
                                         
                                    
     
  start() {
    if (this.#isActive) {
      logger.info("TranslatorManager is already started.");
      return;
    }

    this.#createRuntimeModules();
    this.#setupMessageListeners();
    initUiBridge();                                    
                                         
    if (isExt) {
      browser.storage.onChanged.addListener(this.#fabStorageHandler);
                                                      
      browser.storage.onChanged.addListener(this.#rulesStorageHandler);
      browser.storage.onChanged.addListener(this.#settingsStorageHandler);
    }
    else {
      window.addEventListener("storage", this.#webSettingsHandler);
      window.addEventListener(STORAGE_CHANGE_EVENT, this.#webSettingsHandler);
    }
    if (!this.#transboxOnly) {
      this.#setupTouchOperations();
    }

    if (!this.#transboxOnly) {
      this.#setupSpaListeners();
    }
    this.#isActive = true;
    logger.info("TranslatorManager started.");
  }

     
                                        
    
                               
                                        
                                  
     
  restart(reason = "spa-navigation") {
    if (!this.#isActive) {
      logger.info("TranslatorManager is not running.");
      return;
    }

                                                                       
    const state = this.#snapshotRuntimeState();
    this.#destroyRuntimeModules();

    this.#setting = state.setting;
    this.#rule = state.rule;
    this.#fabConfig = state.fabConfig;
    this.#favWords = state.favWords;

    this.#createRuntimeModules();
    this.#refreshDocumentElementObserver();
                                                         
    if (isContentUiReady()) {
      ensureContentUi(this.#uiContext());
    }
    logger.info(`TranslatorManager restarted: ${reason}`);
  }

     
                      
    
                                            
                                              
     
  stop() {
    if (!this.#isActive) {
      logger.info("TranslatorManager is not running.");
      return;
    }

    this.#clearSpaRefreshTimer();
    this.#teardownSpaListeners();

    window.removeEventListener(
      EVENT_KISS_TRANSLATOR,
      this.#windowMessageHandler
    );
    if (isExt) {
      browser.runtime.onMessage.removeListener(this.#browserMessageHandler);
      browser.storage.onChanged.removeListener(this.#fabStorageHandler);
      browser.storage.onChanged.removeListener(this.#rulesStorageHandler);
      browser.storage.onChanged.removeListener(this.#settingsStorageHandler);
      if (this.#isIframe) {
        window.removeEventListener("message", this.#innerMessageHandler);
      }
    } else {
      window.removeEventListener("message", this.#innerMessageHandler);
      window.removeEventListener("storage", this.#webSettingsHandler);
      window.removeEventListener(STORAGE_CHANGE_EVENT, this.#webSettingsHandler);
    }

    this.#clearTouchListeners.forEach((clear) => clear());
    this.#clearTouchListeners = [];

    this.#destroyRuntimeModules();
    this.#isActive = false;
    logger.info("TranslatorManager stopped.");
  }

     
                                  
    
                                    
                                                  
     
  #createRuntimeModules() {
    if (this.#transboxOnly) {
                                           
      sendUiCommand(null, null, this.#uiContext());
      return;
    }

    this._translator = new Translator({
      rule: this.#cloneConfig(this.#rule),
      setting: this.#cloneConfig(this._translator?.setting || this.#setting),
      favWords: this.#cloneConfig(this.#favWords),
      isIframe: this.#isIframe,
    });

                                     
    if (!this.#isIframe) {
      this._inputTranslator = new InputTranslator(
        this.#cloneConfig(this.#setting)
      );
                                                  
                                              
      if (!this.#fabConfig?.isHide) {
        this.#scheduleUiInject();
      }
      this.#setupUiTrigger();
    }
  }

     
                          
    
                                           
                               
     
  #destroyRuntimeModules() {
    this.#clearUiTrigger();
    this._inputTranslator?.disable();
    this._translator?.stop();

    this._translator = null;
    this._inputTranslator = null;
  }

     
                                                                  
                                        
     
  #uiContext() {
    return {
      translator: this._translator,
                                                
                                                         
      processActions: (payload) => this.#processActions(payload),
      setting: this.#cloneConfig(this._translator?.setting || this.#setting),
      fabConfig: this.#cloneConfig(this.#fabConfig),
      transboxOnly: this.#transboxOnly,
    };
  }

                                     
  #scheduleUiInject() {
    const schedule =
      window.requestIdleCallback || ((fn) => setTimeout(fn, 500));
    this.#uiIdleHandle = schedule(
      () => sendUiCommand(null, null, this.#uiContext()),
      { timeout: 1500 }
    );
  }

     
                                         
                                          
     
  #setupUiTrigger() {
    if (this.#isIframe) return;
    if (this.#setting.tranboxSetting?.transOpen === false) return;
    const handler = (e) => {
      if (isContentUiReady()) return;
      if (e.button === 2) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim()) {
                                                                                
        sendUiCommand(MSG_OPEN_TRANBOX, undefined, this.#uiContext());
      }
    };
    this.#uiTriggerHandler = handler;
    window.addEventListener("mouseup", handler);
    window.addEventListener("touchend", handler);
  }

  #clearUiTrigger() {
    if (this.#uiTriggerHandler) {
      window.removeEventListener("mouseup", this.#uiTriggerHandler);
      window.removeEventListener("touchend", this.#uiTriggerHandler);
      this.#uiTriggerHandler = null;
    }
  }

     
                                     
    
                                              
                                             
     
  #cloneConfig(value) {
    if (value == null) return value;
    if (typeof globalThis.structuredClone === "function") {
      try {
        return globalThis.structuredClone(value);
      } catch (err) {
        logger.debug("structuredClone failed, using JSON clone.", err);
      }
    }
    return JSON.parse(JSON.stringify(value));
  }

     
                                        
    
                                                     
                                  
     
  #snapshotRuntimeState() {
    return {
      setting: this.#cloneConfig(this._translator?.setting || this.#setting),
      rule: this.#cloneConfig(this._translator?.rule || this.#rule),
      fabConfig: this.#cloneConfig(this.#fabConfig),
      favWords: this.#cloneConfig(this.#favWords),
    };
  }

     
                 
    
            
                                                                            
                                                              
     
  #setupSpaListeners() {
    this.#documentObserver = new MutationObserver(() => {
      this.#handleDocumentContainerMutation("document");
    });
                                                        
    this.#documentObserver.observe(document, { childList: true });

    this.#refreshDocumentElementObserver();
    window.addEventListener("pageshow", this.#pageRestoreHandler);
    document.addEventListener(
      "turbo:frame-load",
      this.#spaNavigationHandler,
      true
    );
  }

     
                          
     
  #teardownSpaListeners() {
    this.#documentObserver?.disconnect();
    this.#documentObserver = null;

    this.#documentElementObserver?.disconnect();
    this.#documentElementObserver = null;

    this.#knownDocumentElement?.removeEventListener(
      "turbo:load",
      this.#spaNavigationHandler
    );
    this.#knownDocumentElement = null;
    this.#knownBody = null;

    window.removeEventListener("pageshow", this.#pageRestoreHandler);
    document.removeEventListener(
      "turbo:frame-load",
      this.#spaNavigationHandler,
      true
    );
  }

     
                                                       
    
                                                  
                                   
     
  #refreshDocumentElementObserver() {
    this.#documentElementObserver?.disconnect();
    this.#documentElementObserver = null;

    this.#knownDocumentElement?.removeEventListener(
      "turbo:load",
      this.#spaNavigationHandler
    );

                              
    this.#knownDocumentElement = document.documentElement;
    this.#knownBody = document.body;

    if (!this.#knownDocumentElement) return;

    this.#knownDocumentElement.addEventListener(
      "turbo:load",
      this.#spaNavigationHandler
    );
    this.#documentElementObserver = new MutationObserver(() => {
      this.#handleDocumentContainerMutation("documentElement");
    });
                                                 
    this.#documentElementObserver.observe(this.#knownDocumentElement, {
      childList: true,
    });
  }

     
                   
    
                                                     
                              
     
  #handleDocumentContainerMutation(reason) {
    if (this.#hasDocumentContainerChanged()) {
      this.#scheduleSpaRefresh("restart", reason);
    }
  }

     
                  
    
                                                       
                                                    
     
  #handlePageRestore(event) {
    if (event.type === "pageshow" && event.persisted !== true) return;
    this.#scheduleSpaRefresh("rescan", event.type);
  }

     
                  
    
                                              
                                       
     
  #handleSpaNavigation(event) {
    this.#scheduleSpaRefresh("rescan", event.type);
  }

     
                                        
    
                                                
                                                     
                         
     
  #scheduleSpaRefresh(type, reason) {
    if (!this.#isActive) return;

    if (this.#spaRefreshTimer) {
      clearTimeout(this.#spaRefreshTimer);
      this.#spaRefreshTimer = null;
    }

                                           
    if (type === "restart" || this.#pendingSpaRefresh !== "restart") {
      this.#pendingSpaRefresh = type;
      this.#pendingSpaRefreshReason = reason;
    }

    if (type === "restart") {
      this.#pendingSpaRefreshReason = reason;
    }

    this.#spaRefreshTimer = setTimeout(() => {
      const refreshType = this.#pendingSpaRefresh;
      const refreshReason = this.#pendingSpaRefreshReason;
      this.#spaRefreshTimer = null;
      this.#pendingSpaRefresh = null;
      this.#pendingSpaRefreshReason = "";

      if (!this.#isActive) return;

      if (refreshType === "restart" || this.#hasDocumentContainerChanged()) {
        this.restart(refreshReason);
        return;
      }

      this._translator?.rescan();
      logger.info(`TranslatorManager rescanned: ${refreshReason}`);
    }, 0);
  }

     
                      
     
  #clearSpaRefreshTimer() {
    if (!this.#spaRefreshTimer) return;

    clearTimeout(this.#spaRefreshTimer);
    this.#spaRefreshTimer = null;
    this.#pendingSpaRefresh = null;
    this.#pendingSpaRefreshReason = "";
  }

     
                     
     
  #hasDocumentContainerChanged() {
    return (
      document.documentElement !== this.#knownDocumentElement ||
      document.body !== this.#knownBody
    );
  }

                                                          
  #colorblindMode = "off";

     
                                          
                                                             
                                   
     
  #cycleColorblindStyle() {
    const STYLE_ID = "paralleltext-colorblind-style";
    const ORDER = ["off", "red", "green"];
    this.#colorblindMode =
      ORDER[(ORDER.indexOf(this.#colorblindMode) + 1) % ORDER.length];
    const mode = this.#colorblindMode;

    let el = document.getElementById(STYLE_ID);
    if (mode === "off") {
      el?.remove();
      return "off";
    }
    const color = mode === "red" ? "#0072B2" : "#E69F00";
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = `
.paralleltext-inner,
.paralleltext-inner * {
  color: ${color} !important; /* 色盲安全色 */
  font-weight: 700 !important; /* 醒目加粗 */
}
`;
    return mode;
  }

     
                  
    
                                                           
                                                
                       
     
  #setupMessageListeners() {
    if (isExt) {
      browser.runtime.onMessage.addListener(this.#browserMessageHandler);
      if (this.#isIframe) {
        window.addEventListener("message", this.#innerMessageHandler);
      }
    } else {
      window.addEventListener("message", this.#innerMessageHandler);
    }

    window.addEventListener(EVENT_KISS_TRANSLATOR, this.#windowMessageHandler);
  }

     
                
     
  #setupTouchOperations() {
    if (this.#isIframe) return;

    const { touchModes = [2] } = this._translator.setting;
    if (touchModes.length === 0) {
      return;
    }

    const handleTap = () => {
      this.#processActions({ action: MSG_TRANS_TOGGLE });
    };

    const handleListener = (mode) => {
      let options = null;
      switch (mode) {
        case 2:
        case 3:
        case 4:
          options = { taps: 1, fingers: mode };
          break;
        case 5:
          options = { taps: 2, fingers: 1 };
          break;
        case 6:
          options = { taps: 3, fingers: 1 };
          break;
        case 7:
          options = { taps: 2, fingers: 2 };
          break;
        default:
      }
      if (options) {
        this.#clearTouchListeners.push(touchTapListener(handleTap, options));
      }
    };

    touchModes.forEach((mode) => handleListener(mode));
  }

     
                          
     
  #handleWindowMessage(event) {
    logger.debug("handle window message:", event);
    this.#processActions(event.detail);
  }

     
                            
                                                       
     
  #handleFabStorageChange(changes, areaName) {
    if (areaName !== "local") return;
    const nextFab = changes?.[STOKEY_FAB]?.newValue;
    if (!nextFab) return;

    let isHide = !!nextFab.isHide;
    if (
      !this.#isIframe &&
      isInBlacklist(window.location.href, nextFab.hideExceptionList || "")
    ) {
      isHide = !isHide;
    }

    this.#fabConfig = { ...this.#fabConfig, ...nextFab, isHide };
                                                  
    sendUiCommand(MSG_FAB_TOGGLE, { isHide }, this.#uiContext());
  }

     
                                             
                                            
                                              
                                      
     
  async #handleRulesStorageChange(changes, areaName) {
    if (areaName !== "local" || !changes?.[STOKEY_RULES]) return;
    try {
      const fresh = await matchRule(window.location.href);
      const currentTransOpen = (this._translator?.rule ?? this.#rule)
        ?.transOpen;
      const next = currentTransOpen
        ? { ...fresh, transOpen: currentTransOpen }
        : fresh;
      this.#rule = this.#cloneConfig(next);
      this._translator?.updateRule(next);
    } catch (err) {
      logger.info("sync rule from storage error", err);
    }
  }

     
                                   
     
  #applySettings(setting) {
    this.#setting = setting;
    this._translator?.updateSetting(setting);
    this.#clearUiTrigger();
    this.#setupUiTrigger();
    const context = this.#uiContext();
    if (isContentUiReady()) {
      sendUiCommand(MSG_UI_SETTINGS_UPDATE, setting, context);
    } else {
      window.__KISS_CONTENT_UI_CONTEXT__ = context;
    }
  }

  #handleSettingsStorageChange(changes, areaName) {
    if (areaName !== "local" || !changes?.[STOKEY_SETTING] || !this.#isActive) return;
    try {
      const raw = changes[STOKEY_SETTING].newValue;
      this.#applySettings(mergeSettingWithDefault(typeof raw === "string" ? JSON.parse(raw) : raw));
    } catch (err) {
      logger.warn("sync settings from storage", err);
    }
  }

  #handleInnerMessage(event) {
    this.#processActions(event.data);
  }

     
                                    
     
  #handleBrowserMessage(message, sender, sendResponse) {
    const result = this.#processActions(message, true);
    const response = result || {
      rule: this._translator?.rule || this.#rule,
      setting: this._translator?.setting || this.#setting,
    };
    sendResponse(response);
    return true;
  }

     
              
    
                                               
                                     
     
  #processActions({ action, args } = {}, fromExt = false) {
    if (!action) return;

                                                       
    if (!fromExt) {
      sendIframeMsg(action, args);
    }

    logger.debug("process action:", action, args);

    switch (action) {
      case MSG_TRANS_TOGGLE:
        this._translator?.toggle();
        break;
      case MSG_TRANS_TOGGLE_ONLY:
        this._translator?.toggleTransOnly();
        break;
      case MSG_TRANS_TOGGLE_STYLE:
        this._translator?.toggleStyle();
        break;
      case MSG_TRANS_COLORBLIND:
                                                           
        return { mode: this.#cycleColorblindStyle() };
      case MSG_TRANS_GETRULE:
        return {
          rule: this._translator?.rule || this.#rule,
          setting: this._translator?.setting || this.#setting,
        };
      case MSG_TRANS_PUTRULE:
        this._translator?.updateRule(args);
        break;
      case MSG_OPEN_TRANBOX:
                                                                  
        sendUiCommand(MSG_OPEN_TRANBOX, args, this.#uiContext());
        break;
      case MSG_POPUP_TOGGLE:
        sendUiCommand(MSG_POPUP_TOGGLE, args, this.#uiContext());
        break;
      case MSG_FAB_TOGGLE:
                                            
        sendUiCommand(MSG_FAB_TOGGLE, args, this.#uiContext());
        break;
      case MSG_TRANSBOX_TOGGLE: {
        const transOpen = typeof args?.transOpen === "boolean" ? args.transOpen :
          !(this._translator?.setting || this.#setting).tranboxSetting?.transOpen;
        this.#setting = { ...this.#setting, tranboxSetting: { ...this.#setting.tranboxSetting, transOpen } };
        this._translator?.toggleTransbox(transOpen);
        this.#clearUiTrigger();
        this.#setupUiTrigger();
        sendUiCommand(MSG_TRANSBOX_TOGGLE, { transOpen }, this.#uiContext());
                                                     
        if (typeof args?.transOpen !== "boolean") {
          storage.getObj(STOKEY_SETTING).then((setting) => storage.setObj(STOKEY_SETTING, {
            ...setting, tranboxSetting: { ...setting?.tranboxSetting, transOpen },
          })).catch((err) => logger.warn("persist selection switch", err));
        }
        break;
      }
      case MSG_MOUSEHOVER_TOGGLE:
        this._translator?.toggleMouseHover();
        break;
      case MSG_TRANSINPUT_TOGGLE:
        this._inputTranslator?.toggle();
        this._translator?.toggleInputTranslate();
        break;
      case MSG_HOVERNODE_TOGGLE:
        this._translator?.toggleHoverNode();
        break;
      case MSG_INPUT_TRANSLATE:
        this._inputTranslator?.handleTranslate();
        break;
      default:
        logger.info(`Message action is unavailable: ${action}`);
        return { error: `Message action is unavailable: ${action}` };
    }
  }
}

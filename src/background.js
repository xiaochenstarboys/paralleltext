import browser from "webextension-polyfill";
import { getLocalTranslationGuestId } from "./libs/guestTranslationIdentity";
import {
  BUILTIN_MODEL_ALARM,
  ensureBuiltinModelAlarm,
  refreshBuiltinModels,
} from "./libs/builtinModelSync";
import {
  enqueueTranslationReceipt,
  flushTranslationReceipts,
  ensureTranslationReceiptAlarm,
  TRANSLATION_RECEIPT_ALARM,
} from "./libs/translationReceiptQueue";
import {
  MSG_FETCH,
  MSG_AD_CLIENT_ID,
  MSG_TRANSLATION_GUEST_ID,
  MSG_DATA_SYNC,
  MSG_TRANSLATION_RECEIPT,
  MSG_GET_HTTPCACHE,
  MSG_PUT_HTTPCACHE,
  MSG_TRANS_TOGGLE,
  MSG_TRANS_TOGGLE_ONLY,
  MSG_OPEN_OPTIONS,
  MSG_TRANS_TOGGLE_STYLE,
  MSG_TRANS_COLORBLIND,
  MSG_OPEN_TRANBOX,
  MSG_TRANSBOX_TOGGLE,
  MSG_CONTEXT_MENUS,
  MSG_COMMAND_SHORTCUTS,
  MSG_INJECT_JS,
  MSG_INJECT_CSS,
  MSG_UPDATE_CSP,
  CMD_TOGGLE_TRANSLATE,
  CMD_TOGGLE_TRANSLATE_ONLY,
  CMD_TOGGLE_STYLE,
  CMD_OPEN_OPTIONS,
  CMD_OPEN_TRANBOX,
  CMD_TOGGLE_TRANBOX,
  CMD_OPEN_SEPARATE_WINDOW,
  CLIENT_THUNDERBIRD,
  MSG_SET_LOGLEVEL,
  MSG_CLEAR_CACHES,
  MSG_GET_CACHES_SIZE,
  MSG_OPEN_SEPARATE_WINDOW,
  STOKEY_SEPARATE_WINDOW,
  PORT_STREAM_FETCH,
  MSG_UPDATE_ICON,
  MSG_SHA256,
  MSG_ACCOUNT_GET,
  MSG_ACCOUNT_SET,
  MSG_ACCOUNT_PUSH,
  MSG_ENSURE_CONTENT_UI,
  STOKEY_ACCOUNT,
  STOKEY_ACCOUNT_LOGOUT,
  STOKEY_MEMBER,
} from "./config";
import {
  getSettingWithDefault,
  tryInitDefaultData,
  runDataMigration,
  storage,
} from "./libs/storage";
import { fetchHandle, fetchStreamNative } from "./libs/fetch";
import {
  tryClearCaches,
  getCachesSize,
  getHttpCache,
  putHttpCache,
} from "./libs/cache";
import { sendTabMsg } from "./libs/msg";
import { getCurTabId } from "./libs/msg";
import { injectInlineJsBg, injectInternalCss } from "./libs/injector";
import { kissLog, logger } from "./libs/log";
import { sha256 } from "./libs/utils";
import { syncMembershipStatus } from "./libs/account";
import { dataSync } from "./modules/dataSync/runtime";
import {
  ensureSyncAlarm,
  MEMBER_SYNC_ALARM,
} from "./modules/dataSync/scheduler";

globalThis.__KISS_CONTEXT__ = "background";

let openingOptionsPage = false;

   
                                                                  
                                                                      
   
async function openOptionsPage(hash = "") {
  if (openingOptionsPage) return;

  openingOptionsPage = true;
  try {
                                          
    if (hash) {
      await browser.tabs.create({
        url: browser.runtime.getURL(`options.html${hash}`),
      });
      return;
    }

    if (typeof browser.runtime.openOptionsPage === "function") {
      try {
        await browser.runtime.openOptionsPage();
        return;
      } catch (err) {
        kissLog("open options page with runtime API", err);
      }
    }

    try {
      await browser.tabs.create({
        url: browser.runtime.getURL("options.html"),
      });
    } catch (err) {
      kissLog("open options page in new tab", err);
    }
  } finally {
    openingOptionsPage = false;
  }
}

   
                         
                                                 
                                 
   
async function updateIcon(isActive, tabId) {
  const suffix = isActive ? "_active" : "";
  const path = {
    16: `images/logo16${suffix}.png`,
    32: `images/logo32${suffix}.png`,
    48: `images/logo48${suffix}.png`,
    128: `images/logo128${suffix}.png`,
    192: `images/logo192${suffix}.png`,
  };
  try {
                                                                                  
    if (browser.action) {
      await browser.action.setIcon({ path, tabId });
    } else {
      await browser.browserAction.setIcon({ path, tabId });
    }
  } catch (err) {
    kissLog("updateIcon error", err);
  }
}

                                              
const CSP_RULE_START_ID = 1;
const ORI_RULE_START_ID = 10000;

   
                                                         
                                                    
                                                       
                                       
                                      
   
function getRegistrableDomain(input) {
  try {
    const hostname = new URL(
      /^[a-z]+:\/\//i.test(input) ? input : `https://${input}`
    ).hostname;
    const labels = hostname.split(".").filter(Boolean);
                                   
    return labels.length <= 2 ? hostname : labels.slice(-2).join(".");
  } catch (err) {
    kissLog("getRegistrableDomain error", err);
    return "";
  }
}
                                                                           
const CSP_REMOVE_HEADERS = [
  `content-security-policy`,
  `content-security-policy-report-only`,
  `x-webkit-csp`,
  `x-content-security-policy`,
];

                                
let separateWindowId = null;               
let lastKnownBounds = null;                        

const DEFAULT_SEPARATE_WINDOW_BOUNDS = {
  left: 100,
  top: 100,
  width: 400,
  height: 400,
};

   
                                       
                                
   
async function persistSeparateWindowBounds(bounds) {
  if (!bounds) return;
  try {
    await browser.storage.local.set({ [STOKEY_SEPARATE_WINDOW]: bounds });
    kissLog("Final separate window bounds saved to storage", bounds);
  } catch (err) {
    kissLog("Save separate window bounds error", err);
  }
}

   
                              
   
async function openSeparateWindowWithSavedBounds() {
  try {
                                                        
    if (separateWindowId !== null) {
      const allWindows = await browser.windows.getAll();
      const existingWin = allWindows.find((w) => w.id === separateWindowId);
      if (existingWin) {
        await browser.windows.update(separateWindowId, { focused: true });
        kissLog("Separate window is ready");
        return existingWin;
      }
    }

    const stored = await browser.storage.local.get(STOKEY_SEPARATE_WINDOW);
    const saved = stored && stored[STOKEY_SEPARATE_WINDOW];
    const bounds = Object.assign(
      {},
      DEFAULT_SEPARATE_WINDOW_BOUNDS,
      saved || {}
    );

    const win = await browser.windows.create({
      url: "popup.html#tranbox",
      type: "popup",                        
      left: Math.round(bounds.left),
      top: Math.round(bounds.top),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      focused: true,
    });

    separateWindowId = win.id;
    lastKnownBounds = {
      left: win.left,
      top: win.top,
      width: win.width,
      height: win.height,
    };

    return win;
  } catch (err) {
    kissLog("open separate window error", err);
  }
}

   
                           
                                 
   
async function updateCacheFromActual(windowId) {
  try {
    const win = await browser.windows.get(windowId);
                                          
    if (win && win.state === "normal") {
      lastKnownBounds = {
        left: Math.round(win.left),
        top: Math.round(win.top),
        width: Math.round(win.width),
        height: Math.round(win.height),
      };
      kissLog("Bounds cached via fallback:", lastKnownBounds);
                                                          
                                                                  
                                                                                       
    }
  } catch (e) {
                     
  }
}

   
                                               
   
browser.windows?.onFocusChanged?.addListener?.(async (windowId) => {
  if (separateWindowId !== null) {
    await updateCacheFromActual(separateWindowId);
  }
});

   
                 
                                                                    
   
browser.windows?.onBoundsChanged?.addListener?.((win) => {
  if (separateWindowId !== null && win.id === separateWindowId) {
                                                                                                     
    lastKnownBounds = {
      left: win.left ?? lastKnownBounds.left,
      top: win.top ?? lastKnownBounds.top,
      width: win.width ?? lastKnownBounds.width,
      height: win.height ?? lastKnownBounds.height,
    };
  }
});

   
            
                                                            
                                 
   
browser.windows?.onRemoved?.addListener?.(async (windowId) => {
  if (windowId === separateWindowId) {
    if (lastKnownBounds) {
      await persistSeparateWindowBounds(lastKnownBounds);
    }

    separateWindowId = null;
    lastKnownBounds = null;
  }
});

   
                 
                                                            
   
async function addContextMenus(contextMenuType = 1) {
  try {
                                             
    await browser.contextMenus.removeAll();
  } catch (err) {
    kissLog("remove contextMenus", err);
  }

  switch (contextMenuType) {
    case 1:
                                  
      browser.contextMenus.create({
        id: CMD_TOGGLE_TRANSLATE,
        title: browser.i18n.getMessage("toggle_translate"),
        contexts: ["page"],
      });
      browser.contextMenus.create({
        id: CMD_OPEN_TRANBOX,
        title: browser.i18n.getMessage("translate_selection"),
        contexts: ["selection"],
      });
      break;
    case 2:
                                                
      browser.contextMenus.create({
        id: CMD_TOGGLE_TRANSLATE,
        title: browser.i18n.getMessage("toggle_translate"),
        contexts: ["page", "selection"],
      });
      browser.contextMenus.create({
        id: CMD_TOGGLE_TRANSLATE_ONLY,
        title: browser.i18n.getMessage("toggle_translate_only"),
        contexts: ["page", "selection"],
      });
      browser.contextMenus.create({
        id: CMD_TOGGLE_STYLE,
        title: browser.i18n.getMessage("toggle_style"),
        contexts: ["page", "selection"],
      });
      browser.contextMenus.create({
        id: CMD_OPEN_TRANBOX,
        title: browser.i18n.getMessage("open_tranbox"),
        contexts: ["page", "selection"],
      });
      browser.contextMenus.create({
        id: "options_separator",
        type: "separator",
        contexts: ["page", "selection"],
      });
      browser.contextMenus.create({
        id: CMD_OPEN_OPTIONS,
        title: browser.i18n.getMessage("open_options"),
        contexts: ["page", "selection"],
      });
      break;
    default:
  }
}

   
                                                          
                                                    
                                              
                         
                                                                  
                                                                     
   
async function updateCspRules({ csplist, orilist }) {
  try {
                             
    const oldRules = await browser.declarativeNetRequest.getDynamicRules();

    const rulesToAdd = [];
    const idsToRemove = [];

                          
    if (csplist !== undefined) {
      let processedCspList = csplist;
      if (typeof processedCspList === "string") {
        processedCspList = processedCspList
          .split(/\n|,/)
          .map((url) => url.trim())
          .filter(Boolean);
      }

                                   
      const oldCspRuleIds = oldRules
        .filter(
          (rule) => rule.id >= CSP_RULE_START_ID && rule.id < ORI_RULE_START_ID
        )
        .map((rule) => rule.id);
      idsToRemove.push(...oldCspRuleIds);

                                                 
      const newCspRules = processedCspList.map((url, index) => ({
        id: CSP_RULE_START_ID + index,
        action: {
          type: "modifyHeaders",
          responseHeaders: CSP_REMOVE_HEADERS.map((header) => ({
            operation: "remove",
            header,
          })),
        },
        condition: {
          urlFilter: url,
          resourceTypes: ["main_frame", "sub_frame"],
        },
      }));
      rulesToAdd.push(...newCspRules);
    }

                                
    if (orilist !== undefined) {
      let processedOriList = orilist;
      if (typeof processedOriList === "string") {
        processedOriList = processedOriList
          .split(/\n|,/)
          .map((url) => url.trim())
          .filter(Boolean);
      }

                                      
      const oldOriRuleIds = oldRules
        .filter((rule) => rule.id >= ORI_RULE_START_ID)
        .map((rule) => rule.id);
      idsToRemove.push(...oldOriRuleIds);

                                                             
      const newOriRules = processedOriList.map((url, index) => {
        const condition = {
          urlFilter: url,
          resourceTypes: ["xmlhttprequest"],
        };

                                        
                                               
                                                                   
        const initiatorDomain = getRegistrableDomain(url);
        if (initiatorDomain) {
          condition.excludedInitiatorDomains = [initiatorDomain];
        }

        return {
          id: ORI_RULE_START_ID + index,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              { header: "Origin", operation: "set", value: url },
            ],
          },
          condition,
        };
      });
      rulesToAdd.push(...newOriRules);
    }

                                                                   
                                                   
    if (idsToRemove.length > 0 || rulesToAdd.length > 0) {
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: idsToRemove,
        addRules: rulesToAdd,
      });
    }
  } catch (err) {
    kissLog("update csp rules", err);
  }
}

   
                                               
   
async function registerMsgDisplayScript() {
  await messenger.messageDisplayScripts.register({
    js: [{ file: "/content.js" }],
  });
}

   
                                     
                                                                    
   
async function getUiLanguage() {
  try {
    const lang = await browser.i18n.getUILanguage();

    if (lang === "zh-TW") {
      return "zh_TW";
    } else if (lang.startsWith("zh")) {
      return "zh";
    } else if (["ja", "ko"].includes(lang.substring(0, 2))) {
      return lang.substring(0, 2);
    } else {
      return "en";
    }
  } catch (err) {
    kissLog("get UI language error", err);
    return "en";
  }
}

   
                             
                                              
   
browser.runtime.onInstalled.addListener(async (details) => {
  const uiLang = await getUiLanguage();
  await tryInitDefaultData(uiLang);
  if (details?.reason === "update") {
    await runDataMigration();
  }

                               
  if (process.env.REACT_APP_CLIENT === CLIENT_THUNDERBIRD) {
    registerMsgDisplayScript();
  }

  const { contextMenuType, csplist, orilist } = await getSettingWithDefault();

  addContextMenus(contextMenuType);
  updateCspRules({ csplist, orilist });
});

   
                            
                                                     
   
browser.runtime.onStartup.addListener(async () => {
  const { clearCache, contextMenuType, csplist, orilist, logLevel } =
    await getSettingWithDefault();

  logger.setLevel(logLevel);

  if (clearCache) {
    tryClearCaches();
  }

  if (process.env.REACT_APP_CLIENT === CLIENT_THUNDERBIRD) {
    registerMsgDisplayScript();
  }

                                                                      
  addContextMenus(contextMenuType);

  updateCspRules({ csplist, orilist });
});

   
                                                   
                                
                             
   
const injectToCurrentTab = async (func, args) => {
  const tabId = await getCurTabId();
  return browser.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: func,
    args: [args],
    world: "MAIN",                                                
  });
};

                  
let advertisingIdentityPromise;
const messageHandlers = {
  [MSG_TRANSLATION_RECEIPT]: async (args, sender) => {
    if (sender?.id && sender.id !== browser.runtime.id)
      throw new Error("Unsupported sender");
    return enqueueTranslationReceipt(args);
  },
  [MSG_DATA_SYNC]: async ({ method, args = [] }, sender) => {
    if (sender?.id && sender.id !== browser.runtime.id)
      throw new Error("Unsupported sender");
    if (!["route", "sync", "status", "resolve"].includes(method))
      throw new Error("Unsupported sync action");
    return dataSync[method](...args);
  },
  [MSG_AD_CLIENT_ID]: () => {
    if (!advertisingIdentityPromise)
      advertisingIdentityPromise = (async () => {
        const key = "advertising_anonymous_client";
        const existing = await storage.getObj(key);
        if (
          typeof existing === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            existing
          )
        )
          return existing;
        const id = crypto.randomUUID();
        await storage.setObj(key, id);
        return id;
      })().catch((error) => {
        advertisingIdentityPromise = null;
        throw error;
      });
    return advertisingIdentityPromise;
  },
  [MSG_TRANSLATION_GUEST_ID]: () => getLocalTranslationGuestId(),
  [MSG_FETCH]: (args) => fetchHandle(args),          
  [MSG_GET_HTTPCACHE]: (args) => getHttpCache(args),                
  [MSG_PUT_HTTPCACHE]: (args) => putHttpCache(args),                
  [MSG_SHA256]: ({ text = "", salt = "" } = {}) => sha256(text, salt),          
  [MSG_OPEN_OPTIONS]: (args) => openOptionsPage(args?.hash),                      
  [MSG_ACCOUNT_GET]: async () => {
    const account = (await storage.getObj(STOKEY_ACCOUNT)) || null;
                                         
    if (!account?.accessToken) {
      const loggedOutAt = await storage.getObj(STOKEY_ACCOUNT_LOGOUT);
      if (loggedOutAt) {
        return { account: null, loggedOut: true };
      }
    }
    return account;
  },                  
  [MSG_ACCOUNT_SET]: async ({ account } = {}) => {
                                              
    await storage.setObj(STOKEY_ACCOUNT, account ?? null);
                                   
                                      
    if (account?.accessToken) {
      try {
        await syncMembershipStatus(account.accessToken);
      } catch (err) {
        kissLog("sync membership on account set", err);
      }
    }
    return true;
  },
  [MSG_INJECT_JS]: (args) => injectToCurrentTab(injectInlineJsBg, args),               
  [MSG_INJECT_CSS]: (args) => injectToCurrentTab(injectInternalCss, args),                
  [MSG_UPDATE_CSP]: (args) => updateCspRules(args),                 
  [MSG_CONTEXT_MENUS]: (args) => addContextMenus(args),            
  [MSG_COMMAND_SHORTCUTS]: () => browser.commands.getAll(),                        
  [MSG_SET_LOGLEVEL]: (args) => logger.setLevel(args),                
  [MSG_CLEAR_CACHES]: () => tryClearCaches(),          
  [MSG_GET_CACHES_SIZE]: () => getCachesSize(),             
  [MSG_OPEN_SEPARATE_WINDOW]: () => openSeparateWindowWithSavedBounds(),             
  [MSG_UPDATE_ICON]: (args, sender) => updateIcon(args, sender?.tab?.id),               
                                                        
  [MSG_TRANS_COLORBLIND]: () => sendTabMsg(MSG_TRANS_COLORBLIND),
  [MSG_ENSURE_CONTENT_UI]: async (args, sender) => {
                                                                           
    const tabId = sender?.tab?.id;
    if (tabId == null) return false;
    await browser.scripting.executeScript({
      target: { tabId, frameIds: [0] },                  
      files: ["content-ui.js"],
      world: "ISOLATED",
    });
    return true;
  },
};

   
                                     
   
browser.runtime.onMessage.addListener(async ({ action, args }, sender) => {
  const handler = messageHandlers[action];
  if (!handler) {
    throw new Error(`Message action is unavailable: ${action}`);
  }

                                               
  return handler(args, sender);
});

   
                                   
                                                        
   
browser.commands?.onCommand?.addListener?.((command) => {
  switch (command) {
    case CMD_TOGGLE_TRANSLATE:
      sendTabMsg(MSG_TRANS_TOGGLE);
      break;
    case CMD_TOGGLE_TRANSLATE_ONLY:
      sendTabMsg(MSG_TRANS_TOGGLE_ONLY);
      break;
    case CMD_OPEN_TRANBOX:
      sendTabMsg(MSG_OPEN_TRANBOX);
      break;
    case CMD_TOGGLE_TRANBOX:
      sendTabMsg(MSG_TRANSBOX_TOGGLE);
      break;
    case CMD_TOGGLE_STYLE:
      sendTabMsg(MSG_TRANS_TOGGLE_STYLE);
      break;
    case CMD_OPEN_OPTIONS:
      openOptionsPage();
      break;
    case CMD_OPEN_SEPARATE_WINDOW:
      if (messageHandlers[MSG_OPEN_SEPARATE_WINDOW]) {
        messageHandlers[MSG_OPEN_SEPARATE_WINDOW]();
      }
      break;
    default:
  }
});

   
                
                                                       
   
browser?.contextMenus?.onClicked?.addListener?.(
  ({ menuItemId, selectionText }) => {
    switch (menuItemId) {
      case CMD_TOGGLE_TRANSLATE:
        sendTabMsg(MSG_TRANS_TOGGLE);
        break;
      case CMD_TOGGLE_TRANSLATE_ONLY:
        sendTabMsg(MSG_TRANS_TOGGLE_ONLY);
        break;
      case CMD_TOGGLE_STYLE:
        sendTabMsg(MSG_TRANS_TOGGLE_STYLE);
        break;
      case CMD_OPEN_TRANBOX:
        sendTabMsg(MSG_OPEN_TRANBOX, { text: selectionText });
        break;
      case CMD_TOGGLE_TRANBOX:
        sendTabMsg(MSG_TRANSBOX_TOGGLE);
        break;
      case CMD_OPEN_OPTIONS:
        openOptionsPage();
        break;
      default:
    }
  }
);

   
                           
                                                                                      
                               
                                                            
   
async function handleStreamFetch(port, args) {
  const { input, init, opts } = args;
  const controller = new AbortController();
  let disconnected = false;
  const handleDisconnect = () => {
    disconnected = true;
                                            
    controller.abort();
  };
  port.onDisconnect.addListener(handleDisconnect);

  try {
    for await (const chunk of fetchStreamNative(input, init, {
      httpTimeout: opts.httpTimeout,
      signal: controller.signal,
    })) {
      if (disconnected) break;
                             
      port.postMessage({ type: "delta", data: chunk });
    }
                                               
    if (!disconnected) {
      port.postMessage({ type: "done" });
    }
  } catch (error) {
                                          
    if (error.name !== "AbortError") {
      if (!disconnected) {
                                             
        port.postMessage({
          type: "error",
          error: error.message,
          bizCode: error.bizCode,
        });
      }
    }
  } finally {
    port.onDisconnect.removeListener?.(handleDisconnect);
  }
}

   
                             
                                                                          
   
browser.runtime.onConnect.addListener((port) => {
  if (port.name === PORT_STREAM_FETCH) {
    port.onMessage.addListener((message) => {
      if (message.action === "start") {
        handleStreamFetch(port, message.args);
      }
    });
  }
});

                                                  
                                                                  
globalThis.chrome?.sidePanel
  ?.setPanelBehavior?.({ openPanelOnActionClick: true })
  ?.catch?.(() => {});

                                   
                             
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STOKEY_ACCOUNT]) return;
  const parseAccount = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  };
  const account = parseAccount(changes[STOKEY_ACCOUNT].newValue);
  const prevAccount = parseAccount(changes[STOKEY_ACCOUNT].oldValue);
                                    
                              
  if (!account?.accessToken && !prevAccount?.accessToken) return;
                                            
                                             
  if (!account?.accessToken) {
                                           
                                    
    storage.setObj(STOKEY_ACCOUNT_LOGOUT, Date.now()).catch(() => {});
    storage.getObj(STOKEY_MEMBER).then((prev) => {
      const member = prev || {};
      if (member.plan === "premium") {
        storage.setObj(STOKEY_MEMBER, {
          ...member,
          plan: "free",
          expireAt: null,
        });
      }
    });
  } else {
                               
    storage.del(STOKEY_ACCOUNT_LOGOUT).catch(() => {});
  }
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) =>
      browser.tabs
        .sendMessage(tab.id, {
          action: MSG_ACCOUNT_PUSH,
          account,
                                              
          reason: account?.accessToken ? "login" : "logout",
        })
        .catch(() => {})
    );
  });
});

                                                                                                     
const scheduleMemberSync = () =>
  ensureSyncAlarm(browser.alarms).catch(() => {});
const attemptMemberSync = () => dataSync.sync().catch(() => false);
browser.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === MEMBER_SYNC_ALARM) return attemptMemberSync();
});
browser.runtime.onInstalled.addListener(() => {
  scheduleMemberSync();
  void attemptMemberSync();
});
browser.runtime.onStartup.addListener(() => {
  scheduleMemberSync();
  void attemptMemberSync();
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes[STOKEY_ACCOUNT] || changes[STOKEY_MEMBER]))
    void attemptMemberSync();
});
if (typeof globalThis.addEventListener === "function")
  globalThis.addEventListener("online", attemptMemberSync);
scheduleMemberSync();
const scheduleTranslationReceipts = () =>
  ensureTranslationReceiptAlarm(browser.alarms).catch(() => {});
browser.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === TRANSLATION_RECEIPT_ALARM)
    return flushTranslationReceipts();
});
browser.runtime.onInstalled.addListener(() => {
  scheduleTranslationReceipts();
  void flushTranslationReceipts();
});
browser.runtime.onStartup.addListener(() => {
  scheduleTranslationReceipts();
  void flushTranslationReceipts();
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STOKEY_ACCOUNT])
    void flushTranslationReceipts();
});
scheduleTranslationReceipts();
void flushTranslationReceipts();
const synchronizeBuiltinModels = () => refreshBuiltinModels().catch(() => {});
const scheduleBuiltinModels = () =>
  ensureBuiltinModelAlarm(browser.alarms).catch(() => {});
browser.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === BUILTIN_MODEL_ALARM) return synchronizeBuiltinModels();
});
browser.runtime.onInstalled.addListener(() => {
  scheduleBuiltinModels();
  void synchronizeBuiltinModels();
});
browser.runtime.onStartup.addListener(() => {
  scheduleBuiltinModels();
  void synchronizeBuiltinModels();
});
scheduleBuiltinModels();
void synchronizeBuiltinModels();

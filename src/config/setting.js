   
                   
                                                                               
   

import { LogLevel } from "../libs/log";
import {
  OPT_DICT_BING,
  OPT_SUG_YOUDAO,
  DEFAULT_HTTP_TIMEOUT,
  OPT_TRANS_QWEN,
  DEFAULT_API_LIST,
  OPT_LANGS_TO,
} from "./api";
import { CURRENT_SETTINGS_VERSION, PROMPT_MODE_FOLLOW_API } from "./prompt";
import { GLOBAL_KEY } from "./rules";
import { DEFAULT_CUSTOM_STYLES } from "./styles";

                    
export const OPT_SHORTCUT_TRANSLATE = "toggleTranslate";            
export const OPT_SHORTCUT_TRANSONLY = "toggleTransOnly";           
export const OPT_SHORTCUT_STYLE = "toggleStyle";            
export const OPT_SHORTCUT_POPUP = "togglePopup";              
export const OPT_SHORTCUT_SETTING = "openSetting";          
export const DEFAULT_SHORTCUTS = {
  [OPT_SHORTCUT_TRANSLATE]: ["AltLeft", "KeyQ"],                
  [OPT_SHORTCUT_STYLE]: ["AltLeft", "KeyC"],                
  [OPT_SHORTCUT_POPUP]: ["AltLeft", "KeyK"],                
  [OPT_SHORTCUT_SETTING]: ["AltLeft", "KeyO"],                
};

export const TRANS_MIN_LENGTH = 2;                                  
export const TRANS_MAX_LENGTH = 100000;              
export const TRANS_NEWLINE_LENGTH = 20;                     

                                           
export const DEFAULT_BLACKLIST = [
  "https://your-name.github.io/paralleltext/options.html",
  "https://translate.google.com",
  "https://www.deepl.com/translator",
];
export const DEFAULT_CSPLIST = [];                      
export const DEFAULT_ORILIST = ["https://dict.youdao.com"];                              

                            
export const OPT_INPUT_DOT_DISABLE = "-";           
export const OPT_INPUT_DOT_MOBILE = "mobile";               
export const OPT_INPUT_DOT_ALWAYS = "always";              

                    
export const OPT_INPUT_TRANS_SIGNS = ["/", "//", "\\", "\\\\", ">", ">>"];             
export const DEFAULT_INPUT_SHORTCUT = ["AltLeft", "KeyI"];                 
export const DEFAULT_INPUT_RULE = {
  transOpen: false,                                           
  blacklist: "",                
  apiSlug: OPT_TRANS_QWEN,                    
  fromLang: "auto",               
  toLang: "en",               
  triggerShortcut: DEFAULT_INPUT_SHORTCUT,         
  triggerCount: 1,             
  triggerTime: 200,               
  transSign: OPT_INPUT_TRANS_SIGNS[0],                     
  showDot: OPT_INPUT_DOT_MOBILE,             
};

                    
export const PHONIC_MAP = {
  en_phonic: ["英", "uk"],          
  us_phonic: ["美", "en"],          
};
               
export const OPT_TRANBOX_TRIGGER_CLICK = "click";                         
export const OPT_TRANBOX_TRIGGER_HOVER = "hover";                     
export const OPT_TRANBOX_TRIGGER_SELECT = "select";                    
export const OPT_TRANBOX_TRIGGER_DBLCLICK = "dblclick";                                 
export const OPT_TRANBOX_TRIGGER_ALL = [
  OPT_TRANBOX_TRIGGER_CLICK,
  OPT_TRANBOX_TRIGGER_HOVER,
  OPT_TRANBOX_TRIGGER_SELECT,
  OPT_TRANBOX_TRIGGER_DBLCLICK,
];
               
export const OPT_TRANBOX_BTN_POSITION_FIXED = "fixed";                     
export const OPT_TRANBOX_BTN_POSITION_MOUSE = "mouse";                 
export const OPT_TRANBOX_BTN_POSITION_ALL = [
  OPT_TRANBOX_BTN_POSITION_FIXED,
  OPT_TRANBOX_BTN_POSITION_MOUSE,
];
export const OPT_TRANBOX_INTERACT_CLICK = "click";                   
export const OPT_TRANBOX_INTERACT_DBLCLICK = "dblclick";                   
export const DEFAULT_TRANBOX_SHORTCUT = ["AltLeft", "KeyS"];                  

                                              
export const OPT_SKIPLANGS_SELECTION = [
  ["zh", "中文 Chinese"],
  ...OPT_LANGS_TO.filter(([code]) => code !== "zh-CN" && code !== "zh-TW"),
];

export const DEFAULT_TRANBOX_SETTING = {
  transOpen: true,              
  blacklist: "",               
  apiSlugs: [OPT_TRANS_QWEN],                    
  singleWordNoTrans: false,                             
  autoFavWord: false,                                            
  wordBookHighlightColor: "#ec407a",                     
  fromLang: "auto",
  toLang: "zh-CN",
  toLang2: "en",                   
  tranboxShortcut: DEFAULT_TRANBOX_SHORTCUT,
  btnOffsetX: 0,                    
  btnOffsetY: 0,                    
  boxOffsetX: 0,                
  boxOffsetY: 10,                
  hideTranBtn: false,                             
  hideClickAway: true,                      
  simpleStyle: false,                                
  followSelection: true,                               
  autoHeight: true,                     
  triggerMode: OPT_TRANBOX_TRIGGER_SELECT,               
  btnPositionMode: OPT_TRANBOX_BTN_POSITION_FIXED,                
  tranboxInteractMode: "-",                     
  skipLangs: [],                           

                           
  enDict: OPT_DICT_BING,               
  enSug: OPT_SUG_YOUDAO,             
  aiDictApiSlug: "-",
  aiDictPromptSlug: PROMPT_MODE_FOLLOW_API,
};

export const DEFAULT_MOUSEHOVER_KEY = ["ControlLeft"];                            
export const OPT_MOUSE_HOVER_DISPLAY_BILINGUAL = "bilingual";                        
export const OPT_MOUSE_HOVER_DISPLAY_BUBBLE = "bubble";                            
export const DEFAULT_MOUSE_HOVER_BUBBLE_STYLE = `max-width: min(420px, calc(100vw - 32px));
padding: 10px 12px;
border-radius: 8px;
background: rgb(25, 118, 210);
color: #fff;
font-size: 14px;
line-height: 1.5;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
backdrop-filter: blur(8px);`;
export const DEFAULT_MOUSE_HOVER_SETTING = {
  useMouseHover: false,              
  blacklist: "",                  
  mouseHoverKey: DEFAULT_MOUSEHOVER_KEY,       
  mouseHoverKey2: [],          
  displayMode: OPT_MOUSE_HOVER_DISPLAY_BILINGUAL,              
  apiSlug: GLOBAL_KEY,                       
  bubbleStyle: DEFAULT_MOUSE_HOVER_BUBBLE_STYLE,               
};

                                     
export const DEFAULT_SETTING = {
  version: CURRENT_SETTINGS_VERSION,
  darkMode: "auto",                                                  
  uiLang: "en",                 
                                                          
                                                                
  minLength: TRANS_MIN_LENGTH,                   
  maxLength: TRANS_MAX_LENGTH,                   
  newlineLength: TRANS_NEWLINE_LENGTH,
  httpTimeout: DEFAULT_HTTP_TIMEOUT,            
  clearCache: false,                              
  autoTranslateClipboard: false,                                  
  injectRules: true,                           
  fabClickAction: 0,                                   
                                        
                                                 
                                        
  contextMenuType: 1,                                       
                                                      
                                            
                                                
                                               
  transApis: DEFAULT_API_LIST,                            
  prompts: [],                                               
  deletedTransApiSlugs: [],                   
                                                               
  shortcuts: DEFAULT_SHORTCUTS,             
  inputRule: DEFAULT_INPUT_RULE,               
  tranboxSetting: DEFAULT_TRANBOX_SETTING,                 
                                                           
  touchModes: [2],                                    
  blacklist: DEFAULT_BLACKLIST.join(",\n"),                     
  csplist: DEFAULT_CSPLIST.join(",\n"),                                       
  orilist: DEFAULT_ORILIST.join(",\n"),                                      
                                           
  skipLangs: [],                                          
  translateVariants: true,                               
  transInterval: 100,                   
  langDetector: "-",                                              
  mouseHoverSetting: DEFAULT_MOUSE_HOVER_SETTING,                 
  preInit: false,                                                                 
  transAllnow: false,                          
  logLevel: LogLevel.INFO.value,                  
  rootMargin: 500,                                  
  customStyles: DEFAULT_CUSTOM_STYLES,                            
};

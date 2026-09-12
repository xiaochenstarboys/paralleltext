   
                 
                                                                       
   

import { OPT_TRANS_QWEN } from "./api";
import { OPT_STYLE_NONE } from "./styles";

                  
export const GLOBAL_KEY = "*";                   
export const REMAIN_KEY = "-";                   
export const SHADOW_KEY = ">>>";                                  

export const DEFAULT_COLOR = "#209CEE";                    

export const DEFAULT_TRANS_TAG = "font";                       
export const DEFAULT_SELECT_STYLE =
  "-webkit-line-clamp: unset; max-height: none; height: auto;";                                     

                      
export const OPT_TIMING_PAGESCROLL = "mk_pagescroll";                          
export const OPT_TIMING_PAGEOPEN = "mk_pageopen";                            
export const OPT_TIMING_MOUSEOVER = "mk_mouseover";                             
export const OPT_TIMING_CONTROL = "mk_ctrlKey";                        
export const OPT_TIMING_SHIFT = "mk_shiftKey";                      
export const OPT_TIMING_ALT = "mk_altKey";                    
export const OPT_TIMING_ALL = [
  OPT_TIMING_PAGESCROLL,
  OPT_TIMING_PAGEOPEN,
  OPT_TIMING_MOUSEOVER,
  OPT_TIMING_CONTROL,
  OPT_TIMING_SHIFT,
  OPT_TIMING_ALT,
];

                                             
export const OPT_SPLIT_PARAGRAPH_DISABLE = "split_disable";          
export const OPT_SPLIT_PARAGRAPH_TEXTLENGTH = "split_textlength";                   
export const OPT_SPLIT_PARAGRAPH_PUNCTUATION = "split_punctuation";                             
export const OPT_SPLIT_PARAGRAPH_ALL = [
  OPT_SPLIT_PARAGRAPH_DISABLE,
  OPT_SPLIT_PARAGRAPH_PUNCTUATION,
  OPT_SPLIT_PARAGRAPH_TEXTLENGTH,
];

                                
export const DEFAULT_SELECTOR =
  "h1, h2, h3, h4, h5, h6, li, p, dd, blockquote, figcaption, label, legend";
                                                    
export const DEFAULT_IGNORE_SELECTOR =
  "button, footer, pre, mark, nav, svg, img[src*='.svg'], [class*='logo'] svg, [id*='logo'] svg";
                                      
export const DEFAULT_KEEP_SELECTOR = `code, cite, math, .math, a:has(code)`;

                         
export const DEFAULT_RULE = {
  pattern: "",                  
  enabled: true,                   
  selector: "",                   
  keepSelector: "",                     
  blockSelector: "",                   
  terms: "",                            
  aiTerms: "",                   
  apiSlug: GLOBAL_KEY,                              
  fromLang: GLOBAL_KEY,                     
  toLang: GLOBAL_KEY,                    
  textStyle: GLOBAL_KEY,                    
  wrapOriginal: GLOBAL_KEY,                    
  originalTextStyle: GLOBAL_KEY,                    
  transOpen: GLOBAL_KEY,                      
                              
                                      
  textExtStyle: "",                       
  termsStyle: "",                    
  highlightStyle: "",              
  selectStyle: "",                                 
  parentStyle: "",                      
  grandStyle: "",                       
  injectJs: "",                       
                                 
  transOnly: GLOBAL_KEY,                        
  transOnlyRevert: GLOBAL_KEY,                          
  transOnlyRevertDelay: GLOBAL_KEY,                   
  transOrder: GLOBAL_KEY,                                                             
                                                   
  transTag: GLOBAL_KEY,                                  
  transTitle: GLOBAL_KEY,                          
                                                       
                                                        
                                         
                                         
                                          
  transStartHook: "",                                      
  transEndHook: "",                    
                                        
  autoScan: GLOBAL_KEY,                               
  hasRichText: GLOBAL_KEY,                                 
  hasShadowroot: GLOBAL_KEY,                                     
  scanAll: GLOBAL_KEY,                              
  isPlainText: GLOBAL_KEY,                      
  rootsSelector: "",                     
  ignoreSelector: "",                        
  splitParagraph: GLOBAL_KEY,            
  splitLength: 0,                
};

                               
export const GLOBLA_RULE = {
  pattern: "*",          
  enabled: true,
  selector: DEFAULT_SELECTOR,           
  keepSelector: DEFAULT_KEEP_SELECTOR,             
  blockSelector: "",
  terms: "",
  aiTerms: "",
  apiSlug: OPT_TRANS_QWEN,                   
  fromLang: "auto",              
  toLang: "zh-CN",             
  textStyle: OPT_STYLE_NONE,                   
  wrapOriginal: "false",                  
  originalTextStyle: OPT_STYLE_NONE,              
  transOpen: "true",                             
                                         
                                                     
  textExtStyle: "",
  termsStyle: "font-weight: bold;",            
  highlightStyle: "color: red;",            
  selectStyle: DEFAULT_SELECT_STYLE,
  parentStyle: "",
  grandStyle: "",
  injectJs: "",
  injectCss: "",
  transOnly: "false",                   
  transOnlyRevert: "false",
  transOnlyRevertDelay: "0.5",
                                                              
  transTag: DEFAULT_TRANS_TAG,
  transTitle: "false",                    
                                                   
                                                    
                                         
                                         
                                   
  transStartHook: "",
  transEndHook: "",
                                        
  autoScan: "true",                         
  hasRichText: "true",                                
  hasShadowroot: "false",                                       
  scanAll: "false",
  isPlainText: "false",                      
  rootsSelector: "body",
  ignoreSelector: DEFAULT_IGNORE_SELECTOR,
  splitParagraph: OPT_SPLIT_PARAGRAPH_DISABLE,
  splitLength: 100,
  transOrder: "original-first",                                                             
};

                  
export const DEFAULT_RULES = [GLOBLA_RULE];

                                   
                                                                                               
const RULES_MAP = {
                               
                              
       
  "en.wikipedia.org": {
    ignoreSelector: `.button, code, footer, form, mark, pre, .mwe-math-element, .mw-editsection`,
  },
  "news.ycombinator.com": {
    selector: `p, .titleline, .commtext, .hn-item-title, .hn-comment-text, .hn-story-title`,
    keepSelector: `code, img, svg, pre, .sitebit`,
    ignoreSelector: `button, code, footer, form, header, mark, nav, pre, .reply`,
    autoScan: `false`,
  },
  "twitter.com, https://x.com": {
    selector: `[data-testid='tweetText'], [data-testid='twitter-article-title'], [data-testid='UserDescription'], .public-DraftStyleDefault-block, span.text-body, div.css-175oi2r.r-3pj75a div.css-175oi2r>span, div.css-175oi2r.r-3pj75a li>span, div.r-1s2bzr4>div.r-16dba41, div.r-16y2uox>div.r-1jeg54m`,
    keepSelector: `img, svg, a, span:has(a), div:has(a)`,
    ignoreSelector: `[data-testid='videoPlayer'], [data-testid^='tweetTextarea']`,
    autoScan: `false`,
    selectStyle: `-webkit-line-clamp: unset; max-height: none; height: auto;`,
  },
  "www.youtube.com/live_chat": {
    rootsSelector: `div#items`,
    selector: `span.yt-live-chat-text-message-renderer`,
    autoScan: `false`,
  },
  "www.youtube.com": {
    rootsSelector: `ytd-page-manager`,
    ignoreSelector: `aside, button, footer, form, header, pre, mark, nav, #player, #container, .caption-window, .ytp-settings-menu`,
    selectStyle: `-webkit-line-clamp: unset; max-height: none; height: auto;`,
    parentStyle: `-webkit-line-clamp: unset; max-height: none; height: auto;`,
    grandStyle: `-webkit-line-clamp: unset; max-height: none; height: auto;`,
  },
  "web.telegram.org": {
    autoScan: `false`,
    selector: ".text-content, .embedded-text-wrapper",
    rootsSelector: ".Transition",
  },
  "github.com": {
    autoScan: `false`,
    selector: `h1, h2, h3, h4, h5, h6, .markdown-body li, p, dd, blockquote, figcaption, label, legend, .user-profile-bio>div, [data-testid="results-list"] .search-match, .Subhead-description, [class^="prc-SelectPanel-Subtitle-"], [class^="prc-ActionList-ItemLabel-"], [role="dialog"] .overflow-auto, .h4, .repos-list-description, .discussion-title, [class*="PinnedIssue-module__Link"] span, .js-wiki-sidebar-page-container :is(.Truncate-text, .Link--primary)`,
    ignoreSelector: `button, p.pinned-item-desc+p`,
  },
};

                                      
export const BUILTIN_RULES = Object.entries(RULES_MAP).map(
  ([pattern, rule]) => ({
                       
    ...rule,
    pattern,
  })
);

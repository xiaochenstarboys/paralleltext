import {
  APP_LCNAME,
  APP_CONSTS,
  OPT_STYLE_FUZZY,
  GLOBLA_RULE,
  GLOBAL_KEY,
  DEFAULT_SETTING,
                            
  OPT_STYLE_NONE,
  OPT_STYLE_COLORFUL,
  OPT_STYLE_BLOCK_SET,
  DEFAULT_API_SETTING,
  DEFAULT_MOUSE_HOVER_BUBBLE_STYLE,
  OPT_MOUSE_HOVER_DISPLAY_BUBBLE,
  OPT_SPLIT_PARAGRAPH_PUNCTUATION,
  OPT_SPLIT_PARAGRAPH_DISABLE,
  OPT_SPLIT_PARAGRAPH_TEXTLENGTH,
  API_SPE_TYPES,
  MSG_INJECT_CSS,
  MSG_UPDATE_ICON,
  newI18n,
} from "../config";
import { resolveApiPromptSettings } from "../config/prompt";
import { interpreter } from "./interpreter";
import { clearFetchPool } from "./pool";
import { debounce, scheduleIdle, genEventName, parseAITerms } from "./utils";
import { normalizeTermLang, termKeyToRegexSource } from "./termsText";
import { translateWithEngineChain } from "./translateWithEngineChain";
import {
  createTranslationOperation,
  confirmTranslationPaint,
} from "./translationOperation";
import { escapeHTML } from "./html";
import { apiTranslate } from "../apis";
import { kissLog } from "./log";
import { clearAllBatchQueue } from "./batchQueue";
import { genTextClass } from "./style";
import {
  createSentencePlan,
  createSentenceMark,
  markSourceSentences,
  clearSourceSentenceMarks,
} from "./sentenceColors";
import { createLoadingSVG, createRetrySVG } from "./svg";
import { shortcutRegister } from "./shortcut";
import { tryDetectLang } from "./detect";
import { isSameTranslationLanguage } from "./language";
import { trustedTypesHelper } from "./trustedTypes";
import { injectJs, INJECTOR } from "../injectors";
import { injectInternalCss } from "./injector";
import { isExt } from "./client";
import { upsertRule } from "./storage";
import { sendBgMsg } from "./msg";
import { getDocInfo } from "./docInfo";

                          
                                            
                                          
                                 
const isDuplicateTranslation = (original, translated) => {
  if (typeof original !== "string" || typeof translated !== "string") {
    return false;
  }
  const normalize = (str) => str.replace(/\s+/g, " ").trim();
  const source = normalize(original);
  return Boolean(source) && source === normalize(translated);
};

   
                    
                        
   
export class Translator {
                                                                   
  static displayCache = new WeakMap();

                
  static TAGS = {
             
    BREAK_LINE: new Set(["BR", "WBR"]),
           
    BLOCK: new Set([
      "ADDRESS",
      "ARTICLE",
      "ASIDE",
      "BLOCKQUOTE",
      "CANVAS",
      "DD",
      "DIV",
      "DL",
      "DT",
      "FIELDSET",
      "FIGCAPTION",
      "FIGURE",
      "FOOTER",
      "FORM",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "HEADER",
      "HR",
      "LI",
      "MAIN",
      "NAV",
      "NOSCRIPT",
      "OL",
      "P",
      "PRE",
      "SECTION",
      "TABLE",
      "TFOOT",
      "UL",
      "VIDEO",
    ]),
           
    INLINE: new Set([
             
      "ABBR",
      "ACRONYM",
      "B",
      "BDO",
      "BIG",
      "BR",
      "BUTTON",
      "CITE",
      "CODE",
      "DFN",
      "DEL",
      "FONT",
      "EM",
      "I",
      "IMG",
      "INPUT",
      "INS",
      "KBD",
      "LABEL",
      "MAP",
      "MARK",
      "OBJECT",
      "OUTPUT",
      "Q",
      "RUBY",
      "SAMP",
      "SCRIPT",
      "SELECT",
      "SMALL",
                
      "STRONG",
      "SUB",
      "SUP",
      "TEXTAREA",
      "TIME",
      "TT",
      "U",
      "VAR",
    ]),
                                     
    REPLACE: new Set([
      "ABBR",
      "CODE",
      "DFN",
      "IMG",
      "KBD",
      "OUTPUT",
      "RP",
      "RT",
      "SAMP",
      "SUB",
      "SUP",
      "SVG",
      "TIME",
      "VAR",
    ]),
                        
    WARP: new Set([
      "A",
      "B",
      "BDO",
      "BDI",
      "BIG",
      "CITE",
      "DEL",
      "EM",
      "FONT",
      "I",
      "INS",
      "MARK",
      "Q",
      "RUBY",
      "S",
      "SMALL",
      "SPAN",
      "STRONG",
      "U",
    ]),
  };

                  
  static KISS_CLASS = {
    warpper: `${APP_LCNAME}-wrapper`,
    inner: `${APP_LCNAME}-inner`,
    term: `${APP_LCNAME}-term`,
    br: `${APP_LCNAME}-br`,
    space: `${APP_LCNAME}-space`,
    retry: `${APP_LCNAME}-retry`,
    backup: `${APP_LCNAME}-backup`,
    original: `${APP_LCNAME}-original`,
    hoverBubble: `${APP_LCNAME}-hover-bubble`,
  };

                                           
  static BUILTIN_SKIP_PATTERNS = [
                                            
    /^(?:(?:https?|ftp|file):\/\/|www\.)[^\s/$.?#].[^\s]*$/i,

              
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

                                      
    /^(?:[a-zA-Z]:\\|\/|\\)(?:[\w\-. ]+\/|[\w\-. ]+\\)*[\w\-. ]*\.?[\w\-. ]*$/,

                        
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,

                                   
                                          
    /^[$\u00A2-\u00A5\u20A0-\u20CF]?\s?-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\s?(?:px|%|em|rem|pt|vw|vh|deg|s|ms)?$/,

                                 
    /^v?\d+(\.\d+){1,3}$/,

                          
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/,

                                             
    /^({{[^}]+}}|\${[^}]+}|__\w+__|%\w+)$/,

                                         
    /^(?:\.|#)[\w-]+$|^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,

                                                     
    /^@[\w.-]+$/,

                  
    /^&\w+;$/,

                                  
    /^\[\d+\]$/,

                                     
    /^\d{1,2}:\d{2}(:\d{2})?$/,

                                                     
    /^[^\s\\/:]+?\.[a-zA-Z0-9]{2,5}$/,

                                                                      
                                       
    /^(?:(?:https?|ftp):\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\s*[›»/>]\s*[^\s›»/>]+)*$/i,
  ];

  static DEFAULT_OPTIONS = DEFAULT_SETTING;          
  static DEFAULT_RULE = GLOBLA_RULE;          

                      
  static isElement(el) {
    return el instanceof Element;
  }

                        
  static isElementOrFragment(el) {
    return el instanceof Element || el instanceof DocumentFragment;
  }

     
                         
                                                              
                                                                      
                                                            
                                   
                       
     
  static isBlockNode(el) {
    if (!Translator.isElementOrFragment(el)) return false;

                                
    if (el.attributes?.display?.value?.includes("inline")) return false;
                               
    if (el.attributes?.display?.value?.includes("block")) return true;

                          
    if (Translator.TAGS.INLINE.has(el.nodeName?.toUpperCase())) return false;
                          
    if (Translator.TAGS.BLOCK.has(el.nodeName?.toUpperCase())) return true;

                      
    if (Translator.displayCache.has(el)) {
      return Translator.displayCache.get(el);
    }

                                            
    const isBlock = !window.getComputedStyle(el).display.startsWith("inline");
    Translator.displayCache.set(el, isBlock);
    return isBlock;
  }

                
  static hasBlockNode(el) {
    if (!Translator.isElementOrFragment(el)) return false;
    for (const child of el.childNodes) {
      if (Translator.isBlockNode(child)) {
        return true;
      }
    }
    return false;
  }

                   
  static hasTextNode(el) {
    if (!Translator.isElementOrFragment(el)) return false;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && /\S/.test(child.nodeValue)) {
        return true;
      }
    }
    return false;
  }

           
  static escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

           
  static KISS_IGNORE_SELECTOR = `.${Translator.KISS_CLASS.warpper}, .${Translator.KISS_CLASS.hoverBubble},
  #${APP_CONSTS.fabID}, .${APP_CONSTS.fabID}_warpper,
  #${APP_CONSTS.boxID}, .${APP_CONSTS.boxID}_warpper,
  #${APP_CONSTS.popupID}, .${APP_CONSTS.popupID}_warpper`;

  static BUILTIN_IGNORE_SELECTOR = `address, area, audio, br, canvas,
  cite, data, datalist, embed, head, iframe, input, noscript, map,
  object, option, param, picture, progress,
  select, script, style, svg, track, textarea, template,
  video, wbr, .notranslate, [contenteditable='true'], [translate='no']`;

  #setting;        
  #rule;      
  #isInitialized = false;         
  #isJsInjected = false;          
  #isShadowRootJsInjected = false;   
  #mouseHoverEnabled = false;          
  #enabled = false;          
  #runId = 0;               

  #transOnlyRevertTimer = null;
  #transOnlyRevertTarget = null;
  #transOnlyRevertEnabled = false;
  #boundTransOnlyMouseOver = null;
  #boundTransOnlyMouseOut = null;
  #termValues = [];               
  #combinedTermsRegex;             
  #combinedSkipsRegex;             

  #placeholderCache = null;          
  #translationTagName = APP_LCNAME;            
  #eventName = "";          
  #docInfo = {};        
  #glossary = {};        
  #termsGlossary = {};                           
  #blockSelectorInvalid = false;                   
  #textClass = {};             
  #textSheet = null;                                             
  #textStylesRaw = "";                                              
  #useSheetFallback = false;                                                         
  #apisMap = new Map();            
  #requestController = new AbortController();
  #translationOperation = null;

  #observedNodes = new WeakSet();                           
  #translationNodes = new WeakMap();                  
  #viewNodes = new Set();               
  #processedNodes = new WeakMap();                      
  #rootNodes = new Set();           
  #skipMoNodes = new WeakSet();           
  #ignoredMutationTargets = new WeakSet();                        
  #plainTextPreprocessingNodes = new WeakSet();                   

  #removeKeydownHandler;           
  #removeKeydownHandler2;             
  #hoveredNode = null;                
  #hoverPointer = { x: 0, y: 0 };                   
  #hoverBubbleNode = null;            
  #hoverBubbleTarget = null;               
  #hoverBubbleRunId = 0;                 
  #hoverOriginalTimer = null;                
  #hoverOriginalTimerTarget = null;                 
  #boundMouseMoveHandler;        
  #boundKeyDownHandler;        
  #windowMessageHandler = null;
  #boundFavoriteWordChange = null;
  #boundFavoriteMouseOver = null;
  #boundFavoriteMouseOut = null;

  #debouncedFindShadowRoot = null;

  #io;                        
  #mo;                    
  #dmm;                      

  #rescanQueue = new Set();           
  #isQueueProcessing = false;            
  #anchorFramePending = false;               
  #anchorFrameAnchor = null;            

                                                                   
  #captureViewportAnchor(excludedElements) {
    if (!document.elementFromPoint || !window.scrollBy) return null;

                                                         
    const points = [0.5, 0.33, 0.66];
    for (const ratio of points) {
      const x = Math.max(0, Math.floor(window.innerWidth / 2));
      const y = Math.max(
        0,
        Math.min(window.innerHeight - 1, Math.floor(window.innerHeight * ratio))
      );
      const element = document.elementFromPoint(x, y);
      let anchor = this.#normalizeViewportAnchor(element);
                                      
      while (anchor && excludedElements?.has(anchor)) {
        anchor = anchor.parentElement || anchor.getRootNode?.()?.host || null;
      }
      if (!anchor?.isConnected) continue;

      const rect = anchor.getBoundingClientRect();
      if (rect.width || rect.height) {
        return { element: anchor, top: rect.top };
      }
    }

    return null;
  }

                                                
  #normalizeViewportAnchor(element) {
    if (!element) return null;

    const wrapper = element.closest?.(`.${Translator.KISS_CLASS.warpper}`);
    if (!wrapper) return element;

    const { nodes } = this.#translationNodes.get(wrapper) || {};
    const originalNode = nodes?.find((node) => node.isConnected);
    if (originalNode?.nodeType === Node.ELEMENT_NODE) return originalNode;
    if (originalNode?.parentElement?.isConnected)
      return originalNode.parentElement;

    return wrapper.previousElementSibling || wrapper.parentElement;
  }

                                   
  #restoreViewportAnchor(anchor) {
    if (!anchor?.element?.isConnected) return;

    const scrollingElement =
      document.scrollingElement || document.documentElement;
    if (!scrollingElement) return;

    const overflowY = window.getComputedStyle(scrollingElement).overflowY;
    const canScrollDocument =
      scrollingElement.scrollHeight > scrollingElement.clientHeight &&
      overflowY !== "hidden" &&
      overflowY !== "clip";
    if (!canScrollDocument) return;

    const currentTop = anchor.element.getBoundingClientRect().top;
    const offset = currentTop - anchor.top;
                                 
    if (Math.abs(offset) > 0.5) {
      window.scrollBy(0, offset);
    }
  }

                                    
                                       
                                           
                                                          
  #withViewportAnchor(callback, excludedElements) {
    if (!this.#anchorFramePending) {
      this.#anchorFramePending = true;
      this.#anchorFrameAnchor = this.#captureViewportAnchor(excludedElements);
      requestAnimationFrame(() => {
        const anchor = this.#anchorFrameAnchor;
        this.#anchorFramePending = false;
        this.#anchorFrameAnchor = null;
        this.#restoreViewportAnchor(anchor);
      });
    }
    return callback();
  }

         
  get #ignoreSelector() {
    if (this.#rule.scanAll === "true" || this.#rule.isPlainText) {
      return Translator.KISS_IGNORE_SELECTOR;
    }

    const selectors = [Translator.KISS_IGNORE_SELECTOR];
    if (this.#rule.autoScan !== "false") {
      selectors.push(Translator.BUILTIN_IGNORE_SELECTOR);
    }

    const userSelector = this.#rule.ignoreSelector?.trim();
    if (userSelector) {
      selectors.push(userSelector);
    }

    return selectors.join(", ");
  }

  #isIgnoredElement(node) {
    return (
      node?.nodeType === Node.ELEMENT_NODE &&
      node.matches?.(this.#ignoreSelector)
    );
  }

  #matchesBlockSelector(node) {
    const selector = this.#rule.blockSelector?.trim();
    if (
      !selector ||
      this.#blockSelectorInvalid ||
      !Translator.isElement(node)
    ) {
      return false;
    }

    try {
      return node.matches(selector);
    } catch (err) {
      this.#blockSelectorInvalid = true;
      kissLog("invalid blockSelector", err);
      return false;
    }
  }

  #appendCssText(node, cssText, label) {
    if (typeof cssText !== "string" || !cssText.trim()) return;

    try {
      const style = node?.style;
      if (
        !style ||
        typeof style !== "object" ||
        typeof style.cssText !== "string"
      ) {
        return;
      }

      style.cssText = `${style.cssText || ""}${cssText}`;
    } catch (err) {
      kissLog("append rule style error", label, err);
    }
  }

  #isBlockNode(node) {
    if (this.#matchesBlockSelector(node)) return true;
    return Translator.isBlockNode(node);
  }

  #hasBlockNode(node) {
    if (!Translator.isElementOrFragment(node)) return false;
    for (const child of node.childNodes) {
      if (this.#isBlockNode(child)) {
        return true;
      }
    }
    return false;
  }

                                     
                                                      
                                                        
                                 
  #canUseBlockLayout(hostNode) {
    if (!Translator.isElement(hostNode)) return false;
    if (!this.#isBlockNode(hostNode)) return false;

    const parent = hostNode.parentElement;
    if (!parent) return false;

    try {
      const display = window.getComputedStyle(parent).display;
      if (/(inline|flex|grid)/.test(display)) return false;
    } catch (err) {
      return false;
    }

    return true;
  }

  #getPlainTextChunkLimit() {
    const maxLength = Number(this.#setting.maxLength);
                                                     
    const hardLimit = Number.isFinite(maxLength)
      ? Math.max(1, maxLength - 1)
      : 3000;

                               
    return Math.min(3000, hardLimit);
  }

  #findPlainTextBreakIndex(text, limit) {
    const slice = text.slice(0, limit + 1);
    let breakIndex = -1;
                               
    const naturalBreakRegex = /(?:[。！？]+|[.?!]+(?=\s+|$)|\n+)/g;
    let match;

    while ((match = naturalBreakRegex.exec(slice)) !== null) {
      const candidate = match.index + match[0].length;
      if (candidate > 0 && candidate <= limit) {
        breakIndex = candidate;
      }
    }

    if (breakIndex > Math.floor(limit * 0.4)) {
      return breakIndex;
    }

    for (let i = limit; i > Math.floor(limit * 0.4); i--) {
      if (/\s/.test(text[i - 1])) {
        return i;
      }
    }

    return limit;
  }

  #readPlainTextNewline(source, offset) {
    let count = 0;
    let nextOffset = offset;

    while (nextOffset < source.length) {
      const char = source[nextOffset];
      if (char === "\r") {
        count++;
        nextOffset += source[nextOffset + 1] === "\n" ? 2 : 1;
      } else if (char === "\n") {
        count++;
        nextOffset++;
      } else {
        break;
      }
    }

    return count ? { count, nextOffset } : null;
  }

  #findPlainTextLineEnd(source, offset) {
    let cursor = offset;

    while (cursor < source.length) {
      const char = source[cursor];
      if (char === "\r" || char === "\n") break;
      cursor++;
    }

    return cursor;
  }

  #readNextPlainTextChunk(source, offset, limit) {
    if (offset >= source.length) return null;

    const newline = this.#readPlainTextNewline(source, offset);
    if (newline) {
      return {
        type: "break",
        count: Math.max(0, newline.count - 1),
        nextOffset: newline.nextOffset,
      };
    }

    const lineEnd = this.#findPlainTextLineEnd(source, offset);
    const lineLength = lineEnd - offset;

    if (lineLength <= limit) {
      return {
        type: "text",
        value: source.slice(offset, lineEnd),
        nextOffset: lineEnd,
      };
    }

                                         
    const splitIndex = this.#findPlainTextBreakIndex(
      source.slice(offset, lineEnd),
      limit
    );

    return {
      type: "text",
      value: source.slice(offset, offset + splitIndex),
      nextOffset: offset + splitIndex,
    };
  }

  #createPlainTextChunkNode(chunk) {
    if (chunk.type !== "text" || !chunk.value) return null;

    const span = document.createElement("span");
    span.style.cssText = "display: block; white-space: pre-wrap;";
    span.textContent = chunk.value;

    return span;
  }

  #appendPlainTextPreBatch(pre, state, isInitialBatch = false) {
    if (
      state.runId !== this.#runId ||
      !pre.isConnected ||
      !this.#rule.isPlainText
    ) {
      this.#plainTextPreprocessingNodes.delete(pre);
      return;
    }

    const limit = this.#getPlainTextChunkLimit();
    const maxNodes = isInitialBatch ? 20 : 100;
    const maxDuration = isInitialBatch ? Infinity : 10;
    const startedAt = performance.now?.() || Date.now();
    const fragment = document.createDocumentFragment();
    const textNodes = [];
    let nodeCount = 0;

    while (
      (state.offset < state.source.length || state.pendingBreaks > 0) &&
      nodeCount < maxNodes
    ) {
      if (state.pendingBreaks > 0) {
        fragment.appendChild(document.createElement("br"));
        state.pendingBreaks--;
        nodeCount++;
        continue;
      }

      const chunk = this.#readNextPlainTextChunk(
        state.source,
        state.offset,
        limit
      );
      if (!chunk) break;

      state.offset = chunk.nextOffset;

      if (chunk.type === "break") {
                                             
        state.pendingBreaks += chunk.count;
      } else {
        const node = this.#createPlainTextChunkNode(chunk);
        if (node) {
          fragment.appendChild(node);
          textNodes.push(node);
          nodeCount++;
        }
      }

      if (
        !isInitialBatch &&
        nodeCount > 0 &&
        (performance.now?.() || Date.now()) - startedAt >= maxDuration
      ) {
        break;
      }
    }

    if (fragment.childNodes.length) {
      pre.appendChild(fragment);
      textNodes.forEach((node) => this.#startObserveNode(node));
    }

    if (state.offset < state.source.length || state.pendingBreaks > 0) {
      scheduleIdle(() => this.#appendPlainTextPreBatch(pre, state), 100);
    } else {
      this.#plainTextPreprocessingNodes.delete(pre);
    }
  }

  #initPlainTextPre(pre) {
    if (pre.dataset.kissPreprocessed === "true") {
      return;
    }

                                                     
    const state = {
      source: pre.textContent || "",
      offset: 0,
      runId: this.#runId,
      pendingBreaks: 0,
    };

    pre.dataset.kissPreprocessed = "true";
    this.#plainTextPreprocessingNodes.add(pre);
    pre.replaceChildren();
    this.#appendPlainTextPreBatch(pre, state, true);
  }

         
                   
  get #apiSetting() {
               
                                      
                                                      
                                 
         
    return this.#apisMap.get(this.#rule.apiSlug) || DEFAULT_API_SETTING;
  }

                                 
  get #hoverBubbleApiSetting() {
    const apiSlug = this.#setting.mouseHoverSetting?.apiSlug;
    if (!apiSlug || apiSlug === GLOBAL_KEY) {
      return this.#apiSetting;
    }

    const apiSetting = this.#apisMap.get(apiSlug);
    return apiSetting && !apiSetting.isDisabled ? apiSetting : this.#apiSetting;
  }

  get #transAllnow() {
    const apiValue = this.#apisMap.get(this.#rule.apiSlug)?.transAllnow;
    if (apiValue !== undefined) {
      return apiValue === true || apiValue === "true";
    }

    return (
      this.#setting.transAllnow === true || this.#setting.transAllnow === "true"
    );
  }

  get #rootMargin() {
    const apiValue = this.#apisMap.get(this.#rule.apiSlug)?.rootMargin;
    const legacyValue = this.#setting.rootMargin;
    const value =
      apiValue !== undefined && apiValue !== ""
        ? apiValue
        : legacyValue !== undefined && legacyValue !== ""
          ? legacyValue
          : 500;
    const rootMargin = Number(value);

    return Number.isFinite(rootMargin) ? rootMargin : 500;
  }

                
  get #placeholderConfig() {
    if (this.#placeholderCache) {
      return this.#placeholderCache;
    }

    const [startDelimiter, endDelimiter] =
      this.#apiSetting.placeholder.split(" ");

                                     
    let tagName = this.#apiSetting.placetag;
    if (Array.isArray(tagName)) {
      tagName = tagName[0] || "i";
    }
    if (typeof tagName !== "string") {
      tagName = "i";       
    }

    const format = this.#apiSetting.placetagFormat || "compact";         
    const safeTag = "span";

                  
    let openRegex, closeRegex;
    if (format === "attribute") {
      openRegex = new RegExp(`<${tagName}\\s+i=(\\d+)>`, "gi");
      closeRegex = new RegExp(`<\\/${tagName}>`, "gi");
    } else {
      openRegex = new RegExp(`<${tagName}(\\d+)>`, "gi");
      closeRegex = new RegExp(`<\\/${tagName}(\\d+)>`, "gi");
    }

                                                      
                              
    const escapedStart = Translator.escapeRegex(startDelimiter);
    const escapedEnd = Translator.escapeRegex(endDelimiter);
    const placeholderPattern = `${escapedStart}\\d+${escapedEnd}`;
    const placeholderRegex = new RegExp(placeholderPattern, "g");

    const result = {
      startDelimiter,
      endDelimiter,
      tagName,
      format,
      safeTag,
      openRegex,
      closeRegex,
      placeholderRegex,
    };

    this.#placeholderCache = result;
    return result;
  }

  constructor({ rule = {}, setting = {} }) {
    this.#setting = { ...Translator.DEFAULT_OPTIONS, ...setting };
    this.#rule = {
      ...Translator.DEFAULT_RULE,
      ...rule,
      isPlainText: rule.isPlainText === true || rule.isPlainText === "true",
    };
    this.#apisMap = new Map(
      this.#setting.transApis.map((api) => [api.apiSlug, api])
    );

    this.#eventName = genEventName();
    this.#combinedSkipsRegex = new RegExp(
      Translator.BUILTIN_SKIP_PATTERNS.map((r) => `(${r.source})`).join("|")
    );

    this.#parseTerms(this.#rule.terms, this.#rule.toLang);
                                                         
                                  
    this.#glossary = {
      ...this.#termsGlossary,
      ...parseAITerms(this.#rule.aiTerms),
    };
    this.#createTextStyles();

    this.#boundMouseMoveHandler = this.#handleMouseMove.bind(this);
    this.#boundKeyDownHandler = this.#handleKeyDown.bind(this);

    this.#io = this.#createIntersectionObserver();
    this.#mo = this.#createMutationObserver();
    this.#dmm = this.#createDebounceMouseMover();

    this.#windowMessageHandler = this.#handleWindowMessage.bind(this);
    this.#debouncedFindShadowRoot = debounce(
      this.#findAndObserveShadowRoot.bind(this),
      300
    );

             
    if (this.#setting.mouseHoverSetting.useMouseHover) {
      this.#enableMouseHover();
    }

                     
    if (
      this.#rule.transOnly === "true" &&
      this.#rule.transOnlyRevert === "true"
    ) {
      this.#enableTransOnlyRevert();
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.#run());
    } else {
      this.#run();
    }
  }

       
  #run() {
    if (this.#rule.transOpen === "true") {
      this.enable();
    } else if (this.#setting.preInit) {
                                         
                                                        
      this.#init();
    }
  }

        
  #init() {
                                       
    if (this.#isInitialized) return;
    this.#isInitialized = true;

               
    this.#initInjector();

             
    if (this.#rule.isPlainText) {
      document.querySelectorAll("pre").forEach((pre) => {
        this.#initPlainTextPre(pre);
      });
    }

               
    document
      .querySelectorAll(this.#rule.rootsSelector || "body")
      .forEach((root) => {
        this.#startObserveRoot(root);
      });

    if (this.#rule.scanAll === "true" || this.#rule.hasShadowroot === "true") {
      this.#attachShadowRootListener();
      this.#findAndObserveShadowRoot();
    }
  }

  #handleWindowMessage(event) {
    if (event.data?.type === "KISS_SHADOW_ROOT_CREATED") {
      this.#debouncedFindShadowRoot();
    }
  }

  #attachShadowRootListener() {
    if (!this.#isShadowRootJsInjected) {
      const id = "kiss-translator-inject-shadowroot-js";
      injectJs(INJECTOR.shadowroot, id);

      this.#isShadowRootJsInjected = true;
    }

    window.addEventListener("message", this.#windowMessageHandler);
  }

  #removeShadowRootListener() {
    window.removeEventListener("message", this.#windowMessageHandler);
  }

                      
  #findAndObserveShadowRoot() {
    try {
      this.#findAllShadowRoots().forEach((shadowRoot) => {
        this.#startObserveShadowRoot(shadowRoot);
      });
    } catch (err) {
      kissLog("findAllShadowRoots", err);
    }
  }

         
  #createTextStyles() {
    const [textClass, textStyles] = genTextClass(this.#setting.customStyles);
    this.#textClass = textClass;
    this.#textStylesRaw = textStyles;

    try {
      const textSheet = new CSSStyleSheet();
      textSheet.replaceSync(textStyles);
      this.#textSheet = textSheet;
    } catch (err) {
      kissLog("createTextStyles: CSSStyleSheet not available", err);
                                                           
      this.#useSheetFallback = true;
    }
  }

                                               
  #injectSheet(shadowRoot) {
    if (this.#useSheetFallback || !this.#textSheet) {
      this.#injectSheetFallback(shadowRoot);
      return;
    }

    try {
      if (!shadowRoot.adoptedStyleSheets.includes(this.#textSheet)) {
        shadowRoot.adoptedStyleSheets = [
          ...shadowRoot.adoptedStyleSheets,
          this.#textSheet,
        ];
      }
    } catch {
                                                              
      this.#useSheetFallback = true;
      this.#injectSheetFallback(shadowRoot);
    }
  }

                                         
  #injectSheetFallback(shadowRoot) {
    const fallbackStyleId = `${APP_LCNAME}-fallback-style`;
    if (shadowRoot.getElementById(fallbackStyleId)) return;

    const style = document.createElement("style");
    style.id = fallbackStyleId;
    style.textContent = this.#textStylesRaw || "";
    shadowRoot.append(style);
  }

              
  #parseTerms(termsString, toLang = "") {
    this.#termValues = [];
    this.#combinedTermsRegex = null;
    this.#termsGlossary = {};

    if (!termsString || typeof termsString !== "string") return;

    const termPatterns = [];
    const lines = termsString.split(/\n|;/);            

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      let lastCommaIndex = trimmedLine.lastIndexOf(",");
      if (lastCommaIndex === -1) {
        lastCommaIndex = trimmedLine.length;
      }
      const key = trimmedLine.substring(0, lastCommaIndex).trim();
      const value = trimmedLine.substring(lastCommaIndex + 1).trim();

                                                     
      const langMatch = value.match(/^(.*)\[([a-zA-Z-]+)\]$/);
      if (langMatch) {
                                                   
        const termLang = normalizeTermLang(langMatch[2]);
        if (
          toLang &&
          toLang !== GLOBAL_KEY &&
          termLang !== "auto" &&
          termLang !== toLang
        ) {
          continue;
        }
      }
      const finalValue = langMatch ? langMatch[1].trim() : value;

      if (key) {
                                                   
        const source = termKeyToRegexSource(key);
        if (source) {
          termPatterns.push(`(${source})`);
          this.#termValues.push(finalValue);
                                                   
          if (!Object.hasOwn(this.#termsGlossary, key)) {
            this.#termsGlossary[key] = finalValue;
          }
        } else {
          kissLog(`Invalid RegExp for term: "${key}"`);
        }
      }
    }

    if (termPatterns.length > 0) {
      this.#combinedTermsRegex = new RegExp(termPatterns.join("|"), "g");
    }
  }

               
  #createIntersectionObserver() {
    const { transInterval } = this.#setting;
    const rootMargin = this.#rootMargin;

    const pending = new Set();
    const flush = debounce(() => {
      pending.forEach((node) => this.#performSyncNode(node));
      pending.clear();
    }, transInterval);

    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.#viewNodes.add(entry.target);
            pending.add(entry.target);
            flush();
          } else {
            this.#viewNodes.delete(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: `${rootMargin}px 0px ${rootMargin}px 0px` }
    );
  }

             
  #createMutationObserver() {
    return new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          this.#ignoredMutationTargets.has(mutation.target) ||
          this.#skipMoNodes.has(mutation.target) ||
          this.#plainTextPreprocessingNodes.has(mutation.target) ||
          mutation.nextSibling?.tagName?.toLowerCase() ===
            this.#translationTagName
        ) {
          continue;
        }

        if (mutation.type === "characterData") {
          if (
            mutation.oldValue !== mutation.target.nodeValue &&
            !this.#combinedSkipsRegex.test(mutation.target.nodeValue)
          ) {
            this.#queueForRescan(mutation.target.parentElement);
          }
        } else if (mutation.type === "childList") {
                                                                     
                                                                                     
          let hlSpans = 0;
          let hlOthers = 0;
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) return;
            if (node.classList?.contains?.("KT-wordbook-highlight")) hlSpans++;
            else hlOthers++;
          });
          if (hlSpans > 0 && hlOthers === 0) continue;

          let nodes = new Set();
          let hasText = false;
          mutation.addedNodes.forEach((node) => {
            if (
              this.#skipMoNodes.has(node) ||
              node.nodeName?.toLowerCase() === this.#translationTagName
            ) {
              return;
            }

            if (node.nodeType === Node.TEXT_NODE) {
              hasText = true;
            } else if (Translator.isElementOrFragment(node)) {
              nodes.add(node);
            }
          });
          if (hasText) {
            this.#queueForRescan(mutation.target);
          } else {
            nodes.forEach((node) => this.#queueForRescan(node));
          }
        }
      }
    });
  }

  #withIgnoredMutations(targets, callback) {
    const validTargets = targets.filter((target) => target instanceof Node);
    validTargets.forEach((target) => this.#ignoredMutationTargets.add(target));
    try {
      return callback();
    } finally {
      queueMicrotask(() => {
        validTargets.forEach((target) =>
          this.#ignoredMutationTargets.delete(target)
        );
      });
    }
  }

              
  #createDebounceMouseMover() {
    return debounce((targetNode) => {
      const startNode = targetNode;
                                              
      const translationWrapper = startNode.closest?.(
        `.${Translator.KISS_CLASS.warpper}`
      );
      const { mouseHoverKey = [], mouseHoverKey2 = [] } =
        this.#setting.mouseHoverSetting;
      const hasMouseHoverShortcut =
        mouseHoverKey.length > 0 || mouseHoverKey2.length > 0;

      if (translationWrapper) {
        this.#hoveredNode = translationWrapper;
        if (this.#canShowOriginalInHoverBubble(translationWrapper)) {
          if (hasMouseHoverShortcut) {
                                          
            this.#clearHoverOriginalTimer();
            if (this.#hoverBubbleTarget !== translationWrapper) {
              this.#hideHoverBubble();
            }
          } else {
            this.#scheduleOriginalHoverBubble(translationWrapper);
          }
        } else {
          this.#hideHoverBubble();
        }
        return;
      }

      if (
        this.#hoverOriginalTimerTarget ||
        this.#hoverBubbleTarget?.classList?.contains(
          Translator.KISS_CLASS.warpper
        )
      ) {
                                    
        this.#hideHoverBubble();
      }

      let foundNode = null;
      while (targetNode && targetNode !== document.body) {
        if (this.#observedNodes.has(targetNode)) {
          foundNode = targetNode;
          break;
        }
        targetNode = targetNode.parentElement;
      }
      this.#hoveredNode = foundNode || startNode;

      if (!hasMouseHoverShortcut && !this.#isInitialized) {
        this.#init();
      }
      if (!hasMouseHoverShortcut && foundNode) {
        this.#toggleTargetNode(foundNode);
      } else if (!foundNode && this.#isMouseHoverBubbleMode()) {
        this.#hideHoverBubble();
      }
    }, 100);
  }

                
  #handleMouseMove(event) {
    this.#hoverPointer = { x: event.clientX, y: event.clientY };
    if (
      this.#isMouseHoverBubbleMode() &&
      this.#hoverBubbleNode &&
      !this.#hoverBubbleNode.hidden
    ) {
      this.#positionHoverBubble();
    }
    let targetNode = event.composedPath()[0];
    this.#dmm(targetNode);
  }

               
  #handleKeyDown() {
    if (!this.#isInitialized) {
      this.#init();
    }
    let targetNode = this.#hoveredNode;
                                                   
    if (this.#canShowOriginalInHoverBubble(targetNode)) {
      this.#showOriginalHoverBubble(targetNode);
      return;
    }
    if (!targetNode || !this.#observedNodes.has(targetNode)) return;

    this.#toggleTargetNode(targetNode);
  }

           
  toggleHoverNode() {
    this.#handleKeyDown();
  }

             
  #toggleTargetNode(targetNode) {
    if (this.#isMouseHoverBubbleMode()) {
      this.#translateHoverBubbleNode(targetNode);
      return;
    }

    if (this.#processedNodes.has(targetNode)) {
      const hasPendingTranslation = Array.from(
        this.#findTranslationWrappers(targetNode)
      ).some((wrapper) => !this.#translationNodes.has(wrapper));
      if (hasPendingTranslation) return;
      this.#cleanupDirectTranslations(targetNode);
    } else {
      this.#processNode(targetNode);
    }
  }

                         
  #isMouseHoverBubbleMode() {
    return (
      this.#setting.mouseHoverSetting?.displayMode ===
      OPT_MOUSE_HOVER_DISPLAY_BUBBLE
    );
  }

                                        
  #shouldUseOriginalHoverBubble() {
    return (
      this.#mouseHoverEnabled &&
      this.#isMouseHoverBubbleMode() &&
      this.#rule.transOnly === "true"
    );
  }

                             
  #canShowOriginalInHoverBubble(wrapper) {
    if (
      !this.#shouldUseOriginalHoverBubble() ||
      !wrapper?.classList?.contains(Translator.KISS_CLASS.warpper)
    ) {
      return false;
    }

    const data = this.#translationNodes.get(wrapper);
    return Boolean(data?.isHide && data.nodes?.length);
  }

                                                             
  #getOriginalText(wrapper) {
    const { nodes = [] } = this.#translationNodes.get(wrapper) || {};
    return nodes
      .map((node) => node.textContent || "")
      .join("")
      .trim();
  }

                          
  #clearHoverOriginalTimer() {
    if (this.#hoverOriginalTimer) {
      clearTimeout(this.#hoverOriginalTimer);
      this.#hoverOriginalTimer = null;
    }
    this.#hoverOriginalTimerTarget = null;
  }

                                  
  #scheduleOriginalHoverBubble(wrapper) {
    if (
      this.#hoverBubbleTarget === wrapper &&
      this.#hoverBubbleNode?.isConnected
    ) {
      return;
    }
    if (this.#hoverOriginalTimerTarget === wrapper) return;

    this.#hideHoverBubble();
    const parsedDelay = parseFloat(this.#rule.transOnlyRevertDelay);
    const delay = Number.isFinite(parsedDelay) ? Math.max(0, parsedDelay) : 0.5;
    this.#hoverOriginalTimerTarget = wrapper;
    this.#hoverOriginalTimer = setTimeout(() => {
      this.#hoverOriginalTimer = null;
      this.#hoverOriginalTimerTarget = null;
      if (
                                         
        this.#hoveredNode === wrapper &&
        this.#canShowOriginalInHoverBubble(wrapper)
      ) {
        this.#showOriginalHoverBubble(wrapper);
      }
    }, delay * 1000);
  }

                              
  #showOriginalHoverBubble(wrapper) {
    this.#clearHoverOriginalTimer();
    const text = this.#getOriginalText(wrapper);
    if (!text) {
      this.#hideHoverBubble();
      return;
    }

    this.#hideHoverBubble();
    this.#hoverBubbleTarget = wrapper;
    this.#showHoverBubble(text);
  }

                                   
  #getShadowRoot(element) {
                   
    if (element.openOrClosedShadowRoot) {
      return element.openOrClosedShadowRoot;
    }
                    
    if (
      typeof globalThis !== "undefined" &&
      globalThis.chrome?.dom?.openOrClosedShadowRoot &&
      element instanceof HTMLElement
    ) {
      return globalThis.chrome.dom.openOrClosedShadowRoot(element);
    }
                           
    return element.shadowRoot;
  }

  #isKissIgnoredNode(node) {
    return (
      node?.nodeType === Node.ELEMENT_NODE &&
      (node.matches?.(Translator.KISS_IGNORE_SELECTOR) ||
        node.closest?.(Translator.KISS_IGNORE_SELECTOR))
    );
  }

                     
  #findAllShadowRoots(root = document.body, results = new Set()) {
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (this.#isKissIgnoredNode(node)) {
          continue;
        }

        const shadowRoot = this.#getShadowRoot(node);
        if (shadowRoot) {
          results.add(shadowRoot);
          this.#findAllShadowRoots(shadowRoot, results);
        }
      }
    } catch (err) {
      kissLog("无法访问某个 shadowRoot", err);
    }
    return results;
  }

                  
  #findChangeContainer(startNode) {
    if (
      !Translator.isElementOrFragment(startNode) ||
      startNode.closest?.(this.#ignoreSelector)
    ) {
      return null;
    }

    let current = startNode;
    while (current && current !== document.body) {
      if (current.classList?.contains(Translator.KISS_CLASS.original)) {
        current = current.parentElement;
        continue;
      }
      if (this.#isBlockNode(current) || this.#observedNodes.has(current)) {
                            
        for (const root of this.#rootNodes) {
          if (root.contains(current)) {
            return current;
          }
        }
      }
      current = current.parentElement;
    }

    return null;
  }

            
  #queueForRescan(target) {
    this.#rescanQueue.add(target);
    if (!this.#isQueueProcessing) {
      this.#isQueueProcessing = true;
      scheduleIdle(() => {
        this.#rescanQueue.forEach((t) => this.#rescanContainer(t));
        this.#rescanQueue.clear();
        this.#isQueueProcessing = false;
      }, 100);
    }
  }

            
  #rescanContainer(changedNode) {
    const container = this.#findChangeContainer(changedNode);
    if (!container) return;

    this.#processedNodes.delete(container);                 
    this.#cleanupAllTranslations(container);
    this.#scanNode(container);
  }

         
  #reIO(node) {
    this.#io.unobserve(node);
    this.#io.observe(node);
  }

                  
  #reIOViewNodes() {
    this.#viewNodes.forEach((n) => this.#reIO(n));
  }

                 
  #startObserveShadowRoot(shadowRoot) {
    try {
      if (
        shadowRoot.host.matches(`#${APP_CONSTS.fabID}, #${APP_CONSTS.boxID}`)
      ) {
        return;
      }
      this.#startObserveRoot(shadowRoot);
      this.#injectSheet(shadowRoot);
    } catch (err) {
      kissLog("startObserveShadowRoot", err);
    }
  }

          
  #startObserveRoot(root) {
    if (this.#rootNodes.has(root)) return;
    this.#rootNodes.add(root);
    this.#mo.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    });
    this.#scanNode(root);
  }

              
  #startObserveNode(node) {
                                                  
    if (!Translator.isElement(node)) return;
    if (this.#tryAdoptExistingTranslationHost(node)) {
      if (!this.#observedNodes.has(node)) {
        this.#observedNodes.add(node);
        this.#io.observe(node);
      }
      return;
    }

    if (!this.#observedNodes.has(node) && this.#enabled && this.#transAllnow) {
      this.#observedNodes.add(node);
      this.#processNode(node);
      return;
    }

          
    if (!this.#observedNodes.has(node)) {
      this.#observedNodes.add(node);
      this.#io.observe(node);
      return;
    }

                        
    if (!this.#processedNodes.has(node) && this.#viewNodes.has(node)) {
      this.#reIO(node);
    }
  }

                        
  #queryNode(rootNode) {
                    
    if (rootNode.matches?.(this.#rule.selector)) {
      this.#startObserveNode(rootNode);
    }

    rootNode.querySelectorAll(this.#rule.selector).forEach((node) => {
      if (!node.closest?.(this.#ignoreSelector)) {
        this.#startObserveNode(node);
      }
    });
  }

                 
  #scanNode(rootNode) {
    if (
      !Translator.isElementOrFragment(rootNode) ||
                                                       
      rootNode.matches?.(this.#ignoreSelector)
    ) {
      return;
    }

    if (this.#rule.autoScan === "false") {
      this.#queryNode(rootNode);
      return;
    }

    const hasText = Translator.hasTextNode(rootNode);

                                             
    if (!hasText && rootNode.children.length === 1) {
      const child = rootNode.children[0];
      if (!child.classList?.contains(Translator.KISS_CLASS.warpper)) {
        this.#scanNode(child);
        return;
      }
    }

    const hasBlock = this.#hasBlockNode(rootNode);

    if (hasText || !hasBlock) {
      this.#startObserveNode(rootNode);
    }

    if (hasBlock) {
      for (const child of rootNode.children) {
        const isBlock = this.#isBlockNode(child);
        if (!hasText || isBlock) {
          this.#scanNode(child);
        }
      }
    }
  }

               
  async #processNode(node) {
    if (
      this.#processedNodes.has(node) ||
      !Translator.isElementOrFragment(node)
    ) {
      return;
    }

    this.#processedNodes.set(node, { ...this.#rule });

             
    if (this.#isInvalidText(node.textContent)) {
      return;
    }

               
    let deLang = "";
    const {
      fromLang = "auto",
      toLang,
      splitParagraph = OPT_SPLIT_PARAGRAPH_DISABLE,
      splitLength = 100,
    } = this.#rule;
    const {
      langDetector,
      skipLangs = [],
      translateVariants = true,
    } = this.#setting;
    if (fromLang === "auto") {
                   
      deLang = await tryDetectLang(node.textContent, langDetector);
      if (
        deLang &&
        (isSameTranslationLanguage(deLang, toLang, translateVariants) ||
          skipLangs.includes(deLang))
      ) {
                      
                                             
        return;
      }
    }

            
    if (splitParagraph !== OPT_SPLIT_PARAGRAPH_DISABLE) {
      this.#splitTextNodesBySentence(node, splitParagraph, splitLength);
    }

    let nodeGroup = [];
    [...node.childNodes].forEach((child) => {
      const shouldBreak = this.#shouldBreak(child);
      const shouldGroup =
        child.nodeType === Node.ELEMENT_NODE ||
        child.nodeType === Node.TEXT_NODE;
      if (!shouldBreak && shouldGroup) {
        nodeGroup.push(child);
      } else if (shouldBreak && nodeGroup.length) {
        this.#translateNodeGroup(nodeGroup, node, deLang);
        nodeGroup = [];
      }
    });

    if (nodeGroup.length) {
      this.#translateNodeGroup(nodeGroup, node, deLang);
    }
  }

           
  #splitTextNodesBySentence(parentNode, splitParagraph, splitLength) {
    const sentenceEndRegexForSplit = /[。！？]+|[.?!]+(?=\s+|$)/g;

    [...parentNode.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE || node.textContent.trim() === "") {
        return;
      }

      const text = node.textContent;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = sentenceEndRegexForSplit.exec(text)) !== null) {
        let realEndIndex = match.index + match[0].length;
        while (realEndIndex < text.length && /\s/.test(text[realEndIndex])) {
          realEndIndex++;
        }
        parts.push(text.substring(lastIndex, realEndIndex));
        lastIndex = realEndIndex;
        sentenceEndRegexForSplit.lastIndex = realEndIndex;
      }
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      const validParts = parts.filter((part) => part.trim().length > 0);
      if (validParts.length <= 1) {
        return;
      }

      const newNodes = validParts.map((part) => {
        const newNode = document.createTextNode(part);
        this.#skipMoNodes.add(newNode);
        return newNode;
      });

      node.replaceWith(...newNodes);
    });

    const sentenceEndRegexForTest = /(?:[。！？?!]+|(?<!\d)\.)\s*$/;
    let textLength = 0;

    [...parentNode.childNodes].forEach((node) => {
      textLength += node.textContent.length;

      const isSentenceEnd = sentenceEndRegexForTest.test(node.textContent);
      if (
        !isSentenceEnd ||
        node.nextSibling?.nodeName?.toUpperCase() === "BR"
      ) {
        return;
      }

      if (
        splitParagraph === OPT_SPLIT_PARAGRAPH_PUNCTUATION ||
        (splitParagraph === OPT_SPLIT_PARAGRAPH_TEXTLENGTH &&
          textLength >= splitLength)
      ) {
        textLength = 0;

        const br = document.createElement("br");
        br.className = Translator.KISS_CLASS.br;
        this.#skipMoNodes.add(br);

        node.after(br);
      }
    });
  }

         
  #removeBrTags(parentNode) {
    if (!parentNode) return;

    parentNode
      .querySelectorAll(`.${Translator.KISS_CLASS.br}`)
      .forEach((br) => br.remove());

    parentNode.normalize();
  }

             
  #shouldBreak(node) {
    if (!Translator.isElementOrFragment(node)) return false;

    let matchesKeepSelector = false;
    try {
      matchesKeepSelector = node.matches(this.#rule.keepSelector);
    } catch (err) {
      kissLog(
        "keepSelector match error in shouldBreak",
        this.#rule.keepSelector,
        err
      );
    }
    if (matchesKeepSelector) return false;

    if (
      Translator.TAGS.BREAK_LINE.has(node.nodeName?.toUpperCase()) ||
      node.matches?.(this.#ignoreSelector) ||
      node.nodeName?.toLowerCase() === this.#translationTagName
    ) {
      return true;
    }

    if (this.#rule.autoScan === "true" && this.#isBlockNode(node)) {
      return true;
    }

    if (
      this.#rule.autoScan === "false" &&
      (node.matches(this.#rule.selector) ||
        node.querySelector(this.#rule.selector))
    ) {
      return true;
    }

    return false;
  }

         
  #isInvalidText(text) {
    if (typeof text !== "string") {
      return true;
    }

    const trimmedText = text.trim();

    if (!trimmedText) {
      return true;
    }

           
    if (
      trimmedText.length < this.#setting.minLength ||
      trimmedText.length > this.#setting.maxLength
    ) {
      return true;
    }

                 
    if (trimmedText.length === 1 && !trimmedText.match(/[a-zA-Z]/)) {
      return true;
    }

             
    if (!isNaN(parseFloat(trimmedText)) && isFinite(trimmedText)) {
      return true;
    }

           
    if (this.#combinedSkipsRegex.test(trimmedText)) {
      return true;
    }

    return false;
  }

                                
  #formatTranslateError(error) {
    if (error instanceof Error) {
      const tag = error.name ? `[${error.name}]` : "[UnknownError]";
      const msg = error.message ? ` ${error.message}` : "";
      return `${tag}${msg}\n${error.stack || ""}`;
    }

    if (typeof error === "string") {
      return error;
    }

    try {
      const jsonText = JSON.stringify(error);
      return jsonText || String(error);
    } catch (_) {
      return String(error);
    }
  }

                                             
  async #copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText =
      "position: fixed; left: -9999px; top: 0; opacity: 0;";

    document.body.appendChild(textarea);
    try {
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }

                                 
  #createRetryErrorNode(errorText, onRetry) {
    const i18n = newI18n(this.#setting.uiLang || "zh");
    const copyText = i18n("copy") || "Copy";
    const isDarkMode =
      this.#setting.darkMode === "dark" ||
      (this.#setting.darkMode === "auto" &&
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
    const panelBg = isDarkMode ? "#1f1f23" : "#ffffff";
    const panelText = isDarkMode
      ? "rgba(255, 255, 255, 0.82)"
      : "rgba(0, 0, 0, 0.78)";
    const panelBorder = isDarkMode
      ? "rgba(32, 156, 238, 0.45)"
      : "rgba(32, 156, 238, 0.28)";
    const panelShadow = isDarkMode
      ? "0 8px 24px rgba(0, 0, 0, 0.42)"
      : "0 8px 24px rgba(0, 0, 0, 0.16)";
    const errorColor = isDarkMode ? "#ff8a80" : "#d32f2f";
    const buttonBg = isDarkMode
      ? "rgba(32, 156, 238, 0.14)"
      : "rgba(32, 156, 238, 0.08)";
    const buttonHoverBg = isDarkMode
      ? "rgba(32, 156, 238, 0.24)"
      : "rgba(32, 156, 238, 0.16)";

    const container = document.createElement("span");
    container.style.cssText =
      "position: relative; display: inline-flex; align-items: center; vertical-align: middle;";

    const retryIcon = createRetrySVG();
    retryIcon.classList.add(Translator.KISS_CLASS.retry);
    retryIcon.setAttribute("role", "button");
    retryIcon.setAttribute("tabindex", "0");

    const panel = document.createElement("span");
    panel.className = "notranslate";
    panel.setAttribute("translate", "no");
    panel.style.cssText = [
      "position: fixed",
      "left: 0",
      "top: 0",
      "z-index: 2147483647",
      "display: none",
      "box-sizing: border-box",
      "width: max-content",
      "max-width: min(420px, calc(100vw - 16px))",
      "max-height: 240px",
      "overflow: auto",
      "padding: 10px 10px 8px 12px",
      `border: 1px solid ${panelBorder}`,
      "border-left: 3px solid #209CEE",
      "border-radius: 6px",
      `background: ${panelBg}`,
      `color: ${panelText}`,
      `box-shadow: ${panelShadow}`,
      "font-size: 12px",
      "line-height: 1.5",
      "font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      "white-space: pre-wrap",
      "overflow-wrap: anywhere",
      "user-select: text",
      "visibility: hidden",
    ].join("; ");

    const message = document.createElement("span");
    message.textContent = errorText;
    message.style.cssText = `color: ${errorColor};`;

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = copyText;
    copyButton.style.cssText = [
      "display: flex",
      "align-items: center",
      "justify-content: center",
      "width: fit-content",
      "margin-top: 8px",
      "padding: 3px 8px",
      "border: 1px solid rgba(32, 156, 238, 0.35)",
      "border-radius: 4px",
      `background: ${buttonBg}`,
      "color: #209CEE",
      "font-size: 12px",
      "line-height: 1.4",
      "font-weight: 500",
      "cursor: pointer",
      "transition: background 0.2s ease, border-color 0.2s ease",
    ].join("; ");
    copyButton.addEventListener("mouseenter", () => {
      copyButton.style.background = buttonHoverBg;
      copyButton.style.borderColor = "rgba(32, 156, 238, 0.55)";
    });
    copyButton.addEventListener("mouseleave", () => {
      copyButton.style.background = buttonBg;
      copyButton.style.borderColor = "rgba(32, 156, 238, 0.35)";
    });
    copyButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      e.preventDefault();

      try {
        await this.#copyText(errorText);
        copyButton.textContent = "OK";
        setTimeout(() => {
          copyButton.textContent = copyText;
        }, 800);
      } catch (copyErr) {
        kissLog("copy translate error: ", this.#formatTranslateError(copyErr));
      }
    });

    let hideTimer = null;

    const clearHideTimer = () => {
      if (!hideTimer) return;
      clearTimeout(hideTimer);
      hideTimer = null;
    };

                                                         
    const updatePanelPosition = () => {
      if (!container.isConnected) {
        hidePanel();
        return;
      }

      const anchorRect = container.getBoundingClientRect();
      const viewportGap = 8;
      const panelGap = 6;
      const panelRect = panel.getBoundingClientRect();
      const panelWidth = panelRect.width;
      const panelHeight = panelRect.height;
      const maxLeft = window.innerWidth - panelWidth - viewportGap;
      const maxTop = window.innerHeight - panelHeight - viewportGap;

      let left = anchorRect.left;
      let top = anchorRect.bottom + panelGap;

      if (top > maxTop) {
        top = anchorRect.top - panelHeight - panelGap;
      }

      panel.style.left = `${Math.max(viewportGap, Math.min(left, maxLeft))}px`;
      panel.style.top = `${Math.max(viewportGap, Math.min(top, maxTop))}px`;
      panel.style.visibility = "visible";
    };

    const showPanel = () => {
      clearHideTimer();
      if (!panel.isConnected) {
        document.body.appendChild(panel);
      }
      panel.style.display = "block";
      panel.style.visibility = "hidden";
      updatePanelPosition();
      window.addEventListener("scroll", updatePanelPosition, true);
      window.addEventListener("resize", updatePanelPosition);
    };

    const hidePanel = () => {
      clearHideTimer();
      window.removeEventListener("scroll", updatePanelPosition, true);
      window.removeEventListener("resize", updatePanelPosition);
      panel.style.display = "none";
      panel.style.visibility = "hidden";
      panel.remove();
    };

    const hidePanelSoon = () => {
      clearHideTimer();
      hideTimer = setTimeout(() => {
        const activeElement = document.activeElement;
        if (
          container.matches(":hover") ||
          panel.matches(":hover") ||
          container.contains(activeElement) ||
          panel.contains(activeElement)
        ) {
          return;
        }

        hidePanel();
      }, 80);
    };

    container.addEventListener("mouseenter", showPanel);
    container.addEventListener("mouseleave", hidePanelSoon);
    container.addEventListener("focusin", showPanel);
    container.addEventListener("focusout", (e) => {
      if (panel.contains(e.relatedTarget)) return;
      if (container.contains(e.relatedTarget)) return;
      hidePanelSoon();
    });
    panel.addEventListener("mouseenter", showPanel);
    panel.addEventListener("mouseleave", hidePanelSoon);
    panel.addEventListener("focusin", showPanel);
    panel.addEventListener("focusout", (e) => {
      if (container.contains(e.relatedTarget)) return;
      if (panel.contains(e.relatedTarget)) return;
      hidePanelSoon();
    });
    retryIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      hidePanel();
      onRetry();
    });
    retryIcon.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.stopPropagation();
      e.preventDefault();
      hidePanel();
      onRetry();
    });

    panel.appendChild(message);
    panel.appendChild(copyButton);
    container.appendChild(retryIcon);

    return container;
  }

           
  async #translateNodeGroup(nodes, hostNode, deLang) {
    const operation = this.#enabled
      ? (this.#translationOperation ||= createTranslationOperation("page"))
      : createTranslationOperation("hover");
    const {
      transTag,
      textStyle,
      transEndHook,
      transOnly,
      termsStyle,
      textExtStyle,
      selectStyle,
      parentStyle,
      grandStyle,
                      
      toLang,
                        
      transOrder = "original-first",
      wrapOriginal,
      originalTextStyle,
    } = this.#rule;
    const {
      newlineLength,
                      
    } = this.#setting;
    const parentNode = hostNode.parentElement;
    const hideOrigin = transOnly === "true";
                                      
                                                                            
    let createdWrapper = null;

    try {
      const [processedString, placeholderMap] = this.#serializeForTranslation(
        nodes,
        termsStyle
      );
      if (this.#isInvalidText(processedString)) return;

      const sentencePlan =
        textStyle === OPT_STYLE_COLORFUL
          ? createSentencePlan(nodes, deLang || this.#rule.fromLang, {
              isIgnored: (node) => this.#isIgnoredElement(node),
              isAtomic: (node) => {
                if (
                  this.#rule.hasRichText === "true" &&
                  Translator.TAGS.REPLACE.has(node.tagName)
                )
                  return true;
                try {
                  return Boolean(
                    this.#rule.keepSelector &&
                      node.matches(this.#rule.keepSelector)
                  );
                } catch {
                  return false;
                }
              },
            })
          : null;

                                                         
                                                        
                                            
                                            
      const isBlockStyle = OPT_STYLE_BLOCK_SET.has(textStyle);
      const useBlockLayout = isBlockStyle && this.#canUseBlockLayout(hostNode);
      const appliedTextStyle =
        isBlockStyle && !useBlockLayout ? OPT_STYLE_NONE : textStyle;

      const wrapper = document.createElement(this.#translationTagName);
      createdWrapper = wrapper;
      wrapper.className = `${Translator.KISS_CLASS.warpper} notranslate`;

      const inner = document.createElement(transTag);
      inner.lang = toLang;
      inner.className = `${Translator.KISS_CLASS.inner} ${this.#textClass[appliedTextStyle] || ""}`;
      if (textExtStyle?.trim()) {
        inner.style.cssText = textExtStyle;          
      }
      inner.appendChild(createLoadingSVG());

                                                             
      if (useBlockLayout) {
        wrapper.appendChild(inner);
      } else if (processedString.length > newlineLength) {
        const br = document.createElement("br");
        br.hidden = hideOrigin;
        if (transOrder === "translation-first") {
                            
          wrapper.appendChild(inner);
          wrapper.appendChild(br);
        } else {
                            
          wrapper.appendChild(br);
          wrapper.appendChild(inner);
        }
      } else {
        const space = document.createElement("span");
        space.textContent = " ";
        space.className = Translator.KISS_CLASS.space;
        space.hidden = hideOrigin;
        if (transOrder === "translation-first") {
          wrapper.appendChild(inner);
          wrapper.appendChild(space);
        } else {
          wrapper.appendChild(space);
          wrapper.appendChild(inner);
        }
      }

      this.#withViewportAnchor(() => {
                                   
        if (transOrder === "translation-first") {
          nodes[0].before(wrapper);        
        } else {
          nodes[nodes.length - 1].after(wrapper);            
        }
      });

      const currentRunId = this.#runId;

                      
      const streamRenderMode = this.#apiSetting.streamRenderMode || "disabled";
      const isStreamRender =
        streamRenderMode !== "disabled" &&
        this.#apiSetting.useStream &&
        API_SPE_TYPES.stream.has(this.#apiSetting.apiType);

                                                        
                                               
                                                                                     
                                                                       
                                                                               
      let rafId = null;
      let pendingText = "";
      let hasFirstChunk = false;
      const innerRef = inner;

                           
      const flushPendingText = () => {
        if (!hasFirstChunk) {
          innerRef.textContent = "";
          innerRef.appendChild(document.createTextNode(pendingText));
          hasFirstChunk = true;
        } else {
          const textNode = innerRef.firstChild;
          if (textNode) {
            textNode.nodeValue = pendingText;                                            
          }
        }
        rafId = null;
      };

                      
      const onStreamChunk = isStreamRender
        ? (chunk) => {
                                                 
            if (this.#runId !== currentRunId) return;
            const { text, isComplete } = chunk;
            if (!text) return;

            if (isComplete) {
              pendingText = Array.isArray(text) ? text[0] : text;
              if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
              }
              flushPendingText();
            } else {
              pendingText = text;
              if (!rafId) {
                              
                rafId = requestAnimationFrame(flushPendingText);
              }
            }
          }
        : null;

                       
                                                                                   
                                                                                   
      const sentenceResults = sentencePlan?.sentences.length
        ? await Promise.all(
            sentencePlan.sentences.map(async (sentenceNodes) => {
              const [text, placeholders] = this.#serializeForTranslation(
                sentenceNodes,
                termsStyle
              );
              if (!text.trim()) return { html: "", isSame: true };
              const result = await this.#translateFetch(
                text,
                deLang,
                null,
                null,
                operation
              );
              if (!result.trText?.trim() && !result.isSame)
                throw new Error("Empty translation");
              return {
                html: this.#restoreFromTranslation(
                  result.trText || text,
                  placeholders
                ),
                isSame:
                  result.isSame || isDuplicateTranslation(text, result.trText),
              };
            })
          )
        : null;
      const { trText: translatedText, isSame: isSameLang } = sentenceResults
        ? {
            trText: sentenceResults.map((result) => result.html).join(" "),
            isSame: sentenceResults.every((result) => result.isSame),
          }
        : await this.#translateFetch(
            processedString,
            deLang,
            onStreamChunk,
            null,
            operation
          );

                                       
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (this.#runId !== currentRunId) {
        throw new Error("Request terminated");
      }
                                                                                    
                                                                                     
      if (!wrapper.isConnected) return;
      if (sentencePlan && !sentencePlan.isCurrent()) {
        wrapper.remove();
        this.#processedNodes.delete(hostNode);
        this.#processNode(hostNode);
        return;
      }

                                 
                                                    
      if (
        !translatedText ||
        isSameLang ||
        isDuplicateTranslation(processedString, translatedText)
      ) {
        this.#withViewportAnchor(() => {
          wrapper.remove();
        });
        return;
      }

                                                            
      const htmlString = sentenceResults
        ? translatedText
        : this.#restoreFromTranslation(translatedText, placeholderMap);

                                                           
                                               
                                        

      this.#withViewportAnchor(() => {
        if (sentenceResults) {
          const fragment = document.createDocumentFragment();
          sentenceResults.forEach((result, index) => {
            if (index) fragment.appendChild(document.createTextNode(" "));
            const mark = createSentenceMark(index);
            mark.replaceChildren(trustedTypesHelper.createFragment(result.html));
            fragment.appendChild(mark);
          });
          inner.replaceChildren(fragment);
          this.#withIgnoredMutations(
            [
              hostNode,
              ...sentencePlan.textEntries.map(({ node }) => node.parentNode),
            ],
            () => {
              nodes = markSourceSentences(nodes, sentencePlan);
            }
          );
        } else {
          inner.replaceChildren(trustedTypesHelper.createFragment(htmlString));
        }
      });

      let originalWrapper = null;
      if (wrapOriginal === "true") {
        this.#withViewportAnchor(() => {
          originalWrapper = this.#wrapOriginalNodes(nodes, originalTextStyle);
        });
      }

      const translationData = {
        nodes,
        originalWrapper,
        isHide: hideOrigin,
      };
      this.#translationNodes.set(wrapper, translationData);
      confirmTranslationPaint(
        operation,
        () => wrapper.isConnected && Boolean(inner.textContent?.trim())
      );
      if (hideOrigin) {
        this.#withViewportAnchor(() => {
          this.#removeOriginal(translationData, wrapper);
        });
      }

             
      this.#appendCssText(hostNode, selectStyle, "selectStyle");
      this.#appendCssText(parentNode, parentStyle, "parentStyle");
      this.#appendCssText(parentNode?.parentElement, grandStyle, "grandStyle");

                                         
                                                            
                                                                      
                                                                                                         
                                                                               
      if (transEndHook?.trim()) {
        try {
          interpreter.run(`exports.transEndHook = ${transEndHook}`);
          interpreter.exports.transEndHook(
            {
              hostNode,
              parentNode,
              nodes,
              wrapperNode: wrapper,
              innerNode: inner,
            },
            {
              text: processedString,
              fromLang: deLang || this.#rule.fromLang,
              toLang,
            }
          );
        } catch (err) {
          kissLog("transEndHook", err);
        }
      }
    } catch (err) {
      const errorText = this.#formatTranslateError(err);
      kissLog("translate group error: ", errorText);
      if (err?.message === "Request terminated") {
        if (createdWrapper?.isConnected)
          this.#removeTranslationElement(createdWrapper);
        return;
      }

                                                 
      const retryWrapper = createdWrapper?.isConnected ? createdWrapper : null;
      if (!retryWrapper) {
                                               
        this.#cleanupDirectTranslations(hostNode);
        return;
      }
      try {
        const inner = retryWrapper.querySelector(
          `.${Translator.KISS_CLASS.inner}`
        );
        if (inner) {
          inner.textContent = "";
          const retryNode = this.#createRetryErrorNode(errorText, () => {
            this.#withViewportAnchor(() => {
              retryWrapper.remove();
            });
            this.#processedNodes.delete(hostNode);
            this.#translateNodeGroup(nodes, hostNode, deLang);
          });
          inner.appendChild(retryNode);
        }
      } catch (retryErr) {
        kissLog("retry icon error: ", retryErr.message);
        this.#cleanupDirectTranslations(hostNode);
      }
    }
  }

  #getHoverBubbleStyle() {
    const userStyle =
      this.#setting.mouseHoverSetting?.bubbleStyle ||
      DEFAULT_MOUSE_HOVER_BUBBLE_STYLE;
    const normalizedUserStyle = userStyle.trim().replace(/;+$/, "");
    return `${normalizedUserStyle};
position: fixed !important;
z-index: 2147483647 !important;
box-sizing: border-box !important;
pointer-events: none !important;
white-space: pre-wrap !important;
overflow-wrap: anywhere !important;`;
  }

                               
  #ensureHoverBubble() {
    if (this.#hoverBubbleNode?.isConnected) {
      return this.#hoverBubbleNode;
    }

    const bubble = document.createElement("div");
    bubble.className = `${Translator.KISS_CLASS.hoverBubble} notranslate`;
    bubble.setAttribute("role", "tooltip");
    document.body.appendChild(bubble);
    this.#hoverBubbleNode = bubble;

    return bubble;
  }

                              
  #positionHoverBubble() {
    const bubble = this.#hoverBubbleNode;
    if (!bubble) return;

    const gap = 12;
    const viewportGap = 8;
    let left = this.#hoverPointer.x + gap;
    let top = this.#hoverPointer.y + gap;

    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;

    const rect = bubble.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - viewportGap;
    const maxTop = window.innerHeight - rect.height - viewportGap;

    left = Math.max(viewportGap, Math.min(left, maxLeft));
    top = Math.max(viewportGap, Math.min(top, maxTop));

    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  }

                      
  #showHoverBubble(content, state = "ready") {
    const bubble = this.#ensureHoverBubble();
    bubble.style.cssText = this.#getHoverBubbleStyle();
    bubble.dataset.state = state;
    bubble.replaceChildren(
      content instanceof Node ? content : document.createTextNode(content)
    );
    bubble.hidden = false;
    this.#positionHoverBubble();
  }

                                       
  #hideHoverBubble() {
    this.#clearHoverOriginalTimer();
    this.#hoverBubbleRunId++;
    this.#hoverBubbleTarget = null;
    if (this.#hoverBubbleNode) {
      this.#hoverBubbleNode.remove();
      this.#hoverBubbleNode = null;
    }
  }

                            
  async #translateHoverBubbleNode(node) {
    const operation = createTranslationOperation("hover");
    this.#clearHoverOriginalTimer();
    if (!Translator.isElementOrFragment(node)) return;
    if (this.#hoverBubbleTarget === node && this.#hoverBubbleNode) return;

    const text = node.textContent || "";
    if (this.#isInvalidText(text)) {
      this.#hideHoverBubble();
      return;
    }

    const currentRunId = ++this.#hoverBubbleRunId;
    this.#hoverBubbleTarget = node;
    this.#showHoverBubble(createLoadingSVG(), "loading");

    try {
      let deLang = "";
      const { fromLang = "auto", toLang } = this.#rule;
      const {
        langDetector,
        skipLangs = [],
        translateVariants = true,
      } = this.#setting;
      if (fromLang === "auto") {
        deLang = await tryDetectLang(text, langDetector);
        if (
          deLang &&
          (isSameTranslationLanguage(deLang, toLang, translateVariants) ||
            skipLangs.includes(deLang))
        ) {
          if (this.#hoverBubbleRunId === currentRunId) {
            this.#hideHoverBubble();
          }
          return;
        }
      }

      const { trText, isSame } = await this.#translateFetch(
        text,
        deLang,
        null,
        this.#hoverBubbleApiSetting,
        operation
      );
      if (
        this.#hoverBubbleRunId !== currentRunId ||
        this.#hoverBubbleTarget !== node
      ) {
        return;
      }

                                             
      if (
        !trText ||
        isSame ||
        isDuplicateTranslation(text, Array.isArray(trText) ? trText[0] : trText)
      ) {
        this.#hideHoverBubble();
        return;
      }

      this.#showHoverBubble(Array.isArray(trText) ? trText[0] : trText);
      confirmTranslationPaint(
        operation,
        () =>
          this.#hoverBubbleTarget === node &&
          this.#hoverBubbleRunId === currentRunId &&
          this.#hoverBubbleNode?.isConnected
      );
    } catch (err) {
      if (
        this.#hoverBubbleRunId !== currentRunId ||
        this.#hoverBubbleTarget !== node
      ) {
        return;
      }
      this.#showHoverBubble(this.#formatTranslateError(err), "error");
      operation.close();
    }
  }

                
  #serializeForTranslation(nodes, termsStyle) {
    let replaceCounter = 0;         
    let wrapCounter = 0;          
    const placeholderMap = new Map();
    const { startDelimiter, endDelimiter } = this.#placeholderConfig;

    const pushReplace = (html) => {
      replaceCounter++;
      const placeholder = `${startDelimiter}${replaceCounter}${endDelimiter}`;
      placeholderMap.set(placeholder, html);
      return placeholder;
    };

    const traverse = (node) => {
      if (
        node.nodeType !== Node.ELEMENT_NODE &&
        node.nodeType !== Node.TEXT_NODE
      ) {
        return "";
      }

             
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent;
        if (!text.trim()) return "";

                 
        if (this.#combinedTermsRegex) {
          this.#combinedTermsRegex.lastIndex = 0;
          text = text.replace(this.#combinedTermsRegex, (...args) => {
            const groups = args.slice(1, -2);
            const matchedIndex = groups.findIndex(
              (group) => group !== undefined
            );
            const fullMatch = args[0];
            const termValue = this.#termValues[matchedIndex];

            return pushReplace(
              `<i class="${Translator.KISS_CLASS.term}" style="${termsStyle}">${termValue || fullMatch}</i>`
            );
          });
        }

        return escapeHTML(text);
      }

             
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (this.#isIgnoredElement(node)) {
          return "";
        }

        let matchesKeepSelector = false;
        try {
          matchesKeepSelector = node.matches(this.#rule.keepSelector);
        } catch (err) {
          kissLog("keepSelector match error", this.#rule.keepSelector, err);
        }

        if (
          (this.#rule.hasRichText === "true" &&
            Translator.TAGS.REPLACE.has(node.tagName)) ||
          matchesKeepSelector ||
                                                  
          !node.textContent.trim()
        ) {
          if (
            node.tagName?.toUpperCase() === "IMG" ||
            node.tagName?.toUpperCase() === "SVG"
          ) {
            if (node.isConnected || !node.style.width)
              node.style.width = `${node.offsetWidth}px`;
            if (node.isConnected || !node.style.height)
              node.style.height = `${node.offsetHeight}px`;
          }
          return pushReplace(node.outerHTML);
        }

        let innerContent = "";
        node.childNodes.forEach((child) => {
          try {
            innerContent += traverse(child);
          } catch (err) {
            kissLog("traverse child error", child.nodeName, err);
          }
        });

        if (
          this.#rule.hasRichText === "true" &&
          Translator.TAGS.WARP.has(node.tagName?.toUpperCase())
        ) {
          wrapCounter++;
          const { tagName, format } = this.#placeholderConfig;

                                                  
          placeholderMap.set(`TAG_${wrapCounter}`, {
            openTag: buildOpeningTag(node),
            closeTag: `</${node.localName}>`,
          });

                  
          let startPlaceholder, endPlaceholder;
          if (format === "attribute") {
                                      
            startPlaceholder = `<${tagName} i=${wrapCounter}>`;
            endPlaceholder = `</${tagName}>`;
          } else {
                                    
            startPlaceholder = `<${tagName}${wrapCounter}>`;
            endPlaceholder = `</${tagName}${wrapCounter}>`;
          }

          return `${startPlaceholder}${innerContent}${endPlaceholder}`;
        }

        return innerContent;
      }

      return "";
    };

    function buildOpeningTag(node) {
      const escapeAttr = (str) => str.replace(/"/g, "&quot;");
      let tag = `<${node.tagName.toLowerCase()}`;
      for (const attr of node.attributes) {
        tag += ` ${attr.name}="${escapeAttr(attr.value)}"`;
      }
      tag += ">";
      return tag;
    }

    let processedString = nodes.map(traverse).join("").trim();

                                          
                                       
    processedString = processedString.replace(/\r?\n|\t/g, (whitespace) =>
      pushReplace(whitespace === "\t" ? "&#9;" : "&#10;")
    );

    return [processedString, placeholderMap];
  }

                                                                 
  #restoreFromTranslation(translatedText, placeholderMap) {
    if (!placeholderMap.size) {
      return translatedText;
    }

    if (!translatedText) return "";

    const { safeTag, openRegex, closeRegex } = this.#placeholderConfig;
    const restoreAttr = "data-kiss-restore";
    let textToParse = translatedText;
    let result = translatedText;

    try {
                                                                                                                 
      textToParse = textToParse.replace(
        openRegex,
        `<${safeTag} ${restoreAttr}="$1">`
      );
      textToParse = textToParse.replace(closeRegex, `</${safeTag}>`);

                                                                                    
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        trustedTypesHelper.createHTML(textToParse),
        "text/html"
      );

                      
      const selector = `${safeTag}[${restoreAttr}]`;
      const placeholders = Array.from(doc.querySelectorAll(selector));

                                                                
                                                                  
      placeholders.reverse().forEach((node) => {
        const index = node.getAttribute(restoreAttr);
        if (index) {
          const tagPair = placeholderMap.get(`TAG_${index}`);
          if (tagPair) {
                                                                    
                                                             
                                                                  
            try {
              const wrapDoc = parser.parseFromString(
                trustedTypesHelper.createHTML(
                  `${tagPair.openTag}${tagPair.closeTag}`
                ),
                "text/html"
              );
              const wrapper = wrapDoc.body.firstElementChild;
              if (wrapper) {
                while (node.firstChild) wrapper.appendChild(node.firstChild);
                node.replaceWith(wrapper);
              }
            } catch (e) {
              kissLog("restore tag pair failed", e);
            }
          }
        }
      });

                             
      result = doc.body.innerHTML;
    } catch (e) {
      kissLog("DOMParser restore failed, fallback to raw", e);
                                                                    
    }

                                                       
    result = result.replace(
      this.#placeholderConfig.placeholderRegex,
      (match) => placeholderMap.get(match) || match
    );

    return result;
  }

           
  #translateFetch(
    text,
    deLang = "",
    onStreamChunk = null,
    apiSettingOverride = null,
    operation = null
  ) {
    const { toLang, transStartHook } = this.#rule;
    const fromLang = deLang || this.#rule.fromLang;
    const rawApiSetting = { ...(apiSettingOverride || this.#apiSetting) };

    const apiSetting = resolveApiPromptSettings(
      rawApiSetting,
      this.#setting.prompts
    );

    const glossary = { ...this.#glossary };
    const apisMap = this.#apisMap;

    const args = {
      text,
      fromLang,
      toLang,
      apiSetting,
      glossary,
      onStreamChunk,
      textFormat: "html",
      translateVariants: this.#setting.translateVariants,
      signal: this.#requestController.signal,
      translationOperation:
        operation ||
        (this.#enabled
          ? (this.#translationOperation ||= createTranslationOperation("page"))
          : null),
    };

                                         
                                                          
                                                           
                                                                                                    
                                                                  
    if (transStartHook?.trim()) {
      try {
        interpreter.run(`exports.transStartHook = ${transStartHook}`);
        const hookResult = interpreter.exports.transStartHook({
          ...args,
          apisMap,
        });
        if (hookResult) {
          Object.assign(args, hookResult);
        }
      } catch (err) {
        kissLog("transStartHook", err);
      }
    }

    return apiSettingOverride
      ? apiTranslate(args)
      : translateWithEngineChain(args, this.#setting);
  }

                  
  #findTranslationWrappers(parentNode) {
    return parentNode.querySelectorAll(
      `:scope > .${Translator.KISS_CLASS.warpper}`
    );
  }

                 
  #cleanupAllNodes() {
    this.#rootNodes.forEach((root) => this.#cleanupAllTranslations(root));
  }

  #cleanupTranslationElements(elements) {
    const wrappers = Array.from(elements);
    if (!wrappers.length) return;

                                   
    const excludedAnchors = new Set(wrappers);
    wrappers.forEach((wrapper) => {
      const originalWrapper =
        this.#translationNodes.get(wrapper)?.originalWrapper;
      if (originalWrapper) excludedAnchors.add(originalWrapper);
    });

    this.#withViewportAnchor(() => {
      wrappers.forEach((el) => this.#removeTranslationElement(el));
    }, excludedAnchors);
  }

                  
  #cleanupAllTranslations(root) {
    this.#cleanupTranslationElements(
      root.querySelectorAll(`.${Translator.KISS_CLASS.warpper}`)
    );
  }

               
  #cleanupDirectTranslations(node) {
    this.#cleanupTranslationElements(this.#findTranslationWrappers(node));
  }

  #collectExistingTranslationNodes(wrapper) {
    const { transOrder = "original-first" } = this.#rule;
    const nodes = [];
    const isOriginalBefore = transOrder !== "translation-first";
    let current = isOriginalBefore
      ? wrapper.previousSibling
      : wrapper.nextSibling;

    if (current?.classList?.contains(Translator.KISS_CLASS.original)) {
      return [current];
    }

    while (current) {
      if (
        this.#shouldBreak(current) &&
        !Translator.TAGS.WARP.has(current.nodeName?.toUpperCase())
      ) {
        break;
      }

      if (
        current.nodeType === Node.ELEMENT_NODE ||
        current.nodeType === Node.TEXT_NODE
      ) {
        if (isOriginalBefore) {
          nodes.unshift(current);
        } else {
          nodes.push(current);
        }
      }

      current = isOriginalBefore
        ? current.previousSibling
        : current.nextSibling;
    }

    return nodes;
  }

  #getTranslationBackup(wrapper) {
    return wrapper.querySelector(
      `:scope > template.${Translator.KISS_CLASS.backup}`
    );
  }

  #getOrCreateTranslationBackup(wrapper) {
    let backup = this.#getTranslationBackup(wrapper);
    if (!backup) {
      backup = document.createElement("template");
      backup.className = Translator.KISS_CLASS.backup;
      wrapper.appendChild(backup);
    }
    return backup;
  }

  #getOriginalStyleClass(style) {
    return this.#textClass[style] || this.#textClass[OPT_STYLE_NONE] || "";
  }

  #wrapOriginalNodes(nodes, style) {
    if (!nodes?.length) return null;

    const parent = nodes[0].parentNode;
    if (!parent || nodes.some((node) => node.parentNode !== parent)) {
      return null;
    }

    const originalWrapper = document.createElement("span");
    originalWrapper.className = [
      Translator.KISS_CLASS.original,
      this.#getOriginalStyleClass(style),
    ]
      .filter(Boolean)
      .join(" ");

    this.#withIgnoredMutations([parent, originalWrapper], () => {
      nodes[0].before(originalWrapper);
      nodes.forEach((node) => originalWrapper.appendChild(node));
    });

    return originalWrapper;
  }

  #unwrapOriginal(originalWrapper) {
    if (!originalWrapper?.parentNode) return;

    const parent = originalWrapper.parentNode;
    this.#withIgnoredMutations([parent, originalWrapper], () => {
      originalWrapper.replaceWith(...originalWrapper.childNodes);
    });
  }

  #getOriginalUnits({ nodes = [], originalWrapper } = {}) {
    return originalWrapper ? [originalWrapper] : nodes;
  }

  #setOriginalStyle(originalWrapper, oldStyle, newStyle) {
    if (!originalWrapper) return;

    const oldClass = this.#getOriginalStyleClass(oldStyle);
    const newClass = this.#getOriginalStyleClass(newStyle);
    if (oldClass) originalWrapper.classList.remove(oldClass);
    if (newClass) originalWrapper.classList.add(newClass);
  }

  #tryAdoptExistingTranslationHost(hostNode) {
    if (!Translator.isElementOrFragment(hostNode)) return false;

    const wrappers = Array.from(hostNode.children || []).filter((child) =>
      child.classList?.contains(Translator.KISS_CLASS.warpper)
    );
    if (!wrappers.length) return false;

    wrappers.forEach((wrapper) => {
      const backup = this.#getTranslationBackup(wrapper);
      const backupNodes = backup ? Array.from(backup.content.childNodes) : [];
      const hasBackupNodes = backupNodes.length > 0;
      const collectedNodes = hasBackupNodes
        ? backupNodes
        : this.#collectExistingTranslationNodes(wrapper);
      const originalWrapper = collectedNodes.find((node) =>
        node.classList?.contains(Translator.KISS_CLASS.original)
      );
      const nodes = originalWrapper
        ? Array.from(originalWrapper.childNodes)
        : collectedNodes;
      this.#translationNodes.set(wrapper, {
        nodes,
        originalWrapper,
        isHide: hasBackupNodes,
      });
      nodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          this.#processedNodes.set(node, { ...this.#rule });
        }
      });
    });

    this.#processedNodes.set(hostNode, { ...this.#rule });
    this.#observedNodes.add(hostNode);
    this.#viewNodes.add(hostNode);
    return true;
  }

                         
  #removeTranslationElement(el) {
    const parentElement = el.parentElement;
    this.#processedNodes.delete(parentElement);

                       
    const data = this.#translationNodes.get(el);
    if (data?.isHide) {
      this.#restoreOriginal(el, data);
    }
    if (data?.nodes) {
      const targets = data.nodes.flatMap((node) => [
        node.parentNode,
        node,
        ...Array.from(
          node.querySelectorAll?.("[data-pt-source-text]") || [],
          (mark) => mark.parentNode
        ),
      ]);
      this.#withIgnoredMutations(targets, () =>
        clearSourceSentenceMarks(data.nodes)
      );
    }
    if (data?.originalWrapper) {
      this.#unwrapOriginal(data.originalWrapper);
    }

    this.#translationNodes.delete(el);
    el.remove();

    this.#removeBrTags(parentElement);
  }

         
  #restoreOriginal(el, data) {
    const originalUnits = this.#getOriginalUnits(data);
    if (originalUnits.length) {
      const parent = el.parentElement;
      if (parent) {
        const sourceParents = originalUnits.map((node) => node.parentNode);
        this.#withIgnoredMutations([...sourceParents, parent], () => {
          const frag = document.createDocumentFragment();
          originalUnits.forEach((node) => frag.appendChild(node));
          if (this.#rule.transOrder === "translation-first") {
            el.after(frag);
          } else {
            el.before(frag);
          }
        });
      }
    }
  }

             
  #removeOriginal(data, wrapper) {
    const originalUnits = this.#getOriginalUnits(data);
    if (originalUnits.length && wrapper) {
      const backup = this.#getOrCreateTranslationBackup(wrapper);
      const parent = originalUnits[0].parentNode;
      this.#withIgnoredMutations([parent], () => {
        originalUnits.forEach((node) => backup.content.appendChild(node));
      });
    }
  }

              
  #toggleTranslationOnly(node, transOnly) {
    this.#findTranslationWrappers(node).forEach((el) => {
      const br = el.querySelector(":scope > br");
      const space = el.querySelector(
        `:scope > span.${Translator.KISS_CLASS.space}`
      );
      const data = this.#translationNodes.get(el);
      if (!data) return;
      if (transOnly === "true") {
                  
        this.#withViewportAnchor(() => {
          if (br) br.hidden = true;
          if (space) space.hidden = true;
          this.#removeOriginal(data, el);
        });
        this.#translationNodes.set(el, { ...data, isHide: true });
      } else {
                  
        this.#withViewportAnchor(() => {
          if (br) br.hidden = false;
          if (space) space.hidden = false;
          this.#restoreOriginal(el, data);
        });
        this.#translationNodes.set(el, { ...data, isHide: false });
      }
    });
  }

                                
  #adjustWrapperPosition(wrapper, nodes, transOrder) {
    if (!nodes || !nodes.length) return;

    const { originalWrapper } = this.#translationNodes.get(wrapper) || {};
    const positionNodes = originalWrapper ? [originalWrapper] : nodes;

                        
    const firstNode = positionNodes[0];
    const lastNode = positionNodes[positionNodes.length - 1];

                           
    const wrapperParent = wrapper.parentElement;
    const firstNodeParent = firstNode?.parentElement;
    const lastNodeParent = lastNode?.parentElement;

                      
    if (wrapperParent !== firstNodeParent || wrapperParent !== lastNodeParent) {
      return;
    }

                                                
    if (transOrder === "translation-first") {
                              
      if (firstNode.previousElementSibling !== wrapper) {
        firstNode.before(wrapper);
      }
    } else {
                                  
      if (lastNode.nextElementSibling !== wrapper) {
        lastNode.after(wrapper);
      }
    }
  }

         
  #updateStyle(node, oldStyle, newStyle) {
    this.#findTranslationWrappers(node).forEach((el) => {
      const inner = el.querySelector(
        `:scope > .${Translator.KISS_CLASS.inner}`
      );
      inner.classList.remove(this.#textClass[oldStyle]);
      inner.classList.add(this.#textClass[newStyle]);
    });
  }

  #updateOriginalWrapping(node, wrapOriginal, originalTextStyle) {
    this.#findTranslationWrappers(node).forEach((wrapper) => {
      const data = this.#translationNodes.get(wrapper);
      if (!data) return;

      if (wrapOriginal === "true" && !data.originalWrapper) {
        const originalWrapper = this.#wrapOriginalNodes(
          data.nodes,
          originalTextStyle
        );
        if (originalWrapper) {
          this.#translationNodes.set(wrapper, {
            ...data,
            originalWrapper,
          });
        }
      } else if (wrapOriginal !== "true" && data.originalWrapper) {
        this.#unwrapOriginal(data.originalWrapper);
        this.#translationNodes.set(wrapper, {
          ...data,
          originalWrapper: null,
        });
      }
    });
  }

  #updateOriginalStyle(node, oldStyle, newStyle) {
    this.#findTranslationWrappers(node).forEach((wrapper) => {
      const { originalWrapper } = this.#translationNodes.get(wrapper) || {};
      this.#setOriginalStyle(originalWrapper, oldStyle, newStyle);
    });
  }

           
  #updateTransOrder(node, transOrder) {
    this.#findTranslationWrappers(node).forEach((el) => {
      const { nodes } = this.#translationNodes.get(el) || {};
      if (nodes && nodes.length) {
        this.#withViewportAnchor(() => {
          this.#adjustWrapperPosition(el, nodes, transOrder);
        });
      }
    });
  }

           
  #refreshNode(node) {
    this.#cleanupDirectTranslations(node);
    this.#processedNodes.delete(node);
    this.#processNode(node);
  }

                     
  #performSyncNode(node) {
    const appliedRule = this.#processedNodes.get(node);
    if (!appliedRule) {
      this.#enabled && this.#processNode(node);
      return;
    }

    const {
      apiSlug,
      fromLang,
      toLang,
      hasRichText,
      textStyle,
      transOnly,
      transOrder = "original-first",
      wrapOriginal,
      originalTextStyle,
    } = this.#rule;

    const needsRefresh =
      appliedRule.apiSlug !== apiSlug ||
      appliedRule.fromLang !== fromLang ||
      appliedRule.toLang !== toLang ||
      appliedRule.hasRichText !== hasRichText ||
      (appliedRule.textStyle !== textStyle &&
        (appliedRule.textStyle === OPT_STYLE_COLORFUL ||
          textStyle === OPT_STYLE_COLORFUL));

             
    if (needsRefresh) {
      Object.assign(appliedRule, {
        apiSlug,
        fromLang,
        toLang,
        hasRichText,
        textStyle,
        transOnly,
        transOrder,
        wrapOriginal,
        originalTextStyle,
      });
      this.#refreshNode(node);            
      return;
    }

             
    if (appliedRule.textStyle !== textStyle) {
      const oldStyle = appliedRule.textStyle;
      appliedRule.textStyle = textStyle;
      this.#updateStyle(node, oldStyle, textStyle);
    }

    if (appliedRule.wrapOriginal !== wrapOriginal) {
      appliedRule.wrapOriginal = wrapOriginal;
      this.#withViewportAnchor(() => {
        this.#updateOriginalWrapping(node, wrapOriginal, originalTextStyle);
      });
    }

    if (appliedRule.originalTextStyle !== originalTextStyle) {
      const oldStyle = appliedRule.originalTextStyle;
      appliedRule.originalTextStyle = originalTextStyle;
      this.#updateOriginalStyle(node, oldStyle, originalTextStyle);
    }

               
    if (appliedRule.transOrder !== transOrder) {
      appliedRule.transOrder = transOrder;
      this.#updateTransOrder(node, transOrder);
    }

             
    if (appliedRule.transOnly !== transOnly) {
      appliedRule.transOnly = transOnly;
      this.#toggleTranslationOnly(node, transOnly);
    }
  }

              
  #resetOptions() {
    this.#removeShadowRootListener();

    this.#io.disconnect();
    this.#mo.disconnect();
    this.#viewNodes.clear();
    this.#rootNodes.clear();
    this.#observedNodes = new WeakSet();
    this.#translationNodes = new WeakMap();
    this.#processedNodes = new WeakMap();
    this.#plainTextPreprocessingNodes = new WeakSet();
    this.#ignoredMutationTargets = new WeakSet();
    this.#io = this.#createIntersectionObserver();
  }

             
  #enableMouseHover() {
    if (this.#mouseHoverEnabled) return;
    this.#mouseHoverEnabled = true;
    this.#setting.mouseHoverSetting.useMouseHover = true;

    if (this.#shouldUseOriginalHoverBubble() && this.#transOnlyRevertTarget) {
      this.#clearTransOnlyRevertTimer();
      this.#hideOriginalTemporarily(this.#transOnlyRevertTarget);
    }

    document.addEventListener("mousemove", this.#boundMouseMoveHandler);
    const { mouseHoverKey = [], mouseHoverKey2 = [] } =
      this.#setting.mouseHoverSetting;
    if (mouseHoverKey.length === 0 && mouseHoverKey2.length === 0) {
                                                
      return;
    }
    const hasPrimaryShortcut = mouseHoverKey.length > 0;
    const hasAltShortcut = mouseHoverKey2.length > 0;
    this.#removeKeydownHandler = hasPrimaryShortcut
      ? shortcutRegister(mouseHoverKey, this.#boundKeyDownHandler)
      : undefined;
    const isSameShortcut =
      hasPrimaryShortcut &&
      hasAltShortcut &&
      mouseHoverKey.length === mouseHoverKey2.length &&
      mouseHoverKey.every((key, idx) => key === mouseHoverKey2[idx]);
    this.#removeKeydownHandler2 =
      hasAltShortcut && !isSameShortcut
        ? shortcutRegister(mouseHoverKey2, this.#boundKeyDownHandler)
        : undefined;
  }

             
  #disableMouseHover() {
    if (!this.#mouseHoverEnabled) return;
    this.#mouseHoverEnabled = false;
    this.#setting.mouseHoverSetting.useMouseHover = false;
    this.#hoveredNode = null;
    this.#hideHoverBubble();

    document.removeEventListener("mousemove", this.#boundMouseMoveHandler);
    this.#removeKeydownHandler?.();
    this.#removeKeydownHandler2?.();
  }

  #enableTransOnlyRevert() {
    if (this.#transOnlyRevertEnabled) return;
    this.#transOnlyRevertEnabled = true;

    this.#boundTransOnlyMouseOver = (e) => {
      if (this.#shouldUseOriginalHoverBubble()) return;

      const wrapper = e.target.closest?.(`.${Translator.KISS_CLASS.warpper}`);
      if (wrapper) {
        const data = this.#translationNodes.get(wrapper);
        if (!data || !data.isHide) return;
        if (this.#transOnlyRevertTarget === wrapper) return;

        this.#clearTransOnlyRevertTimer();
        const delay = parseFloat(this.#rule.transOnlyRevertDelay) || 0.5;
        this.#transOnlyRevertTimer = setTimeout(() => {
          this.#showOriginalTemporarily(wrapper, data);
        }, delay * 1000);
        return;
      }

      if (this.#transOnlyRevertTarget) {
        const data = this.#translationNodes.get(this.#transOnlyRevertTarget);
        if (data) {
          const origNodes = data.nodes || [];
          for (const node of origNodes) {
            if (node === e.target || node.contains?.(e.target)) return;
          }
        }
      }
    };

    this.#boundTransOnlyMouseOut = (e) => {
      if (this.#shouldUseOriginalHoverBubble()) return;

      if (!this.#transOnlyRevertTarget) {
        const wrapper = e.target.closest?.(`.${Translator.KISS_CLASS.warpper}`);
        if (wrapper) this.#clearTransOnlyRevertTimer();
        return;
      }

      const wrapper = this.#transOnlyRevertTarget;
      const related = e.relatedTarget;

      if (related && (wrapper.contains(related) || related === wrapper)) return;

      const data = this.#translationNodes.get(wrapper);
      if (data && related) {
        const origNodes = data.nodes || [];
        for (const node of origNodes) {
          if (node === related || node.contains?.(related)) return;
        }
      }

      this.#clearTransOnlyRevertTimer();
      this.#hideOriginalTemporarily(wrapper);
    };

    document.addEventListener("mouseover", this.#boundTransOnlyMouseOver);
    document.addEventListener("mouseout", this.#boundTransOnlyMouseOut);
  }

  #disableTransOnlyRevert() {
    if (!this.#transOnlyRevertEnabled) return;
    this.#transOnlyRevertEnabled = false;

    this.#clearTransOnlyRevertTimer();
    if (this.#transOnlyRevertTarget) {
      this.#hideOriginalTemporarily(this.#transOnlyRevertTarget);
    }

    document.removeEventListener("mouseover", this.#boundTransOnlyMouseOver);
    document.removeEventListener("mouseout", this.#boundTransOnlyMouseOut);
    this.#boundTransOnlyMouseOver = null;
    this.#boundTransOnlyMouseOut = null;
  }

  #clearTransOnlyRevertTimer() {
    if (this.#transOnlyRevertTimer) {
      clearTimeout(this.#transOnlyRevertTimer);
      this.#transOnlyRevertTimer = null;
    }
  }

  #showOriginalTemporarily(wrapper, data) {
    this.#withViewportAnchor(() => {
      this.#restoreOriginal(wrapper, data);
      const inner = wrapper.querySelector(
        `:scope > .${Translator.KISS_CLASS.inner}`
      );
      if (inner) inner.style.display = "none";
      const br = wrapper.querySelector(":scope > br");
      if (br) br.hidden = true;
    });
    this.#transOnlyRevertTarget = wrapper;
  }

  #hideOriginalTemporarily(wrapper) {
    const data = this.#translationNodes.get(wrapper);
    if (!data) return;
    this.#withViewportAnchor(() => {
      this.#removeOriginal(data, wrapper);
      const inner = wrapper.querySelector(
        `:scope > .${Translator.KISS_CLASS.inner}`
      );
      if (inner) inner.style.display = "";
    });
    this.#transOnlyRevertTarget = null;
  }

             
  #initInjector() {
    if (this.#isJsInjected) {
      return;
    }
    this.#isJsInjected = true;

    try {
      const { injectJs, injectCss, toLang } = this.#rule;

                                           
                                            
                                
      const builtinCss = `#b_rs li, #b_rs li a, .b_rs li, .b_rs a { height: auto !important; max-height: none !important; }`;
      const finalInjectCss = [injectCss, builtinCss].filter(Boolean).join("\n");

      if (isExt) {
        finalInjectCss && sendBgMsg(MSG_INJECT_CSS, finalInjectCss);
      } else {
        finalInjectCss && injectInternalCss(finalInjectCss);
      }

      if (injectJs?.trim()) {
        const apiSetting = { ...this.#apiSetting };
        const glossary = { ...this.#glossary };
        const apisMap = this.#apisMap;
        const apiDectect = tryDetectLang;
        interpreter.import({
          KT: {
            apiTranslate,
            apiDectect,
            apiSetting,
            apisMap,
            toLang,
            glossary,
          },
        });
        interpreter.run(injectJs);
      }
    } catch (err) {
      kissLog("inject js", err);
    }
  }

             
  #removeInjector() {
    document
      .querySelectorAll(`[data-source^="kiss-inject"]`)
      ?.forEach((el) => el.remove());
  }

             
  toggleMouseHover() {
    this.#mouseHoverEnabled
      ? this.#disableMouseHover()
      : this.#enableMouseHover();
  }

         
  enable() {
    if (this.#enabled) return;
    this.#enabled = true;
    this.#rule.transOpen = "true";
    this.#runId++;

    if (this.#isInitialized) {
      if (this.#transAllnow) {
        this.rescan();
      } else {
        this.#reIOViewNodes();
      }
    } else {
      this.#init();
    }

    if (this.#rule.transTitle === "true") {
      this.#translateTitle();
    }

    isExt && sendBgMsg(MSG_UPDATE_ICON, true);
  }

           
  async #translateTitle() {
    const docInfo = getDocInfo();
    if (!docInfo?.title) return;

    try {
      const deLang = await tryDetectLang(docInfo.title);
      const { trText } = await this.#translateFetch(docInfo.title, deLang);
      this.#docInfo.title = document.title;         
      document.title = trText || docInfo.title;
      if (trText)
        confirmTranslationPaint(
          this.#translationOperation,
          () => this.#enabled && document.title === trText
        );
    } catch (err) {
      kissLog("tanslate title", err);
    }
  }

         
  #cancelTranslationRequests() {
    this.#translationOperation?.close();
    this.#translationOperation = null;
    this.#requestController.abort();
    this.#requestController = new AbortController();
  }

  disable() {
    if (!this.#enabled) return;
    this.#enabled = false;
    this.#rule.transOpen = "false";
    this.#runId++;

    this.#cancelTranslationRequests();
    this.#cleanupAllNodes();
    clearFetchPool();
    clearAllBatchQueue();

             
    if (this.#rule.transTitle === "true" && this.#docInfo.title) {
      document.title = this.#docInfo.title;
    }

    isExt && sendBgMsg(MSG_UPDATE_ICON, false);
  }

           
  rescan() {
    if (!this.#isInitialized) return;
    this.#runId++;

    this.#cancelTranslationRequests();
    this.#cleanupAllNodes();
    this.#resetOptions();
    clearFetchPool();
    clearAllBatchQueue();

                                                   
    this.#isInitialized = false;
    this.#init();
  }

           
  toggle() {
    this.#enabled ? this.disable() : this.enable();
                                             
                                       
    upsertRule(this.#rule.pattern, { transOpen: this.#rule.transOpen }).catch(
      (err) => kissLog("persist transOpen", err)
    );
  }

  toggleTransOnly() {
    if (!this.#enabled) {
      this.#rule.transOnly = "true";
      this.enable();
    } else {
      const newValue = this.#rule.transOnly === "true" ? "false" : "true";
      this.updateRule({ transOnly: newValue });
    }
  }

             
  toggleStyle() {
    const textStyle =
      this.#rule.textStyle === OPT_STYLE_FUZZY
        ? OPT_STYLE_NONE
        : OPT_STYLE_FUZZY;
    this.updateRule({ textStyle });
  }

           
  toggleTransbox(enabled) {
    this.#setting.tranboxSetting = {
      ...this.#setting.tranboxSetting,
      transOpen:
        typeof enabled === "boolean"
          ? enabled
          : !this.#setting.tranboxSetting.transOpen,
    };
  }

            
  toggleInputTranslate() {
    this.#setting.inputRule.transOpen = !this.#setting.inputRule.transOpen;
  }

         
  stop() {
    this.#hideHoverBubble();
    this.disable();
    this.#cancelTranslationRequests();
    this.#resetOptions();
    this.#disableMouseHover();
    this.#disableTransOnlyRevert();
    this.#removeInjector();
    this.#isInitialized = false;
  }

         
  updateRule(newRule) {
    let hasChanged = false;
    let needsRescan = false;
    const oldTransAllnow = this.#transAllnow;
    const oldRootMargin = this.#rootMargin;
    for (const key in newRule) {
      if (
        Object.prototype.hasOwnProperty.call(this.#rule, key) &&
        this.#rule[key] !== newRule[key]
      ) {
        this.#rule[key] = newRule[key];
        if (
          key === "autoScan" ||
          key === "blockSelector" ||
          key === "hasShadowroot" ||
          key === "scanAll" ||
          key === "isPlainText"
        ) {
          needsRescan = true;
        } else {
          hasChanged = true;
        }
      }
    }

                  
    this.#placeholderCache = null;
    this.#blockSelectorInvalid = false;

    const needsTriggerRescan =
      this.#enabled &&
      (oldTransAllnow !== this.#transAllnow ||
        String(oldRootMargin) !== String(this.#rootMargin));

    if (
      needsRescan ||
      needsTriggerRescan ||
      (this.#enabled && this.#transAllnow)
    ) {
      this.rescan();
      this.#syncTransOnlyRevert();
      return;
    }

    if (hasChanged) {
      this.#reIOViewNodes();
      this.#syncTransOnlyRevert();
    }
  }

  #syncTransOnlyRevert() {
                                       
    if (!this.#shouldUseOriginalHoverBubble()) {
      this.#clearHoverOriginalTimer();
      if (
        this.#hoverBubbleTarget?.classList?.contains(
          Translator.KISS_CLASS.warpper
        )
      ) {
        this.#hideHoverBubble();
      }
    }

    const shouldEnable =
      this.#rule.transOnly === "true" && this.#rule.transOnlyRevert === "true";
    if (shouldEnable && !this.#transOnlyRevertEnabled) {
      this.#enableTransOnlyRevert();
    } else if (!shouldEnable && this.#transOnlyRevertEnabled) {
      this.#disableTransOnlyRevert();
    }
  }

  updateSetting(setting) {
    const enginesChanged =
      JSON.stringify([this.#setting.transApis, this.#setting.engineChain]) !==
      JSON.stringify([setting.transApis, setting.engineChain]);
    this.#setting = { ...this.#setting, ...setting };
    this.#apisMap = new Map(
      (this.#setting.transApis || []).map((api) => [api.apiSlug, api])
    );
    if (enginesChanged) {
      this.#cancelTranslationRequests();
      if (this.#enabled) this.rescan();
    }
  }

  get setting() {
    return { ...this.#setting };
  }

  get rule() {
    return { ...this.#rule };
  }

  get eventName() {
    return this.#eventName;
  }
}

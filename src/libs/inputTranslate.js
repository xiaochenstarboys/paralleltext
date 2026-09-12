import {
  DEFAULT_INPUT_RULE,
  DEFAULT_INPUT_SHORTCUT,
  OPT_LANGS_LIST,
  DEFAULT_API_SETTING,
  OPT_INPUT_DOT_DISABLE,
  OPT_INPUT_DOT_MOBILE,
} from "../config";
import { resolveApiPromptSettings } from "../config/prompt";
import { isMobile } from "./mobile";
import { genEventName, removeEndchar, matchInputStr, sleep } from "./utils";
import { stepShortcutRegister } from "./shortcut";
import { apiTranslate } from "../apis";
import {
  createTranslationOperation,
  confirmTranslationPaint,
} from "./translationOperation";
import { createLoadingSVG } from "./svg";
import { logger } from "./log";

                                             
                     
                                             

   
                            
                                                     
   
function getDeepActiveElement() {
  let element = document.activeElement;
  while (element && element.shadowRoot && element.shadowRoot.activeElement) {
    element = element.shadowRoot.activeElement;
  }
  return element;
}

const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel"]);

   
             
                                                           
   
function isEditableTarget(node) {
  if (!node) return false;

  if (node.disabled || node.readOnly) return false;

             
  const nodeName = node.nodeName?.toUpperCase();
  if (nodeName === "INPUT") return TEXT_INPUT_TYPES.has(node.type);
  if (nodeName === "TEXTAREA") return true;

                                               
  if (
    node.isContentEditable ||
    node.getAttribute("contenteditable") === "true"
  ) {
    return true;
  }
  return false;
}

   
         
   
function getNodeText(node) {
  const nodeName = node.nodeName?.toUpperCase();
  if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
    return node.value || "";
  }
                                                  
  return node.innerText || node.textContent || "";
}

   
                    
                                                     
                     
   
function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value"
  )?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
}

                                             
              
                                             
   
           
                                                                     
  
                                    
                                                                       
                                                                                     
                                                               
                                                      
                                                             
                                          
                                   
                                     
   
async function smartReplaceText(node, newText) {
  node.focus();
  await sleep(10);

                                                                        
  const isRichEditor =
    node.isContentEditable || node.getAttribute("contenteditable") === "true";

                                                     
               
                                                     
  const performSelectAll = () => {
    if (typeof node.select === "function") {
      node.select();
      return;
    }
    try {
      document.execCommand("selectAll", false, null);
    } catch (e) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.addRange(range);
    }
  };
  performSelectAll();
  await sleep(50);

                                                     
                                          
                                                     
  if (isRichEditor) {
    try {
      logger.debug("Rich Editor detected: Priority Strategy (Clipboard Paste)");
      const dt = new DataTransfer();
      dt.setData("text/plain", newText);
      const pasteEvt = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
      });
      node.dispatchEvent(pasteEvt);

                                 
      await sleep(100);

      if (checkSuccess(node, newText)) return true;
    } catch (e) {
      logger.debug("Strategy Paste failed", e);
    }
  }

                                                     
                                          
                                                     
  try {
    const success = document.execCommand("insertText", false, newText);
    if (success) {
      await sleep(20);
      if (checkSuccess(node, newText)) return true;
    }
  } catch (e) {
    logger.debug("Strategy 1 (insertText) failed", e);
  }

                                             
  if (node.nodeName === "INPUT" || node.nodeName === "TEXTAREA") {
    try {
      setNativeValue(node, newText);
      return true;
    } catch (e) {
      logger.debug("Strategy 2 (Input Value) failed", e);
    }
  }

  return false;
}

         
function checkSuccess(node, targetText) {
  const currentText = getNodeText(node);
  return currentText.includes(targetText.trim());
}

                                             
          
                                             

function addLoading(node, loadingId) {
  const rect = node.getBoundingClientRect();
                    
  if (rect.width === 0 || rect.height === 0) {
           
  }

  const div = document.createElement("div");
  div.id = loadingId;
  div.appendChild(createLoadingSVG());

  div.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        min-width: 20px;
        width: ${rect.width || 100}px;
        height: ${rect.height || 30}px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        pointer-events: none;
        background: transparent;
    `;
  document.body.appendChild(div);
}

function removeLoading(loadingId) {
  const div = document.getElementById(loadingId);
  if (div) div.remove();
}

                                             
                     
                                             

export class InputTranslator {
  #config;
  #unregisterShortcut = null;
  #isEnabled = false;
  #triggerShortcut;

         
  #activeInput = null;              
  #floatBtn = null;            
  #resizeObserver = null;             
  #blurTimer = null;                 

              
  #boundFocusIn;
  #boundFocusOut;
  #boundUpdatePos;

  constructor({
    inputRule = DEFAULT_INPUT_RULE,
    transApis = [],
    prompts = [],
    translateVariants = true,
  } = {}) {
    this.#config = {
      inputRule,
      prompts,
      transApis,
      translateVariants,
    };

    const { triggerShortcut: initialTriggerShortcut } = this.#config.inputRule;
    this.#triggerShortcut =
      initialTriggerShortcut && initialTriggerShortcut.length > 0
        ? initialTriggerShortcut
        : DEFAULT_INPUT_SHORTCUT;

    this.#boundFocusIn = this.handleFocusIn.bind(this);
    this.#boundFocusOut = this.handleFocusOut.bind(this);
    this.#boundUpdatePos = this.updateBtnPosition.bind(this);

    if (this.#config.inputRule.transOpen) {
      this.enable();
    }
  }

  enable() {
    if (this.#isEnabled) return;          

               
    const { triggerCount, triggerTime } = this.#config.inputRule;
    this.#unregisterShortcut = stepShortcutRegister(
      this.#triggerShortcut,
      this.handleTranslate.bind(this),
      triggerCount,
      triggerTime
    );

                   
    document.addEventListener("focusin", this.#boundFocusIn);
    document.addEventListener("focusout", this.#boundFocusOut);
    window.addEventListener("scroll", this.#boundUpdatePos, true);
    window.addEventListener("resize", this.#boundUpdatePos);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.#boundUpdatePos);
      window.visualViewport.addEventListener("scroll", this.#boundUpdatePos);
    }

    this.#isEnabled = true;

                                         
    const currentFocus = getDeepActiveElement();
    if (isEditableTarget(currentFocus)) {
      this.handleFocusIn();
    }

    logger.info("Input Translator enabled.");
  }

  disable() {
    if (!this.#isEnabled) return;

               
    if (this.#unregisterShortcut) {
      this.#unregisterShortcut();
      this.#unregisterShortcut = null;
    }

                   
    document.removeEventListener("focusin", this.#boundFocusIn);
    document.removeEventListener("focusout", this.#boundFocusOut);
    window.removeEventListener("scroll", this.#boundUpdatePos, true);
    window.removeEventListener("resize", this.#boundUpdatePos);

    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", this.#boundUpdatePos);
      window.visualViewport.removeEventListener("scroll", this.#boundUpdatePos);
    }

                     
                                
    this.removeFloatButton();

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
    this.#activeInput = null;

    this.#isEnabled = false;
    logger.info("Input Translator disabled.");
  }

  toggle() {
    this.#isEnabled ? this.disable() : this.enable();
  }

                                 
              
                                 

  handleFocusIn() {
                                                    
    if (this.#blurTimer) {
      clearTimeout(this.#blurTimer);
      this.#blurTimer = null;
    }

    const target = getDeepActiveElement();
    if (isEditableTarget(target)) {
      this.#activeInput = target;

      if (this.#resizeObserver) this.#resizeObserver.disconnect();
      this.#resizeObserver = new ResizeObserver(() => this.updateBtnPosition());
      this.#resizeObserver.observe(target);

      this.showFloatButton(target);
    }
  }

  handleFocusOut() {
                             
    this.#blurTimer = setTimeout(() => {
      const newFocus = getDeepActiveElement();
                                             
      if (
        newFocus !== this.#activeInput &&
        !this.#floatBtn?.contains(newFocus)
      ) {
        this.hideFloatButton();
        this.#activeInput = null;
        if (this.#resizeObserver) {
          this.#resizeObserver.disconnect();
          this.#resizeObserver = null;
        }
      }
    }, 150);
  }

                                  
  showFloatButton(inputNode) {
    if (!this.#isEnabled) return;

    const showDot = this.#config.inputRule.showDot || OPT_INPUT_DOT_MOBILE;
    if (showDot === OPT_INPUT_DOT_DISABLE) return;
    if (showDot === OPT_INPUT_DOT_MOBILE) {
      const isTouch = isMobile || navigator.maxTouchPoints > 0;
      if (!isTouch) return;
    }

                              
    this.#activeInput = inputNode;

                       
    if (!this.#floatBtn) {
      this.createFloatButtonDOM();
    }

    this.#floatBtn.style.display = "flex";
    this.updateBtnPosition();
  }

                   
  createFloatButtonDOM() {
    this.#floatBtn = document.createElement("div");
                       
    const isTouch = isMobile || navigator.maxTouchPoints > 0;
    const size = isTouch ? "36px" : "30px";

    this.#floatBtn.style.cssText = `
        position: fixed;
        width: ${size}; height: ${size};
        background: #209CEE;
        border-radius: 50%;
        z-index: 2147483647;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: opacity 0.2s;
        font-size: 13px; color: white;
        user-select: none; -webkit-user-select: none;
      `;
    this.#floatBtn.innerText = "译";

    const preventFocusLoss = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
                                                 
    this.#floatBtn.addEventListener("mousedown", preventFocusLoss);
    this.#floatBtn.addEventListener("touchstart", preventFocusLoss, {
      passive: false,
    });

    const handleTrigger = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.#activeInput) this.#activeInput.focus();
      this.handleTranslate({ isBtnTrigger: true });
    };

    this.#floatBtn.addEventListener("click", handleTrigger);
    this.#floatBtn.addEventListener("touchend", handleTrigger);

    document.body.appendChild(this.#floatBtn);
  }

               
  hideFloatButton() {
    if (this.#floatBtn) {
      this.#floatBtn.style.display = "none";
    }
  }

               
  removeFloatButton() {
    if (this.#floatBtn) {
      this.#floatBtn.remove();            
      this.#floatBtn = null;        
    }
  }

  updateBtnPosition() {
                                 
    if (
      !this.#activeInput ||
      !this.#activeInput.isConnected ||              
      !this.#floatBtn ||
      this.#floatBtn.style.display === "none"
    ) {
                         
      if (this.#floatBtn) this.hideFloatButton();
      return;
    }

    const rect = this.#activeInput.getBoundingClientRect();
                         
    const isTouch = isMobile || navigator.maxTouchPoints > 0;
    const btnSize = isTouch ? 36 : 30;
    const padding = 5;
    let top = rect.bottom - btnSize - padding;
    let left = rect.right - btnSize - padding;

    if (rect.height < 60) {
      const gap = 2;
      const above = rect.top - btnSize - gap;
      const below = rect.bottom + gap;

      if (above >= 0) {
        top = above;
      } else if (below + btnSize <= window.innerHeight) {
        top = below;
      } else {
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        top = spaceAbove >= spaceBelow ? above : below;
      }
    }
                  
    left = Math.max(0, Math.min(left, window.innerWidth - btnSize - 2));
    top = Math.max(0, Math.min(top, window.innerHeight - btnSize - 2));

    this.#floatBtn.style.top = `${top}px`;
    this.#floatBtn.style.left = `${left}px`;
  }

                                 
              
                                 

     
           
                            
                                                    
     
  async handleTranslate({ isBtnTrigger = false } = {}) {
    logger.debug("handle input translate");

                   
    const node = getDeepActiveElement();

                  
    if (!node || !isEditableTarget(node)) {
      logger.debug("Active node is not editable");
      return;
    }

    const { apiSlug, transSign, triggerCount } = this.#config.inputRule;
    let { fromLang, toLang } = this.#config.inputRule;

              
    let initText = getNodeText(node);

                  
                                      
    if (
      !isBtnTrigger &&
      this.#triggerShortcut.length === 1 &&
      this.#triggerShortcut[0].length === 1
    ) {
      initText = removeEndchar(
        initText,
        this.#triggerShortcut[0],
        triggerCount
      );
    }

    if (!initText.trim()) return;

                             
    let text = initText;
    if (transSign) {
      const res = matchInputStr(text, transSign);
      if (res) {
        let lang = res[1];
               
        const langMap = {
          zh: "zh-CN",
          cn: "zh-CN",
          tw: "zh-TW",
          hk: "zh-TW",
          jp: "ja",
          kr: "ko",
        };
        if (langMap[lang.toLowerCase()]) lang = langMap[lang.toLowerCase()];

        if (lang && OPT_LANGS_LIST.includes(lang)) {
          toLang = lang;
        }
        text = res[2];
      }
    }

    const rawApiSetting =
      this.#config.transApis.find((api) => api.apiSlug === apiSlug) ||
      DEFAULT_API_SETTING;

    const apiSetting = resolveApiPromptSettings(
      rawApiSetting,
      this.#config.prompts
    );

    const loadingId = "kiss-loading-" + genEventName();
    const operation = createTranslationOperation("input");

    try {
      addLoading(node, loadingId);
      this.hideFloatButton();            

                 
      const { trText, isSame } = await apiTranslate({
        text,
        fromLang,
        toLang,
        apiSetting,
        textFormat: "text",
        translateVariants: this.#config.translateVariants,
        translationOperation: operation,
      });

      const newText = trText?.trim() || "";
      if (!newText || isSame) return;

                             
      const success = await smartReplaceText(node, newText);
      if (!success) {
        logger.warn("Text replacement failed after all strategies.");
        operation.close();
      } else confirmTranslationPaint(operation, () => node.isConnected);
    } catch (err) {
      logger.error("Translate input error:", err);
      operation.close();
    } finally {
      removeLoading(loadingId);
               
      if (this.#activeInput === node) {
        this.showFloatButton(node);
      }
    }
  }

  updateConfig({ inputRule, transApis, prompts }) {
    const wasEnabled = this.#isEnabled;
    if (wasEnabled) this.disable();

    if (inputRule) this.#config.inputRule = inputRule;
    if (prompts) this.#config.prompts = prompts;
    if (transApis) {
      this.#config.transApis = transApis;
    }

    const { triggerShortcut } = this.#config.inputRule;
    this.#triggerShortcut =
      triggerShortcut && triggerShortcut.length > 0
        ? triggerShortcut
        : DEFAULT_INPUT_SHORTCUT;

    if (wasEnabled) this.enable();
  }
}

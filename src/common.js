import {
  getFabWithDefault,
  getSettingWithDefault,
  runDataMigration,
} from "./libs/storage";
import { isIframe } from "./libs/iframe";
import { matchRule } from "./libs/rules";
import { isInBlacklist } from "./libs/blacklist";
import { logger } from "./libs/log";
import { initAccountRelay } from "./libs/accountRelay";
import { initWordBookHighlight } from "./libs/wordHighlight";
import TranslatorManager from "./libs/translatorManager";

   
                                            
                                 
   
function showErr(message) {
  const bannerId = "ParallelText-Message";
  const existingBanner = document.getElementById(bannerId);
  if (existingBanner) {
    existingBanner.remove();
  }

  const banner = document.createElement("div");
  banner.id = bannerId;

                                       
  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    backgroundColor: "#f44336",
    color: "white",
    textAlign: "center",
    padding: "8px 16px",
    zIndex: "1001",
    boxSizing: "border-box",
    fontSize: "16px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  });

  const closeButton = document.createElement("span");
  closeButton.textContent = "×";

  Object.assign(closeButton.style, {
    position: "absolute",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    cursor: "pointer",
    fontSize: "22px",
    fontWeight: "bold",
  });

  const messageText = document.createTextNode(`ParallelText: ${message}`);
  banner.appendChild(messageText);
  banner.appendChild(closeButton);

  document.body.appendChild(banner);

           
  const removeBanner = () => {
    banner.style.transition = "opacity 0.5s ease";
    banner.style.opacity = "0";
    setTimeout(() => {
      if (banner && banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 500);
  };

  closeButton.onclick = removeBanner;
  setTimeout(removeBanner, 10000);            
}

const IFRAME_TEXT_CHECK_TIMEOUT = 1000;
const IFRAME_TEXT_IGNORE_SELECTOR = [
  "script",
  "style",
  "template",
  "noscript",
  "svg",
  "canvas",
  "iframe",
  "input",
  "textarea",
  "select",
  "option",
  ".notranslate",
  "[translate='no']",
  "[contenteditable='true']",
].join(", ");

function waitForDocumentReady(timeout = IFRAME_TEXT_CHECK_TIMEOUT) {
  if (document.readyState !== "loading") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      document.removeEventListener("DOMContentLoaded", done);
      resolve();
    };
    const timer = setTimeout(done, timeout);
    document.addEventListener("DOMContentLoaded", done, { once: true });
  });
}

function hasIframeTranslatableText() {
  if (!document.body) return false;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue?.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        if (node.parentElement?.closest(IFRAME_TEXT_IGNORE_SELECTOR)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  return Boolean(walker.nextNode());
}

async function waitForIframeTranslatableText() {
  await waitForDocumentReady();
  return hasIframeTranslatableText();
}

   
                 
   
export async function run() {
  try {
    const href = document?.location?.href || "";

                
                                                           
                                          
    await runDataMigration();
    const setting = await getSettingWithDefault();

                   
    logger.setLevel(setting.logLevel);

                                            
    initAccountRelay();

                                                                   
    const contentType = document?.contentType?.toLowerCase() || "";
    const isPdfDocument = contentType.includes("application/pdf");
    if (
      !contentType.includes("text") &&
      !contentType.includes("html") &&
      !isPdfDocument
    ) {
      logger.info("Skip running in document content type: ", contentType);
      return;
    }

                            
    if (isInBlacklist(href, setting.blacklist)) {
      return;
    }

                                                           
    if (isIframe && !(await waitForIframeTranslatableText())) {
      return;
    }

                                                
    if (isInBlacklist(href, setting.tranboxSetting?.blacklist)) {
      setting.tranboxSetting.transOpen = false;
    }

    if (isInBlacklist(href, setting.inputRule?.blacklist)) {
      setting.inputRule.transOpen = false;
    }

    if (isInBlacklist(href, setting.mouseHoverSetting?.blacklist)) {
      setting.mouseHoverSetting.useMouseHover = false;
    }

                                             
    const rule = await matchRule(href, setting);
    const fabConfig = { ...(await getFabWithDefault()) };
                                     
    if (
      !isIframe &&
      !isPdfDocument &&
      isInBlacklist(href, fabConfig.hideExceptionList)
    ) {
      fabConfig.isHide = !fabConfig.isHide;
    }

                       
    const translatorManager = new TranslatorManager({
      setting,
      rule,
      fabConfig,
      isIframe,
      transboxOnly: isPdfDocument,
    });
    translatorManager.start();

                                                    
    if (isIframe || isPdfDocument) {
      return;
    }

                                               
    initWordBookHighlight();
  } catch (err) {
    console.error("[ParallelText]", err);
    showErr(err.message);                                
  }
}

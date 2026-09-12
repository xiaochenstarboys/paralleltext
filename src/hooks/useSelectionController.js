import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { sleep } from "../libs/utils";
import { isMobile } from "../libs/mobile";
import {
  detectLangFast,
  isPureNumberText,
  normalizeZhLang,
  quickDetectLang,
} from "../libs/detectFast";
import useAutoHideTranBtn from "./useAutoHideTranBtn";
import {
  APP_CONSTS,
  OPT_TRANBOX_BTN_POSITION_FIXED,
  OPT_TRANBOX_BTN_POSITION_MOUSE,
  OPT_TRANBOX_TRIGGER_HOVER,
  OPT_TRANBOX_TRIGGER_SELECT,
  OPT_TRANBOX_TRIGGER_DBLCLICK,
  OPT_TRANBOX_INTERACT_CLICK,
  OPT_TRANBOX_INTERACT_DBLCLICK,
} from "../config";

const TRANBTN_SIZE = isMobile ? 32 : 20;
const TRANBTN_MOUSE_GAP = isMobile ? 16 : 12;

   
                                
                                                        
                                                              
   
function getPointerPosition(e) {
  const touch = e?.changedTouches?.[0] || e?.touches?.[0];
  if (
    typeof touch?.clientX === "number" &&
    typeof touch?.clientY === "number"
  ) {
    return {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  if (typeof e?.clientX === "number" && typeof e?.clientY === "number") {
    return {
      x: e.clientX,
      y: e.clientY,
    };
  }

  return null;
}

function limitButtonPosition(value, min, max) {
  const safeMax = Math.max(min, max);
  return Math.min(Math.max(value, min), safeMax);
}

   
                                 
                               
   
function getPointerButtonPosition(
  pointerPosition,
  btnOffsetX = 0,
  btnOffsetY = 0
) {
  if (!pointerPosition) return null;

  const offsetX = Number(btnOffsetX) || 0;
  const offsetY = Number(btnOffsetY) || 0;
  const viewportRight = window.innerWidth;
  const viewportBottom = window.innerHeight;

  let left = pointerPosition.x + TRANBTN_MOUSE_GAP + offsetX;
  let top = pointerPosition.y + TRANBTN_MOUSE_GAP + offsetY;

  if (left + TRANBTN_SIZE > viewportRight) {
    left = pointerPosition.x - TRANBTN_MOUSE_GAP - TRANBTN_SIZE + offsetX;
  }
  if (top + TRANBTN_SIZE > viewportBottom) {
    top = pointerPosition.y - TRANBTN_MOUSE_GAP - TRANBTN_SIZE + offsetY;
  }

  return {
    x: limitButtonPosition(left, 0, viewportRight - TRANBTN_SIZE),
    y: limitButtonPosition(top, 0, viewportBottom - TRANBTN_SIZE),
  };
}

function getEventPath(e) {
  return typeof e?.composedPath === "function" ? e.composedPath() : [];
}

function getOriginalEventTarget(e) {
  return getEventPath(e)?.[0] || e?.target;
}

function getSelectionRootFromEvent(e) {
  const target = getOriginalEventTarget(e);
  const root = target?.getRootNode?.();
  return root?.getSelection ? root : document;
}

function isTranboxNode(node) {
  for (
    let current = node;
    current;
    current = current.parentNode || current.host
  ) {
    if (
      current.id === APP_CONSTS.boxID ||
      current.classList?.contains?.(`${APP_CONSTS.boxID}_wrapper`)
    )
      return true;
  }
  return false;
}

function isTranboxEvent(e) {
  return isTranboxNode(e?.target) || getEventPath(e).some(isTranboxNode);
}

function isTranboxSelection(selection) {
  if (
    isTranboxNode(selection?.anchorNode) ||
    isTranboxNode(selection?.focusNode)
  )
    return true;
  try {
    for (let i = 0; i < (selection?.rangeCount || 0); i++) {
      const range = selection.getRangeAt(i);
      if (
        [
          range.startContainer,
          range.endContainer,
          range.commonAncestorContainer,
        ].some(isTranboxNode)
      )
        return true;
    }
  } catch {
                   
  }
  return false;
}

function isPanelInteractiveTarget(target) {
  return Boolean(
    target?.closest?.(
      'button, input, textarea, select, [role="tab"], [role="button"]'
    )
  );
}

function isPanelInteractiveEvent(e) {
  return getEventPath(e).some((node) => isPanelInteractiveTarget(node));
}

function isTranButtonEvent(e) {
  return getEventPath(e).some((node) =>
    node?.classList?.contains?.("KT-tranbtn")
  );
}

function isUsableRect(rect) {
  if (!rect) return false;
  return Boolean(
    rect.width ||
      rect.height ||
      rect.left ||
      rect.right ||
      rect.top ||
      rect.bottom
  );
}

function getSelectionRects(selection) {
  try {
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const rects = range.getClientRects();
    return {
      rect,
      lastRect: rects.length > 0 ? rects[rects.length - 1] : rect,
    };
  } catch {
    return null;
  }
}

   
                                 
                                         
                                                                
   
function getSelectionButtonPosition(rect, btnOffsetX = 0, btnOffsetY = 0) {
  if (!rect) return null;

  const offsetX = Number(btnOffsetX) || 0;
  const offsetY = Number(btnOffsetY) || 0;
  const viewportRight = window.innerWidth;
  const viewportBottom = window.innerHeight;

  let left = rect.right + offsetX;
  let top = rect.bottom + offsetY;

  if (left + TRANBTN_SIZE > viewportRight) {
    left = rect.left - TRANBTN_SIZE + offsetX;
  }
  if (top + TRANBTN_SIZE > viewportBottom) {
    top = rect.top - TRANBTN_SIZE + offsetY;
  }

  return {
    x: limitButtonPosition(left, 0, viewportRight - TRANBTN_SIZE),
    y: limitButtonPosition(top, 0, viewportBottom - TRANBTN_SIZE),
  };
}

   
                  
                                       
                                     
   
function buildBoxAnchor(rect, boxOffsetX, boxOffsetY) {
  return {
    centerX: (rect.left + rect.right) / 2 + boxOffsetX,
    top: rect.top - boxOffsetY,
    bottom: rect.bottom + boxOffsetY,
  };
}

   
                                      
                                                    
   
function readContextText(container, maxLen = 1000) {
  if (!container) return "";
  try {
    let out = "";
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      out += walker.currentNode.nodeValue;
                         
      if (out.length >= maxLen * 2) break;
    }
    return out.replace(/\s+/g, " ").trim().slice(0, maxLen);
  } catch {
    return "";
  }
}

function getTargetContext(target) {
  const element =
    target?.nodeType === Node.ELEMENT_NODE ? target : target?.parentElement;
  const container = element?.closest?.(
    "p, li, blockquote, article, section, main, div"
  );
  return readContextText(container || element);
}

function getSelectionContext(selection) {
  try {
    if (!selection || selection.rangeCount === 0) return "";
    const node = selection.getRangeAt(0).commonAncestorContainer;
    const element =
      node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const container = element?.closest?.(
      "p, li, blockquote, article, section, main, div"
    );
    if (!container) return "";
    return readContextText(container || element);
  } catch {
    return "";
  }
}

export default function useSelectionController({
  tranboxSetting,
  followSelection,
  boxOffsetX,
  boxOffsetY,
  hideClickAway,
}) {
  const {
    hideTranBtn = false,
    triggerMode,
    btnPositionMode = OPT_TRANBOX_BTN_POSITION_FIXED,
    btnOffsetX = 0,
    btnOffsetY = 0,
    tranboxInteractMode = "-",
    skipLangs = [],
  } = tranboxSetting;

  const [showBox, setShowBox] = useState(false);
  const [showBtn, setShowBtn] = useState(false);
  const [selectedText, setSelText] = useState("");
  const [text, setText] = useState("");
  const [textContext, setTextContext] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
                                        
  const [boxAnchor, setBoxAnchor] = useState(null);
  const selectionRootRef = useRef(document);
  const pendingSelectionRef = useRef(null);
  const selectionRequestRef = useRef(0);

  const getActiveSelection = useCallback(
    () => selectionRootRef.current?.getSelection?.() || window.getSelection(),
    []
  );

  useAutoHideTranBtn(showBtn, setShowBtn, getActiveSelection);

  const commitSelectionSnapshot = useCallback((snapshot) => {
    if (!snapshot?.text) return;

    pendingSelectionRef.current = snapshot;
    setSelText(snapshot.text);
    setTextContext(snapshot.context);
    setShowBtn(false);
    setText(snapshot.text);
    setShowBox(true);
  }, []);

  const handleOpenTranbox = useCallback(
    (inputText) => {
      const pending = pendingSelectionRef.current;
      const snapshot =
        inputText && pending?.text !== inputText
          ? { text: inputText, context: "", source: "manual" }
          : pending || { text: selectedText, context: "", source: "manual" };

      commitSelectionSnapshot(snapshot);
    },
    [commitSelectionSnapshot, selectedText]
  );

  const createSelectionSnapshot = useCallback(
    (selection, pointerPosition, source, target) => {
      const currentSelectedText = selection?.toString()?.trim() || "";
      if (!currentSelectedText) return null;
      const selectionRects = getSelectionRects(selection);
      const rect = isUsableRect(selectionRects?.rect)
        ? selectionRects.rect
        : null;
      const lastRect = isUsableRect(selectionRects?.lastRect)
        ? selectionRects.lastRect
        : rect;

      return {
        text: currentSelectedText,
        context: getSelectionContext(selection) || getTargetContext(target),
        pointerPosition,
        source,
        rect,
        lastRect,
      };
    },
    []
  );

                                
                                      
  const shouldSuppressSelection = useCallback(
    async (text) => {
      if (isPureNumberText(text)) return true;
      if (typeof text !== "string" || !text.trim()) return false;
      if (!skipLangs.length) return false;

                                      
      const quickLang = quickDetectLang(text);
                                       
      if (text.length < 4 && !quickLang) return false;

                                 
      const lang = quickLang || (await detectLangFast(text));
      if (!lang) return false;

      const normLang = normalizeZhLang(lang);
      if (skipLangs.includes(normLang)) {
        return true;
      }
      return false;
    },
    [skipLangs]
  );

  const processSelectionSnapshot = useCallback(
    async (snapshot, requestId) => {
                                
                              
      if (snapshot?.source === "panel") return;
      if (!snapshot?.text) {
        pendingSelectionRef.current = null;
        setShowBtn(false);
        return;
      }

      pendingSelectionRef.current = snapshot;
      setSelText(snapshot.text);

                                   
      const suppressed = await shouldSuppressSelection(snapshot.text);
      if (requestId !== selectionRequestRef.current) return;
      if (suppressed) {
        pendingSelectionRef.current = null;
        setShowBtn(false);
        setShowBox(false);
        return;
      }

      if (snapshot.rect && followSelection) {
        setBoxAnchor(buildBoxAnchor(snapshot.rect, boxOffsetX, boxOffsetY));
      }

      if (
        triggerMode === OPT_TRANBOX_TRIGGER_SELECT ||
        triggerMode === OPT_TRANBOX_TRIGGER_DBLCLICK
      ) {
        commitSelectionSnapshot(snapshot);
        return;
      }

      if (hideTranBtn) {
        setShowBtn(false);
        return;
      }

      const buttonPosition =
        btnPositionMode === OPT_TRANBOX_BTN_POSITION_MOUSE &&
        snapshot.pointerPosition
          ? getPointerButtonPosition(
              snapshot.pointerPosition,
              btnOffsetX,
              btnOffsetY
            )
          : getSelectionButtonPosition(
              snapshot.lastRect,
              btnOffsetX,
              btnOffsetY
            ) ||
            getPointerButtonPosition(
              snapshot.pointerPosition,
              btnOffsetX,
              btnOffsetY
            );

      if (buttonPosition) {
        setShowBtn(true);
        setPosition(buttonPosition);
      } else {
        setShowBtn(false);
      }
    },
    [
      hideTranBtn,
      triggerMode,
      btnPositionMode,
      btnOffsetX,
      btnOffsetY,
      followSelection,
      boxOffsetX,
      boxOffsetY,
      commitSelectionSnapshot,
      shouldSuppressSelection,
    ]
  );

  const handleSelectionEvent = useCallback(
    async (e) => {
      if (e.button === 2) return;
      if (isTranButtonEvent(e)) return;

      const requestId = ++selectionRequestRef.current;
      if (isTranboxEvent(e)) {
        setShowBtn(false);
        return;
      }
      const target = getOriginalEventTarget(e);
      if (
        target?.closest?.(
          'button, input, textarea, select, [role="button"], [contenteditable="true"], [contenteditable=""]'
        )
      )
        return;

      const pointerPosition = getPointerPosition(e);
      await sleep(120);
      if (requestId !== selectionRequestRef.current) return;

      const selection = window.getSelection();
                                           
      if (isTranboxSelection(selection)) {
        setShowBtn(false);
        return;
      }
      selectionRootRef.current = document;
      const snapshot = createSelectionSnapshot(
        selection,
        pointerPosition,
        "page",
        target
      );

      await processSelectionSnapshot(snapshot, requestId);
    },
    [createSelectionSnapshot, processSelectionSnapshot]
  );

  const handleToggleTranbox = useCallback(() => {
    selectionRequestRef.current++;
    setShowBtn(false);

    let selection = window.getSelection();
    let snapshot = createSelectionSnapshot(selection, null, "page");

                                     
    if (!snapshot?.text && selectionRootRef.current) {
      selection =
        selectionRootRef.current.getSelection?.() || window.getSelection();
      snapshot = createSelectionSnapshot(selection, null, "page");
    }

                      
    if (!snapshot?.text && pendingSelectionRef.current?.text) {
      snapshot = pendingSelectionRef.current;
    }

    if (!snapshot?.text) {
      setShowBox((pre) => !pre);
      return;
    }

    selectionRootRef.current = document;

    if (snapshot.rect && followSelection) {
      setBoxAnchor(buildBoxAnchor(snapshot.rect, boxOffsetX, boxOffsetY));
    }

    commitSelectionSnapshot(snapshot);
  }, [
    followSelection,
    boxOffsetX,
    boxOffsetY,
    createSelectionSnapshot,
    commitSelectionSnapshot,
  ]);

  const btnEvent = useMemo(() => {
    if (isMobile) {
      return "onTouchEnd";
    } else if (triggerMode === OPT_TRANBOX_TRIGGER_HOVER) {
      return "onMouseOver";
    }
    return "onMouseUp";
  }, [triggerMode]);

  useEffect(
    () => () => {
      selectionRequestRef.current++;
    },
    [triggerMode]
  );

  useEffect(() => {
                                         
                                       
    let eventName;
    if (triggerMode === OPT_TRANBOX_TRIGGER_DBLCLICK) {
      eventName = "dblclick";
    } else if (isMobile) {
      eventName = "touchend";
    } else {
      eventName = "mouseup";
    }

    window.addEventListener(eventName, handleSelectionEvent);
    return () => {
      window.removeEventListener(eventName, handleSelectionEvent);
    };
  }, [handleSelectionEvent, triggerMode]);

  useEffect(() => {
                                   
                                       
    const handlePanelStart = (event) => {
      if (!isTranboxEvent(event)) return;
      selectionRequestRef.current++;
      setShowBtn(false);
    };
    window.addEventListener("mousedown", handlePanelStart, true);
    window.addEventListener("touchstart", handlePanelStart, true);
    return () => {
      window.removeEventListener("mousedown", handlePanelStart, true);
      window.removeEventListener("touchstart", handlePanelStart, true);
    };
  }, []);

  useEffect(() => {
    if (!hideClickAway) return;

                                                      
                                            
    const handleHideBox = (e) => {
      if (isTranboxEvent(e)) return;
      if (isTranButtonEvent(e)) return;
      selectionRequestRef.current++;
      setShowBox(false);
      setShowBtn(false);
    };
    window.addEventListener("mousedown", handleHideBox, true);
    return () => {
      window.removeEventListener("mousedown", handleHideBox, true);
    };
  }, [hideClickAway]);

                               
  useEffect(() => {
    if (
      tranboxInteractMode !== OPT_TRANBOX_INTERACT_CLICK &&
      tranboxInteractMode !== OPT_TRANBOX_INTERACT_DBLCLICK
    ) {
      return;
    }

    const eventName =
      tranboxInteractMode === OPT_TRANBOX_INTERACT_DBLCLICK
        ? "dblclick"
        : "mouseup";

    function handleInteract(e) {
      if (!isTranboxEvent(e) || isPanelInteractiveEvent(e) || e.button === 2)
        return;
      const target = getOriginalEventTarget(e);
      const selectionRoot = getSelectionRootFromEvent(e);
      selectionRootRef.current = selectionRoot;
      const selection = selectionRoot.getSelection?.() || window.getSelection();
      const snapshot = createSelectionSnapshot(
        selection,
        getPointerPosition(e),
        "panel",
        target
      );
      commitSelectionSnapshot(snapshot);
    }

    document.addEventListener(eventName, handleInteract, true);
    return () => {
      document.removeEventListener(eventName, handleInteract, true);
    };
  }, [tranboxInteractMode, createSelectionSnapshot, commitSelectionSnapshot]);

  return {
    showBox,
    setShowBox,
    showBtn,
    setShowBtn,
    selectedText,
    setSelText,
    text,
    setText,
    textContext,
    position,
    setPosition,
    boxAnchor,
    handleOpenTranbox,
    handleToggleTranbox,
    btnEvent,
  };
}

import { useEffect } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { APP_CONSTS } from "../config";
import useSelectionController from "./useSelectionController";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../libs/mobile", () => ({
  isMobile: false,
}));

jest.mock("../libs/detectFast", () => {
  const actual = jest.requireActual("../libs/detectFast");
  return {
    ...actual,
    detectLangFast: jest.fn(),
  };
});

import { detectLangFast } from "../libs/detectFast";

function makeSelection(text, container, rectOverride) {
  const rect = rectOverride || {
    left: 10,
    right: 30,
    bottom: 40,
  };
  const range = {
    commonAncestorContainer: container?.firstChild || container,
    getBoundingClientRect: () => rect,
    getClientRects: () => [rect],
  };

  return {
    isCollapsed: !text,
    rangeCount: text ? 1 : 0,
    toString: () => text,
    getRangeAt: () => range,
  };
}

function createParagraph(text, parent = document.body) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  parent.appendChild(paragraph);
  return paragraph;
}

function createPanelTarget() {
  const host = document.createElement("div");
  host.id = APP_CONSTS.boxID;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const wrapper = document.createElement("div");
  wrapper.className = `${APP_CONSTS.boxID}_wrapper`;
  shadow.appendChild(wrapper);

  return { host, shadow, wrapper };
}

function TestController({
  onState,
  triggerMode = "click",
  tranboxInteractMode = "-",
  followSelection = false,
  boxOffsetY = 0,
  boxSize = { w: 320, h: 240 },
  setBoxPosition = jest.fn(),
  toLang = "zh-CN",
  skipLangs,
  hideClickAway = false,
}) {
  const tranboxSetting = {
    triggerMode,
    hideTranBtn: false,
    btnPositionMode: "fixed",
    btnOffsetX: 0,
    btnOffsetY: 0,
    tranboxInteractMode,
    toLang,
    ...(skipLangs === undefined ? {} : { skipLangs }),
  };
  const state = useSelectionController({
    tranboxSetting,
    followSelection,
    boxOffsetX: 0,
    boxOffsetY,
    boxSize,
    setBoxPosition,
    hideClickAway,
  });

  useEffect(() => {
    onState(state);
  });

  return null;
}

function renderController(props = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const setBoxPosition = props.setBoxPosition || jest.fn();
  let currentState;

  act(() => {
    root.render(
      <TestController
        onState={(state) => (currentState = state)}
        setBoxPosition={setBoxPosition}
        {...props}
      />
    );
  });

  return {
    root,
    setBoxPosition,
    get state() {
      return currentState;
    },
  };
}

async function dispatchWindowMouseup(delay = 200) {
  await act(async () => {
    window.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, button: 0 })
    );
    jest.advanceTimersByTime(delay);
    await Promise.resolve();
  });
}

async function dispatchWindowDblclick() {
  await act(async () => {
    window.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, button: 0 })
    );
    jest.runOnlyPendingTimers();
    await Promise.resolve();
  });
}

async function dispatchPanelMouseup(target, composedPath) {
  await act(async () => {
    const event = new MouseEvent("mouseup", {
      bubbles: true,
      composed: true,
      button: 0,
    });
                                                                
    Object.defineProperty(event, "clientX", { value: 120 });
    Object.defineProperty(event, "clientY", { value: 160 });
    Object.defineProperty(event, "composedPath", {
      value: () => composedPath,
    });

    target.dispatchEvent(event);
    jest.runOnlyPendingTimers();
    await Promise.resolve();
  });
}

describe("useSelectionController", () => {
  let currentSelection;
  let windowGetSelectionSpy;
  let documentGetSelectionSpy;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = "";
    currentSelection = null;
    detectLangFast.mockReset();
    detectLangFast.mockResolvedValue("");
    windowGetSelectionSpy = jest
      .spyOn(window, "getSelection")
      .mockImplementation(() => currentSelection);
    documentGetSelectionSpy = jest
      .spyOn(document, "getSelection")
      .mockImplementation(() => currentSelection);
  });

  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: originalInnerHeight,
    });
    windowGetSelectionSpy.mockRestore();
    documentGetSelectionSpy.mockRestore();
    jest.useRealTimers();
  });

  test("keeps page selections pending until the trigger button in click mode", async () => {
    const controller = renderController();
    const pageParagraph = createParagraph("The library is open.");

    currentSelection = makeSelection("library", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.selectedText).toBe("library");
    expect(controller.state.text).toBe("");
    expect(controller.state.textContext).toBe("");
    expect(controller.state.showBtn).toBe(true);
    expect(controller.state.showBox).toBe(false);

    act(() => {
      controller.state.handleOpenTranbox();
    });

    expect(controller.state.text).toBe("library");
    expect(controller.state.textContext).toBe("The library is open.");
    expect(controller.state.showBox).toBe(true);

    act(() => {
      controller.root.unmount();
    });
  });

  test("keeps existing context when a later page mouseup has an empty selection", async () => {
    const controller = renderController();
    const pageParagraph = createParagraph("The library is open.");

    currentSelection = makeSelection("library", pageParagraph);
    await dispatchWindowMouseup();

    act(() => {
      controller.state.handleOpenTranbox();
    });

    expect(controller.state.textContext).toBe("The library is open.");
    expect(controller.state.showBox).toBe(true);

    currentSelection = makeSelection("", null);
    await dispatchWindowMouseup();

    expect(controller.state.text).toBe("library");
    expect(controller.state.textContext).toBe("The library is open.");

    act(() => {
      controller.root.unmount();
    });
  });

  test("ignores panel control clicks when preserving the current selection context", async () => {
    const controller = renderController();
    const pageParagraph = createParagraph("The library is open.");
    const { host, shadow, wrapper } = createPanelTarget();
    const tab = document.createElement("button");

    tab.setAttribute("role", "tab");
    wrapper.appendChild(tab);
    Object.defineProperty(shadow, "getSelection", {
      configurable: true,
      value: () => currentSelection,
    });

    currentSelection = makeSelection("library", pageParagraph);
    await dispatchWindowMouseup();

    act(() => {
      controller.state.handleOpenTranbox();
    });

    currentSelection = makeSelection(
      "Other",
      createParagraph("Other panel text.", wrapper)
    );
    await dispatchPanelMouseup(tab, [
      tab,
      wrapper,
      shadow,
      host,
      document.body,
      document,
      window,
    ]);

    expect(controller.state.text).toBe("library");
    expect(controller.state.selectedText).toBe("library");
    expect(controller.state.textContext).toBe("The library is open.");

    act(() => {
      controller.root.unmount();
    });
  });

  test("keeps panel selections available for copying without a new translation button", async () => {
    const controller = renderController();
    const pageParagraph = createParagraph("The library is open.");
    const { host, shadow, wrapper } = createPanelTarget();
    const panelParagraph = createParagraph(
      "Panel selected word context.",
      wrapper
    );

    Object.defineProperty(shadow, "getSelection", {
      configurable: true,
      value: () => currentSelection,
    });

    currentSelection = makeSelection("library", pageParagraph);
    await dispatchWindowMouseup();

    act(() => {
      controller.state.handleOpenTranbox();
    });

    currentSelection = makeSelection("selected", panelParagraph);
    await dispatchPanelMouseup(panelParagraph, [
      panelParagraph,
      wrapper,
      shadow,
      host,
      document.body,
      document,
      window,
    ]);

    expect(controller.state.text).toBe("library");
    expect(controller.state.selectedText).toBe("library");
    expect(controller.state.textContext).toBe("The library is open.");
    expect(controller.state.showBtn).toBe(false);

    act(() => {
      controller.state.handleOpenTranbox();
    });

    expect(controller.state.text).toBe("library");
    expect(controller.state.textContext).toBe("The library is open.");

    act(() => {
      controller.root.unmount();
    });
  });

  test("opens panel selections directly in panel interact click mode", async () => {
    const controller = renderController({ tranboxInteractMode: "click" });
    const pageParagraph = createParagraph("The library is open.");
    const { host, shadow, wrapper } = createPanelTarget();
    const panelParagraph = createParagraph(
      "Panel selected word context.",
      wrapper
    );

    Object.defineProperty(shadow, "getSelection", {
      configurable: true,
      value: () => currentSelection,
    });

    currentSelection = makeSelection("library", pageParagraph);
    await dispatchWindowMouseup();

    act(() => {
      controller.state.handleOpenTranbox();
    });

    currentSelection = makeSelection("selected", panelParagraph);
    await dispatchPanelMouseup(panelParagraph, [
      panelParagraph,
      wrapper,
      shadow,
      host,
      document.body,
      document,
      window,
    ]);

    expect(controller.state.text).toBe("selected");
    expect(controller.state.textContext).toBe("Panel selected word context.");
    expect(controller.state.showBtn).toBe(false);

    act(() => {
      controller.root.unmount();
    });
  });

  test("uses the pointer position when a page selection has an empty rect", async () => {
    const controller = renderController();
    const panelParagraph = createParagraph("Page selected word context.");

    currentSelection = makeSelection("selected", panelParagraph, {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
    });
    await dispatchPanelMouseup(panelParagraph, [
      panelParagraph,
      document.body,
      document,
      window,
    ]);

    expect(controller.state.showBtn).toBe(true);
    expect(controller.state.position.x).toBeGreaterThan(0);
    expect(controller.state.position.y).toBeGreaterThan(0);

    act(() => {
      controller.root.unmount();
    });
  });

  test("opens page translations automatically and preserves the result while selecting panel text", async () => {
    const controller = renderController({ triggerMode: "select" });
    const pageParagraph = createParagraph("The library is open.");
    const { host, shadow, wrapper } = createPanelTarget();
    const panelParagraph = createParagraph(
      "Panel selected word context.",
      wrapper
    );

    Object.defineProperty(shadow, "getSelection", {
      configurable: true,
      value: () => currentSelection,
    });

    currentSelection = makeSelection("library", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.text).toBe("library");
    expect(controller.state.textContext).toBe("The library is open.");
    expect(controller.state.showBox).toBe(true);

    currentSelection = makeSelection("selected", panelParagraph);
    await dispatchPanelMouseup(panelParagraph, [
      panelParagraph,
      wrapper,
      shadow,
      host,
      document.body,
      document,
      window,
    ]);

    expect(controller.state.text).toBe("library");
    expect(controller.state.selectedText).toBe("library");
    expect(controller.state.textContext).toBe("The library is open.");
    expect(controller.state.showBox).toBe(true);
    expect(controller.state.showBtn).toBe(false);

    act(() => {
      controller.root.unmount();
    });
  });

  test("opens directly without language detection when no languages are skipped", async () => {
    const controller = renderController({
      triggerMode: "select",
      followSelection: true,
    });
    const paragraph = createParagraph("The library is open.");
    currentSelection = makeSelection("library", paragraph);
    await dispatchWindowMouseup(120);
    expect(controller.state.showBox).toBe(true);
    expect(controller.state.showBtn).toBe(false);
    expect(controller.state.text).toBe("library");
    expect(controller.state.boxAnchor).not.toBeNull();
    expect(detectLangFast).not.toHaveBeenCalled();
    act(() => controller.root.unmount());
  });

  test.each(["select", "dblclick"])(
    "native shadow selection and copy preserve the result in %s mode",
    async (triggerMode) => {
      const controller = renderController({
        triggerMode,
        followSelection: true,
        hideClickAway: true,
      });
      const paragraph = createParagraph("The library is open.");
      currentSelection = makeSelection("library", paragraph);
      if (triggerMode === "dblclick") await dispatchWindowDblclick();
      else await dispatchWindowMouseup();
      const anchor = controller.state.boxAnchor;
      const { wrapper } = createPanelTarget();
      const result = createParagraph("可以复制的翻译结果", wrapper);
      currentSelection = makeSelection("可以复制的翻译结果", result);
      const copy = new Event("copy", {
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      await act(async () => {
        result.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, composed: true })
        );
        result.dispatchEvent(
          new MouseEvent("mouseup", { bubbles: true, composed: true })
        );
        result.dispatchEvent(
          new MouseEvent("dblclick", { bubbles: true, composed: true })
        );
        result.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "c",
            ctrlKey: true,
            bubbles: true,
            composed: true,
          })
        );
        result.dispatchEvent(copy);
        jest.runOnlyPendingTimers();
      });
      expect(copy.defaultPrevented).toBe(false);
      expect(currentSelection.toString()).toBe("可以复制的翻译结果");
      expect(controller.state.text).toBe("library");
      expect(controller.state.textContext).toBe("The library is open.");
      expect(controller.state.showBox).toBe(true);
      expect(controller.state.showBtn).toBe(false);
      expect(controller.state.boxAnchor).toBe(anchor);
      act(() => controller.root.unmount());
    }
  );

  test("dragging a panel selection outside does not translate it or reopen it after closing", async () => {
    const controller = renderController({
      triggerMode: "select",
      hideClickAway: true,
    });
    const paragraph = createParagraph("The library has books.");
    currentSelection = makeSelection("library", paragraph);
    await dispatchWindowMouseup();
    const { wrapper } = createPanelTarget();
    const result = createParagraph("Translated result", wrapper);
    await act(async () =>
      result.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, composed: true })
      )
    );
    currentSelection = makeSelection("Translated result", result);
    await dispatchWindowMouseup();
    expect(controller.state.text).toBe("library");
    expect(controller.state.showBox).toBe(true);
    await act(async () =>
      paragraph.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    );
    await dispatchWindowMouseup();
    expect(controller.state.showBox).toBe(false);
    currentSelection = makeSelection("books", paragraph);
    await dispatchWindowMouseup();
    expect(controller.state.text).toBe("books");
    expect(controller.state.showBox).toBe(true);
    act(() => controller.root.unmount());
  });

  test("a late language check cannot replace the result after copying begins", async () => {
    const controller = renderController({
      triggerMode: "select",
      skipLangs: ["zh"],
    });
    act(() => controller.state.handleOpenTranbox("library"));
    const paragraph = createParagraph("Another page selection");
    let finishDetection;
    detectLangFast.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishDetection = resolve;
        })
    );
    currentSelection = makeSelection("Another page selection", paragraph);
    await dispatchWindowMouseup();
    const { wrapper } = createPanelTarget();
    const result = createParagraph("Translated result", wrapper);
    await act(async () =>
      result.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, composed: true })
      )
    );
    await act(async () => finishDetection("en"));
    expect(controller.state.text).toBe("library");
    expect(controller.state.showBox).toBe(true);
    expect(controller.state.showBtn).toBe(false);
    act(() => controller.root.unmount());
  });

  test.each(["click", "dblclick"])(
    "copy controls do not invoke the optional panel %s action",
    async (tranboxInteractMode) => {
      const controller = renderController({
        triggerMode: "select",
        tranboxInteractMode,
      });
      act(() => controller.state.handleOpenTranbox("library"));
      const { shadow, wrapper } = createPanelTarget();
      const result = createParagraph("Translated result", wrapper);
      currentSelection = makeSelection("Translated result", result);
      Object.defineProperty(shadow, "getSelection", {
        value: () => currentSelection,
      });
      const button = document.createElement("button");
      button.type = "button";
      const icon = document.createElement("span");
      button.appendChild(icon);
      wrapper.appendChild(button);
      const onCopy = jest.fn();
      button.addEventListener("click", onCopy);
      await act(async () => {
        icon.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, composed: true })
        );
        icon.dispatchEvent(
          new MouseEvent("mouseup", { bubbles: true, composed: true })
        );
        icon.dispatchEvent(
          new MouseEvent("click", { bubbles: true, composed: true })
        );
        icon.dispatchEvent(
          new MouseEvent("dblclick", { bubbles: true, composed: true })
        );
        jest.runOnlyPendingTimers();
      });
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(controller.state.text).toBe("library");
      expect(controller.state.showBox).toBe(true);
      act(() => controller.root.unmount());
    }
  );

  test("a delayed language check cannot replace the latest selected word", async () => {
    const controller = renderController({
      triggerMode: "select",
      skipLangs: ["zh"],
    });
    const paragraph = createParagraph("A library contains books.");
    let finishOld;
    detectLangFast.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOld = resolve;
        })
    );
    currentSelection = makeSelection("library", paragraph);
    await dispatchWindowMouseup();
    currentSelection = makeSelection("books", paragraph);
    await dispatchWindowMouseup();
    expect(controller.state.text).toBe("books");
    await act(async () => finishOld("en"));
    expect(controller.state.text).toBe("books");
    expect(controller.state.showBtn).toBe(false);
    act(() => controller.root.unmount());
  });

  test("typing fields do not open automatic translation", async () => {
    const controller = renderController({ triggerMode: "select" });
    const input = document.createElement("textarea");
    document.body.appendChild(input);
    currentSelection = makeSelection("private draft", input);
    await act(async () => {
      input.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, button: 0 })
      );
      jest.runOnlyPendingTimers();
    });
    expect(controller.state.showBox).toBe(false);
    act(() => controller.root.unmount());
  });

  test("clicking a page button closes the box without reopening an unchanged selection", async () => {
    const controller = renderController({
      triggerMode: "select",
      hideClickAway: true,
    });
    const paragraph = createParagraph("The library is open.");
    currentSelection = makeSelection("library", paragraph);
    await dispatchWindowMouseup();
    expect(controller.state.showBox).toBe(true);
    const button = document.createElement("button");
    document.body.appendChild(button);
    await act(async () => {
      button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      jest.runOnlyPendingTimers();
    });
    expect(controller.state.showBox).toBe(false);
    act(() => controller.root.unmount());
  });

  test("opens the box immediately on double-click in dblclick mode", async () => {
    const controller = renderController({ triggerMode: "dblclick" });
    const pageParagraph = createParagraph("The library is open.");

    currentSelection = makeSelection("library", pageParagraph);
    await dispatchWindowDblclick();

    expect(controller.state.text).toBe("library");
    expect(controller.state.textContext).toBe("The library is open.");
    expect(controller.state.showBox).toBe(true);
    expect(controller.state.showBtn).toBe(false);

    act(() => {
      controller.root.unmount();
    });
  });

  test("ignores plain mouseup selections in dblclick mode", async () => {
    const controller = renderController({ triggerMode: "dblclick" });
    const pageParagraph = createParagraph("The library is open.");

    currentSelection = makeSelection("library", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.text).toBe("");
    expect(controller.state.showBox).toBe(false);
    expect(controller.state.showBtn).toBe(false);

    act(() => {
      controller.root.unmount();
    });
  });

  test("records a follow anchor from the selection rect", async () => {
    const controller = renderController({
      followSelection: true,
      boxOffsetY: 10,
    });
    const pageParagraph = createParagraph("The library is open.");

    currentSelection = makeSelection("library", pageParagraph, {
      left: 10,
      right: 30,
      top: 420,
      bottom: 440,
      width: 20,
      height: 20,
    });
    await dispatchWindowMouseup();

                                        
    expect(controller.state.boxAnchor).toEqual({
      centerX: 20,
      top: 410,
      bottom: 450,
    });
               
    expect(controller.setBoxPosition).not.toHaveBeenCalled();

    act(() => {
      controller.root.unmount();
    });
  });

  test("does not record a follow anchor when followSelection is off", async () => {
    const controller = renderController({
      followSelection: false,
      boxOffsetY: 10,
    });
    const pageParagraph = createParagraph("The library is open.");

    currentSelection = makeSelection("library", pageParagraph, {
      left: 10,
      right: 30,
      top: 420,
      bottom: 440,
      width: 20,
      height: 20,
    });
    await dispatchWindowMouseup();

    expect(controller.state.boxAnchor).toBeNull();
    expect(controller.setBoxPosition).not.toHaveBeenCalled();

    act(() => {
      controller.root.unmount();
    });
  });

  test("hides the button when the selected language is in skipLangs", async () => {
    const controller = renderController({ skipLangs: ["zh"] });
    const pageParagraph = createParagraph("The library is open.");

    detectLangFast.mockResolvedValue("zh-CN");
    currentSelection = makeSelection("这是一段中文文本", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.selectedText).toBe("这是一段中文文本");
    expect(controller.state.showBtn).toBe(false);
    expect(controller.state.showBox).toBe(false);

    act(() => {
      controller.root.unmount();
    });
  });

  test("treats traditional Chinese as zh via normalization in skipLangs", async () => {
    const controller = renderController({ skipLangs: ["zh"] });
    const pageParagraph = createParagraph("The library is open.");

    detectLangFast.mockResolvedValue("zh-TW");
    currentSelection = makeSelection("這是一段繁體中文", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.showBtn).toBe(false);

    act(() => {
      controller.root.unmount();
    });
  });

  test("shows the button when the selected language differs from the target", async () => {
    const controller = renderController();
    const pageParagraph = createParagraph("The library is open.");

    detectLangFast.mockResolvedValue("en");
    currentSelection = makeSelection("some english text here", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.showBtn).toBe(true);

    act(() => {
      controller.root.unmount();
    });
  });

  test("suppresses the button when skipLangs includes the detected language", async () => {
    const controller = renderController({ skipLangs: ["en"] });
    const pageParagraph = createParagraph("The library is open.");

    detectLangFast.mockResolvedValue("en");
    currentSelection = makeSelection("some english text here", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.showBtn).toBe(false);

    act(() => {
      controller.root.unmount();
    });
  });

  test("shows the button when skipLangs is empty and detected lang differs from toLang", async () => {
    const controller = renderController({ skipLangs: [], toLang: "ja" });
    const pageParagraph = createParagraph("The library is open.");

    detectLangFast.mockResolvedValue("zh-CN");
    currentSelection = makeSelection("这是一段中文文本", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.showBtn).toBe(true);

    act(() => {
      controller.root.unmount();
    });
  });

  test("shows the button for Chinese when legacy settings omit skipLangs", async () => {
    const controller = renderController({ toLang: "ja" });
    const pageParagraph = createParagraph("The library is open.");

    detectLangFast.mockResolvedValue("zh-CN");
    currentSelection = makeSelection("这是一段中文文本", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.showBtn).toBe(true);

    act(() => {
      controller.root.unmount();
    });
  });

  test("hides the button for pure-number selections of any length", async () => {
    const controller = renderController();
    const pageParagraph = createParagraph("The library is open.");

    currentSelection = makeSelection("1234567890", pageParagraph);
    await dispatchWindowMouseup();

    expect(controller.state.showBtn).toBe(false);
    expect(detectLangFast).not.toHaveBeenCalled();

    act(() => {
      controller.root.unmount();
    });
  });

  test("shows the button when language detection times out or fails", async () => {
    const controller = renderController();
    const pageParagraph = createParagraph("The library is open.");

    detectLangFast.mockResolvedValue("");
    currentSelection = makeSelection(
      "some undetectable text here",
      pageParagraph
    );
    await dispatchWindowMouseup();

    expect(controller.state.showBtn).toBe(true);

    act(() => {
      controller.root.unmount();
    });
  });
});

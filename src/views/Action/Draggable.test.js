import { act } from "react";
import { createRoot } from "react-dom/client";
import Draggable from "./Draggable";
import { putFab } from "../../libs/storage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../libs/mobile", () => ({ isMobile: false }));
jest.mock("../../libs/storage", () => ({ putFab: jest.fn() }));

describe("Draggable FAB edge locking", () => {
  let container;
  let root;
  let draggable;
  let originalClientWidth;
  let originalClientHeight;
  let getBoundingClientRect;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    originalClientWidth = Object.getOwnPropertyDescriptor(
      document.documentElement,
      "clientWidth"
    );
    originalClientHeight = Object.getOwnPropertyDescriptor(
      document.documentElement,
      "clientHeight"
    );
    setViewport(600, 400);
    HTMLElement.prototype.setPointerCapture = jest.fn();
    getBoundingClientRect = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function () {
        if (this === draggable) {
          const match = this.style.transform.match(
            /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/
          );
          const left = Number(match?.[1] || 0);
          const top = Number(match?.[2] || 0);
          return {
            x: left,
            y: top,
            left,
            top,
            right: left + 40,
            bottom: top + 40,
            width: 40,
            height: 40,
            toJSON: () => ({}),
          };
        }
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        };
      });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    getBoundingClientRect.mockRestore();
    putFab.mockReset();
    jest.useRealTimers();
    restoreViewport("clientWidth", originalClientWidth);
    restoreViewport("clientHeight", originalClientHeight);
  });

  function setViewport(width, height) {
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: width,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: height,
    });
  }

  function restoreViewport(property, descriptor) {
    if (descriptor) {
      Object.defineProperty(document.documentElement, property, descriptor);
    } else {
      delete document.documentElement[property];
    }
  }

  function renderFab(props = {}) {
    const fab = {
      windowSize: { w: 600, h: 400 },
      width: 40,
      height: 40,
      left: 580,
      top: 200,
      edge: "right",
      snapEdge: true,
      handler: <span>fab</span>,
      ...props,
    };
    act(() => root.render(<Draggable {...fab} />));
    draggable = container.firstElementChild;
    return fab;
  }

  function rerenderFab(fab, props) {
    const nextFab = { ...fab, ...props };
    act(() => root.render(<Draggable {...nextFab} />));
    return nextFab;
  }

  test("keeps the right edge during immediate and debounced viewport resize", () => {
    const fab = renderFab();
    expect(draggable.style.transform).toBe("translate(560px, 200px)");

    setViewport(1200, 800);
    act(() => window.dispatchEvent(new Event("resize")));
    expect(draggable.style.transform).toBe("translate(1160px, 400px)");

    rerenderFab(fab, { windowSize: { w: 1200, h: 800 } });
    expect(draggable.style.transform).toBe("translate(1160px, 400px)");
  });

  test.each([
    ["left", -20, 200, "translate(0px, 400px)"],
    ["top", 300, -20, "translate(600px, 0px)"],
    ["bottom", 300, 380, "translate(600px, 760px)"],
  ])("keeps the %s edge after resize", (edge, left, top, expected) => {
    const fab = renderFab({ edge, left, top });
    setViewport(1200, 800);
    rerenderFab(fab, { windowSize: { w: 1200, h: 800 } });
    expect(draggable.style.transform).toBe(expected);
  });

  test("keeps the FAB fully visible on hover without changing its saved edge", () => {
    renderFab();
    expect(draggable.style.opacity).toBe("1");

    act(() =>
      draggable.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
    );
                             
    expect(draggable.style.transform).toBe("translate(560px, 200px)");
    expect(draggable.style.opacity).toBe("1");

    act(() =>
      draggable.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))
    );
    act(() => jest.runOnlyPendingTimers());
    expect(draggable.style.transform).toBe("translate(560px, 200px)");
    expect(putFab).toHaveBeenLastCalledWith({ x: 560, y: 200, edge: "right" });
  });

  test("changes the locked edge only after a real drag", () => {
    renderFab();
    const handler = draggable.firstElementChild.firstElementChild;

    act(() => {
      handler.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
          clientX: 590,
          clientY: 210,
        })
      );
    });
    act(() => {
      handler.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          clientX: 300,
          clientY: 0,
        })
      );
    });
    act(() => {
      handler.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(draggable.style.transform).toBe("translate(270px, 0px)");
    expect(putFab).toHaveBeenLastCalledWith({ x: 270, y: 0, edge: "top" });
  });

  test("infers and persists an edge for legacy FAB positions", () => {
    renderFab({ edge: undefined });
    act(() => jest.runOnlyPendingTimers());

    expect(draggable.style.transform).toBe("translate(560px, 200px)");
    expect(putFab).toHaveBeenLastCalledWith({ x: 560, y: 200, edge: "right" });
  });

  test("treats sub-threshold jitter as a click, not a drag", () => {
    const onMove = jest.fn();
    renderFab({ onMove });
    const handler = draggable.firstElementChild.firstElementChild;

    act(() => {
      handler.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
          clientX: 565,
          clientY: 205,
        })
      );
    });
                           
    act(() => {
      handler.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          clientX: 567,
          clientY: 207,
        })
      );
    });
    act(() => {
      handler.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });
    act(() => {
      jest.runOnlyPendingTimers();
    });

                          
    expect(onMove).not.toHaveBeenCalled();
    expect(draggable.style.transform).toBe("translate(560px, 200px)");
  });
});

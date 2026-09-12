import { act } from "react";
import { createRoot } from "react-dom/client";
import { useStorage } from "./Storage";
import { storage } from "../libs/storage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../libs/storage", () => ({
  STORAGE_CHANGE_EVENT: "paralleltext_storage_change",
  storage: {
    getObj: jest.fn(),
    setObj: jest.fn(() => Promise.resolve()),
    del: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("../libs/log", () => ({
  kissLog: jest.fn(),
}));

function createHookHost() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const hookResult = {};

  function TestComponent() {
    Object.assign(hookResult, useStorage("local-setting", { local: true }));
    return null;
  }

  return {
    hookResult,
    render: () => {
      act(() => {
        root.render(<TestComponent />);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitForLoaded(hookResult) {
  for (let i = 0; i < 5; i += 1) {
    await flushEffects();
    if (hookResult.isLoading === false) return;
  }
}

describe("useStorage local persistence", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    storage.getObj.mockResolvedValue({ local: true });
    storage.setObj.mockResolvedValue(undefined);
    storage.del.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("writes saves into local storage", async () => {
    const host = createHookHost();
    host.render();
    await waitForLoaded(host.hookResult);
    await flushEffects();
    expect(host.hookResult.isLoading).toBe(false);

    await act(async () => {
      host.hookResult.save({ changed: true });
    });

    await flushEffects();
    expect(storage.setObj).toHaveBeenCalledWith("local-setting", {
      changed: true,
    });

    host.unmount();
  });

  test("syncs state across hook instances via storage change events", async () => {
    const hostA = createHookHost();
    hostA.render();
    await waitForLoaded(hostA.hookResult);
    const hostB = createHookHost();
    hostB.render();
    await waitForLoaded(hostB.hookResult);

                                   
    storage.getObj.mockResolvedValue({ changed: true });
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("paralleltext_storage_change", {
          detail: { key: "local-setting" },
        })
      );
      await Promise.resolve();
    });
    await flushEffects();

    expect(hostB.hookResult.data).toEqual({ changed: true });

    hostA.unmount();
    hostB.unmount();
  });

  test("does not update state when reload returns equivalent data", async () => {
    const host = createHookHost();
    host.render();
    await waitForLoaded(host.hookResult);
    await flushEffects();

    storage.setObj.mockClear();
    storage.getObj.mockResolvedValueOnce({ local: true });

    await act(async () => {
      await host.hookResult.reload();
    });
    await flushEffects();

    expect(storage.setObj).not.toHaveBeenCalled();

    host.unmount();
  });

                                                 
                                                        
                                
  test("does not write default when defaultVal is null", async () => {
    storage.getObj.mockResolvedValue(null);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const hookResult = {};
    function NullDefaultComponent() {
      Object.assign(hookResult, useStorage("account-key", null));
      return null;
    }

    act(() => {
      root.render(<NullDefaultComponent />);
    });
    await waitForLoaded(hookResult);
    await flushEffects();

    expect(hookResult.isLoading).toBe(false);
    expect(storage.setObj).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});

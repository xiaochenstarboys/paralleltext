import { act } from "react";
import { createRoot } from "react-dom/client";
import Options from "./index";
import { runDataMigration } from "../../libs/storage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockSettingProvider = jest.fn();

jest.mock("../../libs/log", () => ({
  kissLog: jest.fn(),
  LogLevel: {
    INFO: { value: 3 },
  },
}));

jest.mock("../../libs/storage", () => ({
  runDataMigration: jest.fn(),
}));

jest.mock("../../hooks/Setting", () => ({
  useSetting: () => ({
    setting: { uiLang: "zh-CN" },
    updateSetting: jest.fn(),
  }),
  SettingProvider: function SettingProvider(props) {
    mockSettingProvider(props);
    return props.children;
  },
}));

jest.mock("../../hooks/Theme", () => {
  return function ThemeProvider(props) {
    return props.children;
  };
});
jest.mock("../../hooks/Alert", () => ({
  AlertProvider: function AlertProvider(props) {
    return props.children;
  },
}));
jest.mock("../../hooks/Confirm", () => ({
  ConfirmProvider: function ConfirmProvider(props) {
    return props.children;
  },
}));

function mockComponent(testId) {
  return function MockComponent() {
    const React = require("react");
    return React.createElement("div", testId ? { "data-testid": testId } : {});
  };
}

jest.mock("./Header", () => mockComponent("options-header"));
jest.mock("./Navigator", () => mockComponent("options-nav"));
jest.mock("./Setting", () => mockComponent("setting-page"));
jest.mock("./Rules", () => mockComponent("rules-page"));
jest.mock("./Engines", () => mockComponent("engines-page"));
jest.mock("./Tranbox", () => mockComponent());
jest.mock("../Selection/AiDictCont", () => () => null);

function renderOptions(hash) {
  window.location.hash = hash;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<Options />);
  });

  return {
    container,
    root,
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

describe("Options startup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runDataMigration.mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.location.hash = "";
  });

  test("redirects the index route to the engines page", async () => {
    const view = renderOptions("#/");
    await flushEffects();

                    
    expect(
      view.container.querySelector("[data-testid='engines-page']")
    ).not.toBe(null);

    view.unmount();
  });

  test("renders rules settings page", async () => {
    const view = renderOptions("#/rules");
    await flushEffects();

    expect(view.container.querySelector("[data-testid='rules-page']")).not.toBe(
      null
    );

    view.unmount();
  });

  test("renders engines settings page", async () => {
    const view = renderOptions("#/engines");
    await flushEffects();

    expect(
      view.container.querySelector("[data-testid='engines-page']")
    ).not.toBe(null);

    view.unmount();
  });

  test("runs data migration once on mount without gating rendering", async () => {
    const view = renderOptions("#/");
    await flushEffects();

    expect(runDataMigration).toHaveBeenCalledTimes(1);
    expect(mockSettingProvider).toHaveBeenCalled();
    expect(
      view.container.querySelector("[data-testid='engines-page']")
    ).not.toBe(null);

    view.unmount();
  });
});

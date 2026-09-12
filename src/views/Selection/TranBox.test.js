import React, { act } from "react";
import { createRoot } from "react-dom/client";
import TranBox from "./TranBox";
import TranForm from "./TranForm";
let mockIsProActive = true;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../hooks/I18n", () => ({
  useI18n: () => (key, fallback) => fallback || key,
}));
jest.mock("../../hooks/Theme", () => ({
  __esModule: true,
  default: ({ children }) => children,
}));
jest.mock("../../hooks/Setting", () => ({
  SettingProvider: ({ children }) => children,
  useSetting: () => ({ updateSetting: jest.fn() }),
}));
jest.mock("../../hooks/Membership", () => ({ useMembership: () => ({ isProActive: mockIsProActive }) }));
jest.mock("./TranActions", () => () => null);
jest.mock("../../components/Logo", () => () => null);
jest.mock("./DraggableResizable", () => {
  const React = require("react");
  return (props) =>
    React.createElement(
      "div",
      { "data-testid": "tranbox-shell" },
      React.createElement("div", { "data-testid": "tranbox-header" }, props.header),
      React.createElement("div", { "data-testid": "tranbox-body" }, props.children)
    );
});
jest.mock("./TranForm", () => {
  const React = require("react");
  return jest.fn(() => React.createElement("div", { "data-testid": "tranbox-form" }));
});

const baseProps = {
  showBox: true,
  text: "",
  setText: jest.fn(),
  boxSize: { w: 400, h: 200 },
  setBoxSize: jest.fn(),
  boxPosition: { x: 0, y: 0 },
  boxAnchor: null,
  setBoxPosition: jest.fn(),
  tranboxSetting: {
    apiSlugs: [],
    fromLang: "auto",
    toLang: "zh-CN",
    toLang2: "en",
    enDict: "-",
    enSug: "-",
    aiDictApiSlug: "-",
    aiDictPromptSlug: "-",
  },
  transApis: [],
  prompts: [],
  langDetector: "-",
  translateVariants: true,
  simpleStyle: false,
  hideClickAway: false,
  followSelection: false,
  setSimpleStyle: jest.fn(),
  setHideClickAway: jest.fn(),
  setFollowSelection: jest.fn(),
  selectionContext: "",
};

const render = async (props = {}) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(<TranBox {...baseProps} {...props} />));
  return { container, root };
};
beforeEach(() => { mockIsProActive = true; TranForm.mockImplementation(() => React.createElement("div", { "data-testid": "tranbox-form" })); });

test("does not render an empty read-only panel", async () => {
  const { container, root } = await render();
  expect(container.querySelector('[data-testid="tranbox-shell"]')).toBeNull();
  await act(async () => root.unmount());
  container.remove();
});

test("renders the panel after a valid selection is available", async () => {
  const { container, root } = await render({ text: "selected text" });
  expect(container.querySelector('[data-testid="tranbox-shell"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="tranbox-form"]')).not.toBeNull();
  await act(async () => root.unmount());
  container.remove();
});

test("an open selection panel hides disabled engines and uses the displayed fallback in its form", async () => {
  const apis = ["Qwen", "DeepSeek", "OpenAI"].map((type) => ({ apiSlug: type, apiType: type, apiName: type }));
  const props = { ...baseProps, text: "hello", tranboxSetting: { ...baseProps.tranboxSetting, apiSlugs: ["OpenAI"] }, transApis: apis };
  const { container, root } = await render(props);
  expect(TranForm.mock.calls.at(-1)[0].apiSlugs).toEqual(["OpenAI"]);
  await act(async () => root.render(<TranBox {...props} transApis={apis.map((api) => ({ ...api, isDisabled: api.apiSlug === "OpenAI" }))} />));
  const form = TranForm.mock.calls.at(-1)[0];
  expect(form.transApis.map((api) => api.apiSlug)).toEqual(["Qwen", "DeepSeek"]);
  expect(form.apiSlugs).toEqual(["Qwen"]);
  expect(container.querySelector('input[value="OpenAI"]')).toBeNull();
  await act(async () => root.unmount()); container.remove();
});

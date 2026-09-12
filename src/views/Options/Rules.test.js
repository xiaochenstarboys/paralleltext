   
                            
                                                      
   
import { act } from "react";
import { createRoot } from "react-dom/client";
import Terms from "./Terms";
import { useRules } from "../../hooks/Rules";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../hooks/I18n", () => ({
  useI18n: () => (key, fallback) => fallback || key,
}));

jest.mock("../../hooks/Rules", () => ({
  useRules: jest.fn(),
}));

let mockTermGlossaries = [];
const mockUpdateSetting = jest.fn();
jest.mock("../../hooks/Setting", () => ({
  useSetting: () => ({
    setting: { termGlossaries: mockTermGlossaries },
    updateSetting: mockUpdateSetting,
  }),
}));

let mockMembership = { isMember: false, isLoading: false };
jest.mock("../../hooks/Membership", () => ({
  useMembership: () => mockMembership,
}));

jest.mock("../../hooks/Account", () => ({
  useAccount: () => ({ account: null }),
}));

const G = (over = {}) => ({
  id: "g1",
  name: "默认术语库",
  description: "",
  sites: "*",
  terms: "",
  enabled: true,
  ...over,
});

                                                     
const clickByText = (view, text) => {
  const matches = [...view.querySelectorAll("div, span, p")].filter(
    (n) => n.textContent === text
  );
  const el = matches[matches.length - 1];
  expect(el).toBeTruthy();
  el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
};

const renderTerms = async () => {
  const view = document;
  view.body.innerHTML = "";
  const container = view.createElement("div");
  view.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(<Terms />);
  });
  return view;
};

                   
const openDetail = async (view, name = "默认术语库") => {
  await act(async () => {
    clickByText(view, name);
  });
};

const mockEmptyRule = () =>
  useRules.mockReturnValue({
    list: [{ pattern: "*", terms: "", aiTerms: "" }],
    put: jest.fn(),
  });

beforeEach(() => {
  mockMembership = { isMember: false, isLoading: false };
  mockTermGlossaries = [];
  mockUpdateSetting.mockClear();
});

test.each([true, false])("会员读取期间不闪现免费额度，加载后按实际资格显示（Pro=%s）", async (isMember) => {
  mockTermGlossaries = [G()];
  mockEmptyRule();
  mockMembership = { isMember: false, isLoading: true };
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Terms />));
    expect(container.textContent).toContain("翻译引擎设置");
    expect(container.textContent).not.toContain("免费版");
    expect(container.textContent).not.toContain("开通会员");
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    mockMembership = { isMember, isLoading: false };
    await act(async () => root.render(<Terms />));
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.textContent.includes("免费版 20 条")).toBe(!isMember);
    expect(container.textContent.includes("开通会员")).toBe(!isMember);
    expect(container.textContent.includes("新建词库")).toBe(isMember);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

test("播种：没有任何词库时自动创建「默认术语库」，旧全局术语迁入并清空旧字段", async () => {
  const put = jest.fn();
  useRules.mockReturnValue({
    list: [
      {
        pattern: "*",
        terms: "LLM,大模型",
        aiTerms: "biopsy,活检\nLLM,大语言模型",
      },
    ],
    put,
  });
  await renderTerms();
  expect(put).toHaveBeenCalledWith("*", { terms: "", aiTerms: "" });
  const call = mockUpdateSetting.mock.calls.find((c) =>
    Array.isArray(c[0]?.termGlossaries)
  );
  expect(call).toBeTruthy();
  const seeded = call[0].termGlossaries;
  expect(seeded.length).toBe(1);
  expect(seeded[0].sites).toBe("*");
  expect(seeded[0].terms).toBe("LLM,大模型\nbiopsy,活检");
});

test("列表显示词库卡片（名称/范围/条数/描述），点击进入详情，返回回到列表", async () => {
  mockTermGlossaries = [
    G({ terms: "LLM,大模型", description: "全局生效的常用术语" }),
  ];
  mockEmptyRule();
  const view = await renderTerms();
           
  expect(view.body.textContent).toContain("默认术语库");
  expect(view.body.textContent).toContain("全局生效");
  expect(view.body.textContent).toContain("1 条");
  expect(view.body.textContent).toContain("全局生效的常用术语");
                
  await openDetail(view);
  const values = [...view.querySelectorAll("input")].map((t) => t.value);
  expect(values).toContain("LLM");
  expect(values).toContain("大模型");
         
  const backBtn = view.querySelector('button[aria-label="返回"]');
  expect(backBtn).toBeTruthy();
  await act(async () => {
    backBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(view.body.textContent).toContain("AI术语库");
});

test("词库内旧 aiTerms 字段自动并入 terms 并清空", async () => {
  mockTermGlossaries = [G({ terms: "LLM,大模型", aiTerms: "biopsy,活检" })];
  mockEmptyRule();
  await renderTerms();
  const call = mockUpdateSetting.mock.calls.find((c) =>
    Array.isArray(c[0]?.termGlossaries)
  );
  expect(call[0].termGlossaries[0].terms).toBe("LLM,大模型\nbiopsy,活检");
  expect(call[0].termGlossaries[0].aiTerms).toBe("");
});

test("拉取官方词库一键获取术语（已有保留+免费20条截断）", async () => {
  mockTermGlossaries = [G({ terms: "LLM,大模型" })];
  mockEmptyRule();
  const view = await renderTerms();
  await openDetail(view);
  const pullBtn = [...view.querySelectorAll("button")].find(
    (b) => b.textContent === "拉取"
  );
  expect(pullBtn).toBeTruthy();
  await act(async () => {
    pullBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const item = [...view.querySelectorAll("li")].find((li) =>
    li.textContent.includes("医学")
  );
  expect(item).toBeTruthy();
  await act(async () => {
    item.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const call = mockUpdateSetting.mock.calls.find((c) =>
    c[0]?.termGlossaries?.[0]?.terms?.includes("epidemiology")
  );
  expect(call).toBeTruthy();
  const termsStr = call[0].termGlossaries[0].terms;
  expect(termsStr.split("\n").length).toBe(20);
  expect(termsStr).toContain("LLM,大模型");
  expect(termsStr).toContain("epidemiology,流行病学");
                                                   
  await act(async () => {
    await new Promise((r) => setTimeout(r, 300));
  });
});

test("点添加出现可编辑空行（不再一闪即没）", async () => {
  mockTermGlossaries = [G()];
  mockEmptyRule();
  const view = await renderTerms();
  await openDetail(view);
  const addBtn = [...view.querySelectorAll("button")].find(
    (b) => b.textContent === "添加"
  );
  await act(async () => {
    addBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(view.querySelectorAll('input[placeholder="输入术语"]').length).toBe(1);
  expect(view.body.textContent).not.toContain("还没有术语");
});

test("搜索框粘贴「原文,译文」点添加直接生成术语行", async () => {
  mockTermGlossaries = [G()];
  mockEmptyRule();
  const view = await renderTerms();
  await openDetail(view);
  const searchInput = [...view.querySelectorAll("input")].find(
    (i) => i.placeholder === "搜索已有术语"
  );
  expect(searchInput).toBeTruthy();
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;
  await act(async () => {
    setter.call(searchInput, "biopsy,biopsy 活检");
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const addBtn = [...view.querySelectorAll("button")].find(
    (b) => b.textContent === "添加"
  );
  await act(async () => {
    addBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const call = mockUpdateSetting.mock.calls.find((c) =>
    c[0]?.termGlossaries?.[0]?.terms?.includes("biopsy")
  );
  expect(call).toBeTruthy();
  expect(call[0].termGlossaries[0].terms).toContain("biopsy,biopsy 活检");
});

test("校验反馈术语是否有效（通过/重复）", async () => {
  mockTermGlossaries = [G({ terms: "cache,缓存\ncache,缓存2" })];
  mockEmptyRule();
  let view = await renderTerms();
  await openDetail(view);
  let vBtn = [...view.querySelectorAll("button")].find(
    (b) => b.textContent === "校验"
  );
  await act(async () => {
    vBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(view.body.textContent).toContain("1 条重复");

  mockTermGlossaries = [G({ terms: "LLM,大模型" })];
  view = await renderTerms();
  await openDetail(view);
  vBtn = [...view.querySelectorAll("button")].find(
    (b) => b.textContent === "校验"
  );
  await act(async () => {
    vBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(view.body.textContent).toContain("校验通过：1 条术语全部有效");
});

test("校验提示无效的目标语言代码与网站地址写法", async () => {
  mockTermGlossaries = [G({ terms: "foo,bar[xx]", sites: "https://arxiv.org/abs" })];
  mockEmptyRule();
  const view = await renderTerms();
  await openDetail(view);
  const vBtn = [...view.querySelectorAll("button")].find(
    (b) => b.textContent === "校验"
  );
  await act(async () => {
    vBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(view.body.textContent).toContain("目标语言代码无效");
  expect(view.body.textContent).toContain("网站地址建议只填域名");
});

test("非会员：列表页显示免费额度升级提示", async () => {
  mockTermGlossaries = [G()];
  mockEmptyRule();
  const view = await renderTerms();
  expect(view.body.textContent).toContain("免费版可使用 1 个词库");
  expect(view.body.textContent).toContain("开通会员");
});

test("仅剩一个词库时详情页不显示删除按钮（保底词库不可删）", async () => {
  mockTermGlossaries = [G()];
  mockEmptyRule();
  let view = await renderTerms();
  await openDetail(view);
  expect(view.querySelector('button[aria-label="delete"]')).toBeNull();

  mockTermGlossaries = [
    G(),
    G({ id: "g2", name: "医学词库", sites: "pubmed.ncbi.nlm.nih.gov" }),
  ];
  view = await renderTerms();
  await openDetail(view, "医学词库");
  expect(view.querySelector('button[aria-label="delete"]')).toBeTruthy();
});

import { matchRule } from "./rules";
import { GLOBLA_RULE } from "../config/rules";
import { getRulesWithDefault } from "./storage";

jest.mock("./storage", () => ({
  getRulesWithDefault: jest.fn(),
  getSettingWithDefault: jest.fn(),
}));

import { getSettingWithDefault } from "./storage";

describe("matchRule", () => {
  beforeEach(() => {
    getRulesWithDefault.mockResolvedValue([]);
    getSettingWithDefault.mockResolvedValue({});
  });

  test("returns the built-in global rule when nothing is saved", async () => {
    const rule = await matchRule("https://example.com/post");

    expect(rule.pattern).toBe(GLOBLA_RULE.pattern);
    expect(rule.selector).toBe(GLOBLA_RULE.selector);
  });

  test("merges user-saved global rule over the built-in defaults", async () => {
    getRulesWithDefault.mockResolvedValue([
      { pattern: "*", selector: "h1, p.custom", toLang: "en" },
    ]);

    const rule = await matchRule("https://example.com/post");

    expect(rule.selector).toBe("h1, p.custom");
    expect(rule.toLang).toBe("en");
                    
    expect(rule.pattern).toBe(GLOBLA_RULE.pattern);
  });
});

describe("站点词库（termGlossaries）", () => {
  test("域名命中启用词库时覆盖默认术语", async () => {
    getRulesWithDefault.mockResolvedValue([
      { pattern: "*", terms: "default=默认", aiTerms: "ai=默认" },
    ]);
    getSettingWithDefault.mockResolvedValue({
      termGlossaries: [
        {
          id: "g1",
          sites: "arxiv.org",
          terms: "LLM=大模型",
          aiTerms: "AI=人工智能",
          enabled: true,
        },
      ],
    });
    const hit = await matchRule("https://arxiv.org/abs/1234");
                                   
    expect(hit.terms).toBe("LLM=大模型\ndefault=默认");
    expect(hit.aiTerms).toBe("AI=人工智能\nai=默认");
    const miss = await matchRule("https://example.com/post");
    expect(miss.terms).toBe("default=默认");
  });

  test("停用的词库不参与覆盖", async () => {
    getRulesWithDefault.mockResolvedValue([{ pattern: "*", terms: "default=默认" }]);
    getSettingWithDefault.mockResolvedValue({
      termGlossaries: [
        { id: "g1", sites: "arxiv.org", terms: "X=不应生效", enabled: false },
      ],
    });
    const rule = await matchRule("https://arxiv.org/abs/1234");
    expect(rule.terms).toBe("default=默认");
  });
});

describe("统一词库（* 全局词库）", () => {
  test("sites 为 * 的词库全局生效，指定域名词库优先于全局词库", async () => {
    getRulesWithDefault.mockResolvedValue([]);
    getSettingWithDefault.mockResolvedValue({
      termGlossaries: [
        { id: "g0", sites: "*", terms: "base=全局", enabled: true },
        { id: "g1", sites: "arxiv.org", terms: "site=站点", enabled: true },
      ],
    });
    const hit = await matchRule("https://arxiv.org/abs/1");
    expect(hit.terms).toBe("site=站点\nbase=全局");
    const other = await matchRule("https://example.com/");
    expect(other.terms).toBe("base=全局");
  });

  test("留空 sites 视为全局；无网址时仅全局词库生效", async () => {
    getRulesWithDefault.mockResolvedValue([]);
    getSettingWithDefault.mockResolvedValue({
      termGlossaries: [
        { id: "g0", sites: "", terms: "blank=全局", enabled: true },
        { id: "g1", sites: "arxiv.org", terms: "site=站点", enabled: true },
      ],
    });
    const noHref = await matchRule("");
    expect(noHref.terms).toBe("blank=全局");
    const hit = await matchRule("https://arxiv.org/");
    expect(hit.terms).toBe("site=站点\nblank=全局");
  });
});

describe("网站地址容错", () => {
  test("粘贴完整 URL / 带端口路径也能按域名命中", async () => {
    getRulesWithDefault.mockResolvedValue([]);
    getSettingWithDefault.mockResolvedValue({
      termGlossaries: [
        {
          id: "g1",
          sites: "https://arxiv.org/abs/1234, www.Example.COM:8080/path",
          terms: "T=命中",
          enabled: true,
        },
      ],
    });
    const a = await matchRule("https://arxiv.org/");
    expect(a.terms).toBe("T=命中");
    const b = await matchRule("https://www.example.com/");
    expect(b.terms).toBe("T=命中");
    const miss = await matchRule("https://example.org/");
    expect(miss.terms).toBeFalsy();
  });
});

describe("官方词库（TERM_LIBRARY 启用领域）", () => {
  test("启用领域的术语并入规则，且站点词库优先于官方词库", async () => {
    getRulesWithDefault.mockResolvedValue([{ pattern: "*", terms: "default=默认" }]);
    getSettingWithDefault.mockResolvedValue({
      enabledLibraryDomains: ["cs"],
      termGlossaries: [
        {
          id: "g1",
          sites: "arxiv.org",
          terms: "site=站点优先",
          enabled: true,
        },
      ],
    });
                                     
    const hit = await matchRule("https://arxiv.org/abs/1");
    expect(hit.terms.indexOf("site=站点优先")).toBe(0);
    expect(hit.terms).toContain("machine learning,机器学习");
    expect(hit.terms).toContain("default=默认");
                   
    const miss = await matchRule("https://example.com/");
    expect(miss.terms).toContain("machine learning,机器学习");
    expect(miss.terms).toContain("default=默认");
  });

  test("未启用领域时不并入官方词库", async () => {
    getRulesWithDefault.mockResolvedValue([{ pattern: "*", terms: "default=默认" }]);
    getSettingWithDefault.mockResolvedValue({ enabledLibraryDomains: [] });
    const rule = await matchRule("https://example.com/");
    expect(rule.terms).toBe("default=默认");
  });
});

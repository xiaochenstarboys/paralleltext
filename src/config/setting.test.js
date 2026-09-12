import {
  DEFAULT_INPUT_RULE,
  DEFAULT_MOUSE_HOVER_SETTING,
  DEFAULT_SETTING,
  DEFAULT_TRANBOX_SETTING,
} from "./setting";
import { OPT_TRANS_QWEN } from "./api";
import { GLOBAL_KEY } from "./rules";

describe("translation box defaults", () => {
  test("opens translations directly after selection", () => {
    expect(DEFAULT_TRANBOX_SETTING.triggerMode).toBe("select");
  });
  test("translates language variants by default", () => {
    expect(DEFAULT_SETTING.translateVariants).toBe(true);
  });

  test("does not read the clipboard automatically by default", () => {
    expect(DEFAULT_SETTING.autoTranslateClipboard).toBe(false);
  });

  test("uses Qwen for every default translation entry point", () => {
    expect(DEFAULT_INPUT_RULE.apiSlug).toBe(OPT_TRANS_QWEN);
    expect(DEFAULT_TRANBOX_SETTING.apiSlugs).toEqual([OPT_TRANS_QWEN]);
  });

  test("does not ignore any language by default", () => {
    expect(DEFAULT_TRANBOX_SETTING.skipLangs).toEqual([]);
  });

  test("follows the current page rule for hover bubbles by default", () => {
    expect(DEFAULT_MOUSE_HOVER_SETTING.apiSlug).toBe(GLOBAL_KEY);
  });
});

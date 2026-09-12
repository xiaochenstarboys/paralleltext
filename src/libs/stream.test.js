                                                                              
                                                                          
jest.mock("@streamparser/json", () =>
  jest.requireActual("../../node_modules/@streamparser/json/dist/cjs/index.js")
);

const { TextDecoder, TextEncoder } = require("util");
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

import {
  createRealtimeStreamParser,
  createSSEParser,
  getStreamDelta,
  parseStreamingSegments,
} from "./stream";
import { OPT_TRANS_OPENAI } from "../config";

describe("createRealtimeStreamParser", () => {
  test("streams partial text from wrapped JSON objects without duplicates", () => {
    const parser = createRealtimeStreamParser();

    expect(parser.write('{"translations":[{"id":0,"text":"你')).toEqual([
      { id: 0, partialText: "你", isComplete: false },
    ]);
    expect(parser.write("")).toEqual([]);
    expect(parser.write('好","sourceLanguage":"zh"}]}')).toEqual([
      { id: 0, partialText: "你好", isComplete: false },
    ]);
  });

  test("supports root arrays and keeps segment ids independent", () => {
    const parser = createRealtimeStreamParser();

    expect(parser.write('[{"id":0,"text":"One')).toEqual([
      { id: 0, partialText: "One", isComplete: false },
    ]);
    expect(parser.write('"},{"id":1,"text":"Two')).toEqual([
      { id: 1, partialText: "Two", isComplete: false },
    ]);
    expect(parser.write('"}]')).toEqual([]);
  });

  test("decodes escaped JSON text across chunks", () => {
    const parser = createRealtimeStreamParser();

    expect(
      parser.write('{"translations":[{"id":0,"text":"Quote: \\\"x')
    ).toEqual([{ id: 0, partialText: 'Quote: "x', isComplete: false }]);
    expect(parser.write('\\\"\\nPath C:\\\\Temp \\u4F60')).toEqual([
      {
        id: 0,
        partialText: 'Quote: "x"\nPath C:\\Temp 你',
        isComplete: false,
      },
    ]);
    expect(parser.write('\\u597D"}]}')).toEqual([
      {
        id: 0,
        partialText: 'Quote: "x"\nPath C:\\Temp 你好',
        isComplete: false,
      },
    ]);
  });

  test("waits for an explicit id before streaming JSON text", () => {
    const parser = createRealtimeStreamParser();

    expect(parser.write('{"translations":[{"text":"orphan')).toEqual([]);
    expect(parser.write('","id":0}]}')).toEqual([]);
  });
});

describe("createSSEParser", () => {
  test("parses data fields with or without a following space", () => {
    const parse = createSSEParser();

    expect([...parse("data: hello\n\n")]).toEqual(["hello"]);
    expect([...parse("data:world\n\n")]).toEqual(["world"]);
  });

  test("keeps incomplete frames until the blank-line boundary arrives", () => {
    const parse = createSSEParser();

    expect([...parse("data: partial")]).toEqual([]);
    expect([...parse("\n\n")]).toEqual(["partial"]);
  });

  test("supports CRLF and multi-line data frames", () => {
    const parse = createSSEParser();

    expect([...parse("data: one\r\ndata: two\r\n\r\n")]).toEqual(["one\ntwo"]);
  });

  test("filters DONE frames", () => {
    const parse = createSSEParser();

    expect([...parse("data: [DONE]\n\n")]).toEqual([]);
  });
});

describe("getStreamDelta", () => {
  test("extracts OpenAI-compatible stream deltas", () => {
    const chunk = {
      choices: [{ delta: { content: "敏" }, finish_reason: null, index: 0 }],
      object: "chat.completion.chunk",
    };

    expect(getStreamDelta(chunk, OPT_TRANS_OPENAI)).toBe("敏");
    expect(getStreamDelta({ choices: [] }, OPT_TRANS_OPENAI)).toBe("");
  });
});

describe("parseStreamingSegments", () => {
  test("parses XML segments and skips processed ids", () => {
    const processedIds = new Set([0]);
    const result = [
      ...parseStreamingSegments(
        '<root><t id="0" sourceLanguage="en">你好</t><t id="1" sourceLanguage="en">世界</t></root>',
        processedIds
      ),
    ];

    expect(result).toEqual([{ id: 1, translation: ["世界", "en"] }]);
  });

  test("parses complete LINE segments only", () => {
    const result = [
      ...parseStreamingSegments("0 | 第一行<br>第二行\n1 | 未完成", new Set()),
    ];

    expect(result).toEqual([{ id: 0, translation: ["第一行\n第二行", ""] }]);
  });
});

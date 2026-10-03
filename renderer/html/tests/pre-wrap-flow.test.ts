import {describe, expect, test} from "bun:test"
import {layoutInlineFlow, type InlineInput} from "../src/inline-flow"

const segmenter = new Intl.Segmenter(undefined, {granularity: "grapheme"})
const advance = (_owner: string, text: string) => [...segmenter.segment(text)].length
const text = (owner: string, value: string, whiteSpace: InlineInput<string>["whiteSpace"] = "pre-wrap",
  overflowWrap: InlineInput<string>["overflowWrap"] = "normal"): InlineInput<string> => ({
  owner, kind: "text", text: value, whiteSpace, overflowWrap, width: 0, height: 10, baseline: 8,
})
const plan = (inputs: readonly InlineInput<string>[], width: number, align: "left" | "right" = "left") =>
  layoutInlineFlow(inputs, width, 10, align, advance, 8)
const lines = (result: ReturnType<typeof plan>) => {
  const resultLines: string[] = []
  for (const fragment of result.fragments) resultLines[fragment.line] = (resultLines[fragment.line] ?? "") + fragment.text
  return resultLines
}

test("pre-wrap сохраняет пробелы и переносит по разрешённой границе после их последовательности", () => {
  const result = plan([text("text", "aa  bb cc")], 5)
  expect(lines(result)).toEqual(["aa  ", "bb cc"])
  expect({width: result.width, height: result.height}).toEqual({width: 5, height: 20})
  expect(result.fragments.map(fragment => fragment.sourceOffsets)).toEqual([[0, 1, 2, 3, 4], [4, 5, 6, 7, 8, 9]])
})

test("pre-wrap сохраняет явные CRLF, пустые строки и завершающий перевод строки с исходными UTF16 offsets", () => {
  const result = plan([text("text", " a  b\r\n\r\nc\n")], 20)
  expect(result.height).toBe(40)
  expect(result.fragments.map(fragment => [fragment.text, fragment.line, fragment.sourceOffsets])).toEqual([
    [" a  b", 0, [0, 1, 2, 3, 4, 5]],
    ["c", 2, [9, 10]],
  ])
})

test("CRLF через соседние Text остаётся одним явным разрывом", () => {
  const result = plan([text("first", "a\r"), text("second", "\nb")], 20)
  expect(lines(result)).toEqual(["a", "b"])
  expect(result.height).toBe(20)
  expect(result.fragments[1]?.sourceOffsets).toEqual([1, 2])
})

test("при мягком переносе пробелы висят за концом строки и не смещают right alignment", () => {
  const result = plan([text("text", "aa   bb")], 3, "right")
  expect(lines(result)).toEqual(["aa   ", "bb"])
  expect(result.fragments.map(fragment => [fragment.x, fragment.width])).toEqual([[1, 5], [1, 2]])
  expect(result.width).toBe(2)
})

test("пробелы перед явным разрывом и в конце текста висят только при переполнении", () => {
  const fits = plan([text("text", "aa \nbb ")], 4, "right")
  expect(fits.fragments.map(fragment => [fragment.x, fragment.width])).toEqual([[1, 3], [1, 3]])
  expect(fits.width).toBe(3)
  const overflows = plan([text("text", "aa  \nbb  ")], 3, "right")
  expect(overflows.fragments.map(fragment => [fragment.x, fragment.width])).toEqual([[1, 4], [1, 4]])
  expect(overflows.width).toBe(2)
})

test("конечные пробелы не вызывают преждевременный перенос последнего слова", () => {
  const result = plan([text("text", "aa bb ")], 5)
  expect(lines(result)).toEqual(["aa bb "])
  expect({width: result.width, height: result.height}).toEqual({width: 5, height: 10})
})

test("сохранённый пробельный run через Elements остаётся на предыдущей мягкой строке", () => {
  const result = plan([text("first", "aa "), text("second", "  bb")], 3)
  expect(lines(result)).toEqual(["aa   ", "bb"])
  expect(result.fragments.map(fragment => [fragment.owner, fragment.line, fragment.sourceOffsets])).toEqual([
    ["first", 0, [0, 1, 2, 3]],
    ["second", 0, [0, 1, 2]],
    ["second", 1, [2, 3, 4]],
  ])
})

describe.each(["anywhere", "break-word"] as const)("overflow-wrap:%s", overflowWrap => {
  test.each(["normal", "pre-wrap"] as const)("разрывает длинное слово при white-space:%s", whiteSpace => {
    const result = plan([text("text", "abcdef", whiteSpace, overflowWrap)], 2)
    expect(lines(result)).toEqual(["ab", "cd", "ef"])
    expect(result.fragments.map(fragment => fragment.sourceOffsets)).toEqual([[0, 1, 2], [2, 3, 4], [4, 5, 6]])
    expect(result.height).toBe(30)
  })
  test.each(["pre", "nowrap"] as const)("не вводит мягкие разрывы при white-space:%s", whiteSpace => {
    const result = plan([text("text", "abcdef", whiteSpace, overflowWrap)], 2)
    expect(lines(result)).toEqual(["abcdef"])
    expect(result.height).toBe(10)
  })
})

test("обычный перенос между словами имеет приоритет перед emergency break", () => {
  const result = plan([text("text", "ab cdef", "pre-wrap", "anywhere")], 4)
  expect(lines(result)).toEqual(["ab ", "cdef"])
  expect(result.height).toBe(20)
})

test("grapheme clusters и исходные UTF16 границы сохраняются при разрыве слова", () => {
  const result = plan([text("text", "a\u0301👨‍👩‍👧‍👦x", "pre-wrap", "anywhere")], 1)
  expect(lines(result)).toEqual(["a\u0301", "👨‍👩‍👧‍👦", "x"])
  expect(result.fragments.map(fragment => fragment.sourceOffsets)).toEqual([
    [0, 1, 2],
    Array.from({length: 12}, (_, index) => index + 2),
    [13, 14],
  ])
})

test("grapheme cluster через границу inline Elements не разрывается", () => {
  const result = plan([
    text("first", "a", "pre-wrap", "anywhere"),
    text("second", "\u0301b", "pre-wrap", "anywhere"),
  ], 1)
  expect(lines(result)).toEqual(["a\u0301", "b"])
  expect(result.fragments.map(fragment => [fragment.owner, fragment.line, fragment.sourceOffsets])).toEqual([
    ["first", 0, [0, 1]],
    ["second", 0, [0, 1]],
    ["second", 1, [1, 2]],
  ])
})

test("nowrap внутри общего слова не получает emergency разрыв на своих границах", () => {
  const result = plan([
    text("first", "ab", "normal", "anywhere"),
    text("second", "cd", "nowrap", "anywhere"),
    text("third", "ef", "normal", "anywhere"),
  ], 1)
  expect(lines(result)).toEqual(["a", "bcde", "f"])
})

test("legacy normal схлопывает пробелы, nowrap сохраняет непрерывность, pre сохраняет явные строки", () => {
  expect(lines(plan([text("normal", "aa   bb", "normal")], 3))).toEqual(["aa", "bb"])
  expect(lines(plan([text("nowrap", "aa   bb", "nowrap")], 3))).toEqual(["aa bb"])
  expect(lines(plan([text("pre", "aa  \nbb", "pre")], 3))).toEqual(["aa  ", "bb"])
})

test("табы сохраняются в тексте и offsets; их advance предоставляет штатный measurer", () => {
  const result = plan([text("text", "aa\tbb")], 2)
  expect(lines(result)).toEqual(["aa\t", "bb"])
  expect(result.fragments.map(fragment => fragment.sourceOffsets)).toEqual([[0, 1, 2, 3], [3, 4, 5]])
})


test("работа measurer растёт линейно для большого nowrap-участка внутри emergency-wrap слова", () => {
  const measure = (length: number, width: number) => {
    let advanceWork = 0
    let nowrapMeasurements = 0
    const result = layoutInlineFlow([
      text("before", "a", "normal", "anywhere"),
      text("nowrap", "b".repeat(length), "nowrap", "anywhere"),
      text("after", "c", "normal", "anywhere"),
    ], width, 10, "left", (owner, value) => {
      advanceWork += value.length
      if (owner === "nowrap") nowrapMeasurements++
      return value.length
    }, 8)
    expect(lines(result)).toEqual([`a${"b".repeat(length)}c`])
    expect(result.fragments.find(fragment => fragment.owner === "nowrap")?.sourceOffsets)
      .toEqual(Array.from({length: length + 1}, (_, index) => index))
    return {advanceWork, nowrapMeasurements}
  }
  for (const width of [0, 20]) {
    const short = measure(1000, width)
    const long = measure(8000, width)
    expect(long.advanceWork).toBeLessThan(short.advanceWork * 9)
    expect(long.advanceWork).toBeLessThan(8000 * 5)
    expect(long.nowrapMeasurements).toBeLessThanOrEqual(3)
  }
})

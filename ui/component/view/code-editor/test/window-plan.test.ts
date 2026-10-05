import {expect, test} from "bun:test"
import {codeEditorRowAtOffset, codeEditorRowWindow, codeEditorWindowBlocks, mapCodeEditorOffset} from "../src/window-plan.ts"
import type {CodeEditorVisualRow} from "../src/visual-rows.ts"
import {codeEditorVisualRows} from "../src/visual-rows.ts"

function sourceRows(count: number): Readonly<{value: string; rows: readonly CodeEditorVisualRow[]}> {
  let value = ""
  const rows = Array.from({length: count}, (_, line) => {
    const separator = line === 0 ? "" : line % 2 ? "\r\n" : "\n"
    const text = `строка ${line} 😀`
    const start = value.length
    value += separator + text
    return {key: String(line), line, start, end: value.length, separator, continuation: false, formatting: "",
      segments: [{key: "plain", start: 0, end: text.length, text, category: "plain", foreground: "#ffffff"}]}
  })
  return {value, rows}
}

test("13 тысяч строк создают только viewport, overscan и endpoints; gaps сохраняют точный UTF-16 source", () => {
  const {value, rows} = sourceRows(13_121)
  const window = codeEditorRowWindow(rows.length, 16 * 6000, 16 * 6014, 16)
  const blocks = codeEditorWindowBlocks(rows, value, window, [0, 13_120, 0])
  expect(blocks.filter(block => block.kind === "row")).toHaveLength(32)
  expect(blocks.filter(block => block.kind === "gap").length).toBeLessThanOrEqual(3)
  expect(blocks.map(block => block.kind === "gap" ? block.text
    : block.row.separator + block.row.segments.map(segment => segment.text).join("") + block.row.formatting).join("")).toBe(value)
})

test("окно ограничивается концом, малый viewport и скрытый блок не раскрывают всё", () => {
  expect(codeEditorRowWindow(13_000, 16 * 12_990, 16 * 13_010, 16)).toEqual({start: 12_982, end: 13_000})
  expect(codeEditorRowWindow(13_000, 0, 0, 16)).toEqual({start: 0, end: 0})
  expect(codeEditorRowWindow(13_000, 0, 500, 0)).toEqual({start: 0, end: 32})
  const {value, rows} = sourceRows(300)
  const blocks = codeEditorWindowBlocks(rows, value, {start: 9000, end: 9040})
  expect(blocks).toHaveLength(1)
  expect(blocks[0]?.kind === "gap" && blocks[0].text).toBe(value)
})

test("пустая последняя строка, CRLF и границы visual rows сохраняют источник", () => {
  const {value, rows} = sourceRows(3)
  const full = value + "\r\n"
  const last = {key: "3", line: 3, start: value.length, end: full.length,
    separator: "\r\n", continuation: false, formatting: "", segments: []}
  const blocks = codeEditorWindowBlocks([...rows, last], full, {start: 0, end: 0})
  expect(blocks[0]?.kind === "gap" && blocks[0].text).toBe(full)
  expect(codeEditorRowAtOffset(rows, rows[0]!.end)).toBe(0)
  expect(codeEditorRowAtOffset(rows, rows[0]!.end + 1)).toBe(1)
})

test("замена исходника сохраняет неизменные края и переносит позицию из изменённого участка", () => {
  expect(mapCodeEditorOffset(9, "one\ntwo\nthree", "one\ntwo\nthree")).toBe(9)
  expect(mapCodeEditorOffset(5, "one\ntwo\nthree", "one\nLONG\nthree")).toBe(8)
  expect(mapCodeEditorOffset(9, "one\ntwo\nthree", "one\nLONG\nthree")).toBe(10)
  expect(mapCodeEditorOffset(2, "one\ntwo\nthree", "one\nLONG\nthree")).toBe(2)
})

test("visual softBreaks и скрытые escape markers сохраняют raw gaps без новых LF", () => {
  const value = 'LEFT\\nRIGHT😀\r\nLAST\\r\\nEND\r'
  const lines = value.split(/\r\n|\r|\n/u)
  const view = {props: {value, readOnly: true}, lines, lineEndings: value.match(/\r\n|\r|\n/gu) ?? [],
    resolvedLanguageId: "plaintext", segments: lines.map(text => text ? [{key: "plain", start: 0, end: text.length,
      text, category: "plain", foreground: "#ffffff"}] : [])}
  const rows = codeEditorVisualRows(view, [value.indexOf("RIGHT"), value.indexOf("END")], false)
  expect(rows.filter(row => row.formatting !== "").map(row => row.formatting)).toEqual(["\\n", "\\r\\n"])
  for (let index = 0; index < rows.length; index++) {
    const blocks = codeEditorWindowBlocks(rows, value, {start: index, end: index + 1})
    const raw = blocks.map(block => block.kind === "gap" ? block.text : block.row.separator +
      block.row.segments.map(segment => segment.text).join("") + block.row.formatting).join("")
    expect(raw).toBe(value)
  }
})

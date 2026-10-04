import {expect, test} from "bun:test"
import buildCodeEditorViewModel from "@zavx0z/immersive-ui-component-view-code-editor-view-model"
import {codeEditorPaintRuns} from "../view/code-editor/src/paint-runs.ts"
import {codeEditorVisualRows} from "../view/code-editor/src/visual-rows.ts"
import codeEditorSyntaxTheme from "@zavx0z/immersive-ui-component-view-code-editor-syntax-theme-data"
import resolveCodeEditorSyntaxScopeColorHex from "@zavx0z/immersive-ui-component-view-code-editor-syntax-theme-resolve-scope-color-hex"

test("JSX-компоненты получают цвет тегов через установленный highlighter", () => {
  const value = '<Tab label={null}><Button label="Инструменты" /></Tab>'
  for (const props of [{languageId: "jsx"}, {languageId: "tsx"}, {path: "example.tsx"}]) {
    const view = buildCodeEditorViewModel({value, readOnly: true, ...props})
    const segments = view.segments[0]!
    const tags = segments.filter(segment => segment.text === "Tab" || segment.text === "Button")
    expect(tags.map(segment => segment.text)).toEqual(["Tab", "Button", "Tab"])
    expect(tags.every(segment => segment.foreground === "#d5b778")).toBe(true)
    expect(segments.find(segment => segment.text === "null")?.foreground).toBe("#cf8e6d")
    expect(segments.find(segment => segment.text === '"Инструменты"')?.foreground).toBe("#6aab73")
    expect(segments.map(segment => segment.text).join("")).toBe(value)
  }
})

test("мягкие переносы сохраняют текст, подсветку и номера исходных строк", () => {
  const value = "first\\nsecond\r\nthird"
  const view = buildCodeEditorViewModel({value, readOnly: true, tokens: [
    [{s: 0, e: 13, c: "s", fg: "#112233"}],
    [{s: 0, e: 5, c: "k", fg: "#445566"}],
  ]})
  const rows = codeEditorVisualRows(view, [7])
  expect(rows.map(row => row.segments.map(segment => segment.text).join(""))).toEqual(["first\\n", "second", "third"])
  expect(rows.map(row => row.line)).toEqual([0, 0, 1])
  expect(rows.map(row => row.continuation)).toEqual([false, true, false])
  expect(rows.map(row => row.separator + row.segments.map(segment => segment.text).join("")).join("")).toBe(value)
  expect(rows[1]?.segments[0]?.foreground).toBe("#112233")
})

test("мягкие переносы не меняют редактируемую модель и отклоняют неверные смещения", () => {
  expect(() => buildCodeEditorViewModel({value: "abc", readOnly: false, softBreaks: [1]})).toThrow("только для чтения")
  const view = buildCodeEditorViewModel({value: "abc", readOnly: true})
  for (const breaks of [[0], [3], [1, 1], [2, 1], [0.5]]) {
    expect(() => codeEditorVisualRows(view, breaks)).toThrow(RangeError)
  }
})

test("флаг форматирования отделяет escape от видимого текста без потери исходных символов", () => {
  const value = "first\\nsecond\\r\\nthird"
  const view = buildCodeEditorViewModel({value, readOnly: true, languageId: "plaintext"})
  const rows = codeEditorVisualRows(view, [7, 17], false)
  expect(rows.map(row => row.segments.map(segment => segment.text).join(""))).toEqual(["first", "second", "third"])
  expect(rows.map(row => row.formatting)).toEqual(["\\n", "\\r\\n", ""])
  expect(rows.map(row => row.separator + row.segments.map(segment => segment.text).join("") + row.formatting).join("")).toBe(value)
  const literal = buildCodeEditorViewModel({value: "a\\\\nb", readOnly: true, languageId: "plaintext"})
  expect(codeEditorVisualRows(literal, [4], false)[0]?.formatting).toBe("")
})

test("presentation coalesces equal colors without merging or mutating lexical tokens", () => {
  const tokens = [[{s: 0, e: 3, c: "k", fg: "#ABC"}, {s: 3, e: 6, c: "d", fg: "#aabbcc"}]]
  const before = JSON.stringify(tokens)
  const model = buildCodeEditorViewModel({value: "abcdef", readOnly: true, tokens})
  const segments = model.segments[0]!
  const runs = codeEditorPaintRuns(segments)
  expect(segments.map(segment => segment.category)).toEqual(["k", "d"])
  expect(runs).toEqual([{key: "run:0:6", start: 0, end: 6, text: "abcdef", foreground: "#aabbcc"}])
  expect(codeEditorPaintRuns(segments)).toBe(runs)
  expect(JSON.stringify(tokens)).toBe(before)
})

test("background swatches and distinct foregrounds remain separate paint ranges", () => {
  const model = buildCodeEditorViewModel({value: "abc", readOnly: true, tokens: [[
    {s: 0, e: 1, c: "s", fg: "#112233"},
    {s: 1, e: 2, c: "s", fg: "#112233", bg: "#ffffff"},
    {s: 2, e: 3, c: "s", fg: "#445566", bg: "#ffffff"},
  ]]})
  expect(codeEditorPaintRuns(model.segments[0]!)).toHaveLength(3)
  expect(codeEditorPaintRuns(model.segments[0]!)[1]?.background).toBe("#ffffff")
})

test("explicit foreground is not turned into inherited text even when it equals the default color", () => {
  const model = buildCodeEditorViewModel({value: "plain gap", readOnly: true, tokens: [[{s: 0, e: 5, c: "plain", fg: "#bcbec4"}]]})
  const runs = codeEditorPaintRuns(model.segments[0]!)
  expect(runs).toHaveLength(2)
  expect(runs[0]?.inheritForeground).toBeUndefined()
  expect(runs[1]?.inheritForeground).toBe(true)
})

test("cached scope resolution preserves exact-first selector and rule precedence", () => {
  const scopes = codeEditorSyntaxTheme.tokenColors.flatMap(rule =>
    (typeof rule.scope === "string" ? [rule.scope] : rule.scope).flatMap(scope => scope.split(",").map(value => value.trim())))
  const reference = (selectors: readonly string[]) => {
    for (const exact of [true, false]) for (const selector of selectors) {
      for (let index = codeEditorSyntaxTheme.tokenColors.length - 1; index >= 0; index--) {
        const rule = codeEditorSyntaxTheme.tokenColors[index]!
        const parts = (typeof rule.scope === "string" ? [rule.scope] : rule.scope)
          .flatMap(scope => scope.split(",").map(value => value.trim()).filter(Boolean))
        if (parts.some(scope => scope === selector || scope.split(/\\s+|>/u).some(value => {
          const part = value.trim()
          return part === selector || !exact && (part.startsWith(`${selector}.`) || selector.startsWith(`${part}.`))
        }))) return rule.settings.foreground.toLowerCase()
      }
    }
    return "#123456"
  }
  for (const scope of [...scopes, "unknown.test", "comment.custom", "keyword.control.custom"]) {
    for (const selectors of [[scope], ["unknown.test", scope], [scope, "string"]]) {
      const expected = reference(selectors)
      expect(resolveCodeEditorSyntaxScopeColorHex(selectors, "#123456")).toBe(expected)
      expect(resolveCodeEditorSyntaxScopeColorHex(selectors, "#123456")).toBe(expected)
    }
  }
  expect(resolveCodeEditorSyntaxScopeColorHex(["unknown"], "#ffffff")).toBe("#ffffff")
  expect(resolveCodeEditorSyntaxScopeColorHex(["unknown"], "#000000")).toBe("#000000")
})

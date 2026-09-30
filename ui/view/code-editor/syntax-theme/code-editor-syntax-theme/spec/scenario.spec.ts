/** codeEditorSyntaxTheme показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@ui-views-code-editor-syntax-theme/code-editor-syntax-theme"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value.colors?.["editor.background"], "Данные выражают публичный договор владельца").toBe("#191a1c")
  })
})

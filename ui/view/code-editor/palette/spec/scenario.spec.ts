/** codeEditorPalette показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@immersive-ui-view-code-editor/palette"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value.editorBackground, "Данные выражают публичный договор владельца").toBe("#191a1c")
  })
})

/** themeColor показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@immersive-ui-view-code-editor-theme/color"

describe.each([{name: "Публичный вызов", props: {args: ["editor.background", "#000000"] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe("#191a1c")
  })
})

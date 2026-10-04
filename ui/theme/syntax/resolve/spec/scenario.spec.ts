/** resolveSyntaxScopeColorHex показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@zavx0z/immersive-ui-theme-syntax-resolve"

describe.each([{name: "Публичный вызов", props: {args: [[], "#abcdef"] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe("#abcdef")
  })
})

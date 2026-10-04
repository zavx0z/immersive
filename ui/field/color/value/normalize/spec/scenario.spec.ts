/** normalizeColorValue показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@zavx0z/immersive-ui-field-color-value-normalize"

describe.each([{name: "Публичный вызов", props: {args: [{r: 1, g: 0, b: 0, a: 1}] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toEqual({r: 1, g: 0, b: 0, a: 1})
  })
})

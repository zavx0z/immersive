/** colorHsvaToValue показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@immersive-ui-field-color-value/from-hsva"

describe.each([{name: "Публичный вызов", props: {args: [{h: 0, s: 1, v: 1, a: 1}] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toEqual({r: 1, g: 0, b: 0, a: 1})
  })
})

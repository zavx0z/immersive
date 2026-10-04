/** numberPointerAdaptiveSpan показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@zavx0z/immersive-ui-field-number-value-pointer-adaptive-span"

describe.each([{name: "Публичный вызов", props: {args: [{step: .1}] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe(2000)
  })
})

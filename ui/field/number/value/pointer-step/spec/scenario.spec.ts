/** numberPointerStep показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-fields-number-value/number-pointer-step"

describe.each([{name: "Публичный вызов", props: {args: [{step: .5}] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe(.5)
  })
})

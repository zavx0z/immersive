/** numberFillPercentage показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-fields-number-value/number-fill-percentage"

describe.each([{name: "Публичный вызов", props: {args: [5, 0, 10] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe(50)
  })
})

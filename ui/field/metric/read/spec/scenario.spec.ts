/** fieldMetric показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@immersive-ui-field-metric/read"

describe.each([{name: "Публичный вызов", props: {args: ["field-height-regular"] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe(28)
  })
})

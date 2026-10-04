/** fieldDensityHeight показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@immersive-ui-field-metric/density-height"

describe.each([{name: "Публичный вызов", props: {args: ["compact"] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe(22)
  })
})

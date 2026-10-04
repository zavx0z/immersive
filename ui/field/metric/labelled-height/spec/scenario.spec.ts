/** labelledFieldHeight показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@immersive-ui-field-metric/labelled-height"

describe.each([{name: "Публичный вызов", props: {args: [16, true] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe(28)
  })
})

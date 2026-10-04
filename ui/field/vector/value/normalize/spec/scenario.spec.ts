/** normalizeVectorValue показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@immersive-ui-field-vector-value/normalize"

describe.each([{name: "Публичный вызов", props: {args: [[1, 2], undefined, 1] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result.axes, "Результат соответствует входному примеру и публичному назначению операции").toEqual(["X", "Y"])
  })
})

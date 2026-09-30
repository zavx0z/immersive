/** normalizeMatrixValue показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-fields-matrix-value/normalize-matrix-value"

describe.each([{name: "Публичный вызов", props: {args: [[[1, 0], [0, 1]], 1] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result.value, "Результат соответствует входному примеру и публичному назначению операции").toEqual([[1, 0], [0, 1]])
  })
})

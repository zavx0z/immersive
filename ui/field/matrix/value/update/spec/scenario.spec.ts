/** updateMatrixValue показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@zavx0z/immersive-ui-field-matrix-value-update"

describe.each([{name: "Публичный вызов", props: {args: [[[1, 0], [0, 1]], 0, 1, 2] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toEqual([[1, 2], [0, 1]])
  })
})

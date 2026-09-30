/** updateVectorValue показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-fields-vector-value/update-vector-value"

describe.each([{name: "Публичный вызов", props: {args: [[1, 2], 1, 3] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toEqual([1, 3])
  })
})

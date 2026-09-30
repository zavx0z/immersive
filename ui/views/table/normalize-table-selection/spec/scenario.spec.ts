/** normalizeTableSelection показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-views-table/normalize-table-selection"

describe.each([{name: "Публичный вызов", props: {args: [["a", "b"], ["b", "missing", "b"]] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toEqual(["b"])
  })
})

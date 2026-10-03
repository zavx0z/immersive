/** normalizeCollectionItems показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-fields-collection-model/normalize-collection-items"

describe.each([{name: "Публичный вызов", props: {args: [[{id: "a", label: "Первый"}], "a"] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toEqual([{id: "a", label: "Первый"}])
  })
})

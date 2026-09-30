/** tableSelectionAfterClick показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-views-table/table-selection-after-click"

describe.each([{name: "Публичный вызов", props: {args: [["a", "b"], [], "a", null, {shiftKey: false, ctrlKey: false, metaKey: false}] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result.selectedKeys, "Результат соответствует входному примеру и публичному назначению операции").toEqual(["a"])
  })
})

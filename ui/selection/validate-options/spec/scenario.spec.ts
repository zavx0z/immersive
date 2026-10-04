/** validateSelectionOptions показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@immersive-ui-selection/validate-options"

describe.each([{name: "Публичный вызов", props: {args: [[{key: "a", value: "a", label: "Первый"}]] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toHaveLength(1)
  })
})

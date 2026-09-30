/** resolveFieldDensity показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-fields-metrics/resolve-field-density"

describe.each([{name: "Публичный вызов", props: {args: [undefined, "compact", "Поле"] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Результат соответствует входному примеру и публичному назначению операции").toBe("compact")
  })
})

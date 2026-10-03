/** Интервал берётся из метаданных снимка и проверяется до расчёта геометрии. */
import {describe, expect, test} from "bun:test"
import spacing from "@node-geometry/spacing"

describe.each([
  {name: "Малый", props: {id: "value", revision: 0, value: 1, presentation: {spacingBefore: "small"}}, expected: "small"},
  {name: "Без интервала", props: {id: "value", revision: 0, value: 1, presentation: {}}, expected: undefined},
])("$name", ({props, expected}) => {
  const result = spacing(props)
  test("Правило интервала", () => {
    expect(result, "Отсутствующий интервал не добавляется автоматически").toBe(expected)
    expect(() => spacing({...props, presentation: {spacingBefore: "invalid"}}), "Неизвестный интервал отклоняется").toThrow("small or medium")
  })
})

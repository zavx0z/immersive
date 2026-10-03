/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@socket-values/preset"
import kinds from "@socket-values/kinds"
import presets from "@socket-values/presets"

describe.each(kinds.map(kind => ({name: kind, props: {kind}})))("$name", ({props}) => {
  const result = value(props.kind)
  test("Публичное правило", () => {
    expect(result, "Выбор возвращает исходную предустановку").toBe(presets[props.kind])
    expect(() => Reflect.apply(value, undefined, ["missing"]), "Неизвестный вид отклоняется").toThrow("Unsupported Socket kind")
  })
})

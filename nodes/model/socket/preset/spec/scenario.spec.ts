/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@immersive-nodes-model-socket/preset"
import kinds from "@immersive-nodes-model-socket/kinds"
import presets from "@immersive-nodes-model-socket/presets"

describe.each(kinds.map(kind => ({name: kind, props: {kind}})))("$name", ({props}) => {
  const result = value(props.kind)
  test("Публичное правило", () => {
    expect(result, "Выбор возвращает исходную предустановку").toBe(presets[props.kind])
    expect(() => Reflect.apply(value, undefined, ["missing"]), "Неизвестный вид отклоняется").toThrow("Unsupported Socket kind")
  })
})

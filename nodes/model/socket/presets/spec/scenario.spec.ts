/** Проверяет публичные данные и правила операции над сокетами. */
import {describe, expect, test} from "bun:test"
import value from "@immersive-nodes-model-socket/presets"
import kinds from "@immersive-nodes-model-socket/kinds"

describe.each(kinds.map(kind => ({name: kind, props: {kind}})))("$name", ({props}) => {
  const result = value[props.kind]
  test("Публичное правило", () => {
    expect(result.kind, "Предустановка сохраняет запрошенный вид").toBe(props.kind)
    expect(result.color, "Цвет является переносимым HEX-значением").toMatch(/^#[a-f0-9]{6}$/iu)
    expect(result.label.trim().length, "Имя вида доступно в интерфейсе").toBeGreaterThan(0)
    expect(Object.isFrozen(result), "Предустановка не изменяется вызывающей стороной").toBeTrue()
  })
})

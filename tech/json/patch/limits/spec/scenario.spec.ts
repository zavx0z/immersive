/** Ограничения задают конечную стоимость одной транзакции. */
import {describe, expect, test} from "bun:test"
import limits from "@zavx0z/immersive-tech-json-patch-limits"

describe.each([{name: "Ограниченная транзакция", props: {unit: "положительные целые"}}])("$name", ({props}) => {
  const result = limits
  test("Неизменяемые пределы", () => {
    expect(Object.values(result).every(value => Number.isSafeInteger(value) && value > 0), props.unit).toBeTrue()
    expect(Object.isFrozen(result), "Вызывающая сторона не повышает общие лимиты").toBeTrue()
  })
})

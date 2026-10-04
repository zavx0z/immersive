import {describe, expect, test} from "bun:test"
import slotChild from "@zavx0z/immersive-jsx-slot-child"

describe("Невалидный slot descriptor", () => {
  test.each([
    {name: "Нестроковое имя", input: [1, null, "conditional"]},
    {name: "Отсутствующий kind", input: ["header", null, undefined]},
    {name: "Неизвестный kind", input: ["header", null, "fixed"]},
  ])("$name", ({input}) => {
    expect(() => {
      // @ts-expect-error Намеренно проверяется невалидный JavaScript-вход.
      return slotChild(...input)
    }, "JavaScript-граница сохраняет статическое имя и известный вид позиции").toThrow("static name and composition kind")
  })
})

/** Конструктор модели предоставляет начальное состояние терминала. */
import {describe, expect, test} from "bun:test"
import subject from "@zavx0z/immersive-tech-terminal"

describe.each([{name: "Новая модель", props: {}}])("$name", ({props}) => {
  const model = new subject(props)
  test("Начальное состояние", () => {
    expect(model.snapshot.lines, "Новый терминал содержит начальную пустую строку").toHaveLength(1)
  })
})

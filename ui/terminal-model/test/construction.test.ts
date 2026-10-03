/** Конструктор модели предоставляет начальное состояние терминала. */
import {describe, expect, test} from "bun:test"
import subject from "@ui/terminal-model"

describe.each([{name: "Новая модель", props: {}}])("$name", ({props}) => {
  const model = new subject(props)
  test("Начальное состояние", () => {
    expect(model.snapshot.lines, "Новый терминал содержит начальную пустую строку").toHaveLength(1)
  })
})

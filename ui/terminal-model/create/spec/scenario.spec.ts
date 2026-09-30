/** createTerminalModel показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import subject from "@ui-terminal-model/create"

describe.each([{name: "Новая модель", props: {}}])("$name", ({props}) => {
  const model = subject(props)
  test("Начальное состояние", () => {
    expect(model.snapshot.lines, "Новый терминал содержит начальную пустую строку").toHaveLength(1)
  })
})

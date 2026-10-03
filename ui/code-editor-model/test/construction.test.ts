/** Конструктор сохраняет переданные начальные данные модели. */
import {describe, expect, test} from "bun:test"
import subject from "@ui/code-editor-model"

describe.each([{name: "Новая модель", props: {value: "Текст"}}])("$name", ({props}) => {
  const model = new subject(props)
  test("Начальное состояние", () => {
    expect(model.snapshot.value, "Модель сохраняет исходный текст").toBe("Текст")
  })
})

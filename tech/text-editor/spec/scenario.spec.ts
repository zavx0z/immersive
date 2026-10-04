/** CodeEditorModel показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import subject from "@immersive-tech/text-editor"

describe.each([{name: "Новая модель", props: {value: "Текст"}}])("$name", ({props}) => {
  const model = new subject(props)
  test("Начальное состояние", () => {
    expect(model.snapshot.value, "Модель сохраняет исходный текст").toBe("Текст")
  })
})

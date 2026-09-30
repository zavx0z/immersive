/** createCodeEditorModel показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import subject from "@ui-code-editor-model/create"

describe.each([{name: "Новая модель", props: {value: "Текст"}}])("$name", ({props}) => {
  const model = subject(props)
  test("Начальное состояние", () => {
    expect(model.snapshot.value, "Модель сохраняет исходный текст").toBe("Текст")
  })
})

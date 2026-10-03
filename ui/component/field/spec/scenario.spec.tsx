/** Общая подпись и подсказка не зависят от конкретного типа значения поля. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import FieldExamples from "./fixture"

describe.each([{name: "Поля одного Document", props: {label: "Значение", title: "Подсказка"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 720, height: 1600})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <FieldExamples
      label={props.label}
      title={props.title}
    />
  )
  test("Все участники", () => {
    const fields = [...element.querySelectorAll("[data-field-example]")]
    expect(fields, "Сценарий использует каждое из пятнадцати самостоятельных полей группы").toHaveLength(15)
    expect(fields.every(field => field.ownerDocument === element.ownerDocument), "Поля сохраняют единый Document приложения").toBeTrue()
  })
  test("Общие свойства", () => {
    const fields = [...element.querySelectorAll("[data-field-example]")]
    expect(fields.filter(field => !field.textContent?.includes(props.label)).map(field => field.getAttribute("data-field-example")),
      "Каждое поле показывает подпись из общего входного протокола").toEqual([])
    expect(fields.filter(field => field.querySelector('[title="Подсказка"]') === null).map(field => field.getAttribute("data-field-example")),
      "Каждое поле сохраняет подсказку вызывающей стороны").toEqual([])
  })
})

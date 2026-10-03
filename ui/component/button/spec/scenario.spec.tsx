/** Общий протокол кнопок сохраняется при разных способах выполнения действия. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import type {UiButtons} from "@ui/buttons"
import ButtonExamples from "./fixture"

describe.each([
  {name: "Доступные действия", props: {label: "Запуск", disabled: false}},
  {name: "Запрещённые действия", props: {label: "Запуск", disabled: true}},
] satisfies readonly {name: string, props: UiButtons.Input & {label: string}}[])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 280})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <ButtonExamples
      label={props.label}
      disabled={props.disabled}
    />
  )

  test("Общий запрет действия", () => {
    const buttons = [...element.querySelectorAll("button")]
    expect(buttons, "Все три реализации создают настоящие кнопки в одном Document").toHaveLength(4)
    expect(buttons.every(button => button.hasAttribute("disabled") === props.disabled),
      "Запрет действия доходит до каждой кнопки, включая участников группы выбора").toBeTrue()
    expect(buttons.every(button => button.ownerDocument === element.ownerDocument),
      "Участники не создают отдельный Experience").toBeTrue()
  })

  test("Особенности участников", () => {
    expect(element.querySelector('button[aria-label="Запуск"]'),
      "IconButton сохраняет доступное имя действия без видимого текста").not.toBeNull()
    expect(element.querySelector('button[aria-pressed="true"]')?.textContent,
      "Группа сохраняет внешнее выбранное значение").toContain("Первый")
    expect(element.textContent, "Текстовый Button сохраняет переданную подпись").toContain(props.label)
  })
})

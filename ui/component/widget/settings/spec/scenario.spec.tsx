/** Разделы настроек используют общие поля и панели принимающего приложения. */
import {afterAll, describe, expect, mock, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import {KeyboardEvent, type HTMLButtonElement} from "@zavx0z/immersive-dom"
import Settings from "@zavx0z/immersive-ui-component-widget-settings"
import Panel from "@zavx0z/immersive-ui-component-surface-panel"
import TextField from "@zavx0z/immersive-ui-component-field-text"

const sections = [
  {id: "interface", label: "Интерфейс", group: "appearance"},
  {id: "themes", label: "Темы", group: "appearance", disabled: true},
  {id: "paths", label: "Каталоги", group: "system"},
]

describe.each([
  {name: "Широкая панель", width: 780, props: {sections, selectedId: "interface"}, slots: {
    default: <Panel label="Отображение" expanded={true}>
      <TextField label="Язык" value="Русский" />
    </Panel>,
  }},
  {name: "Компактная панель", width: 520, props: {sections, selectedId: "interface"}, slots: {
    default: <Panel label="Отображение" expanded={true}>
      <TextField label="Язык" value="Русский" />
    </Panel>,
  }},
])("$name", async ({width, props: input, slots}) => {
  const props = {...input, onSelect: mock()}
  const headless = createHeadless({width, height: 420})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Settings
      sections={props.sections}
      selectedId={props.selectedId}
      onSelect={props.onSelect}
    >
      {slots.default}
    </Settings>
  )

  test("Разделы и содержимое", () => {
    expect([...element.querySelectorAll('[role="tab"]')].map(item => item.textContent),
      "Разделы следуют порядку приложения и находятся слева от общих панелей").toEqual(["Интерфейс", "Темы", "Каталоги"])
    expect(element.querySelector('[role="tabpanel"]')?.textContent,
      "Содержимое раздела составлено из стандартных UI-компонентов").toContain("Отображение")
    expect(element.querySelector('input')?.ownerDocument,
      "Поля используют Document принимающего приложения").toBe(element.ownerDocument)
  })

  test("Раскладка", () => {
    const navigation = element.querySelector('[role="tablist"]')!.getBoundingClientRect()
    const content = element.querySelector('[role="tabpanel"]')!.getBoundingClientRect()
    const field = element.querySelector('input')!.getBoundingClientRect()
    expect(content.left >= navigation.right,
      "Навигация и содержимое не перекрываются при изменении ширины").toBeTrue()
    expect(field.width > 100 && field.right <= content.right,
      "Поле остаётся доступным внутри выбранного раздела").toBeTrue()
  })

  test("Выбор раздела", () => {
    const tabs = [...element.querySelectorAll('[role="tab"]')] as HTMLButtonElement[]
    tabs[2]!.click()
    expect(props.onSelect.mock.calls.map(call => call[0]),
      "Приложение получает идентификатор выбранного раздела").toEqual(["paths"])
    tabs[1]!.click()
    expect(props.onSelect.mock.calls.length,
      "Недоступный раздел не изменяет выбор").toBe(1)
  })

  test("Клавиатура", () => {
    const tabs = [...element.querySelectorAll('[role="tab"]')] as HTMLButtonElement[]
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true}))
    expect(props.onSelect.mock.calls.map(call => call[0]),
      "Стрелка пропускает недоступный раздел и передаёт следующий выбор").toEqual(["paths", "paths"])
    expect(element.ownerDocument!.activeElement,
      "Фокус следует за клавиатурной навигацией").toBe(tabs[2]!)
  })
})

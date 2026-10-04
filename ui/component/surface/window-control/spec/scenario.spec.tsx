import {afterAll, describe, expect, mock, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {MouseEvent} from "@immersive/dom"
import WindowControl from "@immersive-ui-component-surface/window-control"

describe.each([
  {name: "Открыть окно", props: {open: false}},
  {name: "Скрыть окно", props: {open: true}},
])("$name", async ({props: input}) => {
  const headless = createHeadless({width: 320, height: 80})
  afterAll(() => headless.dispose())
  const props = {...input, onOpenChange: mock()}
  const button = await headless.render(
    <WindowControl
      windowId="example-window"
      label="Документ"
      open={props.open}
      onOpenChange={props.onOpenChange}
    />,
  )
  test("Связь с оболочкой", () => {
    expect(button.getAttribute("aria-controls"), "Кнопка адресует Window того же Document").toBe("example-window")
    expect(button.getAttribute("aria-expanded"), "Состояние соответствует видимости оболочки").toBe(String(props.open))
  })
  test("Переключение", () => {
    button.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    expect(props.onOpenChange.mock.calls.map(call => call[0]), "Одна кнопка открывает и закрывает окно").toEqual([!props.open])
  })
})

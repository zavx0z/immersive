import {afterAll, describe, expect, mock, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {MouseEvent} from "@immersive/dom"
import Window from "@immersive-ui-component-surface/window"
import TextField from "@immersive-ui-component-field/text"

describe.each([
  {name: "Плавающее окно", props: {open: true, layout: "floating" as const, movable: true, resizable: true}},
  {name: "Свёрнутое окно", props: {open: false, layout: "floating" as const, movable: true, resizable: true}},
  {name: "Заполнение области", props: {open: true, layout: "fill" as const, movable: false, resizable: false}},
])("$name", async ({props: input}) => {
  const headless = createHeadless({width: 640, height: 480})
  afterAll(() => headless.dispose())
  const props = {...input, onOpenChange: mock()}
  const element = await headless.render(
    <Window
      id="example-window"
      title="Документ"
      open={props.open}
      layout={props.layout}
      movable={props.movable}
      resizable={props.resizable}
      onOpenChange={props.onOpenChange}
    >
      <TextField value="Сохраняемое содержимое" />
    </Window>,
  )
  const shell = element.querySelector('[data-window]')!

  test("Оболочка", () => {
    expect({role: shell.getAttribute("role"), id: shell.id, hidden: shell.hasAttribute("hidden")}, "Адресуемое окно целиком скрывается через open").toEqual({role: "dialog", id: "example-window", hidden: !props.open})
    expect(element.querySelectorAll('[data-window-title]').length, "Шапка содержит единственный заголовок без subtitle").toBe(1)
    expect(element.querySelectorAll("input").length, "Скрытие сохраняет смонтированное содержимое").toBe(1)
  })

  /** @remarks Скрытая оболочка не участвует в раскладке или пользовательском вводе. */
  describe.skipIf(!props.open)("Открытое окно", () => {
    test("Геометрия", () => {
      const rect = shell.getBoundingClientRect()
      expect({x: rect.x, y: rect.y, width: rect.width, height: rect.height}, "Плавающая геометрия и заполнение принимающей области").toEqual(props.layout === "fill"
        ? {x: 0, y: 0, width: 640, height: 480}
        : {x: 24, y: 24, width: 320, height: 240})
    })
    test("Сворачивание", () => {
      const button = shell.querySelector("button")!
      button.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      expect(props.onOpenChange.mock.calls.map(call => call[0]), "Кнопка в шапке запрашивает скрытие всей оболочки").toEqual([false])
      expect(shell.hasAttribute("hidden"), "Родитель остаётся владельцем open").toBeFalse()
    })
  })
})

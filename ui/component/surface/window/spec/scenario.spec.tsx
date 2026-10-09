import {afterAll, describe, expect, mock, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import {MouseEvent} from "@zavx0z/immersive-dom"
import Window from "@zavx0z/immersive-ui-component-surface-window"
import TextField from "@zavx0z/immersive-ui-component-field-text"

describe.each([
  {name: "Плавающее окно", props: {open: true, layout: "floating" as const, movable: true, resizable: true, message: undefined}},
  {name: "Свёрнутое окно", props: {open: false, layout: "floating" as const, movable: true, resizable: true, message: undefined}},
  {name: "Заполнение области", props: {open: true, layout: "fill" as const, movable: false, resizable: false, message: undefined}},
  {name: "Ошибка окна", props: {open: true, layout: "floating" as const, movable: false, resizable: false,
    message: {message: "Настройки доступны из общей страницы", tone: "error" as const}}},
])("$name", async ({name, props: input}) => {
  const headless = createHeadless({width: 640, height: 480})
  afterAll(() => headless.dispose())
  const props = {...input, onOpenChange: mock()}
  const element = await headless.render(
    <Window
      id="example-window"
      title="Документ"
      open={props.open}
      message={props.message}
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

  test("Сообщение окна", () => {
    const notification = shell.querySelector('[data-window-message]')
    if (props.message === undefined) {
      expect(notification, "Без сообщения окно не занимает место под уведомление").toBeNull()
    } else {
      expect(notification?.querySelector('[role="alert"]')?.children[1]?.textContent, "Ошибка передана штатному Notification")
        .toBe(props.message.message)
      expect(shell.querySelector('[data-window-body]')?.contains(notification!), "Уведомление не прокручивается вместе с телом").toBeFalse()
    }
  })

  /** @remarks Скрытая оболочка не участвует в раскладке или пользовательском вводе. */
  describe.skipIf(!["Плавающее окно", "Заполнение области", "Ошибка окна"].includes(name))("Открытое окно", () => {
    test("Геометрия", () => {
      const rect = shell.getBoundingClientRect()
      expect({x: rect.x, y: rect.y, width: rect.width, height: rect.height}, "Плавающая геометрия и заполнение принимающей области").toEqual(props.layout === "fill"
        ? {x: 0, y: 0, width: 640, height: 480}
        : {x: 24, y: 24, width: 320, height: 240})
    })
    test("Положение сообщения", () => {
      if (props.message === undefined) return
      const rect = shell.getBoundingClientRect()
      const notification = shell.querySelector('[data-window-message] aside')!.getBoundingClientRect()
      expect(notification.left >= rect.left && notification.left < rect.left + 12, "Уведомление у левого края окна").toBeTrue()
      expect(notification.bottom <= rect.bottom && notification.bottom > rect.bottom - 12, "Уведомление у нижнего края окна").toBeTrue()
    })
    test("Сворачивание", () => {
      const button = shell.querySelector("button")!
      button.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      expect(props.onOpenChange.mock.calls.map(call => call[0]), "Кнопка в шапке запрашивает скрытие всей оболочки").toEqual([false])
      expect(shell.hasAttribute("hidden"), "Родитель остаётся владельцем open").toBeFalse()
    })
  })
})

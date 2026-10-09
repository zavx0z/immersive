import {afterAll, describe, expect, mock, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import {MouseEvent, type HTMLElement} from "@zavx0z/immersive-dom"
import WindowExample from "./fixture.tsx"

describe.each([
  {name: "Матовое стекло", props: {open: true, layout: "floating" as const, movable: true, resizable: true, message: undefined}},
  {name: "Перекрытие окон", props: {open: true, layout: "floating" as const, movable: true, resizable: true, message: undefined}},
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
    <WindowExample
      overlap={["Перекрытие окон", "Матовое стекло"].includes(name)}
      glass={name === "Матовое стекло"}
      open={props.open}
      message={props.message}
      layout={props.layout}
      movable={props.movable}
      resizable={props.resizable}
      onOpenChange={props.onOpenChange}
    />,
  )
  const shell = element.querySelector('[data-window]')!

  test("Оболочка", () => {
    expect({role: shell.getAttribute("role"), id: shell.id, hidden: shell.hasAttribute("hidden")}, "Адресуемое окно целиком скрывается через open").toEqual({role: "dialog", id: "example-window", hidden: !props.open})
    expect(element.querySelectorAll('[data-window-title]').length, "Каждое окно содержит единственный заголовок без subtitle").toBe(["Перекрытие окон", "Матовое стекло"].includes(name) ? 2 : 1)
    expect(element.querySelectorAll("input").length, "Скрытие сохраняет смонтированное содержимое").toBe(["Перекрытие окон", "Матовое стекло"].includes(name) ? 2 : 1)
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
  describe.skipIf(!["Плавающее окно", "Заполнение области", "Ошибка окна", "Перекрытие окон", "Матовое стекло"].includes(name))("Открытое окно", () => {
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

  /** @remarks Перекрытие проверяется по пикселям нативного GPU, без рабочего браузера. */
  describe.skipIf(name !== "Перекрытие окон")("Порядок окон", () => {
    test("Фокус поднимает окно и сохраняет порядок после ухода на внешний элемент", async () => {
      const second = element.querySelector('[id="second-window"]')! as HTMLElement
      const firstField = shell.querySelector("input")! as HTMLElement
      const pixel = (frame: {width: number; rgba: Uint8Array}) => {
        const offset = (210 * frame.width + 250) * 4
        return [...frame.rgba.slice(offset, offset + 3)]
      }
      second.focus()
      const before = await headless.capture(element)
      expect(pixel(before), "В пересечении виден синий фон верхнего второго окна").toEqual([34, 68, 136])
      firstField.focus()
      const raised = await headless.capture(element)
      expect(pixel(raised), "После активации виден коричневый фон первого окна").toEqual([136, 68, 34])
      firstField.blur()
      const blurred = await headless.capture(element)
      expect(pixel(blurred), "Потеря keyboard focus не опускает окно").toEqual(pixel(raised))
      expect(shell.getAttribute("data-window-active"), "Активность сохранена отдельно от focus-within").toBe("true")
      expect(shell.querySelector("input"), "Подъём сохранил Element содержимого").toBe(firstField)
      const evidence = process.env.WINDOW_LAYER_EVIDENCE_DIR
      if (evidence) {
        await Bun.write(`${evidence}/before.png`, before.png)
        await Bun.write(`${evidence}/raised.png`, raised.png)
      }
    })
  })


  /** @remarks Стекло задаётся обычным CSS окна, без отдельного режима компонента. */
  describe.skipIf(name !== "Матовое стекло")("Размытие фона", () => {
    test("CSS уменьшает контраст полос за окном", async () => {
      const glass = await headless.capture(element)
      for (const window of element.querySelectorAll("[data-window]")) {
        window.setAttribute("style", `${window.getAttribute("style") ?? ""};backdrop-filter:none`)
      }
      const plain = await headless.capture(element)
      const contrast = (frame: {width: number; rgba: Uint8Array}) => {
        const values = Array.from({length: 100}, (_, index) => frame.rgba[(210 * frame.width + 200 + index) * 4]!)
        return Math.max(...values) - Math.min(...values)
      }
      expect(contrast(glass), "Полосы за двумя прозрачными окнами размыты").toBeLessThan(contrast(plain) * .5)
      const evidence = process.env.WINDOW_LAYER_EVIDENCE_DIR
      if (evidence) {
        await Bun.write(`${evidence}/glass.png`, glass.png)
        await Bun.write(`${evidence}/glass-disabled.png`, plain.png)
      }
    })
  })

})

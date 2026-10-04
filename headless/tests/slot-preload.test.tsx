import {describe, expect, test} from "bun:test"
import {createRoot} from "@immersive/component"
import {Document, Event} from "@immersive/dom"
import {ContentReceiver, SlotCounter, SlotNamedPanel, SlotPanel, SlotText} from "./fixtures/slot-panel.tsx"

describe("Headless preload со скомпилированными слотами", () => {
  test("undefined пропускается до распределения по именованным слотам", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    try {
      root.render(
        <SlotNamedPanel>
          {undefined}
          <SlotText slot="header" text="Заголовок" />
          {undefined}
        </SlotNamedPanel>,
      )
      expect(container.textContent).toBe("Заголовок")
    } finally {
      root.unmount()
    }
  })
  test("вложенный JSX распределяется в именованный и безымянный слот", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    root.render(
      <SlotPanel>
        <SlotText text="Тело" />
        {["Первый", "Второй"].map(text => (
          <SlotText
            key={text}
            slot="header"
            text={text}
          />
        ))}
        {null}
        {false}
      </SlotPanel>
    )

    expect(container.textContent).toBe("ПервыйВторойТело")
    root.unmount()
  })

  test("скомпилированный fallback остаётся при отсутствии назначенного содержимого", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    root.render(
      <SlotPanel>
        <SlotText
          slot="header"
          text="Заголовок"
        />
      </SlotPanel>
    )

    expect(container.textContent).toBe("ЗаголовокЗапасное тело")
    root.unmount()
  })

  test("неизвестный слот в spec JSX отклоняется до монтирования", () => {
    expect(() => (
      <SlotPanel>
        <SlotText
          slot="missing"
          text="Неизвестный"
        />
      </SlotPanel>
    )).toThrow("unknown slot")
  })

  test("перестановка и добавление mapped children сохраняют DOM и состояние по key", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const scenario = (names: readonly string[]) => (
      <SlotPanel>
        {names.map(text => (
          <SlotCounter
            key={text}
            slot="header"
            text={text}
          />
        ))}
        <SlotCounter
          slot="header"
          text="Постоянный"
        />
      </SlotPanel>
    )
    root.render(scenario(["A", "B"]))
    const first = container.querySelector('[data-item="A"]')!
    const second = container.querySelector('[data-item="B"]')!
    const stable = container.querySelector('[data-item="Постоянный"]')!
    first.dispatchEvent(new Event("click"))
    root.flush()
    root.render(scenario(["B", "A", "C"]))

    expect({
      first: container.querySelector('[data-item="A"]') === first,
      second: container.querySelector('[data-item="B"]') === second,
      stable: container.querySelector('[data-item="Постоянный"]') === stable,
      state: first.textContent,
      order: [...container.querySelectorAll("button")].map(element => element.getAttribute("data-item")),
    }).toEqual({first: true, second: true, stable: true, state: "A:1", order: ["B", "A", "C", "Постоянный"]})
    root.unmount()
  })

  test("появление named conditional child сохраняет следующего соседа", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const scenario = (visible: boolean) => (
      <SlotPanel>
        {visible ? (
          <SlotText
            slot="header"
            text="Необязательный"
          />
        ) : null}
        <SlotCounter
          slot="header"
          text="Постоянный"
        />
      </SlotPanel>
    )
    root.render(scenario(false))
    const stable = container.querySelector("button")!
    stable.dispatchEvent(new Event("click"))
    root.flush()
    root.render(scenario(true))

    expect({same: container.querySelector("button") === stable, state: stable.textContent}).toEqual({
      same: true,
      state: "Постоянный:1",
    })
    root.unmount()
  })

  test("пустой named map и null сохраняют назначение без default outlet", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const scenario = (names: readonly string[], visible: boolean) => (
      <SlotNamedPanel>
        {visible ? (
          <SlotText
            slot="header"
            text="Необязательный"
          />
        ) : null}
        {names.map(text => (
          <SlotText
            key={text}
            slot="header"
            text={text}
          />
        ))}
      </SlotNamedPanel>
    )
    root.render(scenario([], false))
    const fallback = container.textContent
    root.render(scenario(["A"], false))

    expect({fallback, content: container.textContent}).toEqual({fallback: "Запасной заголовок", content: "A"})
    root.unmount()
  })

  test("получатель слота принимает keyed-содержимое и сохраняет состояние по key", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const scenario = (names: readonly string[]) => (
      <ContentReceiver>
        {names.map(text => (
          <SlotCounter
            key={text}
            text={text}
          />
        ))}
      </ContentReceiver>
    )
    root.render(scenario(["A", "B"]))
    const first = container.querySelector('[data-item="A"]')!
    first.dispatchEvent(new Event("click"))
    root.flush()
    root.render(scenario(["B", "A", "C"]))

    expect({same: container.querySelector('[data-item="A"]') === first, state: first.textContent, text: container.textContent}).toEqual({
      same: true,
      state: "A:1",
      text: "B:0A:1C:0",
    })
    root.unmount()
  })

  test("получатель слота обновляет условное содержимое", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const scenario = (visible: boolean) => (
      <ContentReceiver>
        {visible ? <SlotCounter text="Условный" /> : null}
      </ContentReceiver>
    )
    root.render(scenario(false))
    const empty = container.textContent
    root.render(scenario(true))
    const conditional = container.querySelector("button")!
    conditional.dispatchEvent(new Event("click"))
    root.flush()
    root.render(scenario(true))

    expect({empty, same: container.querySelector("button") === conditional, state: conditional.textContent}).toEqual({
      empty: "",
      same: true,
      state: "Условный:1",
    })
    root.unmount()
  })
})

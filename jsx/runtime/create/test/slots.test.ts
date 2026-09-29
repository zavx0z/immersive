import {describe, expect, test} from "bun:test"
import {component, createRoot, normalizeChildren, type ComponentValue, type KeyedComponentsValue} from "@zavx0z/component"
import {composeSlot, type ComposeSlotInput} from "@zavx0z/component/slot"
import {Document} from "@zavx0z/dom"
import {
  bindConditional,
  bindText,
  defineCompiledTemplate,
  slotContents,
  writeBinding,
} from "@zavx0z/template/compiled"
import jsx from "@jsx-runtime/create"
import slotChild from "@jsx-slot/child"

/** Props минимального публичного template для наблюдения DOM identity. */
type TextProps = Readonly<{
  text: string
}>

const textTemplate = defineCompiledTemplate<TextProps>({
  bindingCount: 1,
  mount(document) {
    const element = document.createElement("span")
    const text = document.createTextNode("")
    element.append(text)
    return {nodes: [element], bindings: [bindText(text)]}
  },
  render(props, values) {
    writeBinding(values, 0, props.text)
  },
})

/** Props получателя именованных групп через compiler-owned symbol. */
type ReceiverProps = Readonly<{
  title?: string
  [slotContents]?: Readonly<Record<string, readonly ComposeSlotInput["content"][]>>
}>

/** Создаёт настоящий CompiledTemplate с conditional областями и публичной slot композиции. */
function receiver(outlets: readonly string[]) {
  return defineCompiledTemplate<ReceiverProps>({
    bindingCount: outlets.length,
    slots: outlets,
    mount(document) {
      const element = document.createElement("article")
      const bindings = outlets.map(name => {
        const region = document.createElement("section")
        region.setAttribute("data-region", name)
        const start = document.createComment("slot:start")
        const end = document.createComment("slot:end")
        region.append(start, end)
        element.append(region)
        return bindConditional(start, end)
      })
      return {nodes: [element], bindings}
    },
    render(props, values) {
      for (const [index, name] of outlets.entries()) {
        const supplied = composeSlot({content: props[slotContents]?.[name]})
        writeBinding(values, index, supplied ?? component(textTemplate, {text: `fallback:${name}`}))
      }
    },
  })
}

/** Прежний props.children ABI принимает подготовленный single либо keyed transport. */
type LegacyProps = Readonly<{
  children?: ComponentValue | KeyedComponentsValue | null
}>

const legacyTemplate = defineCompiledTemplate<LegacyProps>({
  bindingCount: 1,
  mount(document) {
    const element = document.createElement("main")
    const start = document.createComment("legacy:start")
    const end = document.createComment("legacy:end")
    element.append(start, end)
    return {nodes: [element], bindings: [bindConditional(start, end)]}
  },
  render(props, values) {
    writeBinding(values, 0, normalizeChildren(props.children))
  },
})

describe("JSX с точками вставки", () => {
  test("собирает именованные и безымянные группы в исходном порядке из вложенных массивов", () => {
    const first = jsx(textTemplate, {slot: "header", text: "Первый"})
    const second = jsx(textTemplate, {slot: "header", text: "Второй"})
    const body = jsx(textTemplate, {text: "Тело"})
    const value = jsx(receiver(["header", ""]), {
      title: "Панель",
      children: [[first, null], [body, [false, second, "текст", 0]]],
    })

    expect(value.props).toEqual({
      title: "Панель",
      [slotContents]: {header: [first, second], "": [null, body, false, "текст", 0]},
    })
  })

  test("не передаёт резервный атрибут slot ребёнку", () => {
    const props = {slot: "header", text: "Заголовок"}
    const child = jsx(textTemplate, props, "header-key")

    expect({props: child.props, key: child.key, authored: props}).toEqual({
      props: {text: "Заголовок"},
      key: "header-key",
      authored: {slot: "header", text: "Заголовок"},
    })
  })

  test("монтирует группы в объявленные области и сохраняет fallback пустого слота", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    root.render(jsx(receiver(["header", "", "footer"]), {
      children: [
        jsx(textTemplate, {text: "Тело"}),
        jsx(textTemplate, {slot: "header", text: "Заголовок"}),
      ],
    }))

    expect(container.textContent).toBe("ЗаголовокТелоfallback:footer")
    root.unmount()
  })

  test("пустой текст включает fallback, а ноль остаётся содержимым", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const template = receiver([""])
    root.render(jsx(template, {children: [null, false, ""]}))
    const empty = container.textContent
    root.render(jsx(template, {children: 0}))

    expect([empty, container.textContent]).toEqual(["fallback:", "0"])
    root.unmount()
  })

  test("пустое именованное содержимое сохраняет объявленное назначение", () => {
    const value = jsx(receiver(["header"]), {
      children: [slotChild("header", null, "conditional"), slotChild("header", [], "keyed")],
    })

    expect(composeSlot({content: (value.props as ReceiverProps)[slotContents]?.header})).toBeNull()
  })

  test("неизвестное имя не попадает в безымянную область", () => {
    const child = jsx(textTemplate, {slot: "missing", text: "Неизвестный"})

    expect(() => jsx(receiver([""]), {children: child})).toThrow("unknown slot")
  })

  test("безымянное содержимое требует объявленного безымянного слота", () => {
    expect(() => jsx(receiver(["header"]), {children: "Тело"})).toThrow('unknown slot ""')
  })

  test("компонент без slots отклоняет именованного ребёнка", () => {
    const child = jsx(textTemplate, {slot: "header", text: "Заголовок"})

    expect(() => jsx(textTemplate, {text: "Родитель", children: child})).toThrow("unknown slot")
  })

  test("сохраняет прежний children transport компонента без slots", () => {
    const child = jsx(textTemplate, {text: "Ребёнок"})
    const value = jsx(textTemplate, {text: "Родитель", children: child})

    expect(value.props.children).toBe(child)
  })

  test("проверяет фактический тип резервного имени", () => {
    expect(() => jsx(textTemplate, {text: "Заголовок", slot: 12})).toThrow("static string name")
  })

  test("имя __proto__ хранится как обычная объявленная область", () => {
    const child = jsx(textTemplate, {slot: "__proto__", text: "Содержимое"})
    const value = jsx(receiver(["__proto__"]), {children: child})

    expect((value.props as ReceiverProps)[slotContents]?.["__proto__"]).toEqual([child])
  })

  test("повторный render сохраняет DOM ребёнка с прежним template и key", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const template = receiver(["header"])
    root.render(jsx(template, {
      children: jsx(textTemplate, {slot: "header", text: "Первый"}, "stable"),
    }))
    const first = container.querySelector("span")
    root.render(jsx(template, {
      children: jsx(textTemplate, {slot: "header", text: "Обновлённый"}, "stable"),
    }))

    expect({same: container.querySelector("span") === first, text: first?.textContent}).toEqual({
      same: true,
      text: "Обновлённый",
    })
    root.unmount()
  })

  test("появление безымянного необязательного соседа сохраняет следующую фиксированную позицию", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const template = receiver([""])
    root.render(jsx(template, {children: [null, jsx(textTemplate, {text: "Постоянный"}, "stable")]}))
    const stable = container.querySelector("span")!
    root.render(jsx(template, {
      children: [jsx(textTemplate, {text: "Необязательный"}), jsx(textTemplate, {text: "Постоянный"}, "stable")],
    }))

    expect([...container.querySelectorAll("span")][1]).toBe(stable)
    root.unmount()
  })

  test("пустое именованное назначение не угадывается из соседей", () => {
    expect(() => jsx(receiver(["header"]), {children: [null]})).toThrow('unknown slot ""')
  })

  test("условная именованная позиция не сдвигает следующего соседа", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const template = receiver(["header"])
    root.render(jsx(template, {
      children: [slotChild("header", null, "conditional"), jsx(textTemplate, {slot: "header", text: "Постоянный"})],
    }))
    const stable = container.querySelector("span")!
    root.render(jsx(template, {
      children: [
        slotChild("header", jsx(textTemplate, {slot: "header", text: "Необязательный"}), "conditional"),
        jsx(textTemplate, {slot: "header", text: "Постоянный"}),
      ],
    }))

    expect([...container.querySelectorAll("span")][1]).toBe(stable)
    root.unmount()
  })

  test("keyed граница сохраняет детей при перестановке и добавлении", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const template = receiver(["header"])
    const children = (names: readonly string[]) => slotChild("header", names.map(name => (
      jsx(textTemplate, {slot: "header", text: name}, name)
    )), "keyed")
    root.render(jsx(template, {children: children(["A", "B"])}))
    const [first, second] = container.querySelectorAll("span")
    root.render(jsx(template, {children: children(["B", "A", "C"])}))
    const reordered = [...container.querySelectorAll("span")]

    expect({first: reordered[1] === first, second: reordered[0] === second, text: container.textContent}).toEqual({
      first: true,
      second: true,
      text: "BAC",
    })
    root.unmount()
  })

  test("ключи фиксированных соседей не превращают группу в keyed map", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const template = receiver(["header"])
    const children = (names: readonly string[]) => names.map(name => (
      jsx(textTemplate, {slot: "header", text: name}, name)
    ))
    root.render(jsx(template, {children: children(["A", "B"])}))
    const first = container.querySelector("span")
    root.render(jsx(template, {children: children(["B", "A"])}))

    expect([...container.querySelectorAll("span")][1] === first).toBe(false)
    root.unmount()
  })

  test("keyed transport требует key у каждого ребёнка", () => {
    expect(() => jsx(receiver(["header"]), {
      children: slotChild("header", [jsx(textTemplate, {slot: "header", text: "A"})], "keyed"),
    })).toThrow("dynamic JSX map components require key")
  })

  test("transport проверяет соответствие статического и фактического назначения", () => {
    expect(() => jsx(receiver(["header", "footer"]), {
      children: slotChild("header", jsx(textTemplate, {slot: "footer", text: "A"}), "conditional"),
    })).toThrow("does not match its static assignment")
  })

  test("legacy children получает содержимое conditional вместо metadata", () => {
    const child = jsx(textTemplate, {text: "Ребёнок"})
    const value = jsx(textTemplate, {text: "Родитель", children: slotChild("", child, "conditional")})

    expect(value.props.children).toBe(child)
  })

  test("legacy children получает готовый keyed transport", () => {
    const child = jsx(textTemplate, {text: "Ребёнок"}, "child")
    const value = jsx(textTemplate, {text: "Родитель", children: slotChild("", [child], "keyed")})
    const normalized = composeSlot({content: value.props.children})
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    if (normalized) root.render(normalized)

    expect(container.textContent).toBe("Ребёнок")
    root.unmount()
  })

  test("legacy примитивный children остаётся прежним без compiler metadata", () => {
    const value = jsx(textTemplate, {text: "Родитель", children: "Прежний текст"})

    expect(value.props.children).toBe("Прежний текст")
  })

  test("legacy смешанные siblings сохраняют fixed позицию после изменяемого keyed списка", () => {
    const document = new Document()
    const container = document.createElement("main")
    const root = createRoot(container)
    const scenario = (names: readonly string[], optional: boolean) => jsx(legacyTemplate, {
      children: [
        slotChild("", optional ? jsx(textTemplate, {text: "Необязательный"}) : null, "conditional"),
        slotChild("", names.map(name => jsx(textTemplate, {text: name}, name)), "keyed"),
        jsx(textTemplate, {text: "Постоянный"}),
      ],
    })
    root.render(scenario(["A", "B"], false))
    const [first, second, stable] = container.querySelectorAll("span")
    root.render(scenario(["B", "A", "C"], true))
    const updated = [...container.querySelectorAll("span")]

    expect({first: updated[2] === first, second: updated[1] === second, stable: updated[4] === stable}).toEqual({
      first: true,
      second: true,
      stable: true,
    })
    root.unmount()
  })
})

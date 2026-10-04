import {afterEach, describe, expect, test} from "bun:test"
import {createDocument, type Node} from "@zavx0z/immersive-dom"
import {
  component,
  createRoot,
  keyedComponents,
  useEffect,
  useState,
  type ComponentRoot,
  type ComponentValue,
  type Ref,
  type StateDispatch,
} from "@zavx0z/immersive-component"
import {composeSlot, type ComposeSlotInput} from "@zavx0z/immersive-component/slot"
import {
  bindConditional,
  bindProperty,
  bindRef,
  bindText,
  defineCompiledTemplate,
  writeBinding,
} from "@zavx0z/immersive-template/compiled"

/** Поддерживаемое содержимое берётся из публичного входного контракта. */
type SlotContent = ComposeSlotInput["content"]

/**
Вход тестового получателя с обычной conditional-областью.

@property content - Передаётся непосредственно проверяемой композиции.

@property [fallback] - Независимый compiled value, выбираемый только после `null`.
*/
type HostProps = Readonly<{content: SlotContent, fallback?: ComponentValue}>

/**
Наблюдения жизненного цикла одного stateful-соседа.

@property cleanups - Число завершённых эффектов при удалении экземпляра.

@property setups - Число созданных экземпляров с принятым эффектом.

@property dispatch - Последний dispatch текущего экземпляра для изменения state.
*/
type CounterLifecycle = {
  cleanups: number
  setups: number
  dispatch: StateDispatch<number> | null
}

/**
Props stateful-соседа, позволяющие наблюдать Element, refs и effect lifecycle.

@property label - Различает соседа в существующем DOM и в текстовом результате.

@property lifecycle - Принимает dispatch и счётчики эффектов без изменения state.

@property ref - Наблюдает принятую DOM identity через действующий ref binding.
*/
type CounterProps = Readonly<{
  label: string
  lifecycle: CounterLifecycle
  ref: Ref<Node>
}>

const roots: ComponentRoot[] = []

const hostTemplate = defineCompiledTemplate<HostProps>({
  displayName: "SlotCompositionHost",
  bindingCount: 1,
  /** Создаёт единственную обычную область в Document тестового root. */
  mount(document) {
    const start = document.createComment("host:start")
    const end = document.createComment("host:end")
    return {nodes: [start, end], bindings: [bindConditional(start, end)]}
  },
  /** Выбирает fallback по результату публичной композиции содержимого. */
  render(props, values) {
    writeBinding(values, 0, composeSlot({content: props.content}) ?? props.fallback ?? null)
  },
})

const counterTemplate = defineCompiledTemplate<CounterProps>({
  displayName: "SlotStatefulCounter",
  bindingCount: 3,
  /** Подготавливает Element и addressed Text для проверки сохранения identity. */
  mount(document) {
    const span = document.createElement("span")
    const text = document.createTextNode("")
    span.appendChild(text)
    return {
      nodes: [span],
      bindings: [bindText(text), bindRef(span), bindProperty(span, "id")],
    }
  },
  /** Изменяет обычный hook state и публикует принятые lifecycle-наблюдения. */
  render(props, values) {
    const [count, dispatch] = useState(0)
    props.lifecycle.dispatch = dispatch
    useEffect(() => {
      props.lifecycle.setups += 1
      return () => {
        props.lifecycle.cleanups += 1
      }
    }, [])
    writeBinding(values, 0, `${props.label}:${count}`)
    writeBinding(values, 1, props.ref)
    writeBinding(values, 2, props.label)
  },
})

/** Создаёт один Component root и регистрирует освобождение после текущего теста. */
function mountedHost() {
  const document = createDocument()
  const container = document.createElement("div")
  document.appendChild(container)
  const root = createRoot(container)
  roots.push(root)
  return {container, document, root}
}

/** Подготавливает наблюдения одного счётчика, не создавая DOM или подписки. */
function counter(label: string, key: string | null = null) {
  const lifecycle: CounterLifecycle = {cleanups: 0, setups: 0, dispatch: null}
  const ref = {current: null as Node | null}
  const value = component(counterTemplate, {label, lifecycle, ref}, key)
  return {lifecycle, ref, value}
}

afterEach(() => {
  for (const root of roots.splice(0)) root.unmount()
})

describe("Slot content composition", () => {
  test("пустые primitives и полностью пустые группы позволяют выбрать fallback", () => {
    const fallback = counter("fallback")
    const emptyContents: SlotContent[] = [
      null,
      undefined,
      false,
      true,
      "",
      [],
      [null, false, "", undefined],
      [[], [true, null], keyedComponents([])],
      keyedComponents([]),
    ]
    const {container, root} = mountedHost()

    for (const content of emptyContents) {
      expect(composeSlot({content}), "пустое назначение должно передавать выбор fallback получателю").toBeNull()
      root.render(hostTemplate, {content, fallback: fallback.value})
      expect(container.textContent, "получатель должен видеть только fallback").toBe("fallback:0")
    }
    expect(fallback.lifecycle.setups, "переход между пустыми входами сохраняет fallback instance").toBe(1)
  })

  test("нулевые числа, bigint и непустые строки обновляют один Text без Element-обёртки", () => {
    const {container, document, root} = mountedHost()
    root.render(hostTemplate, {content: 0})
    const text = Array.from(container.childNodes).find(node => node.nodeType === 3)
    expect(container.textContent, "0 является назначенным текстом, а не пустотой").toBe("0")
    expect(text?.ownerDocument, "text принадлежит Document получателя").toBe(document)

    for (const [content, expected] of [
      [0n, "0"],
      [9007199254740993n, "9007199254740993"],
      [" ", " "],
      ["текст", "текст"],
      [12, "12"],
    ] as const) {
      root.render(hostTemplate, {content})
      expect(container.textContent).toBe(expected)
      expect(Array.from(container.childNodes).find(node => node.nodeType === 3)).toBe(text)
    }
    expect(container.querySelector("*"), "text composition не добавляет semantic Element").toBeNull()
  })

  test("готовый ComponentValue сохраняет template, props, key и context transport", () => {
    const child = counter("direct", "direct-key")
    expect(composeSlot({content: child.value}), "compiled value возвращается без новой обёртки").toBe(child.value)
  })

  test("появление и удаление первого соседа сохраняет state, Element, refs и эффект следующей позиции", () => {
    const first = counter("first")
    const stable = counter("stable")
    const {container, root} = mountedHost()
    root.render(hostTemplate, {content: [null, stable.value]})
    const element = stable.ref.current
    const dispatch = stable.lifecycle.dispatch
    const text = element?.firstChild
    dispatch!(4)

    root.render(hostTemplate, {content: [first.value, stable.value]})
    expect(container.textContent).toBe("first:0stable:4")
    expect(stable.ref.current).toBe(element)
    expect(stable.ref.current?.firstChild).toBe(text)
    expect(stable.lifecycle.dispatch).toBe(dispatch)
    expect(stable.lifecycle.setups).toBe(1)
    expect(stable.lifecycle.cleanups).toBe(0)

    root.render(hostTemplate, {content: [false, stable.value]})
    expect(container.textContent).toBe("stable:4")
    expect(stable.ref.current).toBe(element)
    expect(stable.lifecycle.dispatch).toBe(dispatch)
    expect(stable.lifecycle.cleanups).toBe(0)
    expect(first.ref.current).toBeNull()
    expect(first.lifecycle.cleanups).toBe(1)

    root.unmount()
    expect(stable.ref.current).toBeNull()
    expect(stable.lifecycle.cleanups).toBe(1)
  })

  test("вложенные группы сохраняют исходный порядок и пустые позиции", () => {
    const stable = counter("nested")
    const {container, root} = mountedHost()
    root.render(hostTemplate, {content: ["before", [null, stable.value], 0]})
    const element = stable.ref.current
    stable.lifecycle.dispatch!(7)
    root.render(hostTemplate, {content: ["after", ["optional", stable.value], 0n]})

    expect(container.textContent).toBe("afteroptionalnested:70")
    expect(stable.ref.current).toBe(element)
    expect(stable.lifecycle.setups).toBe(1)
    expect(stable.lifecycle.cleanups).toBe(0)
  })

  test("keyed-перестановка сохраняет экземпляры и удаляет только отсутствующий ключ", () => {
    const first = counter("first", "first-key")
    const second = counter("second", "second-key")
    const {container, root} = mountedHost()
    root.render(hostTemplate, {content: keyedComponents([first.value, second.value])})
    const firstElement = first.ref.current
    const secondElement = second.ref.current
    first.lifecycle.dispatch!(3)
    second.lifecycle.dispatch!(5)
    root.render(hostTemplate, {content: keyedComponents([second.value, first.value])})

    expect(container.textContent).toBe("second:5first:3")
    expect(first.ref.current).toBe(firstElement)
    expect(second.ref.current).toBe(secondElement)
    expect(first.lifecycle.setups).toBe(1)
    expect(second.lifecycle.setups).toBe(1)

    root.render(hostTemplate, {content: keyedComponents([second.value])})
    expect(first.ref.current).toBeNull()
    expect(first.lifecycle.cleanups).toBe(1)
    expect(second.ref.current).toBe(secondElement)
    expect(second.lifecycle.cleanups).toBe(0)
  })

  test("полностью опустевшая ранее непустая группа переключает fallback и завершает удалённые экземпляры", () => {
    const child = counter("child")
    const fallback = counter("fallback")
    const {container, root} = mountedHost()
    root.render(hostTemplate, {content: [null, child.value], fallback: fallback.value})
    root.render(hostTemplate, {content: [null, false], fallback: fallback.value})

    expect(container.textContent).toBe("fallback:0")
    expect(child.ref.current).toBeNull()
    expect(child.lifecycle.cleanups).toBe(1)
    expect(fallback.lifecycle.setups).toBe(1)
  })

  test("неподдерживаемый leaf отвергается до изменения принятого дерева", () => {
    const stable = counter("stable")
    const {container, root} = mountedHost()
    root.render(hostTemplate, {content: [null, stable.value]})
    const element = stable.ref.current
    // @ts-expect-error Отрицательный runtime-вход также запрещён публичным типом.
    const invalid: SlotContent = {tag: "span", props: {}}

    expect(() => root.render(hostTemplate, {content: [invalid, stable.value]})).toThrow(
      "Slot content requires compiled component values, text, or fixed arrays",
    )
    expect(container.textContent).toBe("stable:0")
    expect(stable.ref.current).toBe(element)
    expect(stable.lifecycle.cleanups).toBe(0)
  })
})

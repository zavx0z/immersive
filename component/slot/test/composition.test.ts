import {afterEach, describe, expect, test} from "bun:test"
import {createDocument, createDomRoot, type DOMRoot, type DOMSlotContent, type HTMLButtonElement} from "@zavx0z/immersive-dom"
import {components} from "../../tests/fixture.ts"

type SlotContent = DOMSlotContent
const composeSlot = ({content}: {content: SlotContent}) => components.prepareSlot(content)
const keyedComponents = <Value>(values: readonly Value[]) => values
const hostTemplate = components.SlotHost
const roots: DOMRoot[] = []
function mountedHost() {
  const document = createDocument()
  const container = document.createElement("div")
  document.append(container)
  const root = createDomRoot(container)
  roots.push(root)
  return {container, document, root}
}
function counter(label: string, key: string | null = null) {
  const lifecycle = {cleanups: 0, setups: 0, dispatch: null as ((value: number) => void) | null}
  const ref = {current: null as HTMLButtonElement | null}
  const value = {type: components.Counter, props: {label, lifecycle, element: ref}, key}
  return {lifecycle, ref, value}
}
afterEach(() => { for (const root of roots.splice(0)) root.unmount() })

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
    const {container, document, root} = mountedHost()

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

  test("готовый construction record сохраняет constructor, props, key и context transport", () => {
    const child = counter("direct", "direct-key")
    expect(composeSlot({content: child.value}), "compiled value возвращается без новой обёртки").toBe(child.value)
  })

  test("появление и удаление первого соседа сохраняет state, Element, refs и эффект следующей позиции", () => {
    const first = counter("first")
    const stable = counter("stable")
    const {container, document, root} = mountedHost()
    root.render(hostTemplate, {content: [null, stable.value]})
    const element = stable.ref.current
    const dispatch = stable.lifecycle.dispatch
    const text = element?.firstChild
    dispatch!(4)
    document.flushTasks()

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
    const {container, document, root} = mountedHost()
    root.render(hostTemplate, {content: ["before", [null, stable.value], 0]})
    const element = stable.ref.current
    stable.lifecycle.dispatch!(7)
    document.flushTasks()
    root.render(hostTemplate, {content: ["after", ["optional", stable.value], 0n]})

    expect(container.textContent).toBe("afteroptionalnested:70")
    expect(stable.ref.current).toBe(element)
    expect(stable.lifecycle.setups).toBe(1)
    expect(stable.lifecycle.cleanups).toBe(0)
  })

  test("keyed-перестановка сохраняет экземпляры и удаляет только отсутствующий ключ", () => {
    const first = counter("first", "first-key")
    const second = counter("second", "second-key")
    const {container, document, root} = mountedHost()
    root.render(hostTemplate, {content: keyedComponents([first.value, second.value])})
    const firstElement = first.ref.current
    const secondElement = second.ref.current
    first.lifecycle.dispatch!(3)
    document.flushTasks()
    second.lifecycle.dispatch!(5)
    document.flushTasks()
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
    const {container, document, root} = mountedHost()
    root.render(hostTemplate, {content: [null, child.value], fallback: fallback.value})
    root.render(hostTemplate, {content: [null, false], fallback: fallback.value})

    expect(container.textContent).toBe("fallback:0")
    expect(child.ref.current).toBeNull()
    expect(child.lifecycle.cleanups).toBe(1)
    expect(fallback.lifecycle.setups).toBe(1)
  })

  test("неподдерживаемый leaf отвергается до изменения принятого дерева", () => {
    const stable = counter("stable")
    const {container, document, root} = mountedHost()
    root.render(hostTemplate, {content: [null, stable.value]})
    const element = stable.ref.current
    // @ts-expect-error Отрицательный runtime-вход также запрещён публичным типом.
    const invalid: SlotContent = {tag: "span", props: {}}

    expect(() => root.render(hostTemplate, {content: [invalid, stable.value]})).toThrow(
      "requires a primitive value",
    )
    expect(container.textContent).toBe("stable:0")
    expect(stable.ref.current).toBe(element)
    expect(stable.lifecycle.cleanups).toBe(0)
  })
})

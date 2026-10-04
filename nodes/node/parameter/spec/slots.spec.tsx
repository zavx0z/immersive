import {expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {InputEvent, MouseEvent, type HTMLInputElement} from "@zavx0z/dom"
import AuthoredParameterNode from "./slots.fixture"

test.each([
  {name: "пустые слоты", socketIds: []},
  {name: "один сокет каждой стороны", socketIds: ["first"]},
  {name: "несколько сокетов каждой стороны", socketIds: ["first", "second", "third"]},
])("$name сохраняют авторские параметры, события и обновления", async ({socketIds}) => {
  const headless = createHeadless({width: 400, height: 500})
  const inputs: unknown[] = []
  const activations: unknown[] = []
  const onInput = (value: string, event: Event) => inputs.push([value, event])
  const onSocketActivate = (id: string, event: Event) => activations.push([id, event])
  try {
    const node = await headless.render(
      <AuthoredParameterNode
        socketIds={socketIds}
        value="Первое"
        connected={false}
        collapsed={false}
        onInput={onInput}
        onSocketActivate={onSocketActivate}
      />,
    )
    const rows = node.querySelectorAll("[data-parameter-id]")
    expect([...rows].map(row => row.getAttribute("data-field-kind"))).toEqual(["text", "number", "checkbox"])
    const text = node.querySelector('[data-parameter-id="text"]')!
    const input = text.querySelector("input") as HTMLInputElement
    const sockets = text.querySelectorAll("[data-socket-id]")
    expect(sockets).toHaveLength(socketIds.length * 2)
    expect(text.querySelector('[data-parameter-sockets="left"]')!.querySelectorAll("[data-socket-id]")).toHaveLength(socketIds.length)
    expect(text.querySelector('[data-parameter-sockets="right"]')!.querySelectorAll("[data-socket-id]")).toHaveLength(socketIds.length)
    expect(node.querySelector('[data-parameter-id="number"]')!.querySelectorAll("[data-socket-id]")).toHaveLength(0)
    expect(node.querySelector('[data-parameter-id="boolean"]')!.querySelectorAll("[data-socket-id]")).toHaveLength(0)
    input.value = "Авторский ввод"
    const event = new InputEvent("input", {bubbles: true, data: "Авторский ввод", inputType: "insertText"})
    input.dispatchEvent(event)
    expect(inputs).toEqual([["Авторский ввод", event]])
    for (const socket of sockets) {
      const click = new MouseEvent("click", {bubbles: true})
      socket.dispatchEvent(click)
      expect(activations.at(-1)).toEqual([socket.getAttribute("data-socket-id"), click])
      expect(socket.ownerDocument).toBe(node.ownerDocument)
    }
    expect(activations).toHaveLength(socketIds.length * 2)
    const updated = await headless.render(
      <AuthoredParameterNode
        socketIds={socketIds}
        value="Внешнее обновление"
        connected={true}
        collapsed={true}
        onInput={onInput}
        onSocketActivate={onSocketActivate}
      />,
    )
    expect(updated).toBe(node)
    expect(updated.querySelector('[data-parameter-id="text"]')).toBe(text)
    expect(text.querySelector("input")).toBe(input)
    expect(input.value).toBe("Внешнее обновление")
    expect(text.querySelector("[data-parameter-field]")!.hasAttribute("hidden")).toBe(false)
    expect([...text.querySelectorAll("[data-socket-id]")]).toEqual([...sockets])
    expect(inputs).toHaveLength(1)
  } finally {
    await headless.dispose()
  }
}, 30_000)

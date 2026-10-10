import {describe, expect, test} from "bun:test"
import {createDocument, createDomRoot, Event} from "@zavx0z/immersive-dom"
import {components} from "./fixture.ts"

function mountedRoot() {
  const document = createDocument()
  const container = document.createElement("div")
  document.append(container)
  return {container, document, root: createDomRoot(container)}
}

describe("Compiled DOM component contract", () => {
  test("[CMP-001] Компонент использует ownerDocument и не создаёт собственный Document", () => {
    const {document, container, root} = mountedRoot()
    const documents: unknown[] = []
    try {
      root.render(components.Counter, {label: "owner", mounted: (value: unknown) => { documents.push(value) }})
      expect(documents).toEqual([document])
      expect(container.firstElementChild!.ownerDocument).toBe(document)
    } finally { root.unmount() }
  })

  test("[CMP-002] Обновление сохраняет Element и concrete hook state", () => {
    const {container, root} = mountedRoot()
    try {
      root.render(components.Counter, {label: "first"})
      const button = container.firstElementChild!
      button.dispatchEvent(new Event("click"))
      root.render(components.Counter, {label: "next"})
      expect(container.firstElementChild).toBe(button)
      expect(button.textContent).toBe("next:1")
    } finally { root.unmount() }
  })

  test("[CMP-003] Context выбирает ближайший provider и обновляет того же потребителя", () => {
    const {container, root} = mountedRoot()
    const outer = {context: components.Theme, value: "outer", parent: null}
    try {
      root.render({type: components.ContextText, props: {suffix: "one"}, context: {context: components.Theme, value: "inner", parent: outer}})
      const button = container.firstElementChild!
      button.dispatchEvent(new Event("click"))
      root.render({type: components.ContextText, props: {suffix: "two"}, context: {context: components.Theme, value: "updated", parent: outer}})
      expect(container.firstElementChild).toBe(button)
      expect(button.textContent).toBe("updated:two:1")
    } finally { root.unmount() }
  })

  test("[CMP-004] Эффект следует принятому DOM; cleanup выполняется ровно один раз", () => {
    const {container, root} = mountedRoot()
    const lifecycle = {setups: 0, cleanups: 0}
    root.render(components.Counter, {label: "effect", lifecycle})
    expect(container.textContent).toBe("effect:0")
    expect(lifecycle).toMatchObject({setups: 1, cleanups: 0})
    expect("dispatch" in lifecycle).toBeTrue()
    root.render(components.Counter, {label: "next", lifecycle})
    expect([lifecycle.setups, lifecycle.cleanups]).toEqual([1, 0])
    root.unmount()
    root.unmount()
    expect([lifecycle.setups, lifecycle.cleanups]).toEqual([1, 1])
  })

  test("[CMP-005] Unmount очищает store subscription, effects и refs", () => {
    const {container, document, root} = mountedRoot()
    let value = "first"
    const listeners = new Set<() => void>()
    const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
    root.render(components.Store, {subscribe, getSnapshot: () => value})
    expect(listeners.size).toBe(1)
    value = "next"
    for (const listener of listeners) listener()
    document.flushTasks()
    expect(container.textContent).toBe("next")
    root.unmount()
    expect(listeners.size).toBe(0)
    expect(container.childNodes).toHaveLength(0)
  })
})

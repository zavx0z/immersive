import {expect, test} from "bun:test"
import {createDocument, CustomElementRegistry, HTMLElement} from "../src/index.ts"

test("автономный элемент использует обычные свойства, события и lifecycle того же DOM", () => {
  const document = createDocument()
  const events: unknown[] = []
  class Counter extends HTMLElement {
    static observedAttributes = ["label"]
    value = 1
    connectedCallback() { events.push("connected") }
    disconnectedCallback() { events.push("disconnected") }
    attributeChangedCallback(name: string, previous: string | null, next: string | null) {
      events.push([name, previous, next])
    }
  }
  const registry = document.customElementRegistry
  registry.define("test-counter", Counter)
  const element = document.createElement("test-counter") as Counter
  expect(element).toBeInstanceOf(Counter)
  expect(element.ownerDocument).toBe(document)
  expect(element.value).toBe(1)
  element.setAttribute("label", "Первый")
  const host = document.createElement("main")
  document.append(host)
  host.append(element)
  element.setAttribute("ignored", "x")
  element.removeAttribute("label")
  element.remove()
  expect(events).toEqual([["label", null, "Первый"], "connected", ["label", "Первый", null], "disconnected"])
  expect(registry.get("test-counter")).toBe(Counter)
  expect(registry.getName(Counter)).toBe("test-counter")
  expect(new Counter().ownerDocument).toBe(document)
})

test("позднее определение сохраняет Node identity, атрибуты и готовое дерево", async () => {
  const document = createDocument()
  const element = document.createElement("late-panel")
  element.setAttribute("label", "До загрузки")
  element.append(document.createElement("span"))
  document.append(element)
  const reactions: unknown[] = []
  class Panel extends HTMLElement {
    static observedAttributes = ["label"]
    initialized = true
    attributeChangedCallback(name: string, previous: string | null, next: string | null) { reactions.push([name, previous, next]) }
    connectedCallback() { reactions.push("connected") }
  }
  const registry = document.customElementRegistry
  const waiting = registry.whenDefined("late-panel")
  expect(registry.whenDefined("late-panel")).toBe(waiting)
  registry.define("late-panel", Panel)
  expect(await waiting).toBe(Panel)
  expect(document.documentElement).toBe(element)
  expect(element).toBeInstanceOf(Panel)
  expect((element as Panel).initialized).toBe(true)
  expect(element.querySelector("span")).not.toBeNull()
  expect(reactions).toEqual([["label", null, "До загрузки"], "connected"])
})

test("перенос и adoption вызывают callbacks в порядке DOM без второго экземпляра", () => {
  const first = createDocument(), second = createDocument()
  const events: string[] = []
  class Panel extends HTMLElement {
    connectedCallback() { events.push("connected") }
    disconnectedCallback() { events.push("disconnected") }
    adoptedCallback(previous: typeof first, next: typeof second) {
      expect(previous).toBe(first)
      expect(next).toBe(second)
      events.push("adopted")
    }
  }
  first.customElementRegistry.define("movable-panel", Panel)
  const main = first.createElement("main"), target = second.createElement("main")
  first.append(main)
  second.append(target)
  const element = first.createElement("movable-panel")
  main.append(element)
  target.append(element)
  expect(events).toEqual(["connected", "disconnected", "adopted", "connected"])
  expect(element.ownerDocument).toBe(second)
  expect(element).toBeInstanceOf(Panel)
})

test("реестры документов независимы, detached candidates обновляются через upgrade", () => {
  const first = createDocument(), second = createDocument()
  const detached = first.createElement("test-panel")
  class Panel extends HTMLElement {}
  first.customElementRegistry.define("test-panel", Panel)
  expect(detached).not.toBeInstanceOf(Panel)
  first.customElementRegistry.upgrade(detached)
  expect(detached).toBeInstanceOf(Panel)
  expect(second.createElement("test-panel")).not.toBeInstanceOf(Panel)
  const foreign = second.createElement("test-panel")
  first.customElementRegistry.upgrade(foreign)
  expect(foreign).not.toBeInstanceOf(Panel)
  expect(foreign.customElementRegistry).toBe(second.customElementRegistry)
  const registry = new CustomElementRegistry()
  const shared = createDocument({customElementRegistry: registry})
  registry.define("shared-panel", class extends HTMLElement {})
  expect(shared.createElement("shared-panel")).toBeInstanceOf(registry.get("shared-panel")!)
})

test("реакции подключения входят в одну DOM-транзакцию и не публикуют промежуточные деревья", () => {
  const document = createDocument()
  class Panel extends HTMLElement {
    connectedCallback() { this.append(this.ownerDocument!.createElement("span")) }
  }
  document.customElementRegistry.define("batch-panel", Panel)
  const root = document.createElement("main")
  document.append(root)
  const snapshots: number[] = []
  document.subscribeMutations(() => snapshots.push(root.querySelectorAll("span").length))
  document.transaction(() => {
    for (let index = 0; index < 10; index++) root.append(document.createElement("batch-panel"))
  })
  expect(snapshots).toEqual([10])
})

test("недопустимые определения отклоняются без перезаписи существующего класса", async () => {
  const registry = createDocument().customElementRegistry
  class Panel extends HTMLElement {}
  expect(() => registry.define("panel", Panel)).toThrow("Invalid custom element name")
  expect(() => registry.define("font-face", Panel)).toThrow("Invalid custom element name")
  registry.define("test-panel", Panel)
  expect(() => registry.define("test-panel", class extends HTMLElement {})).toThrow("already defined")
  expect(() => registry.define("other-panel", Panel)).toThrow("already defined")
  expect(registry.get("test-panel")).toBe(Panel)
  await expect(registry.whenDefined("bad")).rejects.toThrow("Invalid custom element name")
})

test("ошибка constructor не ломает DOM-вставку и не останавливает upgrade соседей", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "reportError")
  const errors: unknown[] = []
  Object.defineProperty(globalThis, "reportError", {configurable: true, value: (error: unknown) => errors.push(error)})
  try {
    const document = createDocument()
    const first = document.createElement("broken-panel")
    const second = document.createElement("broken-panel")
    const parent = document.createElement("main")
    parent.append(first, second)
    document.append(parent)
    let constructions = 0
    class Broken extends HTMLElement {
      constructor() { super(); constructions++; throw new Error("constructor failed") }
    }
    document.customElementRegistry.define("broken-panel", Broken)
    expect(errors).toHaveLength(2)
    expect(parent.childNodes).toEqual([first, second])
    document.customElementRegistry.upgrade(parent)
    expect(constructions).toBe(2)
    const failed = document.createElement("broken-panel")
    expect(errors).toHaveLength(3)
    parent.append(failed)
    expect(parent.lastChild).toBe(failed)
    expect(failed).not.toBeInstanceOf(Broken)
  } finally {
    if (original) Object.defineProperty(globalThis, "reportError", original)
    else Reflect.deleteProperty(globalThis, "reportError")
  }
})

test("reentrant attribute callbacks публикуют одну полную DOM-транзакцию в порядке изменений", () => {
  const document = createDocument()
  const calls: unknown[] = []
  class Panel extends HTMLElement {
    static observedAttributes = ["value"]
    attributeChangedCallback(_name: string, previous: string | null, next: string | null) {
      calls.push([previous, next])
      if (next === "first") this.setAttribute("value", "second")
    }
  }
  document.customElementRegistry.define("reentrant-panel", Panel)
  const panel = document.createElement("reentrant-panel")
  document.append(panel)
  const batches: unknown[] = []
  document.subscribeMutations(batch => batches.push({
    value: panel.getAttribute("value"),
    records: batch.records.map(record => record.type === "attributes" ? [record.oldValue, record.newValue] : record.type),
  }))
  panel.setAttribute("value", "first")
  expect(calls).toEqual([[null, "first"], ["first", "second"]])
  expect(batches).toEqual([{value: "second", records: [[null, "first"], ["first", "second"]]}])
})

test("ошибки lifecycle не останавливают реакции соседей и собственные disconnect", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "reportError")
  const errors: unknown[] = []
  Object.defineProperty(globalThis, "reportError", {configurable: true, value: (error: unknown) => errors.push(error)})
  try {
    const document = createDocument()
    const calls: string[] = []
    class Panel extends HTMLElement {
      connectedCallback() { calls.push(this.id); if (this.id === "first") throw new Error("connected failed") }
      disconnectedCallback() { calls.push(`removed:${this.id}`) }
    }
    document.customElementRegistry.define("error-panel", Panel)
    const root = document.createElement("main")
    document.append(root)
    const first = document.createElement("error-panel"), second = document.createElement("error-panel")
    first.id = "first"
    second.id = "second"
    root.append(first, second)
    root.replaceChildren()
    expect(calls).toEqual(["first", "second", "removed:first", "removed:second"])
    expect(errors).toHaveLength(1)
  } finally {
    if (original) Object.defineProperty(globalThis, "reportError", original)
    else Reflect.deleteProperty(globalThis, "reportError")
  }
})


test("ошибки upgrade до super и смены prototype помечают только кандидата и не повторяются", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "reportError")
  const errors: unknown[] = []
  Object.defineProperty(globalThis, "reportError", {configurable: true, value: (error: unknown) => errors.push(error)})
  try {
    const document = createDocument()
    const main = document.createElement("main")
    const frozen = document.createElement("upgrade-panel")
    const early = document.createElement("early-panel")
    const working = document.createElement("upgrade-panel")
    main.append(frozen, early, working)
    document.append(main)
    Object.preventExtensions(frozen)
    let attempts = 0
    class Early extends HTMLElement {
      constructor() {
        if (++attempts) throw new Error("before super")
        super()
      }
    }
    class Panel extends HTMLElement {}
    document.customElementRegistry.define("early-panel", Early)
    document.customElementRegistry.define("upgrade-panel", Panel)
    expect(working).toBeInstanceOf(Panel)
    expect(errors).toHaveLength(2)
    document.customElementRegistry.upgrade(main)
    expect(attempts).toBe(1)
    expect(errors).toHaveLength(2)
    expect(main.childNodes).toEqual([frozen, early, working])
  } finally {
    if (original) Object.defineProperty(globalThis, "reportError", original)
    else Reflect.deleteProperty(globalThis, "reportError")
  }
})


test("native factories не подменяются registry definition ни до, ни после подключения Document", () => {
  class Panel extends HTMLElement {}
  const factories = {"x-native": (document: ReturnType<typeof createDocument>) => new HTMLElement(document, "x-native")}
  const document = createDocument({elementFactories: factories})
  expect(() => document.customElementRegistry.define("x-native", Panel)).toThrow("native factory")
  expect(document.customElementRegistry.get("x-native")).toBeUndefined()
  expect(document.createElement("x-native")).not.toBeInstanceOf(Panel)
  expect(() => document.customElementRegistry.define("vector-path", Panel)).toThrow("native factory")
  document.customElementRegistry.define("x-pane", Panel)
  expect(document.createElement("x-pane")).toBeInstanceOf(Panel)
  const registry = new CustomElementRegistry()
  registry.define("x-native", class extends HTMLElement {})
  expect(() => createDocument({elementFactories: factories, customElementRegistry: registry})).toThrow("native factory")
  const compatible = createDocument({customElementRegistry: registry})
  expect(compatible.createElement("x-native")).toBeInstanceOf(registry.get("x-native")!)
})

test("shared registry учитывает native factories всех Documents и reentrant association во время define", () => {
  const registry = new CustomElementRegistry()
  createDocument({customElementRegistry: registry})
  createDocument({customElementRegistry: registry, elementFactories: {"x-native": document => new HTMLElement(document, "x-native")}})
  expect(() => registry.define("x-native", class extends HTMLElement {})).toThrow("native factory")
  class Reentrant extends HTMLElement {
    static get observedAttributes() {
      createDocument({customElementRegistry: registry, elementFactories: {"x-reentrant": document => new HTMLElement(document, "x-reentrant")}})
      return []
    }
    attributeChangedCallback() {}
  }
  expect(() => registry.define("x-reentrant", Reentrant)).toThrow("native factory")
  expect(registry.get("x-reentrant")).toBeUndefined()
})

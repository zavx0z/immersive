/**
Монтирование самостоятельного DOM-конструктора в принадлежащее вызывающему место.
Корень хранит только фактический Element или диапазон; обновление и очистка
исполняются самим сгенерированным объектом. Hooks и программа bindings здесь
не выполняются.
Один Document, Element или DocumentFragment допускает один живой DOMRoot.
Независимые контейнеры одного Document имеют независимое владение. unmount
освобождает контейнер и при ошибке очистки компонента.

@packageDocumentation
*/
import {Document} from "../src/document.ts"
import {captureDomOrigins} from "../src/dom-placement.ts"
import {DocumentFragment} from "../src/document-fragment.ts"
import {domComponentConstructorBrand, type DOMComponent, type DOMComponentConstructor} from "../src/dom-component.ts"
import {Element} from "../src/element.ts"
import {DOMGroup} from "../src/dom-group.ts"
import type {Node} from "../src/node.ts"
import {domError} from "../src/internal/errors.ts"
import {readDocumentCompiledStyleSheets} from "../src/compiled-style-sheet.ts"
import type {DOMRoot, DOMRenderOptions} from "../contract/root.ts"

export type {DOMConstruction} from "../src/dom-component.ts"
export type {DOMRoot, DOMRenderOptions} from "../contract/root.ts"
import type {DOMConstruction} from "../src/dom-component.ts"

const roots = new WeakMap<Element | DocumentFragment | Document, DOMRoot>()

/** Узнаёт constructor готового DOM-компонента, не загружая авторскую библиотеку. */
export function isDOMComponentConstructor(value: unknown): value is DOMComponentConstructor<unknown> {
  return typeof value === "function" && (value as unknown as Record<symbol, unknown>)[domComponentConstructorBrand] === true
}

/** Повторный render того же constructor/key изменяет прежний DOM-объект. */
export function createDomRoot(parent: Element | DocumentFragment | Document): DOMRoot {
  if (!(parent instanceof Document) && !(parent instanceof Element) && !(parent instanceof DocumentFragment)) {
    throw new TypeError("createDomRoot expects an @zavx0z/immersive-dom Document, Element or DocumentFragment")
  }
  const document = parent instanceof Document ? parent : parent.ownerDocument
  if (!(document instanceof Document)) throw new TypeError("The DOM root container has no ownerDocument")
  if (roots.has(parent)) throw new Error("This container already has a live DOM root")
  let current: DOMComponent<unknown> | null = null
  let constructor: DOMComponentConstructor<unknown> | null = null
  let key: string | number | null = null
  let active = true
  let placed = false
  let placementParent: Node = parent
  let placementBefore: Node | null = null
  const rememberPlacement = (component: DOMComponent<unknown>): void => {
    if (component.parentNode) {
      placementParent = component.parentNode
      placementBefore = component.nextSibling
      placed = true
    }
  }
  const root: DOMRoot = {
    get current() { return current },
    render(input: unknown, props?: unknown, options: DOMRenderOptions = {}) {
      if (!active) throw new Error("DOM root has been unmounted")
      if (input === null) {
        const previous = current
        if (previous) rememberPlacement(previous)
        current = null
        constructor = null
        key = null
        document.transaction(() => previous?.dispose())
        return
      }
      const value = (typeof input === "function" ? {type: input, props, ...options} : input) as DOMConstruction | null
      if (value === null || typeof value !== "object") throw new TypeError("DOM root requires a DOM construction value")
      if (!isDOMComponentConstructor(value.type)) throw new TypeError("DOM root requires a compiled DOM constructor")
      const nextKey = value.key ?? null
      if (nextKey !== null && typeof nextKey !== "string" && typeof nextKey !== "number") throw new TypeError("DOM component key must be a string or number")
      if (current && constructor === value.type && Object.is(key, nextKey)) {
        document.transaction(() => current!.update(value.props, value.content, value.context))
        return
      }
      document.transaction(() => {
        const previous = current
        const previousParent = previous?.parentNode
        const target = previousParent ?? placementParent
        const before = previousParent
          ? previous instanceof DOMGroup ? previous.insertionNodes[0]! : previous
          : placementBefore?.parentNode === target ? placementBefore : null
        const restore = value.content === undefined ? undefined : captureDomOrigins(document, value.content)
        let next: DOMComponent<unknown> | undefined
        try {
          next = new value.type(document, value.props, value.content, value.context)
          if (previousParent && previous instanceof Element) previousParent.replaceChild(next, previous)
          else if (previousParent && previous instanceof DOMGroup) {
            previous.replaceChildren(next)
            previousParent.insertBefore(next, previous.insertionNodes[0]!)
          } else if (!placed) parent.replaceChildren(next)
          else target.insertBefore(next, before)
        } catch (error) {
          try { next?.dispose() } finally { restore?.restore() }
          throw error
        }
        current = next
        rememberPlacement(next)
        constructor = value.type as DOMComponentConstructor<unknown>
        key = nextKey
        try { previous?.dispose() } finally { restore?.restoreFocus() }
      })
    },
    flush() { document.flushTasks() },
    batch: callback => document.transaction(callback),
    moveTo(destination, before = null) {
      if (!active) throw new Error("DOM root has been unmounted")
      if (!(destination instanceof Document) && !(destination instanceof Element) && !(destination instanceof DocumentFragment)) {
        throw new TypeError("DOM root moveTo expects a Document, Element or DocumentFragment")
      }
      const nextDocument = destination instanceof Document ? destination : destination.ownerDocument
      if (nextDocument !== document) throw new TypeError("DOM root placement must belong to the same Document")
      if (before !== null && before.parentNode !== destination) throw domError("NotFoundError", "DOM root placement reference must belong to its parent")
      document.transaction(() => {
        if (current instanceof DOMGroup) current.moveTo(destination, before)
        else if (current) destination.insertBefore(current, before)
        placementParent = destination
        placementBefore = before
        placed = true
      })
    },
    readStyleSheets: () => readDocumentCompiledStyleSheets(document),
    unmount() {
      if (!active) return
      const previous = current
      current = null
      constructor = null
      active = false
      try { document.transaction(() => previous?.dispose()) } finally { roots.delete(parent) }
    },
  }
  roots.set(parent, root)
  return root
}

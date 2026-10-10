/**
Адресованные операции над существующими DOM-узлами.
HTML и сгенерированный код используют одни нормализацию значений и DOM listeners.
Состояние компонентов, hooks и выполнение программы bindings сюда не входят.

@packageDocumentation
*/
import {Comment} from "../src/comment.ts"
import {DOMGroup} from "../src/dom-group.ts"
import {DocumentFragment} from "../src/document-fragment.ts"
import {Element} from "../src/element.ts"
import {HTMLElement} from "../src/html-element.ts"
import {HTMLInputElement} from "../src/html-input-element.ts"
import {HTMLButtonElement} from "../src/html-button-element.ts"
import {HTMLFieldSetElement} from "../src/html-field-set-element.ts"
import {HTMLImageElement} from "../src/html-image-element.ts"
import {HTMLLabelElement} from "../src/html-label-element.ts"
import {HTMLMeterElement} from "../src/html-meter-element.ts"
import {HTMLProgressElement} from "../src/html-progress-element.ts"
import {HTMLTableCellElement} from "../src/html-table-cell-element.ts"
import {HTMLVectorPathElement} from "../src/html-vector-path-element.ts"
import {HTMLVideoElement} from "../src/html-video-element.ts"
import {HTMLOptionElement} from "../src/html-option-element.ts"
import {HTMLSelectElement} from "../src/html-select-element.ts"
import {HTMLTextAreaElement} from "../src/html-text-area-element.ts"
import {Node} from "../src/node.ts"
import {Text} from "../src/text.ts"
import type {Document} from "../src/document.ts"
import type {EventListener} from "../src/event-target.ts"
import type {PropertyOperation, DomPatch, DomNodes, CompiledStyleValue, ResolvedStyleValue} from "../contract/bindings.ts"
import {nativePropertyAttribute} from "../src/internal/native-properties.ts"

export type {PropertyOperation, DomPatch, DomNodes, CompiledStyleValue, ResolvedStyleValue} from "../contract/bindings.ts"
const nativeReflectionPrototypes = new Set<object>([
  Element.prototype, HTMLElement.prototype, HTMLInputElement.prototype, HTMLButtonElement.prototype,
  HTMLFieldSetElement.prototype, HTMLImageElement.prototype, HTMLLabelElement.prototype, HTMLMeterElement.prototype,
  HTMLProgressElement.prototype, HTMLTableCellElement.prototype, HTMLVectorPathElement.prototype, HTMLVideoElement.prototype,
  HTMLOptionElement.prototype, HTMLSelectElement.prototype, HTMLTextAreaElement.prototype,
])
export {markDomAnchor, isDomAnchor, createDomAnchor} from "../src/internal/dom-anchor.ts"

/** Один prepare/apply/rollback путь изменения существующего DOM-значения. */
export function prepareDomOperation(operation: PropertyOperation): DomPatch | null {
  const previous = operation.current()
  if (Object.is(previous, operation.next)) return null
  return {apply: () => operation.write(operation.next), rollback: () => operation.write(previous)}
}
export function applyDomOperation(operation: PropertyOperation): void { prepareDomOperation(operation)?.apply() }
export function prepareTextOperation(target: Text, next: string): DomPatch | null {
  const previous = target.data
  if (previous === next) return null
  return {apply: () => { target.data = next }, rollback: () => { target.data = previous }}
}

/** Читает текущие узлы Fragment; retention принадлежит конкретному получателю. */
export function snapshotDomNodes(value: DomNodes): readonly Node[] {
  if (Array.isArray(value)) return Object.freeze(value.flatMap(node => [...snapshotDomNodes(node)]))
  if (value instanceof DOMGroup) return value.insertionNodes
  if (!(value instanceof Node)) throw new TypeError("DOM content requires real Nodes")
  if (value instanceof DocumentFragment) {
    return Object.freeze([...value.childNodes])
  }
  if (value.nodeType === Node.DOCUMENT_NODE) throw new TypeError("A Document cannot be child content")
  return [value]
}

export function attributeOperation(target: Element, name: string, value: unknown): PropertyOperation {
  return {current: () => target.getAttribute(name), next: attributeValue(value, name),
    write(next) {
      if (next === null) target.removeAttribute(name)
      else target.setAttribute(name, next as string)
    },
  }
}

/** Один стабильный listener; замена значения не перевешивает DOM-подписку. */
export class DomEventBinding {
  private handler: EventListener | null = null
  private readonly listener: EventListener
  constructor(
    private readonly target: Element,
    private readonly type: string,
    private readonly capture = false,
    dispatch: (invoke: () => void) => void = invoke => invoke(),
  ) {
    this.listener = event => {
      const handler = this.handler
      if (!handler) return
      dispatch(() => {
        if (typeof handler === "function") handler.call(this.target, event)
        else handler.handleEvent(event)
      })
    }
    target.addEventListener(type, this.listener, {capture})
  }
  prepare(value: unknown, allowObject = true): DomPatch | null {
    const next = value == null || (allowObject && value === false) ? null : value
    if (next !== null && typeof next !== "function" && !(allowObject && typeof next === "object" &&
      "handleEvent" in next && typeof next.handleEvent === "function")) {
      throw new TypeError("An event binding requires a listener or null")
    }
    if (next === this.handler) return null
    const previous = this.handler
    return {apply: () => { this.handler = next as EventListener | null }, rollback: () => { this.handler = previous }}
  }
  dispose(): void {
    this.target.removeEventListener(this.type, this.listener, {capture: this.capture})
    this.handler = null
  }
}

/** Переносит либо удаляет тот же включительный диапазон, не копируя его узлы. */
export function moveDomRange(start: Node, end: Node, parent: Node, before: Node | null): void {
  let current: Node | null = start
  while (current) {
    const next: Node | null = current.nextSibling
    parent.insertBefore(current, before)
    if (current === end) return
    current = next
  }
}
export function removeDomRange(start: Node, end: Node): void {
  const parent = start.parentNode
  if (!parent || end.parentNode !== parent) return
  let current: Node | null = start
  while (current) {
    const next: Node | null = current.nextSibling
    parent.removeChild(current)
    if (current === end) return
    current = next
  }
}

export function propertyOperation(target: Element, name: string, value: unknown, explicit = false): PropertyOperation {
  if (explicit) return {current: () => Reflect.get(target, name), next: value, write: next => { Reflect.set(target, name, next) }}
  if (name === "style") {
    throw new TypeError("Style values require a bindStyle binding")
  }
  if (name === "value" && (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLOptionElement
  )) {
    const next = value === null || value === undefined ? "" : String(value)
    return {current: () => target.value, next, write: source => { target.value = source as string }}
  }
  if (name === "checked" && target instanceof HTMLInputElement) {
    const next = Boolean(value)
    return {current: () => target.checked, next, write: source => { target.checked = source as boolean }}
  }
  if (name === "indeterminate" && target instanceof HTMLInputElement) {
    const next = Boolean(value)
    return {
      current: () => target.indeterminate,
      next,
      write: source => { target.indeterminate = source as boolean }
    }
  }
  if (name === "selected" && target instanceof HTMLOptionElement) {
    const next = Boolean(value)
    return {current: () => target.selected, next, write: source => { target.selected = source as boolean }}
  }
  if (name === "selectedIndex" && target instanceof HTMLSelectElement) {
    const next = Number(value)
    if (!Number.isFinite(next)) throw new TypeError("selectedIndex must be a finite number")
    return {
      current: () => target.selectedIndex,
      next,
      write: source => { target.selectedIndex = source as number }
    }
  }
  if (name === "tabIndex" && target instanceof HTMLElement) {
    const next = Number(value)
    if (!Number.isFinite(next)) throw new TypeError("tabIndex must be a finite number")
    return {current: () => target.tabIndex, next, write: source => { target.tabIndex = source as number }}
  }
  const attributeName = name === "className" ? "class" : name
  return attributeOperation(target, attributeName, value)
}

export function attributeValue(value: unknown, name: string): string | null {
  if (value === null || value === undefined || value === false) return null
  if (value === true) return ""
  if (
    typeof value === "string" || typeof value === "number" || typeof value === "bigint"
  ) return String(value)
  throw new TypeError(`Host property ${name} requires a primitive value`)
}

export function hasPropertySetter(target: Element, name: string): boolean {
  for (let prototype: object | null = target; prototype !== null; prototype = Object.getPrototypeOf(prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name)
    if (descriptor !== undefined) return typeof descriptor.set === "function"
  }
  return false
}

/**
Доказывает, какое native поле действительно изменяет обычный binding.
Наличие setter само по себе не доказывает attribute transport. null оставляет
значение входом получателя, не объявляя вторую authority над native полем.
*/
export function nativePropertyForBinding(target: Element, name: string): string | null {
  if (!(target instanceof HTMLElement)) return hasPropertySetter(target, name) ? name : null
  if (name === "value" && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target instanceof HTMLOptionElement)) return name
  if ((name === "checked" || name === "indeterminate") && target instanceof HTMLInputElement) return name
  if (name === "selected" && target instanceof HTMLOptionElement) return name
  if (name === "selectedIndex" && target instanceof HTMLSelectElement || name === "tabIndex") return name
  const attribute = name === "className" ? "class" : name.toLowerCase()
  if (nativePropertyAttribute(name) !== attribute) return null
  for (let prototype: object | null = target; prototype; prototype = Object.getPrototypeOf(prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name)
    if (descriptor) return nativeReflectionPrototypes.has(prototype) && typeof descriptor.set === "function" ? name : null
  }
  return null
}

export function textValue(value: unknown): string {
  if (value === null || value === undefined || typeof value === "boolean") return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value)
  }
  throw new TypeError("A compiled text binding requires a primitive value")
}

export function resolveStyleValue(value: CompiledStyleValue): ResolvedStyleValue {
  const fragments: string[] = []
  visitStyleValue(value, fragments)
  const cssText = fragments.length === 0 ? null : fragments.join("; ")
  return Object.freeze({
    cssText,
    signature: cssText ?? ""
  })
}

function visitStyleValue(value: CompiledStyleValue, fragments: string[]): void {
  if (value === null || value === undefined || value === false) return
  if (Array.isArray(value)) {
    for (const entry of value) visitStyleValue(entry, fragments)
    return
  }
  if (typeof value !== "string") {
    throw new TypeError(
      "A compiled style binding accepts CSS strings, false, null, undefined, or nested arrays"
    )
  }
  const cssText = value.trim().replace(/;+$/, "")
  if (cssText.length > 0) fragments.push(cssText)
}

/** Подготавливает обычный style attribute тем же путём, что HTML и сгенерированный DOM. */
export function styleOperation(target: Element, value: CompiledStyleValue): PropertyOperation {
  return attributeOperation(target, "style", resolveStyleValue(value).cssText)
}

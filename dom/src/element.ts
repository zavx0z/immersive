import {readElementBoundingClientRect, readElementLayoutRect, type DOMRectReadOnly, type DOMRect, type ElementGeometryTarget} from "../geometry.ts"
import type {Document} from "./document.ts"
import {parseFragment, serializeFragment} from "./html-fragment.ts"
import {customElementAttributeChanged, customRegistryFor, isCustomElementHost} from "./internal/custom-elements.ts"
import type {CustomElementRegistry} from "./custom-elements.ts"
import {requestElementFullscreen, type FullscreenOptions} from "./fullscreen.ts"
import {getClassList} from "./dom-token-list.ts"
import type {DOMTokenList} from "./dom-token-list.ts"
import type {AttributeMutation} from "./mutation.ts"
import {Node} from "./node.ts"
import type {NodeOrString} from "./node.ts"
import type {NodeList} from "./node-list.ts"
import {requestElementScrollIntoView, type ScrollIntoViewOptions} from "../scroll-into-view.ts"
import {
  hasElementPointerCapture,
  releaseElementPointerCapture,
  setElementPointerCapture
} from "./pointer-capture.ts"
import {
  closestMatch,
  matchesSelector,
  queryAll,
  queryFirst
} from "./selectors.ts"

function normalizeAttributeName(name: string): string {
  return String(name).replace(/[A-Z]/g, character => character.toLowerCase())
}

export class Element extends Node {
  get customElementRegistry(): CustomElementRegistry | null {
    return customRegistryFor(this) as CustomElementRegistry | null ?? this.ownerDocument?.customElementRegistry ?? null
  }
  requestFullscreen(options?: FullscreenOptions): Promise<void> {
    return requestElementFullscreen(this, options)
  }

  readonly localName: string
  readonly tagName: string
  private attributeValues: Map<string, string> | null = null

  constructor(ownerDocument: Document, localName: string) {
    const normalizedName = String(localName).toLowerCase()
    super(ownerDocument, Node.ELEMENT_NODE, normalizedName.toUpperCase())
    this.localName = normalizedName
    this.tagName = normalizedName.toUpperCase()
  }

  get children(): readonly Element[] {
    return this.childNodes.filter((node): node is Element => node.nodeType === Node.ELEMENT_NODE)
  }

  get childElementCount(): number {
    return this.children.length
  }

  get firstElementChild(): Element | null {
    return this.children[0] ?? null
  }

  get lastElementChild(): Element | null {
    return this.children.at(-1) ?? null
  }

  get id(): string {
    return this.getAttribute("id") ?? ""
  }

  set id(value: string) {
    this.setAttribute("id", value)
  }

  get className(): string {
    return this.getAttribute("class") ?? ""
  }

  set className(value: string) {
    this.setAttribute("class", value)
  }

  /**
  Отражает [атрибут slot](https://dom.spec.whatwg.org/#dom-element-slot).
  Распределение содержимого принадлежит принимающему компоненту.
  */
  get slot(): string { return this.getAttribute("slot") ?? "" }
  set slot(value: string) { this.setAttribute("slot", value) }

  get classList(): DOMTokenList {
    return getClassList(this)
  }

  scrollIntoView(options?: boolean | ScrollIntoViewOptions): void {
    requestElementScrollIntoView(this, options)
  }

  /**
  Returns a fresh viewport-relative border-box snapshot, including transforms
  and scrolling. Elements without a rendered CSS box return an empty rectangle.
  Geometry is resolved by the attached Renderer; this method does not parse CSS.
  */
  getBoundingClientRect(): DOMRect {
    if (!(this instanceof Element)) throw new TypeError("Illegal Element invocation")
    return readElementBoundingClientRect(this)
  }

  /** Дробная локальная border-box рамка до transforms/projection; null без готового бокса. */
  getLayoutRect(relativeTo?: ElementGeometryTarget): DOMRectReadOnly | null {
    if (!(this instanceof Element)) throw new TypeError("Illegal Element invocation")
    return readElementLayoutRect(this, relativeTo)
  }

  hasAttributes(): boolean {
    return (this.attributeValues?.size ?? 0) > 0
  }

  hasAttribute(name: string): boolean {
    return this.attributeValues?.has(normalizeAttributeName(name)) ?? false
  }

  getAttribute(name: string): string | null {
    return this.attributeValues?.get(normalizeAttributeName(name)) ?? null
  }

  getAttributeNames(): string[] {
    return this.attributeValues ? [...this.attributeValues.keys()] : []
  }

  setAttribute(name: string, value: string): void {
    const attributeName = normalizeAttributeName(name)
    const attributeValues = this.attributeValues ??= new Map()
    const oldValue = attributeValues.get(attributeName) ?? null
    const newValue = String(value)
    attributeValues.set(attributeName, newValue)
    this.recordAttributeMutation(attributeName, oldValue, newValue)
  }

  removeAttribute(name: string): void {
    const attributeName = normalizeAttributeName(name)
    const oldValue = this.attributeValues?.get(attributeName)
    if (oldValue === undefined) return
    this.attributeValues!.delete(attributeName)
    if (this.attributeValues!.size === 0) this.attributeValues = null
    this.recordAttributeMutation(attributeName, oldValue, null)
  }

  toggleAttribute(name: string, force?: boolean): boolean {
    const attributeName = normalizeAttributeName(name)
    const present = this.hasAttribute(attributeName)
    if (present && force !== true) {
      this.removeAttribute(attributeName)
      return false
    }
    if (!present && force !== false) {
      this.setAttribute(attributeName, "")
      return true
    }
    return present
  }

  setPointerCapture(pointerId: number): void {
    setElementPointerCapture(this, pointerId)
  }

  releasePointerCapture(pointerId: number): void {
    releaseElementPointerCapture(this, pointerId)
  }

  hasPointerCapture(pointerId: number): boolean {
    return hasElementPointerCapture(this, pointerId)
  }

  append(...nodes: NodeOrString[]): void {
    this.appendNodes(...nodes)
  }

  prepend(...nodes: NodeOrString[]): void {
    this.prependNodes(...nodes)
  }

  replaceChildren(...nodes: NodeOrString[]): void {
    this.replaceChildrenNodes(...nodes)
  }

  before(...nodes: NodeOrString[]): void {
    this.beforeNodes(...nodes)
  }

  after(...nodes: NodeOrString[]): void {
    this.afterNodes(...nodes)
  }

  replaceWith(...nodes: NodeOrString[]): void {
    this.replaceWithNodes(...nodes)
  }

  remove(): void {
    this.removeNode()
  }

  matches(selectors: string): boolean {
    return matchesSelector(this, selectors)
  }

  closest(selectors: string): Element | null {
    return closestMatch(this, selectors)
  }

  querySelector(selectors: string): Element | null {
    return queryFirst(this, selectors)
  }

  querySelectorAll(selectors: string): NodeList<Element> {
    return queryAll(this, selectors)
  }

  get innerHTML(): string {
    return serializeFragment(this)
  }

  set innerHTML(value: string | null) {
    const document = this.ownerDocument
    if (!document) throw new TypeError("HTML fragment target has no ownerDocument")
    document.transaction(() => this.replaceChildren(parseFragment(document, value === null ? "" : String(value), this)))
  }

  override get textContent(): string {
    return this.descendantTextContent()
  }

  override set textContent(value: string | null) {
    this.replaceAllWithText(value)
  }

  private recordAttributeMutation(
    attributeName: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (isCustomElementHost(this)) {
      const document = this.ownerDocument
      const record = () => {
        customElementAttributeChanged(this, attributeName, oldValue, newValue)
        this.publishAttributeMutation(attributeName, oldValue, newValue)
      }
      if (document) document.transaction(record)
      else record()
      return
    }
    this.publishAttributeMutation(attributeName, oldValue, newValue)
  }

  private publishAttributeMutation(attributeName: string, oldValue: string | null, newValue: string | null): void {
    const document = this.ownerDocument
    if (!document || !this.isConnected) return
    const mutation: AttributeMutation = Object.freeze({
      type: "attributes",
      target: this,
      attributeName,
      oldValue,
      newValue
    })
    document.recordMutation(mutation)
  }
}

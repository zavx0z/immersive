import {
  readCustomState, trackCustomState, failCustomState, visitCustomLifecycle,
  enqueueCustomLifecycle, beginDOMReactions, endDOMReactions, flushDOMReactions,
  reportLifecycleError
} from "./lifecycle.ts"
import type {Document} from "../document.ts"
import type {Element} from "../element.ts"
import type {HTMLElement} from "../html-element.ts"
import type {Node} from "../node.ts"

export const hasNativeElementFactory = Symbol("hasNativeElementFactory")

export const nativeHTMLElementNames = new Set([
  "button", "div", "fieldset", "h1", "h2", "h3", "h4", "h5", "h6", "input", "img", "video", "label", "li", "legend", "meter", "option",
  "p", "progress", "select", "span", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "tr", "ul"
])
export const customizedBuiltinNames = new Set([
  "a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "blockquote", "body", "br", "button",
  "canvas", "caption", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt",
  "em", "embed", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup",
  "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark", "menu", "meta",
  "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby",
  "s", "samp", "script", "search", "section", "select", "slot", "small", "source", "span", "strong", "style", "sub", "summary", "sup",
  "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "u", "ul", "var", "video", "wbr"
])
export type CustomConstructor = new (document: Document) => HTMLElement
export type CustomCallbacks = Readonly<{
  connectedCallback?: (this: HTMLElement) => void
  disconnectedCallback?: (this: HTMLElement) => void
  adoptedCallback?: (this: HTMLElement, previous: Document, next: Document) => void
  attributeChangedCallback?: (this: HTMLElement, name: string, previous: string | null, next: string | null, namespace: null) => void
}>

export interface CustomDefinition {
  readonly registry: object
  readonly name: string
  readonly localName: string
  readonly constructor: CustomConstructor
  readonly observed: ReadonlySet<string>
  readonly callbacks: CustomCallbacks
}

export interface CustomConstruction {
  readonly document: Document
  readonly definition: CustomDefinition
  readonly existing?: HTMLElement
  element?: HTMLElement
}

const constructors = new WeakMap<Function, () => CustomConstruction>()
const constructionStack: CustomConstruction[] = []

export function registerCustomConstructor(constructor: CustomConstructor, resolve: () => CustomConstruction) {
  if (!constructors.has(constructor)) constructors.set(constructor, resolve)
}

export function customConstruction(constructor: Function): CustomConstruction {
  const current = constructionStack.at(-1)
  if (current?.definition.constructor === constructor) {
    if (current.element) throw new TypeError("Custom element constructor called super twice")
    return current
  }
  const resolve = constructors.get(constructor)
  if (!resolve) throw new TypeError("Illegal custom element constructor")
  return resolve()
}

export function activeCustomConstruction(constructor: Function): CustomConstruction | undefined {
  const context = constructionStack.at(-1)
  return context?.definition.constructor === constructor ? context : undefined
}
export function customElementIsValue(element: Element): string | null { return readCustomState(element)?.is ?? null }
export function customElementDefinitionName(element: Element): string {
  return readCustomState(element)?.is ?? element.localName
}

export function constructCustomElement(context: CustomConstruction): HTMLElement {
  constructionStack.push(context)
  try {
    const element = new context.definition.constructor(context.document)
    if (element !== context.element) throw new TypeError("Custom element constructor returned another object")
    if (!context.existing && (element.parentNode !== null || element.hasChildNodes() || element.hasAttributes()))
      throw new TypeError("Custom element constructor must not create attributes or children")
    const state = readCustomState(element)!
    state.status = "custom"
    return element
  } catch (error) {
    const element = context.existing ?? context.element
    if (element) failCustomElementUpgrade(element)
    throw error
  } finally {
    constructionStack.pop()
  }
}

export function initializeCustomElement(element: HTMLElement, context: CustomConstruction): HTMLElement {
  const target = context.existing ?? element
  context.element = target
  trackCustomElement(target, context.definition.registry, () => {}, context.definition.localName === context.definition.name ? null : context.definition.name)
  const state = readCustomState(target)!
  state.definition = context.definition
  state.status = constructionStack.at(-1) === context ? "precustomized" : "custom"
  return target
}

export function trackCustomElement(element: Element, registry: object, upgrade: () => void, is: string | null = null) {
  trackCustomState(element, {registry, status: "undefined", upgrade, is})
}

export const failCustomElementUpgrade = failCustomState

export function canUpgradeCustomElement(element: Element, registry: object) {
  const state = readCustomState(element)
  return state?.status === "undefined" && state.registry === registry
}

export function isCustomElementHost(node: Node): node is HTMLElement {
  const state = readCustomState(node as Element)
  return state?.status === "custom" || state?.status === "precustomized"
}

export function customRegistryFor(element: Element): object | null { return readCustomState(element)?.registry ?? null }

export const visitCustomElements = visitCustomLifecycle

export function customElementAttributeChanged(element: Element, name: string, previous: string | null, next: string | null) {
  const state = readCustomState(element)
  if (state?.status !== "custom" || !state.definition?.observed.has(name)) return
  enqueueCustomReaction(element as HTMLElement, "attributeChangedCallback", name, previous, next, null)
  flushCustomReactions()
}

export const enqueueCustomReaction = enqueueCustomLifecycle
export const beginCustomReactions = beginDOMReactions
export const endCustomReactions = endDOMReactions
export const flushCustomReactions = flushDOMReactions
export const reportCustomElementError = reportLifecycleError

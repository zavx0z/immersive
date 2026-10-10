import type {Document} from "../document.ts"
import type {Element} from "../element.ts"
import type {HTMLElement} from "../html-element.ts"
import type {Node} from "../node.ts"

export const hasNativeElementFactory = Symbol("hasNativeElementFactory")

export type CustomConstructor = new () => HTMLElement
export type CustomCallbacks = Readonly<{
  connectedCallback?: (this: HTMLElement) => void
  disconnectedCallback?: (this: HTMLElement) => void
  adoptedCallback?: (this: HTMLElement, previous: Document, next: Document) => void
  attributeChangedCallback?: (this: HTMLElement, name: string, previous: string | null, next: string | null, namespace: null) => void
}>

export interface CustomDefinition {
  readonly registry: object
  readonly name: string
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

type CustomState = {
  registry: object
  definition?: CustomDefinition
  status: "undefined" | "precustomized" | "custom" | "failed"
  upgrade(): void
}

const states = new WeakMap<Element, CustomState>()
const counts = new WeakMap<Node, number>()
const constructors = new WeakMap<Function, () => CustomConstruction>()
const constructionStack: CustomConstruction[] = []
const reactions: Array<() => void> = []
let reactionDepth = 0
let invoking = false

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

export function constructCustomElement(context: CustomConstruction): HTMLElement {
  constructionStack.push(context)
  try {
    const element = new context.definition.constructor()
    if (element !== context.element) throw new TypeError("Custom element constructor returned another object")
    if (!context.existing && (element.parentNode !== null || element.hasChildNodes() || element.hasAttributes()))
      throw new TypeError("Custom element constructor must not create attributes or children")
    const state = states.get(element)!
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
  trackCustomElement(target, context.definition.registry, () => {})
  const state = states.get(target)!
  state.definition = context.definition
  state.status = constructionStack.at(-1) === context ? "precustomized" : "custom"
  return target
}

export function trackCustomElement(element: Element, registry: object, upgrade: () => void) {
  if (states.has(element)) return
  states.set(element, {registry, status: "undefined", upgrade})
  for (let node: Node | null = element; node !== null; node = node.parentNode)
    counts.set(node, (counts.get(node) ?? 0) + 1)
}

export function failCustomElementUpgrade(element: Element) {
  const state = states.get(element)
  if (state) state.status = "failed"
}

export function canUpgradeCustomElement(element: Element, registry: object) {
  const state = states.get(element)
  return state?.status === "undefined" && state.registry === registry
}

export function isCustomElementHost(node: Node): node is HTMLElement {
  const state = states.get(node as Element)
  return state?.status === "custom" || state?.status === "precustomized"
}

export function customRegistryFor(element: Element): object | null { return states.get(element)?.registry ?? null }

/** Посещает только ветви, в которых есть custom elements или ожидающие определения кандидаты. */
export function visitCustomElements(root: Node, visit: (element: HTMLElement) => void) {
  if (!counts.has(root)) return
  if (states.has(root as Element)) visit(root as HTMLElement)
  for (let child = root.firstChild; child !== null; child = child.nextSibling)
    if (counts.has(child)) visitCustomElements(child, visit)
}

export function customElementInserted(root: Node) {
  const count = counts.get(root)
  if (count === undefined) return
  adjustAncestors(root.parentNode, count)
  if (!root.isConnected) return
  visitCustomElements(root, element => {
    const state = states.get(element)!
    if (state.status === "undefined") state.upgrade()
    else if (state.status === "custom") enqueueCustomReaction(element, "connectedCallback")
  })
}

export function customElementRemoving(root: Node) {
  const count = counts.get(root)
  if (count === undefined) return
  if (root.isConnected) visitCustomElements(root, element => enqueueCustomReaction(element, "disconnectedCallback"))
  adjustAncestors(root.parentNode, -count)
}

export function customElementAdopted(element: Node, previous: Document | null, next: Document) {
  if (previous !== null && previous !== next && states.has(element as Element))
    enqueueCustomReaction(element as HTMLElement, "adoptedCallback", previous, next)
}

export function customElementAttributeChanged(element: Element, name: string, previous: string | null, next: string | null) {
  const state = states.get(element)
  if (state?.status !== "custom" || !state.definition?.observed.has(name)) return
  enqueueCustomReaction(element as HTMLElement, "attributeChangedCallback", name, previous, next, null)
  flushCustomReactions()
}

export function enqueueCustomReaction(element: HTMLElement, name: keyof CustomCallbacks, ...args: unknown[]) {
  const state = states.get(element)
  if (state?.status !== "custom") return
  const callback = state.definition?.callbacks[name]
  if (callback) reactions.push(() => Reflect.apply(callback, element, args))
}

export function beginCustomReactions() { reactionDepth++ }
export function endCustomReactions() { reactionDepth--; flushCustomReactions() }

export function flushCustomReactions() {
  if (reactionDepth > 0 || invoking || reactions.length === 0) return
  invoking = true
  try {
    for (let index = 0; index < reactions.length; index++) {
      try { reactions[index]!() }
      catch (error) { reportCustomElementError(error) }
    }
  } finally {
    reactions.length = 0
    invoking = false
  }
}

export function reportCustomElementError(error: unknown) {
  if (typeof globalThis.reportError === "function") globalThis.reportError(error)
  else queueMicrotask(() => { throw error })
}

function adjustAncestors(parent: Node | null, difference: number) {
  for (let node = parent; node !== null; node = node.parentNode) {
    const count = (counts.get(node) ?? 0) + difference
    if (count === 0) counts.delete(node)
    else counts.set(node, count)
  }
}

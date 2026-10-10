import type {Document} from "./document.ts"
import type {Node} from "./node.ts"
import {HTMLElement} from "./html-element.ts"
import {domError} from "./internal/errors.ts"
import {
  hasNativeElementFactory, canUpgradeCustomElement, constructCustomElement, enqueueCustomReaction, failCustomElementUpgrade,
  flushCustomReactions, registerCustomConstructor, trackCustomElement,
  visitCustomElements, reportCustomElementError, type CustomCallbacks, type CustomConstructor,
  type CustomDefinition,
} from "./internal/custom-elements.ts"

export type CustomElementConstructor = CustomConstructor
export const associateCustomElementDocument = Symbol("associateCustomElementDocument")
export const createCustomElement = Symbol("createCustomElement")
const reserved = new Set(["annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph"])
const namePattern = /^[a-z][.0-9_a-z\-\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}]*$/u

/** Реестр автономных DOM-элементов. Он не зависит от JSX, Template и Component. */
export class CustomElementRegistry {
  private readonly definitions = new Map<string, CustomDefinition>()
  private readonly names = new Map<CustomConstructor, string>()
  private readonly documents = new Set<WeakRef<Document>>()
  private readonly waiting = new Map<string, {promise: Promise<CustomConstructor>; resolve(value: CustomConstructor): void}>()
  private defining = false

  define(name: string, constructor: CustomConstructor, options: {extends?: string} = {}): void {
    name = String(name)
    validateName(name)
    if (typeof constructor !== "function" || !(constructor.prototype instanceof HTMLElement))
      throw new TypeError("Custom element constructor must extend HTMLElement")
    if (options.extends !== undefined) throw domError("NotSupportedError", "Customized built-in elements are not implemented")
    if (this.definitions.has(name) || this.names.has(constructor) || this.defining)
      throw domError("NotSupportedError", "Custom element is already defined or definition is in progress")
    this.assertNativeNameAvailable(name)
    this.defining = true
    let definition: CustomDefinition
    try {
      const callbacks: Record<string, Function> = {}
      for (const key of ["connectedCallback", "disconnectedCallback", "adoptedCallback", "attributeChangedCallback"] as const) {
        const callback: unknown = Reflect.get(constructor.prototype, key)
        if (callback === undefined) continue
        if (typeof callback !== "function") throw new TypeError(`${key} must be a function`)
        callbacks[key] = callback
      }
      const declared = callbacks.attributeChangedCallback === undefined ? []
        : (constructor as CustomConstructor & {observedAttributes?: Iterable<unknown>}).observedAttributes ?? []
      if (typeof declared[Symbol.iterator] !== "function") throw new TypeError("observedAttributes must be iterable")
      const observed = new Set(Array.from(declared, String))
      definition = {registry: this, name, constructor, observed, callbacks: callbacks as CustomCallbacks}
    } finally { this.defining = false }
    this.assertNativeNameAvailable(name)
    this.definitions.set(name, definition)
    this.names.set(constructor, name)
    registerCustomConstructor(constructor, () => {
      for (const reference of this.documents) {
        const document = reference.deref()
        if (document) return {document, definition}
      }
      throw new TypeError("Custom element registry has no associated Document")
    })
    for (const reference of this.documents) {
      const document = reference.deref()
      if (document) this.upgrade(document)
      else this.documents.delete(reference)
    }
    this.waiting.get(name)?.resolve(constructor)
    this.waiting.delete(name)
  }

  get(name: string): CustomConstructor | undefined { return this.definitions.get(String(name))?.constructor }
  getName(constructor: CustomConstructor): string | null { return this.names.get(constructor) ?? null }

  whenDefined(name: string): Promise<CustomConstructor> {
    name = String(name)
    try { validateName(name) } catch (error) { return Promise.reject(error) }
    const definition = this.get(name)
    if (definition) return Promise.resolve(definition)
    const pending = this.waiting.get(name)
    if (pending) return pending.promise
    let resolve!: (value: CustomConstructor) => void
    const promise = new Promise<CustomConstructor>(done => { resolve = done })
    this.waiting.set(name, {promise, resolve})
    return promise
  }

  upgrade(root: Node): void {
    const document = root.nodeType === 9 ? root as Document : root.ownerDocument
    const upgrade = () => {
      visitCustomElements(root, element => this.upgradeElement(element))
      flushCustomReactions()
    }
    if (document) document.transaction(upgrade)
    else upgrade()
  }

  /** Связывает реестр с Document; регистрация не создаёт второе дерево. */
  [associateCustomElementDocument](document: Document): void {
    for (const name of this.definitions.keys()) {
      if (document[hasNativeElementFactory](name)) throw domError("NotSupportedError", `Custom element name is owned by a native factory: ${name}`)
    }
    this.documents.add(new WeakRef(document))
  }

  /** Единый путь Document.createElement для определённых и будущих автономных элементов. */
  [createCustomElement](document: Document, name: string): HTMLElement {
    const definition = this.definitions.get(name)
    if (definition) {
      try { return constructCustomElement({document, definition}) }
      catch (error) {
        reportCustomElementError(error)
        return new HTMLElement(document, name)
      }
    }
    const element = new HTMLElement(document, name)
    if (name.includes("-") && namePattern.test(name) && !reserved.has(name))
      trackCustomElement(element, this, () => this.upgradeElement(element))
    return element
  }

  private assertNativeNameAvailable(name: string): void {
    for (const reference of this.documents) {
      const document = reference.deref()
      if (document?.[hasNativeElementFactory](name)) throw domError("NotSupportedError", `Custom element name is owned by a native factory: ${name}`)
      if (!document) this.documents.delete(reference)
    }
  }

  private upgradeElement(element: HTMLElement): void {
    if (!canUpgradeCustomElement(element, this)) return
    const definition = this.definitions.get(element.localName)
    if (!definition) return
    try {
      Object.setPrototypeOf(element, definition.constructor.prototype)
      constructCustomElement({document: element.ownerDocument!, definition, existing: element})
    } catch (error) {
      failCustomElementUpgrade(element)
      reportCustomElementError(error)
      return
    }
    for (const name of element.getAttributeNames())
      if (definition.observed.has(name)) enqueueCustomReaction(element, "attributeChangedCallback", name, null, element.getAttribute(name), null)
    if (element.isConnected) enqueueCustomReaction(element, "connectedCallback")
  }
}

function validateName(name: string) {
  if (!name.includes("-") || !namePattern.test(name) || reserved.has(name))
    throw domError("SyntaxError", `Invalid custom element name ${name}`)
}

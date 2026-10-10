import {
  Comment,
  DocumentFragment,
  Element,
  Node,
  type Document
} from "@zavx0z/immersive-dom"
import {
  containsTaggedTemplateMarker,
  getTaggedTemplateShape,
  joinTaggedTemplateSource,
  parseTaggedTemplateSegments,
  type TaggedTemplateSegment,
  type TaggedTemplateSlotSegment,
} from "./tagged-template.ts"

import {DomContentRange, DomEventBinding, createDomAnchor, isDomAnchor, applyDomOperation, attributeOperation, propertyOperation, removeDomRange,
  type DomContent, type DomContentAdapter} from "./compiled.ts"
import {parseFragmentSource, type HTMLFragmentSyntaxNode} from "@zavx0z/immersive-dom"

const templateResultType = Symbol("@zavx0z/immersive-template/result")
const htmlBlueprintFrontends = new Map<string, symbol>()


export type TemplateChild =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | Node
  | TemplateResult
  | DomContent
  | readonly TemplateChild[]

export interface TemplateResult {
  readonly strings: TemplateStringsArray
  readonly values: readonly unknown[]
  readonly [templateResultType]: true
}

export type TemplateView<State> = (state: State) => TemplateResult

export interface TemplateInstance<State> {
  readonly parentNode: Element | DocumentFragment
  /** Authored root nodes only; internal Comment boundaries are private. */
  readonly rootNodes: readonly Node[]
  readonly state: State
  update(state: State): void
  dispose(): void
}

export interface TemplateProgram<State> {
  mount(
    parentNode: Element | DocumentFragment,
    initialState: State,
    before?: Node | null
  ): TemplateInstance<State>
}

/**
Captures an HTML template and its live values without producing an intermediate
renderer tree.
*/
export function html(strings: TemplateStringsArray, ...values: readonly unknown[]): TemplateResult {
  return Object.freeze({
    strings,
    values: Object.freeze(values),
    [templateResultType]: true as const
  })
}

/**
Compiles a stable template shape into addressed operations on `@zavx0z/immersive-dom`.

The view is executed at mount and update time. Its top-level tagged-template
callsite must stay the same. Conditional structure belongs in child bindings,
where changing a nested template replaces only that bounded child region.
*/
export function compile<State>(view: TemplateView<State>): TemplateProgram<State> {
  if (typeof view !== "function") throw new TypeError("compile expects a template view function")

  return Object.freeze({
    mount(
      parentNode: Element | DocumentFragment,
      initialState: State,
      before: Node | null = null
    ): TemplateInstance<State> {
      assertContainer(parentNode)
      if (before && before.parentNode !== parentNode) {
        throw new Error("The insertion reference does not belong to the template container")
      }

      const document = parentNode.ownerDocument
      if (!document) throw new Error("The template container must have an ownerDocument")

      let currentState = initialState
      let disposed = false
      let internal: InternalTemplateInstance

      document.transaction(() => {
        internal = new InternalTemplateInstance(document, parentNode, before, expectTemplateResult(view(initialState)))
      })
      try { internal!.commitMounted() }
      catch (error) {
        document.transaction(() => internal!.dispose())
        throw error
      }

      const instance: TemplateInstance<State> = {
        get parentNode() {
          return parentNode
        },
        get rootNodes() {
          return internal.rootNodes
        },
        get state() {
          return currentState
        },
        update(state: State) {
          if (disposed) throw new Error("Cannot update a disposed template instance")
          const result = expectTemplateResult(view(state))
          if (result.strings !== internal.strings) {
            throw new Error(
              "The top-level template shape changed; put conditional templates in a child interpolation"
            )
          }
          document.transaction(() => internal.update(result))
          internal.commitMounted()
          currentState = state
        },
        dispose() {
          if (disposed) return
          document.transaction(() => internal.dispose())
          disposed = true
        }
      }

      return Object.freeze(instance)
    }
  })
}

type Segment = TaggedTemplateSegment
type SlotSegment = TaggedTemplateSlotSegment

type TextBlueprint = {
  readonly type: "text"
  readonly value: string
}

type ChildPartBlueprint = {
  readonly type: "part"
  readonly index: number
}

type AttributeBlueprint = {
  readonly name: string
  readonly segments: readonly Segment[] | null
}

type ElementBlueprint = {
  readonly type: "element"
  readonly tagName: string
  readonly attributes: readonly AttributeBlueprint[]
  readonly children: readonly BlueprintNode[]
}

type BlueprintNode = TextBlueprint | {readonly type: "comment", readonly value: string} | ChildPartBlueprint | ElementBlueprint

type TemplateBlueprint = {
  readonly children: readonly BlueprintNode[]
}


interface DynamicPart {
  update(values: readonly unknown[]): void
  commit?(): void
  dispose(): void
}

class InternalTemplateInstance {
  readonly strings: TemplateStringsArray
  private readonly start: Comment
  private readonly end: Comment
  private readonly parts: DynamicPart[] = []
  private disposed = false

  constructor(
    document: Document,
    parentNode: Element | DocumentFragment,
    before: Node | null,
    result: TemplateResult
  ) {
    this.strings = result.strings
    this.start = createTemplateAnchor(document, "template:start")
    this.end = createTemplateAnchor(document, "template:end")

    const fragment = document.createDocumentFragment()
    fragment.appendChild(this.start)
    const blueprint = getBlueprint(result.strings, parentNode instanceof Element ? parentNode.localName : "body")
    for (const child of blueprint.children) instantiateBlueprint(document, fragment, child, this.parts)
    fragment.appendChild(this.end)
    try {
      for (const part of this.parts) part.update(result.values)
      parentNode.insertBefore(fragment, before)
    } catch (error) {
      for (let index = this.parts.length - 1; index >= 0; index--) {
        try { this.parts[index]!.dispose() } catch {}
      }
      removeDomRange(this.start, this.end)
      this.disposed = true
      throw error
    }
  }

  get rootNodes(): readonly Node[] {
    const parent = this.start.parentNode
    if (!parent || this.end.parentNode !== parent) return Object.freeze([])
    const result: Node[] = []
    for (let node: Node | null = this.start.nextSibling; node && node !== this.end; node = node.nextSibling) {
      if (!isDomAnchor(node)) result.push(node)
    }
    return Object.freeze(result)
  }

  update(result: TemplateResult): void {
    if (this.disposed) throw new Error("Cannot update a disposed nested template")
    if (result.strings !== this.strings) throw new Error("Nested template shape mismatch")
    for (const part of this.parts) part.update(result.values)
  }

  commitMounted(): void { for (const part of this.parts) part.commit?.() }

  dispose(): void {
    if (this.disposed) return
    let firstError: unknown = null
    for (const part of this.parts) {
      try { part.dispose() } catch (error) { firstError ??= error }
    }
    const parentNode = this.start.parentNode
    if (
      parentNode &&
      (parentNode instanceof Element || parentNode instanceof DocumentFragment) &&
      this.end.parentNode === parentNode
    ) {
      removeInclusiveRange(parentNode, this.start, this.end)
    }
    this.disposed = true
    if (firstError) throw firstError
  }
}

class AttributePart implements DynamicPart {
  private readonly element: Element
  private readonly attributeName: string
  private readonly segments: readonly Segment[]
  private readonly wholeDynamicIndex: number | null

  constructor(element: Element, attributeName: string, segments: readonly Segment[]) {
    this.element = element
    this.attributeName = attributeName
    this.segments = segments
    const onlySegment = segments.length === 1 ? segments[0] : undefined
    this.wholeDynamicIndex = onlySegment?.type === "slot" ? onlySegment.index : null
  }

  update(values: readonly unknown[]): void {
    const isWholeDynamic = this.wholeDynamicIndex !== null
    const dynamicValue = isWholeDynamic ? values[this.wholeDynamicIndex!] : undefined

    let nextValue: unknown = isWholeDynamic ? dynamicValue : ""
    if (isWholeDynamic && dynamicValue === true) {
      nextValue = ""
    } else if (!(isWholeDynamic && (dynamicValue == null || dynamicValue === false))) {
      nextValue = this.segments.map(segment => segmentValue(segment, values)).join("")
    }
    const operation = attributeOperation(this.element, this.attributeName, nextValue)
    applyDomOperation(operation)
  }

  dispose(): void {}
}

class EventPart implements DynamicPart {
  private readonly binding: DomEventBinding
  constructor(element: Element, attributeName: string, private readonly index: number) {
    this.binding = new DomEventBinding(element, attributeName.startsWith("@") ? attributeName.slice(1) : attributeName.slice(2).toLowerCase())
  }
  update(values: readonly unknown[]): void { this.binding.prepare(values[this.index])?.apply() }
  dispose(): void { this.binding.dispose() }
}

class PropertyPart implements DynamicPart {
  constructor(private readonly element: Element, private readonly name: string, private readonly index: number) {}
  update(values: readonly unknown[]): void {
    const operation = propertyOperation(this.element, this.name, values[this.index], true)
    applyDomOperation(operation)
  }
  dispose(): void {}
}

class ChildPart implements DynamicPart {
  private readonly region: DomContentRange
  constructor(anchor: Comment, private readonly index: number) {
    this.region = new DomContentRange(anchor, [htmlContentAdapter], document => createTemplateAnchor(document, "template:item"))
  }
  update(values: readonly unknown[]): void { this.region.commit(values[this.index]) }
  commit(): void { this.region.commitMounted() }
  dispose(): void { this.region.dispose() }
}

const htmlContentAdapter: DomContentAdapter = {
  accepts: isTemplateResult,
  mount(parent, before, value) {
    const instance = new InternalTemplateInstance(parent.ownerDocument!, parent, before, value as TemplateResult)
    return {
      update(next) {
        if (!isTemplateResult(next) || next.strings !== instance.strings) return false
        instance.update(next)
        return true
      },
      dispose: () => instance.dispose(),
      commit: () => instance.commitMounted(),
    }
  },
}

function instantiateBlueprint(
  document: Document,
  parentNode: Element | DocumentFragment,
  blueprint: BlueprintNode,
  parts: DynamicPart[]
): void {
  switch (blueprint.type) {
    case "text":
      parentNode.appendChild(document.createTextNode(blueprint.value))
      return
    case "comment":
      parentNode.appendChild(document.createComment(blueprint.value))
      return
    case "part": {
      const anchor = createTemplateAnchor(document, "template:part")
      parentNode.appendChild(anchor)
      parts.push(new ChildPart(anchor, blueprint.index))
      return
    }
    case "element": {
      const element = document.createElement(blueprint.tagName)
      instantiateAttributes(element, blueprint.attributes, parts)
      for (const child of blueprint.children) instantiateBlueprint(document, element, child, parts)
      parentNode.appendChild(element)
    }
  }
}

function instantiateAttributes(
  element: Element,
  attributes: readonly AttributeBlueprint[],
  parts: DynamicPart[]
): void {
  for (const attribute of attributes) {
    if (attribute.segments === null) {
      element.setAttribute(attribute.name, "")
      continue
    }

    const dynamicSegments = attribute.segments.filter(
      (segment): segment is SlotSegment => segment.type === "slot"
    )

    if (dynamicSegments.length === 0) {
      if (attribute.name.startsWith("on") || attribute.name.startsWith("@") || attribute.name.startsWith(".")) {
        throw new Error(`Static event attribute ${attribute.name} cannot be executed`)
      }
      element.setAttribute(
        attribute.name,
        attribute.segments.map(segment => segment.type === "static" ? segment.value : "").join("")
      )
      continue
    }

    if (attribute.name.startsWith(".")) {
      if (attribute.segments.length !== 1 || dynamicSegments.length !== 1 || attribute.name.length === 1) {
        throw new Error("DOM property bindings require one dynamic value")
      }
      parts.push(new PropertyPart(element, attribute.name.slice(1), dynamicSegments[0]!.index))
      continue
    }
    if (attribute.name.startsWith("on") || attribute.name.startsWith("@")) {
      if (attribute.segments.length !== 1 || dynamicSegments.length !== 1 || attribute.name.length === 2) {
        throw new Error(`Event binding ${attribute.name} must contain exactly one JavaScript listener`)
      }
      parts.push(new EventPart(element, attribute.name, dynamicSegments[0]!.index))
      continue
    }

    parts.push(new AttributePart(element, attribute.name, attribute.segments))
  }
}

function getBlueprint(strings: TemplateStringsArray, context: string): TemplateBlueprint {
  let frontend = htmlBlueprintFrontends.get(context)
  if (!frontend) htmlBlueprintFrontends.set(context, frontend = Symbol(`HTML:${context}`))
  return getTaggedTemplateShape(strings, frontend, strings => parseBlueprint(strings, context))
}

function parseBlueprint(strings: TemplateStringsArray, context: string): TemplateBlueprint {
  const source = joinTaggedTemplateSource(strings)
  const convert = (node: HTMLFragmentSyntaxNode): BlueprintNode[] => {
    if (node.type === "comment") {
      if (containsTaggedTemplateMarker(node.value)) throw new Error("HTML comment interpolations are unsupported")
      return [{type: "comment", value: node.value}]
    }
    if (node.type === "text") {
      return parseTaggedTemplateSegments(node.value, strings.length - 1).map(segment =>
        segment.type === "static" ? {type: "text", value: segment.value} : {type: "part", index: segment.index})
    }
    if (containsTaggedTemplateMarker(node.name)) throw new Error("Element names must be static")
    return [{type: "element", tagName: node.name,
      attributes: node.attrs.map(attribute => {
        if (containsTaggedTemplateMarker(attribute.name)) throw new Error("Attribute names must be static")
        const segments = parseTaggedTemplateSegments(attribute.value, strings.length - 1)
        return {name: authoredDirectiveName(strings, attribute.name, segments), segments}
      }),
      children: node.children.flatMap(convert),
    }]
  }
  return Object.freeze({children: Object.freeze(parseFragmentSource(source, context).flatMap(convert))})
}

/** DOM уже установил границы атрибута; индекс единственного placeholder сохраняет case JS-директивы. */
function authoredDirectiveName(strings: TemplateStringsArray, name: string, segments: readonly Segment[]): string {
  if (!name.startsWith(".") && !name.startsWith("@")) return name
  const only = segments[0]
  if (segments.length !== 1 || only?.type !== "slot") return name
  return strings[only.index]?.match(/(?:^|\s)([.@][^\s=<>]+)\s*=\s*["']?$/u)?.[1] ?? name
}

function createTemplateAnchor(document: Document, data: string): Comment {
  return createDomAnchor(document, data)
}


function segmentValue(segment: Segment, values: readonly unknown[]): string {
  if (segment.type === "static") return segment.value
  const value = values[segment.index]
  if (value === null || value === undefined || value === false) return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint" || value === true) {
    return String(value)
  }
  throw new TypeError(`Attribute interpolation requires a primitive value, received ${describeValue(value)}`)
}


function expectTemplateResult(value: unknown): TemplateResult {
  if (!isTemplateResult(value)) throw new TypeError("A template view must return html`...`")
  return value
}

function isTemplateResult(value: unknown): value is TemplateResult {
  return typeof value === "object" && value !== null && (value as Partial<TemplateResult>)[templateResultType] === true
}

function assertContainer(value: unknown): asserts value is Element | DocumentFragment {
  if (!(value instanceof Element || value instanceof DocumentFragment)) {
    throw new TypeError("Templates mount into an Element or DocumentFragment")
  }
}

function removeInclusiveRange(expectedParent: Element | DocumentFragment, start: Node, end: Node): void {
  if (start.parentNode === expectedParent && end.parentNode === expectedParent) removeDomRange(start, end)
}

function describeValue(value: unknown): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}

import {DocumentFragment, Node, type Document} from "@zavx0z/immersive-dom"
import {slotContents, snapshotDomNodes, type CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {SlotContent} from "../slot/contract/content.ts"

/** Нижняя композиция: ключ — действующее имя outlet; пустой ключ обозначает default. */
export type ComponentContent = Readonly<Record<string, SlotContent>>

export function hasDomContent(content: ComponentContent | undefined): boolean {
  if (content === undefined) return false
  const seen = new Set<readonly unknown[]>()
  const hasNode = (value: SlotContent): boolean => {
    if (value instanceof Node) return true
    if (!Array.isArray(value) || seen.has(value)) return false
    seen.add(value)
    return value.some(hasNode)
  }
  return Object.values(content).some(hasNode)
}

/** Снимок конкретного назначения сохраняет Nodes, но не оживляет пустой Fragment у других получателей. */
export function retainComponentContent(content: ComponentContent): ComponentContent {
  const retain = (value: SlotContent): SlotContent => value instanceof DocumentFragment
    ? snapshotDomNodes(value)
    : Array.isArray(value) ? Object.freeze(value.map(retain)) : value
  return Object.freeze(Object.fromEntries(Object.entries(content).map(([name, value]) => [name, retain(value)])))
}

/** Один slotContents ABI для imperative root, custom element и prepared HTML-содержимого. */
export function withComponentContent<Props>(
  template: CompiledTemplate<Props>,
  props: Readonly<Props>,
  content: ComponentContent,
  document?: Document,
  container?: Node,
): Readonly<Props> {
  if (content === null || typeof content !== "object" || Array.isArray(content)) throw new TypeError("Component content must be a slot map")
  const names = new Set(template.slots ?? [])
  const nodes = new Set<Node>()
  const groups = new Set<readonly unknown[]>()
  const inspect = (value: SlotContent): void => {
    if (value instanceof Node) {
      for (const node of snapshotDomNodes(value)) {
        if (document && node.ownerDocument !== document) throw new TypeError("Component content must belong to the receiving Document")
        if (container && node.contains(container)) throw new TypeError("Component content cannot contain its receiving container")
        if (nodes.has(node)) throw new TypeError("Component content cannot assign a Node more than once")
        nodes.add(node)
      }
    } else if (Array.isArray(value)) {
      if (groups.has(value)) throw new TypeError("Component content arrays cannot contain themselves")
      groups.add(value)
      for (const child of value) inspect(child)
      groups.delete(value)
    }
  }
  for (const [name, value] of Object.entries(content)) {
    if (!names.has(name)) throw new Error(`Unknown component content slot ${JSON.stringify(name)}`)
    inspect(value)
  }
  return {...props, [slotContents]: content}
}

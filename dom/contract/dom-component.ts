import {domComponentConstructorBrand} from "../src/dom-component.ts"
import type {Document} from "../src/document.ts"
import type {Element} from "../src/element.ts"
import type {Node} from "../src/node.ts"
import type {DOMGroup} from "../src/dom-group.ts"

export type DOMConstruction<Props = unknown> = Readonly<{
  type: DOMComponentConstructor<Props>
  props: Readonly<Props>
  key?: string | number | null
  content?: DOMComponentContent
  context?: unknown
}>
export type DOMSlotContent = Node | DOMGroup | DOMConstruction<any> | string | number | bigint | boolean | null | undefined | readonly DOMSlotContent[]
export type DOMComponentContent = Readonly<Record<string, DOMSlotContent>>
export type DOMComponent<Props, Content = DOMComponentContent> = (Element | DOMGroup) & {
  props: Readonly<Props>
  content: Content
  update(props: Readonly<Props>, content?: Content, context?: unknown): void
  dispose(): void
}

/** Только constructor ABI; state, methods и эффекты генерирует авторский compiler. */
export interface DOMComponentConstructor<Props, Content = DOMComponentContent> {
  new(document: Document, props: Readonly<Props>, content?: Content, context?: unknown): DOMComponent<Props, Content>
  readonly [domComponentConstructorBrand]: true
  readonly slots?: readonly string[]
}

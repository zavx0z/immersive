import type {Node} from "../src/node.ts"
import type {DOMGroup} from "../src/dom-group.ts"

/** Адресованное чтение и запись одного значения существующего DOM-объекта. */
export type PropertyOperation = {current(): unknown, next: unknown, write(value: unknown): void}
export type DomPatch = {apply(): void, rollback(): void}

/** Существующий DOM либо фиксированная группа узлов; Fragment раскрывается при чтении. */
export type DomNodes = Node | DOMGroup | readonly (Node | DOMGroup)[]

/** Транспорт CSS для адресованного изменения style существующего Element. */
export type CompiledStyleValue =
  | string
  | false
  | null
  | undefined
  | readonly CompiledStyleValue[]

export type ResolvedStyleValue = Readonly<{
  cssText: string | null
  signature: string
}>

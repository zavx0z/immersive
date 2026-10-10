import {Node} from "./node.ts"
import {definePropertyAttributes} from "./internal/native-properties.ts"
import {lifecyclePropertyChanged} from "./internal/lifecycle.ts"
import type {DOMPropertyAttributes} from "../contract/native-properties.ts"
export type {DOMPropertyAttributes} from "../contract/native-properties.ts"

/** Объявляет immutable reflection metadata владельца; поля, setters и DOM не создаются. */
export function defineDOMPropertyAttributes(owner: object, declarations: DOMPropertyAttributes): void {
  definePropertyAttributes(owner, declarations)
}

/**
Уведомляет точные scopes после успешной native записи расширения.
Владелец поля выполняет запись и связанные mutations одной Document.transaction;
hook не хранит значение и не исполняет component bindings.
*/
export function notifyDOMPropertyChange(target: Node, name: string): void {
  if (!(target instanceof Node) || typeof name !== "string" || !name) throw new TypeError("Native DOM property notification requires a Node and nonempty name")
  const document = target.ownerDocument
  if (document) document.transaction(() => lifecyclePropertyChanged(target, name))
}

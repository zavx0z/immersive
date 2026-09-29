/**
Статическое назначение одной позиции authored JSX.

Компилятор передаёт имя из AST, а runtime читает descriptor после вычисления
expression. Пустой conditional и пустой keyed список сохраняют свою область;
монтирование и проверка готовых ComponentValue принадлежат runtime.
Пакет связывает синтаксическую подготовку и automatic JSX protocol обычным
неизменяемым объектом, без registry и отдельного semantic дерева.

@packageDocumentation
*/
import type {SlotChildInput} from "./contract/input.ts"
import type {SlotChildOutput} from "./contract/output.ts"
export type {SlotChildInput} from "./contract/input.ts"
export type {SlotChildOutput} from "./contract/output.ts"

/**
Сохраняет буквальное имя и границу одного JSX expression без изменения content.

@returns Неизменяемый descriptor для общего JSX runtime.
@throws TypeError Имя не является строкой либо kind не является conditional/keyed.
*/
export default function slotChild(...[name, content, kind]: SlotChildInput): SlotChildOutput {
  if (typeof name !== "string" || (kind !== "conditional" && kind !== "keyed")) {
    throw new TypeError("JSX slot child requires a static name and composition kind")
  }
  return Object.freeze({"@zavx0z/jsx/slot-child": true as const, name, content, kind})
}

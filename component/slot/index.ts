/**
Композиция подготовленного содержимого одной области через обычный lifecycle Component.

Фиксированные группы сохраняют позиции соседей при условном обновлении, а keyed
группы используют действующее сопоставление по ключам. Выбор имени области,
распределение входа и fallback принадлежат вызывающему коду.
Перенос экземпляра между разными областями остаётся
[отложенным контрактом Component](../meta/notes/slot-transfer.md).

@packageDocumentation
*/
import type {ComposeSlotInput} from "./contract/input.ts"
import type {ComposeSlotOutput} from "./contract/output.ts"
import type {SlotContent} from "./contract/content.ts"
import {
  component,
  isComponentValue,
  isKeyedComponentsValue,
  normalizeChildren,
} from "../src/composition.ts"
import {composeFixedSlotGroup} from "./src/group.ts"
import {slotTextTemplate, slotNodeTemplate} from "./src/templates.ts"
import {Node} from "@zavx0z/immersive-dom"

export type {ComposeSlotInput} from "./contract/input.ts"
export type {ComposeSlotOutput} from "./contract/output.ts"

/**
Подготавливает содержимое одной области без создания DOM и без собственного
механизма сопоставления дочерних компонентов.

При неизменной длине массива каждый сосед остаётся в своей conditional-области.
Изменение длины выбирает другой template и пересоздаёт группу при её принятии.
Пустой keyed-список и группа только из пустых значений возвращают `null`.

@returns Готовый child value либо `null`, если вызывающему коду следует выбрать fallback.

@throws TypeError — содержимое содержит значение вне {@link SlotContent}, например
JSX descriptor, функцию или обычный объект.

@example
```ts
import {composeSlot} from "@zavx0z/immersive-component/slot"

const content = composeSlot({content: [null, "Счётчик: ", 0]})
```
*/
export function composeSlot({content}: ComposeSlotInput): ComposeSlotOutput {
  if (content == null || typeof content === "boolean") return null
  if (content instanceof Node) return component(slotNodeTemplate, {value: content})
  if (
    typeof content === "string" ||
    typeof content === "number" ||
    typeof content === "bigint"
  ) {
    return content === "" ? null : component(slotTextTemplate, {value: content})
  }
  if (isComponentValue(content)) return content
  if (isKeyedComponentsValue(content)) {
    return content.entries.length === 0 ? null : normalizeChildren(content)
  }
  if (Array.isArray(content)) {
    return composeFixedSlotGroup(content, entry => composeSlot({content: entry}))
  }
  throw new TypeError("Slot content requires compiled component values, DOM Nodes, text, or fixed arrays")
}

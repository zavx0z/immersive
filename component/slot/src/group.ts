import {component} from "../../src/composition.ts"
import type {SlotContent} from "../contract/content.ts"
import type {ComposeSlotOutput} from "../contract/output.ts"
import {fixedSlotTemplate} from "./templates.ts"

/**
Составляет фиксированную группу из результатов нормализации её исходных позиций.

Пустые позиции сохраняются в props, поэтому следующие соседи не меняют область.
Полностью пустая группа возвращает `null` для выбора fallback получателем.

@param normalize - Применяет правила основной сущности к каждому соседу,
включая вложенные фиксированные группы.
*/
export function composeFixedSlotGroup(
  content: readonly SlotContent[],
  normalize: (content: SlotContent) => ComposeSlotOutput,
): ComposeSlotOutput {
  const entries = Array.from(content, normalize)
  if (entries.every(entry => entry === null)) return null
  return component(fixedSlotTemplate(entries.length), entries)
}

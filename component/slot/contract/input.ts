import type {SlotContent} from "./content.ts"

/**
Содержимое одной области, которое вызывающий код уже распределил по слотам.

@property content - Готовые compiled values, текст или постоянные группы соседей.
Позиции массива сохраняются при появлении и исчезновении необязательного соседа.
Для fallback вся группа считается пустой только при отсутствии непустых значений.
*/
export interface ComposeSlotInput {
  readonly content: SlotContent
}

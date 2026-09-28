import type {ComponentValue} from "../../src/composition.ts"

/**
Обычное содержимое conditional-области Component либо признак пустоты для fallback.

Результат не монтирует DOM: lifecycle начинается при его принятии существующим
Component root. Возвращённый `null` позволяет вызывающему коду выбрать fallback.
*/
export type ComposeSlotOutput = ComponentValue | null

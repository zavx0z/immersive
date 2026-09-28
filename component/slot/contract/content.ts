import type {ComponentValue, KeyedComponentsValue} from "../../src/composition.ts"

/**
Подготовленное содержимое области до выбора fallback.

Массив задаёт постоянные позиции соседей, а вложенный массив — отдельную такую
группу. Для изменяемого порядка используются ключи в {@link KeyedComponentsValue}.
Пустая строка, `null`, `undefined` и boolean не создают дочерних экземпляров.
Числа, включая `0`, и bigint остаются текстом.
*/
export type SlotContent =
  | ComponentValue
  | KeyedComponentsValue
  | string
  | number
  | bigint
  | null
  | undefined
  | boolean
  | readonly SlotContent[]

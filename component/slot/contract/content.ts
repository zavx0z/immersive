import type {ComponentValue, KeyedComponentsValue} from "../../src/composition.ts"
import type {Node} from "@zavx0z/immersive-dom"

/**
Подготовленное содержимое области до выбора fallback.

Массив задаёт постоянные позиции соседей, а вложенный массив — отдельную такую
группу. Для изменяемого порядка используются ключи в {@link KeyedComponentsValue}.
Пустая строка, `null`, `undefined` и boolean не создают дочерних экземпляров.
Числа, включая `0`, и bigint остаются текстом.
Nodes принадлежат Document получателя и перемещаются без копирования. Fragment
принимается через snapshot конкретного content assignment, а не глобальный кэш.
*/
export type SlotContent =
  | ComponentValue
  | KeyedComponentsValue
  | Node
  | string
  | number
  | bigint
  | null
  | undefined
  | boolean
  | readonly SlotContent[]

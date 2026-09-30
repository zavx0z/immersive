/**
Проверка вариантов выбора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ValidateSelectionOptionsInput} from "./contract/input"
import type {SelectionOptionShape} from "./contract/types.ts"

export type {SelectionOptionShape, SelectionState} from "./contract/types"

export default function validateSelectionOptions<T extends SelectionOptionShape>(options: ValidateSelectionOptionsInput<T>[0]): readonly T[] {
  if (!Array.isArray(options)) throw new TypeError("Field options must be an array")
  const keys = new Set<string>()
  const values = new Set<string>()
  for (const option of options) {
    if (typeof option.key !== "string" || option.key.length === 0) {
      throw new TypeError("Field option key must not be empty")
    }
    if (keys.has(option.key)) throw new Error(`Field option key must be unique: ${option.key}`)
    keys.add(option.key)
    if (typeof option.value !== "string" || typeof option.label !== "string") {
      throw new TypeError("Field option value and label must be strings")
    }
    if (values.has(option.value)) throw new Error(`Field option value must be unique: ${option.value}`)
    values.add(option.value)
  }
  return options
}

export type {ValidateSelectionOptionsInput} from "./contract/input"

/**
Обработка assert-non-empty.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {AssertNonEmptyInput} from "./contract/input"

export default function assertNonEmpty(value: AssertNonEmptyInput[0], label: AssertNonEmptyInput[1]): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(`${label} must not be empty`)
}

export type {AssertNonEmptyInput} from "./contract/input"

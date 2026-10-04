/**
Обработка assert-non-empty.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveTechTextAssertNonEmpty as Contract} from "./contract"

export default function assertNonEmpty(value: Contract.Input[0], label: Contract.Input[1]): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(`${label} must not be empty`)
}

export type {ImmersiveTechTextAssertNonEmpty} from "./contract"

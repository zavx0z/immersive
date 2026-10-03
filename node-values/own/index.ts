/**
Копирует JSON-данные, отвергает циклы, NaN и бесконечности и экземпляры посторонних классов.

@packageDocumentation
*/
import type {NodeValuesOwn as Contract} from "./contract"
export type {NodeValuesOwn} from "./contract"
type NodeJsonValue = Contract.Input[0]

/** Копирует и замораживает JSON, отклоняя неоднозначные runtime-данные. */
export default function ownNodeJsonValue<T extends NodeJsonValue>(value: Contract.Input<T>[0], label: Contract.Input<T>[1] = "Node JSON value"): Contract.Output<T> {
  return ownNodeJsonValueAt(value, label, new Set<object>()) as T
}


function ownNodeJsonValueAt(value: NodeJsonValue, label: string, ancestors: Set<object>): NodeJsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must contain only finite numbers`)
    return value
  }
  if (typeof value !== "object") throw new TypeError(`${label} must be JSON-compatible`)
  if (ancestors.has(value)) throw new TypeError(`${label} must not contain cycles`)
  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      return Object.freeze(value.map((entry, index) => ownNodeJsonValueAt(entry, `${label}[${index}]`, ancestors)))
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${label} must contain only plain objects`)
    }
    const entries = Object.entries(value).map(([key, entry]) => [
      key,
      ownNodeJsonValueAt(entry, `${label}.${key}`, ancestors),
    ] as const)
    return Object.freeze(Object.fromEntries(entries))
  } finally {
    ancestors.delete(value)
  }
}

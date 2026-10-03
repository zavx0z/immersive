/**
Проверяет непустой id и положительную целую версию типа; возвращает неизменяемую копию.

@packageDocumentation
*/
import type {NodeValuesType as Contract} from "./contract"
export type {NodeValuesType} from "./contract"

/** Проверяет идентичность переносимого типа и возвращает собственную копию. */
export default function ownNodeValueType(value: Contract.Input[0], label: Contract.Input[1] = "Node value type"): Contract.Output {
  if (typeof value !== "object" || value === null) throw new TypeError(`${label} must be an object`)
  const id = requireIdentifier(value.id, label)
  if (!Number.isSafeInteger(value.version) || value.version < 1) {
    throw new TypeError(`${label} version must be a positive safe integer`)
  }
  return Object.freeze({id, version: value.version})
}


function requireIdentifier(value: string, label: string): string {
  if (value.trim().length === 0) throw new Error(`${label} id must be non-empty`)
  return value
}

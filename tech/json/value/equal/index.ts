/**
Сравнивает JSON-массивы и объекты структурно без изменения исходных значений.

@packageDocumentation
*/
import type {NodeValuesEqual as Contract} from "./contract"
export type {NodeValuesEqual} from "./contract"
type NodeJsonValue = Contract.Input[0]

/** Сравнивает структуру значений; неизменившийся Parameter не создаёт новую revision. */
export default function equalNodeJsonValue(left: Contract.Input[0], right: Contract.Input[1]): Contract.Output {
  if (Object.is(left, right)) return true
  if (typeof left !== typeof right || left === null || right === null) return false
  if (isNodeJsonArray(left) || isNodeJsonArray(right)) {
    if (!isNodeJsonArray(left) || !isNodeJsonArray(right) || left.length !== right.length) return false
    return left.every((entry, index) => equalNodeJsonValue(entry, right[index]!))
  }
  if (typeof left !== "object" || typeof right !== "object") return false
  const leftEntries = Object.entries(left)
  const rightEntries = Object.entries(right)
  if (leftEntries.length !== rightEntries.length) return false
  for (const [key, value] of leftEntries) {
    if (!Object.hasOwn(right, key) || !equalNodeJsonValue(value, right[key]!)) return false
  }
  return true
}

function isNodeJsonArray(value: NodeJsonValue): value is readonly NodeJsonValue[] {
  return Array.isArray(value)
}

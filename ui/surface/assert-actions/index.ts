/**
Проверка ключей и состояний действий поверхности.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiSurfacesChromeAssertSurfaceActions as Contract} from "./contract"

export default function assertSurfaceActions(
  items: Contract.Input[0],
  owner: Contract.Input[1],
): Contract.Output {
  if (!Array.isArray(items)) throw new TypeError(`${owner}s must be an array`)
  const keys = new Set<string>()
  for (const item of items) {
    if (!item || typeof item !== "object") throw new TypeError(`${owner} must be an object`)
    if (typeof item.key !== "string") throw new TypeError(`${owner} key must be a string`)
    if (item.key.length === 0) throw new Error(`${owner} key must not be empty`)
    if (keys.has(item.key)) throw new Error(`${owner} key must be unique: ${item.key}`)
    keys.add(item.key)
    if (typeof item.label !== "string") throw new TypeError(`${owner} ${item.key} label must be a string`)
    if (typeof item.disabled !== "boolean") throw new TypeError(`${owner} ${item.key} disabled must be a boolean`)
  }
}
export type {UiSurfacesChromeAssertSurfaceActions} from "./contract"

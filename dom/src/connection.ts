import {DOMGroup, groupConnectionNodes} from "./dom-group.ts"
import {observeDOMConnection} from "./internal/lifecycle.ts"
import type {ConnectionTarget, ConnectionCallbacks, ConnectionScope} from "../contract/connection.ts"
export type {ConnectionTarget, ConnectionCallbacks, ConnectionScope} from "../contract/connection.ts"

/**
Наблюдает Node/реальный диапазон через общий lifecycle Document и Custom Elements.
Точные attributes/properties фильтры Node используют тот же индекс и coalesced
changed callback после native reactions, до Document tasks. У DOMGroup нет
native attributes/properties. Отключение Node от дерева не отключает эти фильтры.
*/
export function observeConnection(target: ConnectionTarget, callbacks: ConnectionCallbacks): ConnectionScope {
  return observeDOMConnection(target, target instanceof DOMGroup ? target[groupConnectionNodes]() : [target], callbacks)
}

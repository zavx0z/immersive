/**
Development protocol automatic JSX.

Адаптер принимает native позиционные аргументы jsxDEV и передаёт содержимое
общему runtime. Метаданные транслятора не добавляются в props компонента.
Fragment является тем же объектом protocol, которым владеет @jsx/runtime.

@packageDocumentation
*/
import {jsx, Fragment as RuntimeFragment} from "@jsx/runtime"
import type {DevelopmentInput} from "./contract/input.ts"
import type {DevelopmentOutput} from "./contract/output.ts"
export type {JSX} from "@jsx/runtime"
export type {DevelopmentInput} from "./contract/input.ts"
export type {DevelopmentOutput} from "./contract/output.ts"

/** Общая identity native Fragment, используемая также обычным runtime. */
export const Fragment = RuntimeFragment

/** Принимает development metadata и создаёт готовый ComponentValue через общий jsx protocol. */
export function jsxDEV(...[type, props, key, isStaticChildren, source, self]: DevelopmentInput): DevelopmentOutput {
  return jsx(type, props, key ?? null)
}

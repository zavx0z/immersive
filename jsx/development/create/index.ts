/**
Development protocol automatic JSX.

Адаптер принимает native позиционные аргументы jsxDEV и передаёт содержимое
общему runtime. Метаданные транслятора не добавляются в props компонента.
Fragment для обоих protocol предоставляет домен из @immersive-jsx-runtime/fragment.

@packageDocumentation
*/
import jsx from "@immersive-jsx-runtime/create"
import type {DevelopmentInput} from "./contract/input.ts"
import type {DevelopmentOutput} from "./contract/output.ts"
export type {JSX} from "@immersive-jsx-runtime/create"
export type {DevelopmentInput} from "./contract/input.ts"
export type {DevelopmentOutput} from "./contract/output.ts"

/** Принимает development metadata и создаёт готовый ComponentValue через общий jsx protocol. */
export default function jsxDEV(...[type, props, key, isStaticChildren, source, self]: DevelopmentInput): DevelopmentOutput {
  return jsx(type, props, key ?? null)
}

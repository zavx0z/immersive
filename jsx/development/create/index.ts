/**
Development automatic JSX предоставляет типы и диагностику пропущенной компиляции.
Source metadata не создаёт второго пути исполнения компонентов.

@packageDocumentation
*/
import jsx from "@zavx0z/immersive-jsx-runtime-create"
import type {DevelopmentInput} from "./contract/input.ts"
import type {DevelopmentOutput} from "./contract/output.ts"
export type {JSX} from "@zavx0z/immersive-jsx-runtime-create"
export type {DevelopmentInput} from "./contract/input.ts"
export type {DevelopmentOutput} from "./contract/output.ts"

/** Сохраняет общую диагностику пропущенного compiler. */
export default function jsxDEV(...[type, props, key, isStaticChildren, source, self]: DevelopmentInput): DevelopmentOutput {
  return jsx(type, props, key ?? null)
}

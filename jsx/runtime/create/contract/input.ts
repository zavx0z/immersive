import type {ComponentKey} from "@immersive/component"

/**
Позиционные аргументы автоматических jsx и jsxs.
Первый аргумент содержит уже подготовленный CompiledTemplate либо Fragment.
Props поступают из native JSX-трансляции; key принадлежит экземпляру Component.
*/
export type RuntimeInput = readonly [
  type: unknown,
  props: Record<string, unknown> | null,
  key?: ComponentKey,
]

import type {ComponentKey} from "@zavx0z/component"

/** Позиционные аргументы native jsxDEV; source и self являются метаданными транслятора. */
export type DevelopmentInput = readonly [
  type: unknown,
  props: Record<string, unknown> | null,
  key: ComponentKey | undefined,
  isStaticChildren: boolean,
  source?: {fileName?: string; lineNumber?: number; columnNumber?: number},
  self?: unknown,
]

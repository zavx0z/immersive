import type {RuntimeInput} from "@zavx0z/immersive-jsx-runtime-create"

/** Позиционные аргументы native jsxDEV; source и self являются метаданными транслятора. */
export type DevelopmentInput = readonly [
  type: RuntimeInput[0],
  props: RuntimeInput[1],
  key: RuntimeInput[2],
  isStaticChildren: boolean,
  source?: {fileName?: string; lineNumber?: number; columnNumber?: number},
  self?: unknown,
]

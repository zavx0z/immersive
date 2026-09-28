import type {CssTemplateItem, CssTemplateRule} from "../src/types.ts"

/** Статическая форма CSS с адресами динамических частей. */
export type CssTemplateShape = Readonly<{
  items: readonly CssTemplateItem[]
  rules: readonly CssTemplateRule[]
  fragmentSlots: readonly number[]
  slotCount: number
}>

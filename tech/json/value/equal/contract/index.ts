import type {ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"

/** Структурное равенство уже переносимых JSON-значений. */
export declare namespace ImmersiveTechJsonValueEqual {
  type Input = readonly [left: ImmersiveTechJsonValueOwn.Input[0], right: ImmersiveTechJsonValueOwn.Input[0]]
  type Output = boolean
}

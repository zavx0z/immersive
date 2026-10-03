import type {NodeValuesOwn} from "@node-values/own"

/** Структурное равенство уже переносимых JSON-значений. */
export declare namespace NodeValuesEqual {
  type Input = readonly [left: NodeValuesOwn.Input[0], right: NodeValuesOwn.Input[0]]
  type Output = boolean
}

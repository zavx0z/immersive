import type {NodeValuesOwn} from "@node-values/own"
type NodeJsonValue = NodeValuesOwn.Input[0]

/** Поддерживаемые изменения и проверки одной части JSON-документа. */
export type JsonPatchOperation =
  | Readonly<{op: "add" | "replace" | "test"; path: string; value: NodeJsonValue}>
  | Readonly<{op: "remove"; path: string}>

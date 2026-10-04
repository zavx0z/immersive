import type {ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
type NodeJsonValue = ImmersiveTechJsonValueOwn.Input[0]

/** Поддерживаемые изменения и проверки одной части JSON-документа. */
export type Operation =
  | Readonly<{op: "add" | "replace" | "test"; path: string; value: NodeJsonValue}>
  | Readonly<{op: "remove"; path: string}>

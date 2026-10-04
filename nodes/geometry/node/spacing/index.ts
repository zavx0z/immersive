/**
Читает и проверяет интервал перед параметром.

@packageDocumentation
*/
import type {ImmersiveNodesGeometryNodeSpacing as Contract} from "./contract"
export type {ImmersiveNodesGeometryNodeSpacing} from "./contract"

import {metadataString} from "@zavx0z/immersive-tech-json-metadata"

export default function parameterSpacingBefore(
  parameter: Contract.Input,
): Contract.Output {
  const spacing = metadataString(parameter.presentation, "spacingBefore", "")
  if (spacing === "") return undefined
  if (spacing !== "small" && spacing !== "medium") {
    throw new TypeError(`Parameter ${parameter.id} spacingBefore must be small or medium`)
  }
  return spacing
}

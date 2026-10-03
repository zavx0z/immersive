/**
Читает и проверяет интервал перед параметром.

@packageDocumentation
*/
import type {NodeGeometrySpacing as Contract} from "./contract"
export type {NodeGeometrySpacing} from "./contract"

import {metadataString} from "@nodes/metadata"

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

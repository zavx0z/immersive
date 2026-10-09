import source from "./glass.wgsl" with {type: "text"}
import composite from "./glass-composite.wgsl" with {type: "text"}
import {composePresentationClipShader} from "./presentation-clip"
import {GLASS_ACCUMULATION_SCALE, GLASS_FP16_MAX, GLASS_MAX_OPTICAL_DEPTH, GLASS_MAX_RADIANCE} from "../glass-optics"

const constants = `
const ACCUMULATION_SCALE: f32 = ${GLASS_ACCUMULATION_SCALE};
const MAX_OPTICAL_DEPTH: f32 = ${GLASS_MAX_OPTICAL_DEPTH}.0;
const MAX_RADIANCE: f32 = ${GLASS_MAX_RADIANCE}.0;
const FP16_MAX: f32 = ${GLASS_FP16_MAX}.0;
`

/** Single-sample стекло читает существующий opaque depth, не создавая MSAA FP16 targets. */
export function glassShader(sampleCount: number): string {
  if (sampleCount !== 1 && sampleCount !== 4) throw new RangeError("Стеклянный проход требует opaque MSAA 1 или 4")
  const depth = sampleCount === 1
    ? "@group(2) @binding(0) var opaqueDepth: texture_depth_2d;"
    : "@group(2) @binding(0) var opaqueDepth: texture_depth_multisampled_2d;"
  const visibility = sampleCount === 1
    ? "return select(0.0, 1.0, position.z < textureLoad(opaqueDepth, pixel, 0));"
    : `var visible = 0.0;
    for (var sampleIndex = 0; sampleIndex < ${sampleCount}; sampleIndex += 1) {
        visible += select(0.0, 1.0, position.z < textureLoad(opaqueDepth, pixel, sampleIndex));
    }
    return visible / ${sampleCount}.0;`
  return composePresentationClipShader(source
    .replace("// @glass-constants", constants)
    .replace("// @glass-depth", depth)
    .replace("// @glass-depth-visibility", visibility))
}

export const glassCompositeShader = composite.replace("// @glass-constants", constants)

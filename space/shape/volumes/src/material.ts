import {Color, GlassMaterial, HolographicMaterial, LineGlowMaterial} from "@zavx0z/immersive-engine"
import type {XRMaterialProjectionContext} from "../../../src/elements.ts"
import type {SpatialVolumeMaterialDefaults} from "../contract/material-defaults.ts"

/** Проверяет только fallback; CSS продолжает разрешаться общим каскадом Browser. */
export function resolveVolumeMaterialDefaults(input?: SpatialVolumeMaterialDefaults) {
  const appearance = input?.appearance ?? "holographic"
  if (appearance !== "glass" && appearance !== "holographic") throw new TypeError("materialDefaults.appearance требует holographic или glass")
  for (const key of ["opacity", "outlineOpacity", "selectedOpacity", "selectedOutlineOpacity"] as const) {
    const value = input?.[key]
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)) throw new RangeError(`materialDefaults.${key} требует число от 0 до 1`)
  }
  return {appearance, opacity: input?.opacity ?? .12, outlineOpacity: input?.outlineOpacity ?? .65,
    selectedOpacity: input?.selectedOpacity, selectedOutlineOpacity: input?.selectedOutlineOpacity ?? .95}
}

/** Только разрешённые значения CSS; парсер и каскад принадлежат Renderer. */
export function volumeMaterial(color: number | string, context?: XRMaterialProjectionContext, defaultAppearance: "glass" | "holographic" = "holographic") {
  const tint = tinted(color, context)
  const opacity = (context?.opacity ?? .12) * (context?.color.a ?? 1)
  const appearance = context?.customProperties["--spatial-volume-appearance"]?.trim() || defaultAppearance
  if (appearance === "glass") return new GlassMaterial({tintColor: new Color(tint.r, tint.g, tint.b, opacity)})
  if (appearance !== "holographic") throw new TypeError("--spatial-volume-appearance требует holographic или glass")
  return new HolographicMaterial({color: tint, opacity, rimStrength: 1.25, scanDensity: .05, scanSharpness: .3, irregularity: .1})
}

export function volumeOutlineMaterial(color: number | string, context?: XRMaterialProjectionContext) {
  // Прозрачные контуры проверяют depth, но не закрывают им последующие стеклянные грани.
  // При distanceFade=0 нейтральная intensity=1 сохраняет fade=1 без деления 0/0.
  return new LineGlowMaterial({color: tinted(color, context), opacity: (context?.opacity ?? .65) * (context?.color.a ?? 1),
    distanceFade: 0, visibilityMode: "silhouette", glowIntensity: 1, luminanceBoost: 1, shimmerAmount: 0, silhouetteAmount: 0})
}

function tinted(color: number | string, context?: XRMaterialProjectionContext): Color {
  const tint = context?.color
  if (typeof color === "string") return tint === undefined ? new Color(0x67e8f9) : new Color(tint.r, tint.g, tint.b)
  const result = new Color(color)
  if (tint !== undefined) result.setRGB(result.r * tint.r, result.g * tint.g, result.b * tint.b)
  return result
}

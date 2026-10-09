/** Материальные fallback-значения; CSS предков имеет приоритет без переопределения variables. */
export type SpatialVolumeMaterialDefaults = Readonly<{
  appearance?: "holographic" | "glass" | undefined
  opacity?: number | undefined
  outlineOpacity?: number | undefined
  selectedOpacity?: number | undefined
  selectedOutlineOpacity?: number | undefined
}>

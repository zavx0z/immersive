import type {SpatialVolumePlane} from "./plane.ts"

/** Прямоугольный блок или сужающаяся ветвь; принадлежность и layer gap задаёт модель. */
export type SpatialVolume = Readonly<{
  id: string
  from: SpatialVolumePlane
  to: SpatialVolumePlane
  /** Стабильный RGB семейства; умножается на CSS tint материала. */
  color?: number | string | undefined
  /** У ветви можно отключить coarse picking, сохраняя её прозрачную геометрию. */
  interactive?: boolean | undefined
  /** Замыкать торцы; по умолчанию true. */
  caps?: boolean | undefined
}>

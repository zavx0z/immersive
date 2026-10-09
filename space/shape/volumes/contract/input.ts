import type {SpatialVolume} from "./volume.ts"
import type {SpatialVolumeMaterialDefaults} from "./material-defaults.ts"

/** Общие объёмы в существующем Space; CSS variables принадлежат этому же Document. */
export type SpatialVolumesProps = Readonly<{
  volumes: readonly SpatialVolume[]
  geometryRevision?: number | string | undefined
  visibleIds?: ReadonlySet<string> | readonly string[] | undefined
  disabledHitIds?: ReadonlySet<string> | undefined
  onActivate?: ((id: string, event: MouseEvent) => void) | undefined
  selectedId?: string | null | undefined
  materialDefaults?: SpatialVolumeMaterialDefaults | undefined
  style?: CssStyle | undefined
}>

import type {SpatialVolume} from "./volume.ts"
import type {SpatialVolumeMaterialDefaults} from "./material-defaults.ts"

/** Один самостоятельный объём через общий batch; Display и содержимое компонует Nodes. */
export type VolumeNodeProps = SpatialVolume & Readonly<{selected?: boolean | undefined; materialDefaults?: SpatialVolumeMaterialDefaults | undefined; style?: CssStyle | undefined; onActivate?: ((id: string, event: MouseEvent) => void) | undefined}>

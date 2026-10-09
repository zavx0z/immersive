import {readSpatialHit, type SpatialRay} from "@zavx0z/immersive-space"
import {hitVolumeBatch} from "./volumes/src/hit.ts"
import {useMemo} from "@zavx0z/immersive-component"
import type {SpatialVolumesProps} from "./volumes/contract/input.ts"
import type {VolumeNodeProps} from "./volumes/contract/node.ts"
import type {XRMaterialProjectionContext} from "../src/elements.ts"
import {cacheSpatialVolumes, createVolumeBatches} from "./volumes/src/geometry.ts"
import {resolveVolumeMaterialDefaults, volumeMaterial, volumeOutlineMaterial} from "./volumes/src/material.ts"
import "../src/jsx.ts"

export type {SpatialVolumesProps} from "./volumes/contract/input.ts"
export type {SpatialVolume} from "./volumes/contract/volume.ts"
export type {SpatialVolumePlane} from "./volumes/contract/plane.ts"
export type {VolumeNodeProps} from "./volumes/contract/node.ts"
export type {SpatialVolumeMaterialDefaults} from "./volumes/contract/material-defaults.ts"
export {spatialVolumeCorners} from "./volumes/src/geometry.ts"

/** Общий XYZ batch прозрачных блоков и ветвей, включая самостоятельные leaves. */
export function SpatialVolumes(props: SpatialVolumesProps) {
  const cache = useMemo(() => cacheSpatialVolumes(props.volumes), [props.geometryRevision ?? props.volumes])
  const ids = props.visibleIds === undefined ? [...cache.keys()] : [...props.visibleIds]
  const signature = JSON.stringify(ids)
  const batches = useMemo(() => createVolumeBatches(cache, ids, props.selectedId), [cache, signature, props.selectedId])
  const materialDefaults = useMemo(() => resolveVolumeMaterialDefaults(props.materialDefaults), [props.materialDefaults])
  return <xr-group
    name="spatial-volumes"
    style={css`
      color: var(--spatial-volume-tint, #ffffff);

      ${props.style}
    `}
  >
    {batches.map(batch => <VolumeBatch
      key={batch.key}
      batch={batch}
      materialDefaults={materialDefaults}
      disabledHitIds={props.disabledHitIds}
      onActivate={props.onActivate}
    />)}
  </xr-group>
}

function VolumeBatch(props: Readonly<{batch: ReturnType<typeof createVolumeBatches>[number]; materialDefaults: ReturnType<typeof resolveVolumeMaterialDefaults>; disabledHitIds: SpatialVolumesProps["disabledHitIds"]; onActivate: SpatialVolumesProps["onActivate"]}>) {
  const batch = props.batch
  const defaults = props.materialDefaults
  const disabled = props.disabledHitIds ?? emptyDisabled
  const hitTest = useMemo(() => props.onActivate === undefined ? null : (ray: SpatialRay) => hitVolumeBatch(batch, ray, disabled), [batch, disabled, props.onActivate])
  const surface = useMemo(() => () => batch.surface, [batch.surface])
  const outline = useMemo(() => () => batch.outline, [batch.outline])
  const material = useMemo(() => (_element: object, context?: XRMaterialProjectionContext) => volumeMaterial(batch.color, context, defaults.appearance), [batch.color, defaults.appearance])
  const edgeMaterial = useMemo(() => (_element: object, context?: XRMaterialProjectionContext) => volumeOutlineMaterial(batch.color, context), [batch.color])
  const surfaceOpacity = batch.selected ? defaults.selectedOpacity === undefined
    ? `var(--spatial-volume-selected-opacity, var(--spatial-volume-opacity, ${defaults.opacity}))`
    : `var(--spatial-volume-selected-opacity, ${defaults.selectedOpacity})`
    : `var(--spatial-volume-opacity, ${defaults.opacity})`
  const outlineOpacity = batch.selected
    ? `var(--spatial-volume-selected-outline-opacity, ${defaults.selectedOutlineOpacity})`
    : `var(--spatial-volume-outline-opacity, ${defaults.outlineOpacity})`
  return <xr-group
    style={css`
      color: ${typeof batch.color === "string" ? batch.color : "inherit"};
    `}
  >
    <xr-mesh
      name="spatial-volume-surfaces"
      hitTest={hitTest}
      onClick={event => {
        const hit = readSpatialHit(event)
        if (hit !== null) props.onActivate?.(hit.id, event)
      }}
    >
      <xr-geometry factory={surface} />
      <xr-material
        factory={material}
        styleProperties={["--spatial-volume-appearance"]}
        style={css`opacity: ${surfaceOpacity};`}
      />
    </xr-mesh>
    <xr-line-segments name="spatial-volume-outlines">
      <xr-geometry factory={outline} />
      <xr-material
        factory={edgeMaterial}
        style={css`opacity: ${outlineOpacity};`}
      />
    </xr-line-segments>
  </xr-group>
}

const emptyDisabled: ReadonlySet<string> = new Set()

/** Один блок; многим сущностям предпочтителен один общий SpatialVolumes. */
export function VolumeNode(props: VolumeNodeProps) {
  const volumes = useMemo(() => [{id: props.id, from: props.from, to: props.to, color: props.color, caps: props.caps, interactive: props.interactive}], [props.id, props.from, props.to, props.color, props.caps, props.interactive])
  return <SpatialVolumes
    volumes={volumes}
    selectedId={props.selected ? props.id : null}
    materialDefaults={props.materialDefaults}
    onActivate={props.onActivate}
    style={props.style}
  />
}

/** Сужающаяся ветвь использует тот же XYZ loft и CSS-материалы. */
export function BranchVolume(props: VolumeNodeProps) {
  return <VolumeNode
    id={props.id}
    from={props.from}
    to={props.to}
    color={props.color}
    caps={props.caps}
    interactive={props.interactive}
    selected={props.selected}
    materialDefaults={props.materialDefaults}
    onActivate={props.onActivate}
    style={props.style}
  />
}

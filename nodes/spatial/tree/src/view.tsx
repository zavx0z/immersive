import type {DisplayElement} from "@zavx0z/immersive-dom/display"
import {useMemo, useSyncExternalStore} from "@zavx0z/immersive-component"
import {composeSlot} from "@zavx0z/immersive-component/slot"
import {Grid} from "@zavx0z/immersive-space/gizmo/grid"
import {SpatialVolumes, type SpatialVolumeMaterialDefaults} from "@zavx0z/immersive-space/shape/volumes"
import {Frame} from "../../../frame/index.tsx"
import type {SpatialTreeState, SpatialTreeSnapshot} from "../contract/controller.ts"
import {SPATIAL_TREE_HEADER, type SpatialTreeDisplay} from "./scene.ts"

/**
Послойное объёмное дерево в существующем Space. Один Display на материализованную
сущность; холодные тела остаются общей пространственной геометрией. Содержимое
поступает через публичную композицию Component в том же Document.
*/
export function SpatialTree(props: Readonly<{source: SpatialTreeState; style?: CssStyle}>) {
  const state = useSyncExternalStore(props.source.subscribe, props.source.getSnapshot)
  return <>
    <xr-group name="Призматическое дерево" style={props.style}>
      {state === null ? null : <TreeGeometry state={state} />}
    </xr-group>
    {state === null ? null : <TreeDisplays state={state} style={props.style} prefix={props.source.id} />}
  </>
}

function TreeGeometry(props: Readonly<{state: SpatialTreeSnapshot}>) {
  const state = props.state
  const roles = useMemo(() => {
    const bodies = state.bodyVolumes ?? state.volumes.filter(volume => volume.caps !== false)
    const branches = state.branchVolumes ?? state.volumes.filter(volume => volume.caps === false)
    return {bodies, branches, bodyIds: new Set(bodies.map(volume => volume.id))}
  }, [state.geometryRevision, state.volumes, state.bodyVolumes, state.branchVolumes])
  const visible = useMemo(() => {
    const bodies: string[] = [], branches: string[] = []
    for (const id of state.visibleVolumeIds) (roles.bodyIds.has(id) ? bodies : branches).push(id)
    return {bodies, branches}
  }, [state.visibleVolumeIds, roles])
  return <>
    {state.showGrid === true ? <Grid
      name="Нулевой уровень пола"
      size={state.floor.size}
      divisions={state.floor.divisions}
      position={state.floor.position}
      distanceFade={state.floor.distanceFade}
      colorCenterLine={0x668899}
      colorGrid={0x3d4756}
    /> : null}
    <xr-group name="spatial-tree-bodies">
      <SpatialVolumes
        volumes={roles.bodies}
        visibleIds={visible.bodies}
        disabledHitIds={state.disabledHitIds}
        geometryRevision={state.geometryRevision}
        selectedId={state.selectedVolumeId}
        onActivate={state.onVolumeActivate}
        materialDefaults={bodyMaterialDefaults}
      />
    </xr-group>
    <xr-group name="spatial-tree-branches">
      <SpatialVolumes
        volumes={roles.branches}
        visibleIds={visible.branches}
        geometryRevision={state.geometryRevision}
        materialDefaults={branchMaterialDefaults}
      />
    </xr-group>
  </>
}

const bodyMaterialDefaults: SpatialVolumeMaterialDefaults = {appearance: "glass", opacity: .10, outlineOpacity: .40, selectedOpacity: .18, selectedOutlineOpacity: .90}
const branchMaterialDefaults: SpatialVolumeMaterialDefaults = {appearance: "glass", opacity: .025, outlineOpacity: .10, selectedOpacity: .18, selectedOutlineOpacity: .90}

function TreeDisplays(props: Readonly<{state: SpatialTreeSnapshot; style?: CssStyle | undefined; prefix: string}>) {
  return <>
    {props.state.nodes.map(node => <TreeDisplay
      key={node.id}
      node={node}
      state={props.state}
      style={props.style}
      prefix={props.prefix}
    />)}
  </>
}

function TreeDisplay(props: Readonly<{node: SpatialTreeDisplay; state: SpatialTreeSnapshot; style?: CssStyle | undefined; prefix: string}>) {
  const node = props.node
  const ready = useMemo(() => (display: DisplayElement | null) => {
    props.state.onHost(node.id, display)
  }, [node.id, props.state.onHost])
  return <display
    id={`${props.prefix}-display-${encodeURIComponent(node.id)}`}
    data-spatial-node-id={node.id}
    ref={ready}
    width={node.rect.width}
    height={node.rect.height}
    style={css`
      box-sizing: border-box;
      width: ${node.viewport.width}px;
      height: ${node.viewport.height}px;
      translate: ${node.rect.x + node.rect.width / 2}mm ${node.rect.y + node.rect.height / 2}mm ${node.rect.z}mm;
      rotate: x 0deg;
      background: transparent;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      ${props.style}
    `}
  >
    <TreeFace node={node} state={props.state} />
  </display>
}

function TreeFace(props: Readonly<{node: SpatialTreeDisplay; state: SpatialTreeSnapshot}>) {
  const node = props.node
  const loaded = props.state.contentById.has(node.id)
  return <Frame
    id={node.id}
    label={node.label}
    rect={{x: 0, y: 0, width: node.viewport.width, height: node.viewport.height}}
    selected={props.state.selectedId === node.id}
    onActivate={event => {
      const target = event.target as HTMLElement | null
      if (loaded && typeof target?.closest === "function" && target.closest("[data-spatial-node-body]") !== null) return
      props.state.onActivate(node.id, true)
    }}
    style={css`
      overflow: hidden;
      background: rgba(28, 38, 52, var(--spatial-node-surface-opacity, .34));
      border-color: ${node.color};
      color: var(--spatial-node-foreground, #edf2f7);
      box-shadow: none;

      --frame-selected-border-color: ${node.color};
      --frame-selected-shadow: none;
    `}
  >
    <TreeBody node={node} state={props.state} />
  </Frame>
}

function TreeBody(props: Readonly<{node: SpatialTreeDisplay; state: SpatialTreeSnapshot}>) {
  const node = props.node
  const loaded = props.state.contentById.has(node.id)
  return <div
    data-spatial-node-body={node.id}
    onPointerDown={() => {
      if (loaded && props.state.selectedId !== node.id) props.state.onActivate(node.id, false)
    }}
    style={css`
      display: flex;
      flex-direction: column;
      width: 100%;
      height: ${Math.max(1, node.viewport.height - SPATIAL_TREE_HEADER - 2)}px;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    `}
  >
    {loaded ? <TreeContent node={node} state={props.state} /> : <NodeLabel label={node.label} />}
  </div>
}

/** Готовое содержимое участвует в обычном Component lifecycle той же области. */
function TreeContent(props: Readonly<{node: SpatialTreeDisplay; state: SpatialTreeSnapshot}>) {
  const content = composeSlot({content: props.state.contentById.get(props.node.id)})
  return <>{content}</>
}

function NodeLabel(props: Readonly<{label: string}>) {
  return <div
    style={css`
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 24px;
      color: var(--spatial-node-foreground, #edf2f7);
      font-size: 48px;
      text-align: center;
    `}
  >
    {props.label}
  </div>
}

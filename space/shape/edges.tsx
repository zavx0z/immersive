import {useMemo} from "@zavx0z/immersive-component"
import {LineBasicMaterial} from "@zavx0z/immersive-engine"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {SpatialEdgesProps} from "./edges/contract/input.ts"
import {cacheSpatialRoutes, createSpatialBatch, spatialStyleSignature, updateSpatialColors} from "./edges/src/batch.ts"
import {readSpatialHit} from "@zavx0z/immersive-space"
import {hitSpatialBatch} from "./edges/src/hit.ts"
import "../src/jsx.ts"

export type {SpatialEdgesProps} from "./edges/contract/input.ts"
export type {SpatialEdge} from "./edges/contract/edge.ts"
export type {SpatialEdgeRoute} from "./edges/contract/route.ts"
export type {SpatialEdgeBounds} from "./edges/contract/bounds.ts"
export {spatialEdgeBounds, tessellateSpatialEdge} from "./edges/src/geometry.ts"

/**
Все связи используют XYZ в мм одного Space. Точки и endpoints разрешает владелец
модели. Один semantic LineSegments рисует общий batch с native stroke 1px.
Геометрия кешируется по geometryRevision; камера и выбор не меняют маршруты.
Изменение цвета обновляет только соответствующие диапазоны color buffer.
*/
export function SpatialEdges(props: SpatialEdgesProps): JSX.Element {
  const hitTolerance = props.hitTolerance ?? 2
  if (!Number.isFinite(hitTolerance) || hitTolerance <= 0) throw new RangeError("Радиус попадания должен быть положительным конечным числом в мм")
  const edgeIndex = useMemo(() => new Map(props.edges.map(edge => [edge.id, edge])), [props.edges])
  const styleSignature = useMemo(() => spatialStyleSignature(props), [props.edges, props.selectedId, props.selectedColor])
  const cache = useMemo(() => cacheSpatialRoutes(props.edges), [props.geometryRevision ?? props.edges])
  const visibleIds = props.visibleIds === undefined
    ? props.edges.filter(edge => !edge.hidden).map(edge => edge.id)
    : [...props.visibleIds].filter(id => !edgeIndex.get(id)?.hidden)
  for (const id of visibleIds) if (!edgeIndex.has(id)) throw new TypeError(`Неизвестное ребро visibleIds: ${id}`)
  if (new Set(visibleIds).size !== visibleIds.length) throw new TypeError("visibleIds не содержит повторов")
  const visibilitySignature = JSON.stringify(visibleIds)
  const batch = useMemo(() => createSpatialBatch(cache, visibleIds), [cache, visibilitySignature])
  const geometryFactory = useMemo(() => {
    updateSpatialColors(batch, props, edgeIndex)
    return () => batch.geometry
  }, [batch, styleSignature])
  const disabled = useMemo(() => new Set(props.edges.filter(edge => edge.disabled).map(edge => edge.id)), [props.edges])
  const hitTest = useMemo(() => (ray: import("../contract/spatial-ray.ts").SpatialRay) => hitSpatialBatch(batch, ray, hitTolerance, disabled), [batch, hitTolerance, disabled])
  const materialFactory = useMemo(() => () => new LineBasicMaterial({vertexColors: true, distanceFade: 0}), [])
  return (
    <xr-line-segments
      hitTest={hitTest}
      onClick={event => {
        const hit = readSpatialHit(event)
        if (hit !== null) props.onActivate?.(hit.id, event)
      }}
      visible={props.visible}
      name={props.name}
      ref={props.ref}
    >
      <xr-geometry factory={geometryFactory} />
      <xr-material factory={materialFactory} />
    </xr-line-segments>
  )
}

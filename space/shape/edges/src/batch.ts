import {BufferAttribute, BufferGeometry, Sphere, Vector3} from "@zavx0z/immersive-engine"
import type {SpatialEdgeBounds} from "../contract/bounds.ts"
import type {SpatialEdge} from "../contract/edge.ts"
import type {SpatialEdgesProps} from "../contract/input.ts"
import {spatialEdgeBounds, tessellateSpatialEdge} from "./geometry.ts"

export function cacheSpatialRoutes(edges: readonly SpatialEdge[]) {
  const routes = new Map<string, ReturnType<typeof tessellateSpatialEdge>>()
  const bounds = new Map<string, ReturnType<typeof spatialEdgeBounds>>()
  for (const edge of edges) {
    if (!edge.id.trim() || routes.has(edge.id)) throw new TypeError("Рёбра требуют непустые уникальные id")
    routes.set(edge.id, tessellateSpatialEdge(edge.route))
    bounds.set(edge.id, spatialEdgeBounds(edge.route))
  }
  return {routes, bounds}
}

export function createSpatialBatch(cache: ReturnType<typeof cacheSpatialRoutes>, ids: readonly string[]) {
  const vertices: number[] = []
  const ranges: {id: string; offset: number; count: number; bounds: SpatialEdgeBounds}[] = []
  const min = new Vector3(Infinity, Infinity, Infinity)
  const max = new Vector3(-Infinity, -Infinity, -Infinity)
  for (const id of ids) {
    const points = cache.routes.get(id)
    const bounds = cache.bounds.get(id)
    if (!points || !bounds) throw new Error("Состав рёбер изменился без изменения geometryRevision")
    const offset = vertices.length
    for (let index = 1; index < points.length; index++) {
      for (const point of [points[index - 1]!, points[index]!]) vertices.push(point.x, point.y, point.z)
    }
    const renderedBounds = {
      min: {x: Math.min(bounds.min.x, Math.fround(bounds.min.x)), y: Math.min(bounds.min.y, Math.fround(bounds.min.y)), z: Math.min(bounds.min.z, Math.fround(bounds.min.z))},
      max: {x: Math.max(bounds.max.x, Math.fround(bounds.max.x)), y: Math.max(bounds.max.y, Math.fround(bounds.max.y)), z: Math.max(bounds.max.z, Math.fround(bounds.max.z))},
    }
    ranges.push({id, offset, count: vertices.length - offset, bounds: renderedBounds})
    min.x = Math.min(min.x, renderedBounds.min.x)
    min.y = Math.min(min.y, renderedBounds.min.y)
    min.z = Math.min(min.z, renderedBounds.min.z)
    max.x = Math.max(max.x, renderedBounds.max.x)
    max.y = Math.max(max.y, renderedBounds.max.y)
    max.z = Math.max(max.z, renderedBounds.max.z)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3))
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(vertices.length), 3))
  const center = ids.length === 0 ? new Vector3() : min.clone().add(max).multiplyScalar(.5)
  geometry.boundingSphere = new Sphere(center, ids.length === 0 ? 0 : center.distanceTo(max))
  return {geometry, ranges, bounds: {min, max}}
}

export function spatialStyleSignature(props: SpatialEdgesProps): string {
  const selectedColor = props.selectedColor ?? 0x67e8f9
  validateColor(selectedColor)
  const seen = new Set<string>()
  const styles = props.edges.map(edge => {
    if (!edge.id.trim() || seen.has(edge.id)) throw new TypeError("Рёбра требуют непустые уникальные id")
    seen.add(edge.id)
    validateColor(edge.color ?? 0x94a3b8)
    return [edge.id, edge.hidden ?? false, colorFor(edge, props.selectedId, selectedColor)]
  })
  return JSON.stringify(styles)
}

export function updateSpatialColors(batch: ReturnType<typeof createSpatialBatch>, props: SpatialEdgesProps, edges: ReadonlyMap<string, SpatialEdge>): void {
  const attribute = batch.geometry.attributes.color!
  const colors = attribute.array
  for (const range of batch.ranges) {
    const edge = edges.get(range.id)
    if (!edge) throw new Error("Состав рёбер изменился без изменения geometryRevision")
    const color = colorFor(edge, props.selectedId, props.selectedColor ?? 0x67e8f9)
    const rgb = [(color >>> 16) / 255, ((color >>> 8) & 255) / 255, (color & 255) / 255].map(Math.fround)
    let changed = false
    for (let offset = range.offset; offset < range.offset + range.count; offset++) {
      const next = rgb[(offset - range.offset) % 3]!
      if (colors[offset] === next) continue
      colors[offset] = next
      changed = true
    }
    if (changed) attribute.addUpdateRange(range.offset, range.count)
  }
}

function colorFor(edge: SpatialEdge, selectedId: SpatialEdgesProps["selectedId"], selectedColor: number): number {
  return edge.disabled ? 0x64748b : selectedId === edge.id ? selectedColor : edge.color ?? 0x94a3b8
}

function validateColor(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffff) throw new RangeError("Цвет ребра должен быть целым RGB 0x000000..0xffffff")
}

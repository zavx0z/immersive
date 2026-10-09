import type {SpatialEdgeBounds} from "../contract/bounds.ts"
import type {SpatialRay} from "../../../contract/spatial-ray.ts"
import type {SpatialHit} from "../../../contract/spatial-hit.ts"
import type {SpatialVector} from "../../../src/props.ts"
import type {createSpatialBatch} from "./batch.ts"

/** Ближайшее попадание луча к XYZ segments; камера не меняет cached геометрию. */
export function hitSpatialBatch(
  batch: ReturnType<typeof createSpatialBatch>,
  ray: SpatialRay,
  tolerance: number,
  disabled: ReadonlySet<string>,
): SpatialHit | null {
  if (!Number.isFinite(tolerance) || tolerance <= 0) throw new RangeError("Радиус попадания должен быть положительным конечным числом в мм")
  const directionLength = Math.hypot(ray.direction.x, ray.direction.y, ray.direction.z)
  if (!Number.isFinite(directionLength) || directionLength === 0 || ![ray.origin.x, ray.origin.y, ray.origin.z].every(Number.isFinite)) return null
  const direction = {x: ray.direction.x / directionLength, y: ray.direction.y / directionLength, z: ray.direction.z / directionLength}
  if (batch.ranges.length === 0 || !rayIntersectsBounds(ray.origin, direction, batch.bounds, tolerance, Infinity)) return null
  const positions = batch.geometry.attributes.position!.array
  let best: SpatialHit | null = null
  for (const range of batch.ranges) {
    if (disabled.has(range.id) || !rayIntersectsBounds(ray.origin, direction, range.bounds, tolerance, best?.distance ?? Infinity)) continue
    for (let offset = range.offset; offset < range.offset + range.count; offset += 6) {
      const a = {x: positions[offset]!, y: positions[offset + 1]!, z: positions[offset + 2]!}
      const b = {x: positions[offset + 3]!, y: positions[offset + 4]!, z: positions[offset + 5]!}
      const result = raySegment(ray.origin, direction, a, b)
      if (result.separation > tolerance || best !== null && result.distance >= best.distance) continue
      best = {id: range.id, distance: result.distance, point: result.point}
    }
  }
  return best
}

function raySegment(origin: SpatialVector, direction: SpatialVector, start: SpatialVector, end: SpatialVector) {
  const v = {x: end.x - start.x, y: end.y - start.y, z: end.z - start.z}
  const w = {x: origin.x - start.x, y: origin.y - start.y, z: origin.z - start.z}
  const b = direction.x * v.x + direction.y * v.y + direction.z * v.z
  const c = v.x * v.x + v.y * v.y + v.z * v.z
  const d = direction.x * w.x + direction.y * w.y + direction.z * w.z
  const e = v.x * w.x + v.y * w.y + v.z * w.z
  const denominator = c - b * b
  let t = c === 0 ? 0 : denominator > Number.EPSILON * c ? (e - b * d) / denominator : e / c
  t = Math.max(0, Math.min(1, t))
  let distance = Math.max(0, b * t - d)
  if (distance === 0 && c > 0) t = Math.max(0, Math.min(1, e / c))
  const point = {x: start.x + t * v.x, y: start.y + t * v.y, z: start.z + t * v.z}
  const separation = Math.hypot(origin.x + distance * direction.x - point.x, origin.y + distance * direction.y - point.y, origin.z + distance * direction.z - point.z)
  return {distance, separation, point}
}


const axes = ["x", "y", "z"] as const

/** Расширенный кешированный AABB пропускает только возможные точные segment hits. */
function rayIntersectsBounds(origin: SpatialVector, direction: SpatialVector, bounds: SpatialEdgeBounds, tolerance: number, farthest: number): boolean {
  let near = 0
  let far = farthest
  for (const axis of axes) {
    const lower = bounds.min[axis] - tolerance
    const upper = bounds.max[axis] + tolerance
    const component = direction[axis]
    if (component === 0) {
      if (origin[axis] < lower || origin[axis] > upper) return false
      continue
    }
    const first = (lower - origin[axis]) / component
    const second = (upper - origin[axis]) / component
    near = Math.max(near, Math.min(first, second))
    far = Math.min(far, Math.max(first, second))
    if (near > far) return false
  }
  return true
}

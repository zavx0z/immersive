import type {ViewPointFrustumPlane} from "@zavx0z/immersive-engine"
import type {SpatialVolumePlane} from "@zavx0z/immersive-space/shape/volumes"
import type {SpatialTreeBounds} from "./scene.ts"

export type VisibilityEntry = Readonly<{id: string; bounds: SpatialTreeBounds}>
export type VisibilityQuery = Readonly<{ids: readonly string[]; truncated: boolean; visited: number}>
type Vector = Readonly<{x: number; y: number; z: number}>
type Branch = {bounds: SpatialTreeBounds; id?: string; left?: Branch; right?: Branch}

/** Неизменный balanced 3D BVH; запрос обходит ближние ветви с ограниченным числом посещений. */
export function createSpatialVisibilityIndex(input: readonly VisibilityEntry[]) {
  const ids = new Set<string>()
  const entries = input.map(entry => {
    if (!entry.id || ids.has(entry.id)) throw new TypeError("Visibility entries require unique non-empty IDs")
    ids.add(entry.id)
    validateBounds(entry.bounds)
    return {id: entry.id, bounds: {min: {...entry.bounds.min}, max: {...entry.bounds.max}}}
  })
  const build = (values: typeof entries, depth: number): Branch | null => {
    if (values.length === 0) return null
    if (values.length === 1) return values[0]!
    const axis = (["x", "y", "z"] as const)[depth % 3]!
    values.sort((a, b) => (a.bounds.min[axis] / 2 + a.bounds.max[axis] / 2) -
      (b.bounds.min[axis] / 2 + b.bounds.max[axis] / 2) || a.id.localeCompare(b.id))
    const middle = values.length >> 1
    const left = build(values.slice(0, middle), depth + 1)!
    const right = build(values.slice(middle), depth + 1)!
    return {left, right, bounds: unionBounds(left.bounds, right.bounds)}
  }
  const root = build(entries, 0)
  return Object.freeze({
    size: input.length,
    query(planes: readonly ViewPointFrustumPlane[], options: Readonly<{eye: Vector; limit: number; maxVisited?: number}>): VisibilityQuery {
      if (!Number.isSafeInteger(options.limit) || options.limit < 1 || ![options.eye.x, options.eye.y, options.eye.z].every(Number.isFinite)) {
        throw new RangeError("Visibility query requires a positive limit and finite eye")
      }
      const maximum = options.maxVisited ?? Math.max(64, options.limit * 8)
      if (!Number.isSafeInteger(maximum) || maximum < 1) throw new RangeError("Visibility visit budget must be positive")
      for (const plane of planes) if (![plane.normal.x, plane.normal.y, plane.normal.z, plane.constant].every(Number.isFinite)) {
        throw new RangeError("Visibility planes must be finite")
      }
      const heap: {branch: Branch; distance: number}[] = []
      const push = (branch: Branch) => {
        const entry = {branch, distance: distanceToBounds(branch.bounds, options.eye)}
        heap.push(entry)
        let index = heap.length - 1
        while (index > 0) {
          const parent = (index - 1) >> 1
          if (heap[parent]!.distance <= entry.distance) break
          heap[index] = heap[parent]!
          index = parent
        }
        heap[index] = entry
      }
      const pop = () => {
        const first = heap[0]!
        const last = heap.pop()!
        if (heap.length > 0) {
          let index = 0
          while (index * 2 + 1 < heap.length) {
            let child = index * 2 + 1
            if (child + 1 < heap.length && heap[child + 1]!.distance < heap[child]!.distance) child++
            if (last.distance <= heap[child]!.distance) break
            heap[index] = heap[child]!
            index = child
          }
          heap[index] = last
        }
        return first.branch
      }
      if (root !== null) push(root)
      const found: string[] = []
      let visited = 0
      while (heap.length > 0 && visited < maximum) {
        const branch = pop()
        visited++
        if (!intersectsFrustum(branch.bounds, planes)) continue
        if (branch.id !== undefined) {
          if (found.length === options.limit) return {ids: found, truncated: true, visited}
          found.push(branch.id)
        } else {
          if (branch.left !== undefined) push(branch.left)
          if (branch.right !== undefined) push(branch.right)
        }
      }
      return {ids: found, truncated: heap.length > 0, visited}
    },
  })
}

export function intersectsFrustum(bounds: SpatialTreeBounds, planes: readonly ViewPointFrustumPlane[]): boolean {
  for (const plane of planes) {
    const n = plane.normal
    const x = n.x >= 0 ? bounds.max.x : bounds.min.x
    const y = n.y >= 0 ? bounds.max.y : bounds.min.y
    const z = n.z >= 0 ? bounds.max.z : bounds.min.z
    if (n.x * x + n.y * y + n.z * z + plane.constant < 0) return false
  }
  return true
}

/** AABB готовых торцов: треугольники и GPU-геометрия для индекса не строятся. */
export function spatialVolumeBounds(from: SpatialVolumePlane, to: SpatialVolumePlane): SpatialTreeBounds {
  const bounds = (plane: SpatialVolumePlane): SpatialTreeBounds => {
    if ("width" in plane) return {min: {x: plane.x, y: plane.y, z: plane.z},
      max: {x: plane.x + plane.width, y: plane.y + plane.height, z: plane.z}}
    return {min: {x: Math.min(...plane.map(p => p.x)), y: Math.min(...plane.map(p => p.y)), z: Math.min(...plane.map(p => p.z))},
      max: {x: Math.max(...plane.map(p => p.x)), y: Math.max(...plane.map(p => p.y)), z: Math.max(...plane.map(p => p.z))}}
  }
  return unionBounds(bounds(from), bounds(to))
}

export function unionBounds(a: SpatialTreeBounds, b: SpatialTreeBounds): SpatialTreeBounds {
  return {min: {x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y), z: Math.min(a.min.z, b.min.z)},
    max: {x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y), z: Math.max(a.max.z, b.max.z)}}
}

function distanceToBounds(bounds: SpatialTreeBounds, point: Vector): number {
  const x = Math.max(bounds.min.x - point.x, 0, point.x - bounds.max.x)
  const y = Math.max(bounds.min.y - point.y, 0, point.y - bounds.max.y)
  const z = Math.max(bounds.min.z - point.z, 0, point.z - bounds.max.z)
  return x * x + y * y + z * z
}
function validateBounds(bounds: SpatialTreeBounds): void {
  for (const axis of ["x", "y", "z"] as const) if (!Number.isFinite(bounds.min[axis]) || !Number.isFinite(bounds.max[axis]) || bounds.min[axis] > bounds.max[axis]) {
    throw new RangeError("Visibility bounds must be finite and ordered")
  }
}

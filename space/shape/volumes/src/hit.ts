import type {SpatialRay} from "../../../contract/spatial-ray.ts"
import type {SpatialHit} from "../../../contract/spatial-hit.ts"
import type {createVolumeBatches} from "./geometry.ts"

/** Кешированные треугольники выбирают поверхность сущности до размещения её HTML Display. */
export function hitVolumeBatch(batch: ReturnType<typeof createVolumeBatches>[number], ray: SpatialRay, disabled: ReadonlySet<string>): SpatialHit | null {
  const length = Math.hypot(ray.direction.x, ray.direction.y, ray.direction.z)
  if (!Number.isFinite(length) || length === 0 || ![ray.origin.x, ray.origin.y, ray.origin.z].every(Number.isFinite)) return null
  const d = {x: ray.direction.x / length, y: ray.direction.y / length, z: ray.direction.z / length}
  let best: SpatialHit | null = null
  for (const record of batch.records) {
    if (record.volume.interactive === false || disabled.has(record.volume.id)) continue
    let near = 0, far = best?.distance ?? Infinity
    for (const axis of ["x", "y", "z"] as const) {
      if (d[axis] === 0) {
        if (ray.origin[axis] < record.bounds.min[axis] || ray.origin[axis] > record.bounds.max[axis]) far = -1
      } else {
        const a = (record.bounds.min[axis] - ray.origin[axis]) / d[axis]
        const b = (record.bounds.max[axis] - ray.origin[axis]) / d[axis]
        near = Math.max(near, Math.min(a, b))
        far = Math.min(far, Math.max(a, b))
      }
    }
    if (near > far) continue
    const a = record.positions
    for (let offset = 0; offset < a.length; offset += 9) {
      const ax = a[offset]!, ay = a[offset + 1]!, az = a[offset + 2]!
      const ux = a[offset + 3]! - ax, uy = a[offset + 4]! - ay, uz = a[offset + 5]! - az
      const vx = a[offset + 6]! - ax, vy = a[offset + 7]! - ay, vz = a[offset + 8]! - az
      const px = d.y * vz - d.z * vy, py = d.z * vx - d.x * vz, pz = d.x * vy - d.y * vx
      const determinant = ux * px + uy * py + uz * pz
      if (Math.abs(determinant) < 1e-12) continue
      const inverse = 1 / determinant
      const tx = ray.origin.x - ax, ty = ray.origin.y - ay, tz = ray.origin.z - az
      const u = (tx * px + ty * py + tz * pz) * inverse
      if (u < 0 || u > 1) continue
      const qx = ty * uz - tz * uy, qy = tz * ux - tx * uz, qz = tx * uy - ty * ux
      const v = (d.x * qx + d.y * qy + d.z * qz) * inverse
      if (v < 0 || u + v > 1) continue
      const distance = (vx * qx + vy * qy + vz * qz) * inverse
      if (distance < 0 || best !== null && distance >= best.distance) continue
      best = {id: record.volume.id, distance, point: {x: ray.origin.x + d.x * distance, y: ray.origin.y + d.y * distance, z: ray.origin.z + d.z * distance}}
    }
  }
  return best
}

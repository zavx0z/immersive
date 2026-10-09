import {BufferAttribute, BufferGeometry, Sphere, Vector3} from "@zavx0z/immersive-engine"
import type {SpatialVolume} from "../contract/volume.ts"
import type {SpatialVolumePlane} from "../contract/plane.ts"
import type {SpatialVector} from "../../../src/props.ts"

type VolumeGeometry = Readonly<{
  volume: SpatialVolume
  positions: readonly number[]
  normals: readonly number[]
  outline: readonly number[]
  bounds: Readonly<{min: SpatialVector; max: SpatialVector}>
}>

/** Преобразует Layout Rect3 в общий порядок XYZ-углов, без камеры и CSS px. */
export function spatialVolumeCorners(plane: SpatialVolumePlane): readonly SpatialVector[] {
  if ("width" in plane) {
    if (![plane.x, plane.y, plane.z, plane.width, plane.height].every(Number.isFinite) || plane.width <= 0 || plane.height <= 0) throw new RangeError("Прямоугольник объёма требует конечные XYZ и положительные размеры в мм")
    return spatialVolumeCorners([{x: plane.x, y: plane.y, z: plane.z}, {x: plane.x + plane.width, y: plane.y, z: plane.z}, {x: plane.x + plane.width, y: plane.y + plane.height, z: plane.z}, {x: plane.x, y: plane.y + plane.height, z: plane.z}])
  }
  if (!Array.isArray(plane) || plane.length !== 4 || plane.some(point => !point || ![point.x, point.y, point.z].every(value => Number.isFinite(value) && Number.isFinite(Math.fround(value))))) throw new RangeError("Торец требует четыре конечных XYZ-угла")
  return plane.map(point => ({x: point.x, y: point.y, z: point.z}))
}

/** Каждый input, включая leaf, имеет собственный полный блок и геометрический кеш. */
export function cacheSpatialVolumes(volumes: readonly SpatialVolume[]) {
  const cache = new Map<string, VolumeGeometry>()
  for (const volume of volumes) {
    if (!volume.id.trim() || cache.has(volume.id)) throw new TypeError("Объёмы требуют непустые уникальные id")
    const color = volume.color ?? 0x67e8f9
    if (typeof color === "number" ? !Number.isInteger(color) || color < 0 || color > 0xffffff : !color.trim() || color.length > 2048) throw new RangeError("Цвет семейства требует RGB 0x000000..0xffffff")
    const a = spatialVolumeCorners(volume.from)
    const b = spatialVolumeCorners(volume.to)
    const positions: number[] = [], normals: number[] = [], outline: number[] = []
    for (let index = 0; index < 4; index++) {
      const next = (index + 1) % 4
      quad([a[index]!, b[index]!, b[next]!, a[next]!], positions, normals)
      for (const pair of [[a[index]!, a[next]!], [b[index]!, b[next]!], [a[index]!, b[index]!]]) for (const point of pair) outline.push(point.x, point.y, point.z)
    }
    if (volume.caps !== false) {
      quad(a, positions, normals)
      quad([b[3]!, b[2]!, b[1]!, b[0]!], positions, normals)
    }
    if (positions.length === 0) throw new RangeError("Объём требует ненулевую площадь поверхности")
    for (let index = 0; index < positions.length; index++) positions[index] = Math.fround(positions[index]!)
    for (let index = 0; index < outline.length; index++) outline[index] = Math.fround(outline[index]!)
    const min = {x: Infinity, y: Infinity, z: Infinity}
    const max = {x: -Infinity, y: -Infinity, z: -Infinity}
    for (let offset = 0; offset < positions.length; offset += 3) {
      for (const [index, axis] of ["x", "y", "z"].entries()) {
        const key = axis as "x" | "y" | "z"
        const value = Math.fround(positions[offset + index]!)
        min[key] = Math.min(min[key], value)
        max[key] = Math.max(max[key], value)
      }
    }
    cache.set(volume.id, {volume, positions, normals, outline, bounds: {min, max}})
  }
  return cache
}

/** Один Mesh и LineSegments на tint-группу; visible set использует готовые записи. */
export function createVolumeBatches(cache: ReturnType<typeof cacheSpatialVolumes>, ids: readonly string[], selectedId: string | null | undefined) {
  const groups = new Map<string, {color: number | string; selected: boolean; ids: string[]; records: VolumeGeometry[]; positions: number[]; normals: number[]; outline: number[]}>()
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) throw new TypeError("visibleIds не содержит повторов")
    seen.add(id)
    const record = cache.get(id)
    if (!record) throw new TypeError(`Неизвестный объём ${id}; состав требует новой geometryRevision`)
    const color = record.volume.color ?? 0x67e8f9
    const selected = id === selectedId
    const key = JSON.stringify([color, selected])
    const group = groups.get(key) ?? {color, selected, ids: [], records: [], positions: [], normals: [], outline: []}
    group.ids.push(id)
    group.records.push(record)
    group.positions.push(...record.positions)
    group.normals.push(...record.normals)
    group.outline.push(...record.outline)
    groups.set(key, group)
  }
  return [...groups].map(([key, data]) => ({key, color: data.color, selected: data.selected, ids: data.ids, records: data.records, surface: geometry(data.positions, data.normals), outline: geometry(data.outline)}))
}

function geometry(positions: readonly number[], normals?: readonly number[]): BufferGeometry {
  const result = new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(positions), 3))
  if (normals !== undefined) result.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3))
  if (positions.length > 0) result.computeBoundingSphere()
  else result.boundingSphere = new Sphere(new Vector3(), 0)
  return result
}

function quad(points: readonly SpatialVector[], positions: number[], normals: number[]): void {
  for (const indices of [[0, 1, 2], [0, 2, 3]]) {
    const a = points[indices[0]!]!, b = points[indices[1]!]!, c = points[indices[2]!]!
    const u = {x: b.x - a.x, y: b.y - a.y, z: b.z - a.z}
    const v = {x: c.x - a.x, y: c.y - a.y, z: c.z - a.z}
    const n = {x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x}
    const length = Math.hypot(n.x, n.y, n.z)
    if (length === 0) continue
    for (const point of [a, b, c]) {
      positions.push(point.x, point.y, point.z)
      normals.push(n.x / length, n.y / length, n.z / length)
    }
  }
}

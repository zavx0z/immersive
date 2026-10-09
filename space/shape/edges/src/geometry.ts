import type {SpatialVector} from "../../../src/props.ts"
import type {SpatialEdgeRoute} from "../contract/route.ts"
import type {SpatialEdgeBounds} from "../contract/bounds.ts"

/** Числовая аппроксимация в мм; не принимает и не читает камеру. */
export function tessellateSpatialEdge(route: SpatialEdgeRoute): readonly SpatialVector[] {
  validateRoute(route)
  if (route.kind === "polyline") return roundedPolyline(route.points, route.cornerRadius ?? 0, route.cornerSegments ?? 4)
  const count = route.segments ?? 32
  return Array.from({length: count + 1}, (_, index) => cubicPoint(route.points, index / count))
}

/** Точные extrema кубической кривой сохраняют габарит при любой аппроксимации. */
export function spatialEdgeBounds(route: SpatialEdgeRoute): SpatialEdgeBounds {
  validateRoute(route)
  const points = route.kind === "polyline" ? route.points : [route.points[0], route.points[3]]
  const min = {x: Infinity, y: Infinity, z: Infinity}
  const max = {x: -Infinity, y: -Infinity, z: -Infinity}
  for (const axis of ["x", "y", "z"] as const) {
    const values = points.map(point => point[axis])
    if (route.kind === "cubic") {
      const [p0, p1, p2, p3] = route.points.map(point => point[axis]) as [number, number, number, number]
      const a = -p0 + 3 * p1 - 3 * p2 + p3
      const b = 2 * (p0 - 2 * p1 + p2)
      const c = p1 - p0
      const roots = a === 0 ? b === 0 ? [] : [-c / b] : quadraticRoots(a, b, c)
      for (const t of roots) if (t > 0 && t < 1) values.push(cubicPoint(route.points, t)[axis])
    }
    for (const value of values) {
      min[axis] = Math.min(min[axis], value)
      max[axis] = Math.max(max[axis], value)
    }
  }
  return {min, max}
}

function roundedPolyline(points: readonly SpatialVector[], radius: number, segments: number): readonly SpatialVector[] {
  const distinct = points.filter((point, index) => index === 0 || point.x !== points[index - 1]!.x || point.y !== points[index - 1]!.y || point.z !== points[index - 1]!.z)
    .map(point => ({x: point.x, y: point.y, z: point.z}))
  if (radius === 0) return points.map(point => ({x: point.x, y: point.y, z: point.z}))
  if (distinct.length < 2) return [distinct[0]!, {...distinct[0]!}]
  const result: SpatialVector[] = [distinct[0]!]
  for (let index = 1; index < distinct.length - 1; index++) {
    const previous = distinct[index - 1]!
    const corner = distinct[index]!
    const next = distinct[index + 1]!
    const incoming = {x: corner.x - previous.x, y: corner.y - previous.y, z: corner.z - previous.z}
    const outgoing = {x: next.x - corner.x, y: next.y - corner.y, z: next.z - corner.z}
    const before = Math.hypot(incoming.x, incoming.y, incoming.z)
    const after = Math.hypot(outgoing.x, outgoing.y, outgoing.z)
    const cosine = (incoming.x * outgoing.x + incoming.y * outgoing.y + incoming.z * outgoing.z) / (before * after)
    // Прямой участок и разворот не определяют плоскость округления и сохраняют вершину.
    if (Math.abs(cosine) > 1 - 1e-10) {
      result.push(corner)
      continue
    }
    const cut = Math.min(radius, before / 2, after / 2)
    const start = {x: corner.x - incoming.x * cut / before, y: corner.y - incoming.y * cut / before, z: corner.z - incoming.z * cut / before}
    const end = {x: corner.x + outgoing.x * cut / after, y: corner.y + outgoing.y * cut / after, z: corner.z + outgoing.z * cut / after}
    result.push(start)
    for (let segment = 1; segment <= segments; segment++) {
      const t = segment / segments
      const inverse = 1 - t
      result.push({
        x: inverse ** 2 * start.x + 2 * inverse * t * corner.x + t ** 2 * end.x,
        y: inverse ** 2 * start.y + 2 * inverse * t * corner.y + t ** 2 * end.y,
        z: inverse ** 2 * start.z + 2 * inverse * t * corner.z + t ** 2 * end.z,
      })
    }
  }
  result.push(distinct.at(-1)!)
  return result
}

function quadraticRoots(a: number, b: number, c: number): readonly number[] {
  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) return []
  const root = Math.sqrt(discriminant)
  const q = -.5 * (b + (b < 0 ? -root : root))
  return q === 0 ? [-b / (2 * a)] : [q / a, c / q]
}

function cubicPoint(points: readonly SpatialVector[], t: number): SpatialVector {
  const inverse = 1 - t
  const weights = [inverse ** 3, 3 * inverse ** 2 * t, 3 * inverse * t ** 2, t ** 3]
  const value = {x: 0, y: 0, z: 0}
  for (let index = 0; index < 4; index++) {
    const point = points[index]!
    const weight = weights[index]!
    value.x += weight * point.x
    value.y += weight * point.y
    value.z += weight * point.z
  }
  return value
}

function validateRoute(route: SpatialEdgeRoute): void {
  if (!route || (route.kind !== "polyline" && route.kind !== "cubic")) throw new TypeError("Ребро требует polyline или cubic маршрут")
  if (!Array.isArray(route.points) || route.points.length < 2 || route.kind === "cubic" && route.points.length !== 4) {
    throw new RangeError("Polyline требует минимум две точки, cubic — четыре")
  }
  for (const point of route.points) {
    if (!point || ![point.x, point.y, point.z].every(value => Number.isFinite(value) && Number.isFinite(Math.fround(value)))) {
      throw new RangeError("Точки ребра требуют три конечные координаты Float32 в мм")
    }
  }
  if (route.kind === "polyline") {
    const radius = route.cornerRadius ?? 0
    const segments = route.cornerSegments ?? 4
    if (!Number.isFinite(radius) || radius < 0) throw new RangeError("Радиус перегиба должен быть конечным неотрицательным числом в мм")
    if (!Number.isInteger(segments) || segments < 1 || segments > 64) throw new RangeError("Число отрезков перегиба должно быть целым от 1 до 64")
  }
  if (route.kind === "cubic") {
    const segments = route.segments ?? 32
    if (!Number.isInteger(segments) || segments < 1 || segments > 4096) throw new RangeError("Число отрезков cubic должно быть целым от 1 до 4096")
  }
}

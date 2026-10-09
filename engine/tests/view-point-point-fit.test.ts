import {expect, test} from "bun:test"
import {Vector3, ViewPoint, type ViewPointPose} from "../src/index.ts"

type Point = {x: number; y: number; z: number}
const back = {x: .35, y: -.75, z: .56}
const options = {fov: 1, aspect: 16 / 9, padding: 1.12}
const points: Point[] = []
// Наклонная цепочка объёмов не содержит пустых крайних углов своей world AABB.
for (let i = 0; i < 6; i++) for (let corner = 0; corner < 8; corner++) {
  points.push({x: i * 900 + ((corner & 1) ? 300 : 0),
    y: i * 900 + ((corner & 2) ? 150 : 0), z: -i * 500 - ((corner & 4) ? 250 : 0)})
}

function projected(points: readonly Point[], pose: ViewPointPose, aspect: number) {
  // Double world-to-view dot products отделяют fit от Float32 quantization Renderer.
  const direction = new Vector3(pose.position.x - pose.target.x, pose.position.y - pose.target.y, pose.position.z - pose.target.z).normalize()
  const right = new Vector3().crossVectors(new Vector3(0, 0, 1), direction)
  if (right.length() === 0) right.set(1, 0, 0)
  else right.normalize()
  const up = new Vector3().crossVectors(direction, right)
  return points.map(point => {
    const relative = new Vector3(point.x - pose.position.x, point.y - pose.position.y, point.z - pose.position.z)
    const depth = -relative.dot(direction)
    return {x: relative.dot(right) / (depth * Math.tan(options.fov / 2) * aspect),
      y: relative.dot(up) / (depth * Math.tan(options.fov / 2)), depth}
  })
}
const occupancy = (p: ReturnType<typeof projected>) => Math.max(
  Math.max(...p.map(p => p.x)) - Math.min(...p.map(p => p.x)),
  Math.max(...p.map(p => p.y)) - Math.min(...p.map(p => p.y))) / 2

for (const aspect of [16 / 9, 9 / 16]) for (const direction of [back, {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1}]) {
  test(`point fit вписывает фактические углы и заполняет limiting axis: aspect=${aspect}, back=${JSON.stringify(direction)}`, () => {
    const pose = ViewPoint.fitPoseForPoints(points, direction, {...options, aspect})
    for (const p of projected(points, pose, aspect)) {
      expect(p.depth).toBeGreaterThan(0)
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1 / options.padding + 1e-12)
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1 / options.padding + 1e-12)
    }
    expect(occupancy(projected(points, pose, aspect))).toBeCloseTo(1 / options.padding, 10)
  })
}

test("реальные точки дают более плотный overview, чем пустые world AABB corners", () => {
  const bounds = {min: {x: 0, y: 0, z: -2750}, max: {x: 4800, y: 4650, z: 0}}
  const pointPose = ViewPoint.fitPoseForPoints(points, back, options)
  const boundsPose = ViewPoint.fitPoseForBounds(bounds, back, options)
  expect(occupancy(projected(points, pointPose, options.aspect))).toBeGreaterThan(occupancy(projected(points, boundsPose, options.aspect)) * 1.4)
})

test("single pass iterable может повторно выдавать один DTO, большой перенос не меняет fit", () => {
  let count = 0
  let iterations = 0
  const iterable = {[Symbol.iterator]: function* () {
    if (++iterations > 1) throw new Error("second iteration")
    const point = {x: 0, y: 0, z: 0}
    for (const p of points) { Object.assign(point, p); count++; yield point }
  }}
  const initial = ViewPoint.fitPoseForPoints(iterable, back, options)
  expect(count).toBe(points.length)
  expect(iterations).toBe(1)
  const translation = {x: 1e12, y: -1e12, z: 1e12}
  const movedPoints = points.map(p => ({x: p.x + translation.x, y: p.y + translation.y, z: p.z + translation.z}))
  const moved = ViewPoint.fitPoseForPoints(movedPoints, back, options)
  for (const field of ["position", "target"] as const) for (const axis of ["x", "y", "z"] as const) {
    expect(Math.abs(moved[field][axis] - translation[axis] - initial[field][axis])).toBeLessThan(.001)
  }
  for (const p of projected(movedPoints, moved, options.aspect)) {
    expect(p.depth).toBeGreaterThan(0)
    expect(Math.abs(p.x)).toBeLessThanOrEqual(1 / options.padding + 1e-7)
    expect(Math.abs(p.y)).toBeLessThanOrEqual(1 / options.padding + 1e-7)
  }
})

test("пустые и невалидные points отклоняются, единичная точка имеет конечный forward depth", () => {
  expect(() => ViewPoint.fitPoseForPoints([], back, options)).toThrow(RangeError)
  expect(() => ViewPoint.fitPoseForPoints([{x: NaN, y: 0, z: 0}], back, options)).toThrow(RangeError)
  expect(() => ViewPoint.fitPoseForPoints(points, {x: 0, y: 0, z: 0}, options)).toThrow(RangeError)
  for (const invalid of [{fov: 0}, {fov: Math.PI}, {aspect: 0}, {padding: .5}]) {
    expect(() => ViewPoint.fitPoseForPoints(points, back, {...options, ...invalid})).toThrow(RangeError)
  }
  const point = {x: 1e12, y: 1e12, z: 1e12}
  const pose = ViewPoint.fitPoseForPoints([point], {x: 0, y: 0, z: 1}, options)
  expect(pose.target).toEqual(point)
  expect(pose.position.z).toBeGreaterThan(point.z)
})

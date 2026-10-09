import {expect, test} from "bun:test"
import {Matrix4, Vector3, ViewPoint, type ViewPointPose, type ViewPointWorldBounds} from "../src/index.ts"

const corners = (bounds: ViewPointWorldBounds) => [bounds.min.x, bounds.max.x].flatMap(x =>
  [bounds.min.y, bounds.max.y].flatMap(y => [bounds.min.z, bounds.max.z].map(z => new Vector3(x, y, z))),
)

function depth32(viewPoint: ViewPoint, worldY: number): number {
  const matrix = new Matrix4().multiplyMatrices(viewPoint.projectionMatrix, viewPoint.viewMatrix).elements
  const x = viewPoint.position.x
  const z = viewPoint.getTarget().z
  // Тот же combined viewProjection uniform и Float32 dots, что у WGSL.
  const clip = (row: number) => {
    const xy = Math.fround(Math.fround(matrix[row]! * x) + Math.fround(matrix[row + 4]! * worldY))
    const xyz = Math.fround(xy + Math.fround(matrix[row + 8]! * z))
    return Math.fround(xyz + matrix[row + 12]!)
  }
  return Math.fround(clip(2) / clip(3))
}

const bounds: ViewPointWorldBounds = {
  min: {x: 0, y: -0.4, z: -8000}, max: {x: 12000, y: 0, z: 0},
}
const pose: ViewPointPose = {position: {x: 6000, y: -20000, z: -4000}, target: {x: 6000, y: 0, z: -4000}}

test.each([20000, 100000, 1000000])("явный AABB clip range различает Display и edge на дистанции %p мм в Float32", distance => {
  const currentPose: ViewPointPose = {
    position: {...pose.position, y: -distance}, target: pose.target,
  }
  const legacy = new ViewPoint({...currentPose, near: 0.1, far: distance * 1.1})
  expect(depth32(legacy, -0.4)).toBe(depth32(legacy, 0))
  const range = ViewPoint.depthRangeForBounds(bounds, currentPose)!
  const viewPoint = new ViewPoint({...currentPose, ...range})
  expect(range.near).toBeCloseTo((distance - 0.4) * 0.5, 8)
  expect(range.far).toBeCloseTo(distance * 1.1, 8)
  expect(depth32(viewPoint, -0.4)).toBeLessThan(depth32(viewPoint, 0))
  for (const y of [-0.4, 0]) {
    expect(depth32(viewPoint, y)).toBeGreaterThan(0)
    expect(depth32(viewPoint, y)).toBeLessThan(1)
  }
})

test("rotated ViewPoint получает консервативный range всех восьми углов", () => {
  const rotated: ViewPointPose = {position: {x: -1000, y: -20000, z: 3000}, target: {x: 6000, y: 0, z: -4000}}
  const range = ViewPoint.depthRangeForBounds(bounds, rotated)!
  const forward = new Vector3(rotated.target.x - rotated.position.x, rotated.target.y - rotated.position.y, rotated.target.z - rotated.position.z).normalize()
  for (const corner of corners(bounds)) {
    const depth = corner.sub(new Vector3(rotated.position.x, rotated.position.y, rotated.position.z)).dot(forward)
    expect(range.near).toBeLessThan(depth)
    expect(range.far).toBeGreaterThan(depth)
  }
})

test("crossing и задние AABB имеют определённый положительный fallback или null", () => {
  const atOrigin: ViewPointPose = {position: {x: 0, y: 0, z: 0}, target: {x: 0, y: 1, z: 0}}
  const crossing = ViewPoint.depthRangeForBounds({min: {x: -2, y: -5, z: -3}, max: {x: 2, y: 7, z: 3}}, atOrigin)!
  expect(crossing.near).toBe(0.001)
  expect(crossing.far).toBeGreaterThan(7)
  expect(Number.isFinite(crossing.far)).toBe(true)
  expect(ViewPoint.depthRangeForBounds({min: {x: -2, y: -10, z: -3}, max: {x: 2, y: 0, z: 3}}, atOrigin)).toBeNull()
  const tiny = ViewPoint.depthRangeForBounds({min: {x: 0, y: 0.00001, z: 0}, max: {x: 0, y: 0.00001, z: 0}}, atOrigin)!
  expect(tiny.near).toBeGreaterThan(0)
  expect(tiny.near).toBeLessThan(0.00001)
  expect(tiny.far).toBeGreaterThan(0.00001)
})

test("helper сохраняет авторские clip planes, а burst zoom использует весь delta при range предыдущей позы", () => {
  const authored = new ViewPoint({...pose, near: 0.1, far: 22000})
  const range = ViewPoint.depthRangeForBounds(bounds, pose)!
  expect([authored.near, authored.far]).toEqual([0.1, 22000])
  const whole = new ViewPoint({...pose, ...range})
  const pieces = new ViewPoint({...pose, ...range})
  whole.zoom(30)
  for (let i = 0; i < 30; i++) pieces.zoom(1)
  expect(pieces.position.distanceTo(whole.position)).toBeLessThan(1e-8)
  expect(pieces.position.distanceTo(pieces.getTarget())).toBeCloseTo(20000 * Math.pow(0.95, 1.5), 6)
  expect([pieces.near, pieces.far]).toEqual([range.near, range.far])
})

test("невалидные границы и вырожденная поза явно отклоняются", () => {
  expect(() => ViewPoint.depthRangeForBounds({min: {x: 1, y: 0, z: 0}, max: {x: 0, y: 1, z: 1}}, pose)).toThrow(RangeError)
  expect(() => ViewPoint.depthRangeForBounds(bounds, {position: pose.position, target: pose.position})).toThrow(RangeError)
  expect(() => ViewPoint.depthRangeForBounds({min: bounds.min, max: {x: Infinity, y: 1, z: 1}}, pose)).toThrow(RangeError)
})

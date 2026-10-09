import {expect, test} from "bun:test"
import {Vector3, ViewPoint, type ViewPointFrustumPlane, type ViewPointWorldBounds} from "../src/index.ts"

const viewport = {left: 40, top: 20, width: 1000, height: 600}
const flyView = () => new ViewPoint({viewport, navigation: "fly", flySpeed: 100,
  position: {x: 0, y: 0, z: 100}, target: {x: 0, y: 0, z: 0}, near: 0.001, far: 100000})
const distance = (plane: ViewPointFrustumPlane, point: Vector3) =>
  plane.normal.x * point.x + plane.normal.y * point.y + plane.normal.z * point.z + plane.constant

test("fly zoom проходит target и нижние слои, сохраняя направление и расстояние eye→target", () => {
  const viewPoint = flyView()
  viewPoint.zoom(5)
  expect(viewPoint.position).toEqual(new Vector3(0, 0, -400))
  expect(viewPoint.getTarget()).toEqual(new Vector3(0, 0, -500))
  expect(viewPoint.position.distanceTo(viewPoint.getTarget())).toBe(100)
  viewPoint.zoom(-5)
  expect(viewPoint.position).toEqual(new Vector3(0, 0, 100))
  expect(viewPoint.getTarget()).toEqual(new Vector3())
})

test("fly вдоль cursor ray не зависит от дробления trackpad delta", () => {
  const whole = flyView()
  const pieces = flyView()
  const anchor = {clientX: 780, clientY: 210}
  const ray = whole.rayForClientPoint({x: anchor.clientX, y: anchor.clientY})!
  whole.zoom(5, anchor)
  for (let i = 0; i < 50; i++) pieces.zoom(0.1, anchor)
  expect(pieces.position.distanceTo(whole.position)).toBeLessThan(1e-9)
  expect(pieces.getTarget().distanceTo(whole.getTarget())).toBeLessThan(1e-9)
  expect(whole.position.clone().sub(ray.origin).distanceTo(ray.direction.clone().multiplyScalar(500))).toBeLessThan(1e-9)
})

test("orbit остаётся default: zoom меняет radius и сохраняет target", () => {
  const viewPoint = new ViewPoint({position: {x: 0, y: -100, z: 0}})
  expect(viewPoint.navigation).toBe("orbit")
  viewPoint.zoom(5)
  expect(viewPoint.getTarget()).toEqual(new Vector3())
  expect(viewPoint.position.length()).toBeCloseTo(100 * Math.pow(0.95, 0.25), 10)
})

test("публичный client ray и frustum используют одну Z-up позу, viewport и authored clip range", () => {
  const viewPoint = new ViewPoint({viewport, position: {x: 3000, y: -1000, z: 900},
    target: {x: 3000, y: 0, z: 900}, near: 10, far: 2000})
  const ray = viewPoint.rayForClientPoint({x: 780, y: 210})!
  expect(ray.origin).toEqual(viewPoint.position)
  const point = ray.at(1000, new Vector3())
  const projected = point.clone().applyMatrix4(viewPoint.viewMatrix).applyMatrix4(viewPoint.projectionMatrix)
  expect(40 + (projected.x + 1) * 500).toBeCloseTo(780, 3)
  expect(20 + (1 - projected.y) * 300).toBeCloseTo(210, 3)
  const planes = viewPoint.frustumPlanes()
  expect(planes).toHaveLength(6)
  expect(planes.every(plane => distance(plane, point) > 0)).toBe(true)
  expect(distance(planes[0]!, ray.origin)).toBeCloseTo(-10, 10)
  expect(distance(planes[1]!, new Vector3(3000, 1001, 900))).toBeLessThan(0)
  ray.origin.x = -1
  expect(viewPoint.position.x).toBe(3000)
})

test("frustum overscan расширяет CSS viewport без изменения near/far или позы", () => {
  const viewPoint = flyView()
  const ray = viewPoint.rayForClientPoint({x: viewport.left - 20, y: viewport.top + viewport.height / 2})!
  const point = ray.at(50, new Vector3())
  expect(viewPoint.frustumPlanes().some(plane => distance(plane, point) < 0)).toBe(true)
  expect(viewPoint.frustumPlanes(40).every(plane => distance(plane, point) > 0)).toBe(true)
  expect(viewPoint.position).toEqual(new Vector3(0, 0, 100))
  expect([viewPoint.near, viewPoint.far]).toEqual([0.001, 100000])
})

const bounds: ViewPointWorldBounds = {min: {x: -600, y: -300, z: -400}, max: {x: 900, y: 500, z: 0}}
for (const aspect of [16 / 9, 9 / 16]) for (const back of [{x: 1, y: -2, z: 2}, {x: 0, y: 0, z: 1}]) {
  test(`fit world AABB удерживает все углы при aspect=${aspect}, back=${JSON.stringify(back)}`, () => {
    const pose = ViewPoint.fitPoseForBounds(bounds, back, {fov: 0.8, aspect})
    const clip = ViewPoint.depthRangeForBounds(bounds, pose)!
    const viewPoint = new ViewPoint({...pose, ...clip, fov: 0.8, viewport: {left: 0, top: 0, width: 900 * aspect, height: 900}})
    expect(pose.position.z).toBeGreaterThan(pose.target.z)
    for (let corner = 0; corner < 8; corner++) {
      const point = new Vector3((corner & 1) === 0 ? bounds.min.x : bounds.max.x,
        (corner & 2) === 0 ? bounds.min.y : bounds.max.y, (corner & 4) === 0 ? bounds.min.z : bounds.max.z)
      const projected = point.applyMatrix4(viewPoint.viewMatrix).applyMatrix4(viewPoint.projectionMatrix)
      expect(Math.abs(projected.x)).toBeLessThanOrEqual(1 / 1.12 + 1e-6)
      expect(Math.abs(projected.y)).toBeLessThanOrEqual(1 / 1.12 + 1e-6)
      expect(projected.z).toBeGreaterThanOrEqual(0)
      expect(projected.z).toBeLessThanOrEqual(1)
    }
  })
}

test("невалидный fly и fit отклоняются до изменения pose", () => {
  const viewPoint = flyView()
  const initial = viewPoint.position.clone()
  expect(() => viewPoint.fly(Infinity)).toThrow(RangeError)
  expect(() => viewPoint.zoom(1, {clientX: NaN, clientY: 0})).toThrow(RangeError)
  expect(() => ViewPoint.fitPoseForBounds(bounds, {x: 0, y: 0, z: 0}, {fov: 1, aspect: 1})).toThrow(RangeError)
  expect(viewPoint.position).toEqual(initial)
})

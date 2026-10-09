import {expect, test} from "bun:test"
import {Raycaster, Vector3, ViewPoint} from "../src/index.ts"

const viewpoint = () => new ViewPoint({
  position: {x: 0, y: -20, z: 0},
  viewport: {left: 0, top: 0, width: 200, height: 200},
})

test("zoom сохраняет масштаб при дроблении trackpad delta и обратном жесте", () => {
  const whole = viewpoint()
  const parts = viewpoint()
  whole.zoom(1)
  for (let step = 0; step < 10; step++) parts.zoom(0.1)
  expect(parts.position.distanceTo(whole.position)).toBeLessThan(1e-10)
  whole.zoom(-1)
  expect(whole.position.distanceTo(new Vector3(0, -20, 0))).toBeLessThan(1e-10)
  const before = parts.position.clone()
  parts.zoom(0)
  expect(parts.position.distanceTo(before)).toBeLessThan(1e-10)
})

test("дробное anchored zoom сохраняет world point под указателем", () => {
  const whole = viewpoint()
  const parts = viewpoint()
  const anchor = {clientX: 140, clientY: 75}
  const raycaster = new Raycaster()
  whole.update()
  raycaster.setFromCamera({x: 0.4, y: 0.25}, whole)
  const worldAnchor = raycaster.ray.at(-raycaster.ray.origin.y / raycaster.ray.direction.y, new Vector3())
  whole.zoom(1, anchor)
  for (let step = 0; step < 10; step++) parts.zoom(0.1, anchor)
  expect(parts.position.distanceTo(whole.position)).toBeLessThan(1e-5)
  expect(parts.getTarget().distanceTo(whole.getTarget())).toBeLessThan(1e-5)
  const projected = worldAnchor.applyMatrix4(parts.viewMatrix).applyMatrix4(parts.projectionMatrix)
  // Float32 матрицы сохраняют anchor точнее одной сотой CSS px.
  expect(Math.abs(projected.x - 0.4) * 100).toBeLessThan(0.01)
  expect(Math.abs(projected.y - 0.25) * 100).toBeLessThan(0.01)
})

test("zoom остаётся конечным у минимальной дистанции", () => {
  const viewPoint = viewpoint()
  viewPoint.zoom(100000)
  const distance = viewPoint.position.distanceTo(viewPoint.getTarget())
  expect(distance).toBeGreaterThan(0)
  expect(Number.isFinite(distance)).toBe(true)
})


test.each([1000, 100000])("мелкий anchored zoom не дрожит при дистанции %s мм и большом far/near", size => {
  const viewPoint = new ViewPoint({
    position: {x: size * 3, y: -size, z: -size * 2},
    target: {x: size * 3, y: 0, z: -size * 2},
    near: 0.1,
    far: size * 10,
    viewport: {left: 40, top: 20, width: 1000, height: 600},
  })
  const anchor = {clientX: 780, clientY: 210}
  const tangent = Math.tan(viewPoint.fov / 2)
  const worldAnchor = new Vector3(
    size * 3 + 0.48 * size * tangent * viewPoint.aspect,
    0,
    -size * 2 + (1 - 190 / 600 * 2) * size * tangent,
  )
  for (let step = 0; step < 30; step++) {
    viewPoint.zoom(0.1, anchor)
    const projected = worldAnchor.clone().applyMatrix4(viewPoint.viewMatrix).applyMatrix4(viewPoint.projectionMatrix)
    expect(Math.abs(40 + (projected.x + 1) * 500 - anchor.clientX)).toBeLessThan(0.01)
    expect(Math.abs(20 + (1 - projected.y) * 300 - anchor.clientY)).toBeLessThan(0.01)
  }
})

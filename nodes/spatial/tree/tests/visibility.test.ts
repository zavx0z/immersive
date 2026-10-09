import {expect, test} from "bun:test"
import {ViewPoint} from "@zavx0z/immersive-engine"
import {createSpatialVisibilityIndex, spatialVolumeBounds} from "../src/visibility.ts"

test("3D BVH возвращает ближние AABB первыми, копирует вход и ограничивает работу", () => {
  const entries = Array.from({length: 10000}, (_, i) => ({id: String(i), bounds: {
    min: {x: i * 10, y: 0, z: 0}, max: {x: i * 10 + 1, y: 1, z: 1},
  }}))
  const index = createSpatialVisibilityIndex(entries)
  entries[0]!.bounds.min.x = 999999
  const result = index.query([], {eye: {x: 0, y: 0, z: 0}, limit: 3, maxVisited: 100})
  expect(result.ids).toEqual(["0", "1", "2"])
  expect(result.truncated).toBe(true)
  expect(result.visited).toBeLessThan(100)
})

test("frustum исключает задние и боковые объёмы и сохраняет пересечение camera plane", () => {
  const index = createSpatialVisibilityIndex([
    {id: "front", bounds: {min: {x: -1, y: 10, z: -1}, max: {x: 1, y: 12, z: 1}}},
    {id: "behind", bounds: {min: {x: -1, y: -20, z: -1}, max: {x: 1, y: -10, z: 1}}},
    {id: "side", bounds: {min: {x: 1000, y: 10, z: -1}, max: {x: 1010, y: 12, z: 1}}},
    {id: "crossing", bounds: {min: {x: -2, y: -5, z: -2}, max: {x: 2, y: 20, z: 2}}},
  ])
  const viewPoint = new ViewPoint({position: {x: 0, y: 0, z: 0}, target: {x: 0, y: 1, z: 0}, near: 1, far: 100})
  const result = index.query(viewPoint.frustumPlanes(), {eye: {x: 0, y: 0, z: 0}, limit: 10})
  expect(new Set(result.ids)).toEqual(new Set(["front", "crossing"]))
  expect(result.truncated).toBe(false)
})

test("loft bounds используют оба торца, включая leaf extrusion", () => {
  expect(spatialVolumeBounds({x: 0, y: 0, z: 100, width: 20, height: 10},
    {x: 50, y: -20, z: -100, width: 5, height: 5})).toEqual({
      min: {x: 0, y: -20, z: -100}, max: {x: 55, y: 10, z: 100},
    })
  expect(() => createSpatialVisibilityIndex([{id: "a", bounds: {min: {x: 0, y: 0, z: 0}, max: {x: -1, y: 1, z: 1}}}])).toThrow()
})

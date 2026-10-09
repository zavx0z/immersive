import {expect, test} from "bun:test"
import {createSpatialTreeScene, SPATIAL_TREE_PIXEL_MM} from "../src/scene.ts"

test("размеры desktop и portrait Display сохраняются, все сущности имеют один объём", () => {
  const scene = createSpatialTreeScene([
    {id: "project", label: "Проект"},
    {id: "repo", parentId: "project", label: "Repo", color: 0x112233},
    {id: "leaf", parentId: "project", label: "Лист"},
    {id: "mobile", parentId: "repo", label: "Телефон", viewport: {width: 390, height: 844}},
  ], {width: 1440, height: 900})
  expect(scene.nodes).toHaveLength(4)
  expect(scene.volumes).toHaveLength(7)
  expect(scene.bodyVolumes).toHaveLength(4)
  expect(scene.branchVolumes).toHaveLength(3)
  expect(scene.bodyVolumes.every(volume => scene.volumes.includes(volume) && volume.caps === true)).toBe(true)
  expect(scene.branchVolumes.every(volume => scene.volumes.includes(volume) && volume.caps === false)).toBe(true)
  expect(scene.nodesById.get("repo")?.color).toBe("#112233")
  expect(scene.nodesById.get("mobile")?.color).toBe("#112233")
  expect(scene.nodesById.get("mobile")?.rect.width).toBe(390 * SPATIAL_TREE_PIXEL_MM)
  expect(scene.nodesById.get("mobile")?.rect.height).toBe(844 * SPATIAL_TREE_PIXEL_MM)
  expect(scene.layout.groundDepth).toBe(1)
  expect(scene.layout.stems.find(body => body.nodeId === "leaf")?.bottom.z).toBe(0)
  expect(scene.layout.stems.find(body => body.nodeId === "mobile")!.bottom.z).toBeLessThan(0)
  expect(scene.layout.stems.every(body => body.top.z > body.bottom.z)).toBe(true)
  expect(scene.floor.position.z).toBe(0)
  expect(scene.volumes.filter(volume => volume.interactive === false)).toHaveLength(3)
})

test("порядок входа не меняет цвет родственной ветви, Scene не добавляет дубли родителей", () => {
  const nodes = [{id: "p", label: "p"}, {id: "b", parentId: "p", label: "b"}, {id: "a", parentId: "p", label: "a"}]
  const first = createSpatialTreeScene(nodes, {width: 1000, height: 600})
  const second = createSpatialTreeScene([...nodes].reverse(), {width: 1000, height: 600})
  for (const node of first.nodes) expect(second.nodesById.get(node.id)?.color).toBe(node.color)
  expect(first.layout.stems.map(body => body.nodeId).sort()).toEqual(["a", "b", "p"])
})

test("расстояние между слоями и зазоры задаются независимо без изменения размеров Display", () => {
  const nodes = [{id: "p", label: "P"}, {id: "a", parentId: "p", label: "A"}, {id: "b", parentId: "p", label: "B"}]
  const scene = createSpatialTreeScene(nodes, {width: 960, height: 540}, {layerGap: 900, spacing: 80})
  expect(scene.layerGap).toBe(900)
  expect(scene.layout.layers[0]!.z - scene.layout.layers[1]!.z).toBe(900)
  expect(scene.nodes.every(node => node.rect.width === 240 && node.rect.height === 135)).toBe(true)
  const a = scene.nodesById.get("a")!.rect, b = scene.nodesById.get("b")!.rect
  const gapX = Math.max(b.x - a.x - a.width, a.x - b.x - b.width)
  const gapY = Math.max(b.y - a.y - a.height, a.y - b.y - b.height)
  expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(80)
})


test("равные Display имеют равные тела и единый увеличенный шаг без роста от широкого веера", () => {
  const nodes = [
    {id: "root", label: "Root"},
    {id: "early", parentId: "root", label: "Early"},
    {id: "wide", parentId: "root", label: "Wide"},
    ...Array.from({length: 100}, (_, n) => ({id: `leaf:${n}`, parentId: "wide", label: `Leaf ${n}`})),
  ]
  const scene = createSpatialTreeScene(nodes, {width: 1440, height: 900})
  const largest = 1440 * SPATIAL_TREE_PIXEL_MM
  const bodyDepth = largest * 1.05
  expect(scene.layerGap).toBe(largest * 3)
  for (let depth = 1; depth < scene.layout.layers.length; depth++) {
    expect(scene.layout.layers[depth - 1]!.z - scene.layout.layers[depth]!.z).toBeCloseTo(scene.layerGap, 8)
  }
  for (const body of scene.layout.stems) {
    expect(body.top.width).toBe(largest)
    expect(body.top.height).toBe(900 * SPATIAL_TREE_PIXEL_MM)
    expect(body.top.z - body.bottom.z).toBeCloseTo(bodyDepth, 8)
  }
  expect(scene.layout.stems.find(body => body.nodeId === "early")!.bottom.z).toBe(0)
  const farther = createSpatialTreeScene(nodes, {width: 1440, height: 900}, {layerGap: scene.layerGap * 2})
  for (const body of farther.layout.stems) expect(body.top.z - body.bottom.z).toBeCloseTo(bodyDepth, 8)
  const explicit = createSpatialTreeScene(nodes, {width: 1440, height: 900}, {layerGap: 900, bodyDepth: 100})
  for (const body of explicit.layout.stems) expect(body.top.z - body.bottom.z).toBe(100)
})

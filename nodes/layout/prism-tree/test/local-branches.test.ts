import {expect, test} from "bun:test"
import layoutPrismTree, {type ImmersiveNodesLayoutPrismTree as Contract} from "@zavx0z/immersive-nodes-layout-prism-tree"

type Rectangle = Contract.Output["nodes"][number]["rect"]
type Bounds = Pick<Rectangle, "x" | "y" | "width" | "height">
type Volume = {id: string; from: Rectangle; to: Rectangle}
const epsilon = 1e-7

test("одиночная длинная ветка не возвращается к центру слоя после завершения соседнего листа", () => {
  const nodes: Contract.Input["nodes"][number][] = [
    {id: "root", width: 180, height: 100},
    {id: "a-leaf", parentId: "root", width: 310, height: 80},
  ]
  for (let depth = 0; depth < 100; depth++) nodes.push({
    id: `b-chain:${depth}`, parentId: depth === 0 ? "root" : `b-chain:${depth - 1}`,
    width: 70 + depth % 7 * 13, height: 60 + depth % 3 * 19,
  })
  const result = layoutPrismTree({nodes, options: {spacing: 20}})
  verifyLocalDomains(result)
  verifyVolumes(result)
  const byId = new Map(result.nodes.map(node => [node.id, node.rect]))
  const origin = center(byId.get("b-chain:0")!)
  expect(Math.hypot(...origin)).toBeGreaterThan(1)
  for (let depth = 1; depth < 100; depth++) {
    const current = center(byId.get(`b-chain:${depth}`)!)
    expect(current[0]).toBeCloseTo(origin[0], 7)
    expect(current[1]).toBeCloseTo(origin[1], 7)
  }
})

test("асимметричный comb держит каждый полный descendant domain в локальной развилке", () => {
  const nodes: Contract.Input["nodes"][number][] = []
  for (let depth = 0; depth < 30; depth++) {
    nodes.push({id: `spine:${depth}`, ...depth === 0 ? {} : {parentId: `spine:${depth - 1}`},
      width: 90 + depth % 4 * 31, height: 60 + depth % 5 * 17})
    nodes.push({id: `leaf:${depth}`, parentId: `spine:${depth}`, width: 40 + depth % 3 * 19, height: 100 + depth % 7 * 13})
  }
  const result = layoutPrismTree({nodes, options: {spacing: 13, aspectRatio: 1.7}})
  verifyLocalDomains(result)
  verifyVolumes(result)
  expect(result.stems).toHaveLength(nodes.length)
  expect(result.branches).toHaveLength(nodes.length - 1)
})

test("развилка резервирует разный полный footprint по числу потомков, не меняя Display размеры", () => {
  const size = {width: 100, height: 60}
  const input: Contract.Input = {nodes: [
    {id: "root", ...size},
    {id: "a-leaf", parentId: "root", ...size},
    {id: "b-wide", parentId: "root", ...size},
    ...Array.from({length: 25}, (_, index) => ({id: `b-wide:${index}`, parentId: "b-wide", ...size})),
  ], options: {spacing: 20}}
  const result = layoutPrismTree(input)
  const domains = verifyLocalDomains(result)
  verifyVolumes(result)
  const leaf = domains.get("a-leaf")!, wide = domains.get("b-wide")!
  expect(wide.width * wide.height).toBeGreaterThanOrEqual(25 * size.width * size.height)
  expect(wide.width * wide.height / (leaf.width * leaf.height)).toBeGreaterThan(20)
  const leafDeparture = result.branches.find(branch => branch.childId === "a-leaf")!.from
  const wideDeparture = result.branches.find(branch => branch.childId === "b-wide")!.from
  expect(wideDeparture.width * wideDeparture.height / (leafDeparture.width * leafDeparture.height))
    .toBeCloseTo(wide.width * wide.height / (leaf.width * leaf.height), 7)
  for (const node of result.nodes) expect([node.rect.width, node.rect.height]).toEqual([size.width, size.height])
})

const actual: {provenance: {subjects: number}; nodes: readonly {id: string; parentId?: string}[]} = await Bun.file(new URL("./fixture/actual-subjects.json", import.meta.url)).json()
for (const size of [{width: 1922, height: 1126}, {width: 392, height: 882}]) {
  test(`actual428 ${size.width}×${size.height}: локальные домены и любые пары полных объёмов`, () => {
    expect(actual.provenance.subjects).toBe(428)
    for (const bodyDepth of [500, 350]) {
      const result = layoutPrismTree({nodes: actual.nodes.map(node => ({...node, ...size})), options: {spacing: 48, layerGap: 1000, bodyDepth}})
      verifyLocalDomains(result)
      verifyVolumes(result)
      expect(result.nodes).toHaveLength(428)
    }
  })
}

test("аналитический oracle обнаруживает пересечение loft между endpoints и допускает общую грань", () => {
  const rect = (x: number, z: number): Rectangle => ({x, y: 0, z, width: 2, height: 2})
  const left = {id: "left", from: rect(-4, 2), to: rect(4, 0)}
  const right = {id: "right", from: rect(4, 2), to: rect(-4, 0)}
  expect(intersects(left, right)).toBe(true)
  expect(intersects(left, {id: "same-order", from: rect(0, 2), to: rect(8, 0)})).toBe(false)
  expect(intersects({id: "upper", from: rect(0, 2), to: rect(0, 1)}, {id: "lower", from: rect(0, 1), to: rect(0, 0)})).toBe(false)
})

function verifyLocalDomains(result: Contract.Output): ReadonlyMap<string, Bounds> {
  const children = new Map<string, string[]>()
  const nodes = new Map(result.nodes.map(node => [node.id, node]))
  for (const node of result.nodes) if (node.parentId !== undefined) {
    const ids = children.get(node.parentId) ?? []
    ids.push(node.id)
    children.set(node.parentId, ids)
  }
  const domains = new Map<string, Bounds>()
  for (const node of [...result.nodes].sort((a, b) => b.depth - a.depth)) {
    const ids = children.get(node.id) ?? []
    const childDomains = ids.map(id => domains.get(id)!)
    domains.set(node.id, union([node.rect, ...childDomains]))
    if (childDomains.length === 0) continue
    const childBounds = union(childDomains)
    const ownCenter = center(node.rect), localCenter = center(childBounds)
    expect(ownCenter[0], `local center X ${node.id}`).toBeCloseTo(localCenter[0], 6)
    expect(ownCenter[1], `local center Y ${node.id}`).toBeCloseTo(localCenter[1], 6)
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      expect(separated(childDomains[a]!, childDomains[b]!), `subtree domains ${ids[a]} / ${ids[b]}`).toBe(true)
    }
    if (ids.length === 1) {
      const child = center(nodes.get(ids[0]!)!.rect)
      expect(child[0], `unary X ${node.id}`).toBeCloseTo(ownCenter[0], 6)
      expect(child[1], `unary Y ${node.id}`).toBeCloseTo(ownCenter[1], 6)
      const branch = result.branches.find(branch => branch.parentId === node.id)!
      const bottom = result.stems.find(stem => stem.nodeId === node.id)!.bottom
      expect(branch.from, `unary whole departure ${node.id}`).toEqual(bottom)
    }
  }
  return domains
}

function verifyVolumes(result: Contract.Output): void {
  const nodes = new Map(result.nodes.map(node => [node.id, node]))
  const stems = new Map(result.stems.map(stem => [stem.nodeId, stem]))
  const volumes: Volume[] = result.stems.map(stem => ({id: stem.id, from: stem.top, to: stem.bottom}))
  for (const branch of result.branches) {
    const bottom = stems.get(branch.parentId)!.bottom
    expect(branch.from.z).toBe(bottom.z)
    expect(branch.to).toEqual(nodes.get(branch.childId)!.rect)
    expect(branch.from.x).toBeGreaterThanOrEqual(bottom.x - epsilon)
    expect(branch.from.y).toBeGreaterThanOrEqual(bottom.y - epsilon)
    expect(branch.from.x + branch.from.width).toBeLessThanOrEqual(bottom.x + bottom.width + epsilon)
    expect(branch.from.y + branch.from.height).toBeLessThanOrEqual(bottom.y + bottom.height + epsilon)
    volumes.push(branch)
  }
  const collisions: string[] = []
  for (let a = 0; a < volumes.length; a++) for (let b = a + 1; b < volumes.length; b++) {
    if (intersects(volumes[a]!, volumes[b]!)) collisions.push(`${volumes[a]!.id} / ${volumes[b]!.id}`)
  }
  expect(collisions).toEqual([])
}

/** Четыре affine XY inequalities должны одновременно выполняться на общем открытом Z-интервале. */
function intersects(a: Volume, b: Volume): boolean {
  const bottom = Math.max(a.to.z, b.to.z), top = Math.min(a.from.z, b.from.z)
  if (top - bottom <= epsilon) return false
  const at = (volume: Volume, z: number): Bounds => {
    const t = (z - volume.to.z) / (volume.from.z - volume.to.z)
    return {x: volume.to.x + (volume.from.x - volume.to.x) * t,
      y: volume.to.y + (volume.from.y - volume.to.y) * t,
      width: volume.to.width + (volume.from.width - volume.to.width) * t,
      height: volume.to.height + (volume.from.height - volume.to.height) * t}
  }
  const gaps = (left: Bounds, right: Bounds) => [left.x + left.width - right.x, right.x + right.width - left.x,
    left.y + left.height - right.y, right.y + right.height - left.y]
  const start = gaps(at(a, bottom), at(b, bottom)), end = gaps(at(a, top), at(b, top))
  let lower = 0, upper = 1
  for (let index = 0; index < 4; index++) {
    const value = start[index]!, slope = end[index]! - value
    if (Math.abs(slope) <= epsilon) { if (value <= epsilon) return false }
    else if (slope > 0) lower = Math.max(lower, (epsilon - value) / slope)
    else upper = Math.min(upper, (epsilon - value) / slope)
    if (upper <= lower) return false
  }
  return upper - lower > 1e-10
}

function center(rect: Bounds): [number, number] { return [rect.x + rect.width / 2, rect.y + rect.height / 2] }
function separated(a: Bounds, b: Bounds): boolean {
  return a.x + a.width <= b.x + epsilon || b.x + b.width <= a.x + epsilon || a.y + a.height <= b.y + epsilon || b.y + b.height <= a.y + epsilon
}
function union(rects: readonly Bounds[]): Bounds {
  const x = Math.min(...rects.map(rect => rect.x)), y = Math.min(...rects.map(rect => rect.y))
  return {x, y, width: Math.max(...rects.map(rect => rect.x + rect.width)) - x, height: Math.max(...rects.map(rect => rect.y + rect.height)) - y}
}

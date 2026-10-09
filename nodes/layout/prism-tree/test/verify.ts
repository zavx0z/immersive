import {expect} from "bun:test"
import layoutPrismTree, {type ImmersiveNodesLayoutPrismTree as Contract} from "@zavx0z/immersive-nodes-layout-prism-tree"

type Rectangle = Contract.Output["nodes"][number]["rect"]

export function verify(input: Contract.Input): Contract.Output {
  const result = layoutPrismTree(input)
  const measured = new Map(input.nodes.map(node => [node.id, node]))
  const nodes = new Map(result.nodes.map(node => [node.id, node]))
  const stems = new Map(result.stems.map(stem => [stem.nodeId, stem]))
  const gap = input.options?.layerGap ?? 240
  const bodyDepth = input.options?.bodyDepth ?? gap / 2
  expect(result.nodes).toHaveLength(input.nodes.length)
  expect(result.stems).toHaveLength(input.nodes.length)
  for (const node of result.nodes) {
    const original = measured.get(node.id)!
    const stem = stems.get(node.id)!
    expect(node.rect.width).toBe(original.width)
    expect(node.rect.height).toBe(original.height)
    expect(stem.top).toEqual(node.rect)
    expect({...stem.bottom, z: stem.top.z}).toEqual(stem.top)
    expect(stem.top.z - stem.bottom.z).toBeCloseTo(bodyDepth, 8)
    if (node.parentId !== undefined) expect(node.depth).toBe(nodes.get(node.parentId)!.depth + 1)
    for (const value of Object.values(node.rect)) expect(Number.isFinite(value)).toBe(true)
  }
  for (const branch of result.branches) {
    const parent = stems.get(branch.parentId)!.bottom
    expect(branch.from.z).toBe(parent.z)
    expect(branch.to).toEqual(nodes.get(branch.childId)!.rect)
    expect(branch.from.z - branch.to.z).toBeCloseTo(gap - bodyDepth, 8)
    expect(branch.from.x).toBeGreaterThanOrEqual(parent.x - 1e-8)
    expect(branch.from.y).toBeGreaterThanOrEqual(parent.y - 1e-8)
    expect(branch.from.x + branch.from.width).toBeLessThanOrEqual(parent.x + parent.width + 1e-8)
    expect(branch.from.y + branch.from.height).toBeLessThanOrEqual(parent.y + parent.height + 1e-8)
  }
  const byBand = new Map<number, Contract.Output["branches"][number][]>()
  for (const branch of result.branches) {
    const band = byBand.get(branch.from.z) ?? []
    band.push(branch)
    byBand.set(branch.from.z, band)
  }
  // Независимое аналитическое доказательство: для одной оси и одного порядка
  // оба endpoint gaps >=0. Gap любого промежуточного сечения — их affine смесь.
  for (const band of byBand.values()) {
    for (let a = 0; a < band.length; a++) for (let b = a + 1; b < band.length; b++) {
      const left = band[a]!, right = band[b]!
      expect(separated(left.from, right.from, left.to, right.to)).toBe(true)
    }
  }
  for (const layer of result.layers) {
    const members = layer.nodeIds.map(id => nodes.get(id)!.rect)
    for (let a = 0; a < members.length; a++) for (let b = a + 1; b < members.length; b++) expect(separated(members[a]!, members[b]!, members[a]!, members[b]!)).toBe(true)
  }
  return result
}

function separated(a0: Rectangle, b0: Rectangle, a1: Rectangle, b1: Rectangle): boolean {
  const epsilon = 1e-8
  return a0.x + a0.width <= b0.x + epsilon && a1.x + a1.width <= b1.x + epsilon ||
    b0.x + b0.width <= a0.x + epsilon && b1.x + b1.width <= a1.x + epsilon ||
    a0.y + a0.height <= b0.y + epsilon && a1.y + a1.height <= b1.y + epsilon ||
    b0.y + b0.height <= a0.y + epsilon && b1.y + b1.height <= a1.y + epsilon
}

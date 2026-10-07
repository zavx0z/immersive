import type {HierarchyLayoutInput} from "../contract/input.ts"
import type {HierarchyLayoutOutput} from "../contract/output.ts"
import type {HierarchyLayoutEdge} from "../contract/edge.ts"
import {HierarchyLayoutError} from "./error.ts"

/** Частная геометрия области поддерева, не переносимая в публичный результат. */
interface WorkNode {
  readonly index: number
  readonly id: string
  readonly width: number
  readonly height: number
  readonly children: WorkNode[]
  parent: WorkNode | undefined
  depth: number
  subtreeWidth: number
  childrenWidth: number
  left: number
  x: number
  y: number
}

export function solveHierarchy(input: HierarchyLayoutInput): HierarchyLayoutOutput {
  const siblingSpacing = finiteGeometry(input.options?.siblingSpacing ?? 24, "siblingSpacing", [])
  const layerSpacing = finiteGeometry(input.options?.layerSpacing ?? 64, "layerSpacing", [])
  const byId = new Map<string, WorkNode>()
  const nodes = input.nodes.map((node, index): WorkNode => {
    if (byId.has(node.id)) {
      throw new HierarchyLayoutError("DUPLICATE_NODE", {nodeIds: [node.id]})
    }
    const work: WorkNode = {
      index,
      id: node.id,
      width: finiteGeometry(node.width, "width", [node.id], true),
      height: finiteGeometry(node.height, "height", [node.id], true),
      children: [],
      parent: undefined,
      depth: 0,
      subtreeWidth: 0,
      childrenWidth: 0,
      left: 0,
      x: 0,
      y: 0,
    }
    byId.set(node.id, work)
    return work
  })

  const roots: WorkNode[] = []
  for (const node of nodes) {
    const parentId = input.nodes[node.index]!.parentId
    if (parentId === undefined) {
      roots.push(node)
      continue
    }
    const parent = byId.get(parentId)
    if (!parent) {
      throw new HierarchyLayoutError("UNKNOWN_PARENT", {nodeIds: [node.id, parentId]})
    }
    node.parent = parent
    parent.children.push(node)
  }

  // Очередь раскрывает каждый узел ровно один раз и задаёт порядок снизу вверх.
  const ordered = [...roots]
  const layerHeights: number[] = []
  for (const node of ordered) {
    layerHeights[node.depth] = Math.max(layerHeights[node.depth] ?? 0, node.height)
    for (const child of node.children) {
      child.depth = node.depth + 1
      ordered.push(child)
    }
  }
  if (ordered.length !== nodes.length) {
    const visited = new Set(ordered)
    const witness = cycleWitness(nodes.find(node => !visited.has(node))!)
    throw new HierarchyLayoutError("CYCLE_DETECTED", {nodeIds: witness})
  }

  for (let index = ordered.length - 1; index >= 0; index--) {
    const node = ordered[index]!
    let childrenWidth = 0
    for (const child of node.children) childrenWidth += child.subtreeWidth
    childrenWidth += Math.max(0, node.children.length - 1) * siblingSpacing
    node.childrenWidth = finiteGeometry(childrenWidth, "subtreeWidth", [node.id])
    node.subtreeWidth = Math.max(node.width, childrenWidth)
  }

  const layerTops: number[] = []
  let height = 0
  for (const layerHeight of layerHeights) {
    if (layerTops.length > 0) height = finiteGeometry(height + layerSpacing, "height", [])
    layerTops.push(height)
    height = finiteGeometry(height + layerHeight, "height", [])
  }

  let width = 0
  for (const root of roots) {
    if (root !== roots[0]) width = finiteGeometry(width + siblingSpacing, "width", [root.id])
    root.left = width
    width = finiteGeometry(width + root.subtreeWidth, "width", [root.id])
  }

  for (const node of ordered) {
    node.x = node.left + (node.subtreeWidth - node.width) / 2
    node.y = layerTops[node.depth]!
    let childLeft = node.left + (node.subtreeWidth - node.childrenWidth) / 2
    for (const child of node.children) {
      child.left = childLeft
      childLeft += child.subtreeWidth + siblingSpacing
    }
  }

  const edges: HierarchyLayoutEdge[] = []
  for (const node of nodes) {
    const parent = node.parent
    if (!parent) continue
    const startPoint = {x: parent.x + parent.width / 2, y: parent.y + parent.height}
    const endPoint = {x: node.x + node.width / 2, y: node.y}
    // Горизонтальная часть всегда проходит в свободной полосе между слоями.
    const turnY = parent.y + layerHeights[parent.depth]! + layerSpacing / 2
    edges.push({
      id: `hierarchy:${node.index}`,
      sourceNodeId: parent.id,
      targetNodeId: node.id,
      sections: [{
        startPoint,
        bendPoints: startPoint.x === endPoint.x ? [] : [
          {x: startPoint.x, y: turnY},
          {x: endPoint.x, y: turnY},
        ],
        endPoint,
      }],
    })
  }

  return {
    direction: "DOWN",
    bounds: {x: 0, y: 0, width, height},
    nodes: nodes.map(({id, x, y, width, height}) => ({id, x, y, width, height})),
    edges,
  }
}

function cycleWitness(start: WorkNode): string[] {
  const path: WorkNode[] = []
  const indices = new Map<WorkNode, number>()
  let node = start
  while (!indices.has(node)) {
    indices.set(node, path.length)
    path.push(node)
    node = node.parent!
  }
  return [...path.slice(indices.get(node)!), node].map(member => member.id)
}

function finiteGeometry(value: number, field: string, nodeIds: readonly string[], positive = false): number {
  if (!Number.isFinite(value) || (positive ? value <= 0 : value < 0)) {
    throw new HierarchyLayoutError("INVALID_GEOMETRY", {nodeIds, field})
  }
  return value
}

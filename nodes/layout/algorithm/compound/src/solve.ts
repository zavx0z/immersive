import type {CompoundLayoutInput} from "../contract/input.ts"
import type {CompoundLayoutOutput} from "../contract/output.ts"
import {CompoundLayoutError} from "./error.ts"

interface WorkNode {
  readonly id: string
  readonly contentHeight: number
  readonly children: WorkNode[]
  parent: WorkNode | undefined
  width: number
  height: number
  x: number
  y: number
}

/**
Упаковывает соседей в строки сбалансированной ширины, затем расширяет их Frame.

Сортировка по высоте и стабильному ID сохраняет геометрию при перестановке входа.
Два итеративных прохода обходят дерево без рекурсии. Время O(n log n), память O(n).
Результат сохраняет порядок входа и размеры листов, не создаёт маршруты связей.
*/
export function layoutCompound(input: CompoundLayoutInput): CompoundLayoutOutput {
  const spacing = geometry(input.options?.spacing ?? 24, "spacing")
  const padding = geometry(input.options?.padding ?? 24, "padding")
  const outerPadding = geometry(input.options?.outerPadding ?? 0, "outerPadding")
  const aspectRatio = geometry(input.options?.aspectRatio ?? 1.5, "aspectRatio", [], true)
  const byId = new Map<string, WorkNode>()
  const nodes = input.nodes.map(node => {
    if (byId.has(node.id)) throw new CompoundLayoutError("DUPLICATE_NODE", {nodeIds: [node.id]})
    const width = geometry(node.width, "width", [node.id], true)
    const height = geometry(node.height, "height", [node.id], true)
    const contentHeight = geometry(node.contentHeight ?? height, "contentHeight", [node.id])
    if (contentHeight > height) throw new CompoundLayoutError("INVALID_GEOMETRY", {nodeIds: [node.id], field: "contentHeight"})
    const work: WorkNode = {id: node.id, width, height, contentHeight, children: [], parent: undefined, x: 0, y: 0}
    byId.set(node.id, work)
    return work
  })
  const roots: WorkNode[] = []
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]!
    const parentId = input.nodes[index]!.parentId
    if (parentId === undefined) {
      roots.push(node)
      continue
    }
    const parent = byId.get(parentId)
    if (!parent) throw new CompoundLayoutError("UNKNOWN_PARENT", {nodeIds: [node.id, parentId]})
    node.parent = parent
    parent.children.push(node)
  }
  const ordered = [...roots]
  for (let index = 0; index < ordered.length; index++) {
    for (const child of ordered[index]!.children) ordered.push(child)
  }
  if (ordered.length !== nodes.length) {
    const visited = new Set(ordered)
    let node = nodes.find(candidate => !visited.has(candidate))!
    const path: string[] = []
    const positions = new Map<WorkNode, number>()
    while (!positions.has(node)) {
      positions.set(node, path.length)
      path.push(node.id)
      node = node.parent!
    }
    throw new CompoundLayoutError("CYCLE_DETECTED", {nodeIds: [...path.slice(positions.get(node)!), node.id]})
  }
  for (let index = ordered.length - 1; index >= 0; index--) {
    const node = ordered[index]!
    if (node.children.length === 0) continue
    const size = pack(node.children, spacing, aspectRatio)
    node.width = geometry(Math.max(node.width, size.width + padding * 2), "width", [node.id], true)
    node.height = geometry(Math.max(node.height, node.contentHeight + size.height + padding * 2), "height", [node.id], true)
    for (const child of node.children) {
      child.x = geometry(child.x + padding, "x", [child.id])
      child.y = geometry(child.y + node.contentHeight + padding, "y", [child.id])
    }
  }
  const size = pack(roots, spacing, aspectRatio)
  for (const node of ordered) {
    node.x = geometry(node.x + (node.parent?.x ?? outerPadding), "x", [node.id])
    node.y = geometry(node.y + (node.parent?.y ?? outerPadding), "y", [node.id])
  }
  return {
    direction: "DOWN",
    bounds: {
      x: 0,
      y: 0,
      width: nodes.length === 0 ? 0 : geometry(size.width + outerPadding * 2, "width"),
      height: nodes.length === 0 ? 0 : geometry(size.height + outerPadding * 2, "height"),
    },
    nodes: nodes.map(({id, x, y, width, height}) => ({id, x, y, width, height})),
  }
}

function pack(nodes: WorkNode[], spacing: number, aspectRatio: number): {width: number; height: number} {
  if (nodes.length === 0) return {width: 0, height: 0}
  if (nodes.length === 1) {
    nodes[0]!.x = 0
    nodes[0]!.y = 0
    return {width: nodes[0]!.width, height: nodes[0]!.height}
  }
  const sorted = [...nodes].sort((a, b) => b.height - a.height || b.width - a.width || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  let area = 0
  let maxWidth = 0
  for (const node of sorted) {
    area = geometry(area + (node.width + spacing) * (node.height + spacing), "packingArea", [node.id])
    maxWidth = Math.max(maxWidth, node.width)
  }
  const targetWidth = Math.max(maxWidth, geometry(Math.sqrt(area) * Math.sqrt(aspectRatio), "packingWidth"))
  let x = 0
  let y = 0
  let rowHeight = 0
  let width = 0
  for (const node of sorted) {
    if (x > 0 && x + node.width > targetWidth) {
      y = geometry(y + rowHeight + spacing, "y", [node.id])
      x = 0
      rowHeight = 0
    }
    node.x = x
    node.y = y
    width = Math.max(width, geometry(x + node.width, "width", [node.id]))
    rowHeight = Math.max(rowHeight, node.height)
    x = geometry(x + node.width + spacing, "x", [node.id])
  }
  return {width, height: geometry(y + rowHeight, "height")}
}

function geometry(value: number, field: string, nodeIds: readonly string[] = [], positive = false): number {
  if (!Number.isFinite(value) || (positive ? value <= 0 : value < 0)) {
    throw new CompoundLayoutError("INVALID_GEOMETRY", {nodeIds, field})
  }
  return value
}

import type {ImmersiveNodesLayoutPrismTree as Contract} from "../contract/index.ts"
import type {Rectangle} from "../contract/rectangle.ts"
import {finite, PrismTreeLayoutError} from "./error.ts"
import {layoutCompound, CompoundLayoutError} from "@zavx0z/immersive-nodes-layout/compound"

interface Node {
  readonly index: number
  readonly id: string
  readonly width: number
  readonly height: number
  readonly weight: number
  readonly children: Node[]
  parent: Node | undefined
  depth: number
  footprintWidth: number
  footprintHeight: number
  groupWidth: number
  groupHeight: number
  centerX: number
  centerY: number
  localX: number
  localY: number
  departure: {x: number; y: number; width: number; height: number} | undefined
}

export function solve(input: Contract.Input): Contract.Output {
  const gap = finite(input.options?.layerGap ?? 240, "layerGap", [], true)
  const spacing = finite(input.options?.spacing ?? 24, "spacing")
  const aspectRatio = finite(input.options?.aspectRatio ?? 1.5, "aspectRatio", [], true)
  const bodyDepth = finite(input.options?.bodyDepth ?? gap / 2, "bodyDepth", [], true)
  if (bodyDepth >= gap) throw new PrismTreeLayoutError("INVALID_GEOMETRY", {nodeIds: [], field: "bodyDepth"})
  const byId = new Map<string, Node>()
  const nodes = input.nodes.map((source, index): Node => {
    if (typeof source.id !== "string" || source.id.length === 0) throw new PrismTreeLayoutError("INVALID_ID", {nodeIds: [source.id]})
    if (byId.has(source.id)) throw new PrismTreeLayoutError("DUPLICATE_NODE", {nodeIds: [source.id]})
    const node: Node = {index, id: source.id, width: finite(source.width, "width", [source.id], true),
      height: finite(source.height, "height", [source.id], true), weight: finite(source.weight ?? 1, "weight", [source.id], true),
      children: [], parent: undefined, depth: 0, footprintWidth: source.width, footprintHeight: source.height,
      groupWidth: 0, groupHeight: 0, centerX: 0, centerY: 0, localX: 0, localY: 0, departure: undefined}
    byId.set(node.id, node)
    return node
  })
  const roots: Node[] = []
  for (const node of nodes) {
    const parentId = input.nodes[node.index]!.parentId
    if (parentId === undefined) roots.push(node)
    else {
      const parent = byId.get(parentId)
      if (parent === undefined) throw new PrismTreeLayoutError("UNKNOWN_PARENT", {nodeIds: [node.id, parentId]})
      node.parent = parent
      parent.children.push(node)
    }
  }
  const order = (a: Node, b: Node) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  roots.sort(order)
  const ordered = [...roots]
  let groundDepth = Infinity
  for (let n = 0; n < ordered.length; n++) {
    const node = ordered[n]!
    node.children.sort(order)
    if (node.children.length === 0) groundDepth = Math.min(groundDepth, node.depth)
    for (const child of node.children) {
      child.depth = node.depth + 1
      ordered.push(child)
    }
  }
  if (ordered.length !== nodes.length) {
    const seen = new Set(ordered)
    let node = nodes.find(candidate => !seen.has(candidate))!
    const path: string[] = [], positions = new Map<Node, number>()
    while (!positions.has(node)) {
      positions.set(node, path.length)
      path.push(node.id)
      node = node.parent!
    }
    throw new PrismTreeLayoutError("CYCLE_DETECTED", {nodeIds: [...path.slice(positions.get(node)!), node.id]})
  }
  if (nodes.length === 0) return {nodes: [], layers: [], stems: [], branches: [], floorZ: 0, groundDepth: null, bounds: {x: 0, y: 0, z: 0, width: 0, height: 0, depth: 0}}

  // Каждый родитель резервирует весь XY-регион своей семьи, независимо от слоёв.
  for (let n = ordered.length - 1; n >= 0; n--) {
    const node = ordered[n]!
    if (node.children.length > 0) {
      const group = pack(node.children, spacing, aspectRatio)
      node.groupWidth = group.width
      node.groupHeight = group.height
      node.footprintWidth = Math.max(node.width, group.width)
      node.footprintHeight = Math.max(node.height, group.height)
    }
  }
  pack(roots, spacing, aspectRatio)
  finite(groundDepth * gap + bodyDepth, "topZ", [], true)
  const rects: Rectangle[] = []
  const members: Node[][] = []
  // Одна трансляция семейства вниз от его родителя. Unary имеет localX/localY=0.
  for (const node of ordered) {
    node.centerX = (node.parent?.centerX ?? 0) + node.localX
    node.centerY = (node.parent?.centerY ?? 0) + node.localY
    const z = (groundDepth - node.depth) * gap + bodyDepth
    if (!Number.isFinite(z)) throw new PrismTreeLayoutError("INVALID_GEOMETRY", {nodeIds: [], field: "z"})
    rects[node.index] = {x: node.centerX - node.width / 2, y: node.centerY - node.height / 2, z, width: node.width, height: node.height}
    ensureRectangle(rects[node.index]!, node.id)
    const layer = members[node.depth] ?? []
    layer.push(node)
    members[node.depth] = layer
  }
  // Слои только описывают полученную геометрию; не размещают и не центрируют её.
  const layers = members.map((layer, depth) => {
    let left = Infinity, bottom = Infinity, right = -Infinity, top = -Infinity
    for (const node of layer) {
      const rect = rects[node.index]!
      left = Math.min(left, rect.x)
      bottom = Math.min(bottom, rect.y)
      right = Math.max(right, rect.x + rect.width)
      top = Math.max(top, rect.y + rect.height)
    }
    const z = rects[layer[0]!.index]!.z
    return {depth, z, nodeIds: layer.map(node => node.id), bounds: {x: left, y: bottom, z, width: finite(right - left, "layerWidth"), height: finite(top - bottom, "layerHeight")}}
  })
  const stems = nodes.map(node => ({id: `prism-tree:stem:${node.id}`, nodeId: node.id, top: rects[node.index]!, bottom: {...rects[node.index]!, z: (groundDepth - node.depth) * gap}}))
  for (const stem of stems) ensureRectangle(stem.bottom, stem.nodeId)
  const departures = new Map<number, Rectangle>()
  for (const parent of nodes) {
    if (parent.children.length === 0) continue
    const face = stems[parent.index]!.bottom
    for (const child of parent.children) {
      const part = child.departure!
      const departure = {x: face.x + part.x * face.width, y: face.y + part.y * face.height,
        z: face.z, width: finite(part.width * face.width, "departureWidth", [child.id], true), height: finite(part.height * face.height, "departureHeight", [child.id], true)}
      ensureRectangle(departure, child.id)
      departures.set(child.index, departure)
    }
  }
  const branches = nodes.flatMap(node => node.parent === undefined ? [] : [{id: `prism-tree:branch:${node.id}`, parentId: node.parent.id, childId: node.id, from: departures.get(node.index)!, to: rects[node.index]!}])
  let x = Infinity, y = Infinity, right = -Infinity, top = -Infinity, bottomZ = Infinity, maximumZ = -Infinity
  for (const stem of stems) {
    x = Math.min(x, stem.top.x)
    y = Math.min(y, stem.top.y)
    right = Math.max(right, stem.top.x + stem.top.width)
    top = Math.max(top, stem.top.y + stem.top.height)
    bottomZ = Math.min(bottomZ, stem.bottom.z)
    maximumZ = Math.max(maximumZ, stem.top.z)
  }
  return {
    nodes: nodes.map(node => ({id: node.id, ...node.parent === undefined ? {} : {parentId: node.parent.id}, depth: node.depth, rect: rects[node.index]!})),
    layers, stems, branches, floorZ: 0, groundDepth,
    bounds: {x, y, z: bottomZ, width: finite(right - x, "width"), height: finite(top - y, "height"), depth: finite(maximumZ - bottomZ, "depth")},
  }
}

/** Упаковывает только виртуальные размеры соседних поддеревьев через публичный owner. */
function pack(nodes: readonly Node[], spacing: number, aspectRatio: number): {width: number; height: number} {
  const ranked = [...nodes].sort((a, b) => b.weight - a.weight || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const slots = new Map(ranked.map((node, index) => [`domain:${String(index).padStart(12, "0")}`, node]))
  try {
    const result = layoutCompound({
      nodes: [...slots].map(([id, node]) => ({id, width: node.footprintWidth, height: node.footprintHeight})),
      options: {spacing, aspectRatio, padding: 0, outerPadding: 0},
    })
    const width = finite(result.bounds.width, "familyWidth", nodes.map(node => node.id), true)
    const height = finite(result.bounds.height, "familyHeight", nodes.map(node => node.id), true)
    for (const rect of result.nodes) {
      const node = slots.get(rect.id)!
      node.localX = rect.x + rect.width / 2 - width / 2
      node.localY = rect.y + rect.height / 2 - height / 2
      node.departure = {x: rect.x / width, y: rect.y / height, width: rect.width / width, height: rect.height / height}
    }
    return {width, height}
  } catch (error) {
    if (error instanceof CompoundLayoutError) throw new PrismTreeLayoutError(error.code, {
      nodeIds: error.witness.nodeIds.map(id => slots.get(id)?.id ?? id),
      ...(error.witness.field === undefined ? {} : {field: error.witness.field}),
    })
    throw error
  }
}

function ensureRectangle(rect: Rectangle, id: string): void {
  if (![rect.x, rect.y, rect.z, rect.width, rect.height, rect.x + rect.width, rect.y + rect.height].every(Number.isFinite)) {
    throw new PrismTreeLayoutError("INVALID_GEOMETRY", {nodeIds: [id], field: "coordinates"})
  }
  if (rect.x + rect.width <= rect.x || rect.y + rect.height <= rect.y) {
    throw new PrismTreeLayoutError("INVALID_GEOMETRY", {nodeIds: [id], field: "coordinatePrecision"})
  }
}

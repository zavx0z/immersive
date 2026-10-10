import type {LayoutNodeGeometry, LayoutPoint} from "../../protocol/types/src/protocol.ts"
import type {OrthogonalRoutingInput} from "../contract/input.ts"

type Endpoint = OrthogonalRoutingInput["edges"][number]["source"]
type Item = Readonly<{node: number; cost: number; remaining: number; turns: number}>

/**
Общий для batch граф ортогональной видимости границ препятствий и portals.
Декартова сетка имеет явный предел размера. Сегменты проверяются лениво один раз,
поиск ограничен общим числом раскрытий, массивы переиспользуются между связями.
*/
export function createVisibilityRouter(
  nodes: readonly LayoutNodeGeometry[],
  edges: OrthogonalRoutingInput["edges"],
  clearance: number,
  maxGridPoints: number,
  maxSearchSteps: number,
  clearSegment: (a: LayoutPoint, b: LayoutPoint) => boolean,
) {
  const xsSet = new Set<number>()
  const ysSet = new Set<number>()
  for (const node of nodes) {
    xsSet.add(node.x - clearance)
    xsSet.add(node.x + node.width + clearance)
    ysSet.add(node.y - clearance)
    ysSet.add(node.y + node.height + clearance)
  }
  for (const edge of edges) {
    for (const endpoint of [edge.source, edge.target]) {
      const point = portal(endpoint, clearance)
      xsSet.add(point.x)
      ysSet.add(point.y)
    }
  }
  const xs = [...xsSet].sort((a, b) => a - b)
  const ys = [...ysSet].sort((a, b) => a - b)
  const gridPoints = xs.length * ys.length
  if (!Number.isSafeInteger(gridPoints) || gridPoints > maxGridPoints) {
    return {gridPoints, get searchSteps() { return 0 }, route: (_source: Endpoint, _target: Endpoint) => ({reason: "GRID_BUDGET" as const})}
  }
  const xi = new Map(xs.map((value, index) => [value, index]))
  const yi = new Map(ys.map((value, index) => [value, index]))
  const width = xs.length
  const generations = new Uint32Array(gridPoints)
  const costs = new Float64Array(gridPoints)
  const turns = new Uint32Array(gridPoints)
  const directions = new Uint8Array(gridPoints)
  const previous = new Uint32Array(gridPoints)
  const segmentCache = new Map<number, boolean>()
  let generation = 0
  let searchSteps = 0
  const point = (node: number): LayoutPoint => ({x: xs[node % width]!, y: ys[Math.floor(node / width)]!})
  return {
    gridPoints,
    get searchSteps() { return searchSteps },
    route(source: Endpoint, target: Endpoint): {points?: readonly LayoutPoint[]; reason?: "SEARCH_BUDGET" | "SEARCH_FAILED"} {
      if (searchSteps >= maxSearchSteps) return {reason: "SEARCH_BUDGET"}
      generation++
      const startPoint = portal(source, clearance)
      const endPoint = portal(target, clearance)
      const start = yi.get(startPoint.y)! * width + xi.get(startPoint.x)!
      const end = yi.get(endPoint.y)! * width + xi.get(endPoint.x)!
      const remaining = (p: LayoutPoint) => Math.abs(p.x - endPoint.x) + Math.abs(p.y - endPoint.y)
      const heap = new Heap()
      generations[start] = generation
      costs[start] = 0
      turns[start] = 0
      directions[start] = source.side === "WEST" || source.side === "EAST" ? 1 : 2
      heap.push({node: start, cost: 0, remaining: remaining(startPoint), turns: 0})
      while (heap.size > 0) {
        const current = heap.pop()!
        if (current.cost !== costs[current.node] || current.turns !== turns[current.node]) continue
        if (searchSteps >= maxSearchSteps) return {reason: "SEARCH_BUDGET"}
        searchSteps++
        if (current.node === end) {
          const path: LayoutPoint[] = []
          let node = end
          while (node !== start) { path.push(point(node)); node = previous[node]! }
          path.push(startPoint)
          path.reverse()
          return {points: path}
        }
        const x = current.node % width
        const y = Math.floor(current.node / width)
        const a = point(current.node)
        const neighbours = [
          ...(x > 0 ? [{node: current.node - 1, axis: 1}] : []),
          ...(x + 1 < width ? [{node: current.node + 1, axis: 1}] : []),
          ...(y > 0 ? [{node: current.node - width, axis: 2}] : []),
          ...(y + 1 < ys.length ? [{node: current.node + width, axis: 2}] : []),
        ]
        for (const next of neighbours) {
          const b = point(next.node)
          const cost = current.cost + Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
          const nextTurns = current.turns + (next.axis === directions[current.node] ? 0 : 1)
          if (generations[next.node] === generation && (cost > costs[next.node]! || cost === costs[next.node] && nextTurns >= turns[next.node]!)) continue
          const key = Math.min(current.node, next.node) * 2 + next.axis - 1
          let legal = segmentCache.get(key)
          if (legal === undefined) { legal = clearSegment(a, b); segmentCache.set(key, legal) }
          if (!legal) continue
          generations[next.node] = generation
          costs[next.node] = cost
          turns[next.node] = nextTurns
          directions[next.node] = next.axis
          previous[next.node] = current.node
          heap.push({node: next.node, cost, remaining: remaining(b), turns: nextTurns})
        }
      }
      return {reason: "SEARCH_FAILED"}
    },
  }
}

export function portal(endpoint: Endpoint, clearance: number): LayoutPoint {
  return {
    x: endpoint.point.x + (endpoint.side === "WEST" ? -clearance : endpoint.side === "EAST" ? clearance : 0),
    y: endpoint.point.y + (endpoint.side === "NORTH" ? -clearance : endpoint.side === "SOUTH" ? clearance : 0),
  }
}

class Heap {
  private readonly items: Item[] = []
  get size() { return this.items.length }
  push(item: Item): void {
    const items = this.items
    items.push(item)
    let index = items.length - 1
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (compare(items[parent]!, item) <= 0) break
      items[index] = items[parent]!
      index = parent
    }
    items[index] = item
  }
  pop(): Item | undefined {
    const first = this.items[0]
    const last = this.items.pop()
    if (this.items.length === 0 || last === undefined) return first
    let index = 0
    while (index * 2 + 1 < this.items.length) {
      let child = index * 2 + 1
      if (child + 1 < this.items.length && compare(this.items[child + 1]!, this.items[child]!) < 0) child++
      if (compare(last, this.items[child]!) <= 0) break
      this.items[index] = this.items[child]!
      index = child
    }
    this.items[index] = last
    return first
  }
}

function compare(a: Item, b: Item): number {
  return a.cost + a.remaining - b.cost - b.remaining || a.remaining - b.remaining || a.turns - b.turns || a.node - b.node
}

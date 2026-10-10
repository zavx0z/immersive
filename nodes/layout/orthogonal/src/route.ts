import type {LayoutNodeGeometry, LayoutPoint} from "../../protocol/types/src/protocol.ts"
import type {OrthogonalRoutingInput} from "../contract/input.ts"
import type {OrthogonalRoutingOutput} from "../contract/output.ts"
import {createRectangleIndex} from "../../rectangle-index/index.ts"
import {routeGraph} from "../../shared/route-graph.ts"
import type {RouteNode, RoutePort} from "../../shared/types/routing.ts"
import {createVisibilityRouter} from "./visibility.ts"

type Edge = OrthogonalRoutingInput["edges"][number]
type Endpoint = Edge["source"]
const SCALE = 1_000
const SEGMENT_HIT_LIMIT = 256

/** Рассчитывает ограниченный batch без placement и без зависимости от камеры. */
export function routeOrthogonal(input: OrthogonalRoutingInput): OrthogonalRoutingOutput {
  const clearance = input.options?.clearance ?? 12
  if (!Number.isFinite(clearance) || clearance <= 0) throw new RangeError("routing clearance must be finite and positive")
  const maxObstacles = budget(input.options?.maxObstacles ?? 32, 2, 64, "maxObstacles")
  const maxFallbacks = budget(input.options?.maxFallbacks ?? 8, 0, 64, "maxFallbacks")
  const maxEdges = budget(input.options?.maxEdges ?? 4_000, 1, 10_000, "maxEdges")
  const maxGridPoints = budget(input.options?.maxGridPoints ?? 100_000, 0, 1_000_000, "maxGridPoints")
  const maxSearchSteps = budget(input.options?.maxSearchSteps ?? 1_000_000, 0, 8_000_000, "maxSearchSteps")
  const cards = new Map(input.nodes.map(node => [node.id, node]))
  if (cards.size !== input.nodes.length) throw new Error("duplicate routing node")
  const inflated = input.nodes.map(node => ({
    id: node.id, x: node.x - clearance, y: node.y - clearance,
    width: node.width + clearance * 2, height: node.height + clearance * 2,
  }))
  // Оригинальная геометрия и расширенные obstacles проверяются отдельно.
  createRectangleIndex(input.nodes)
  const index = createRectangleIndex(inflated)
  const inflatedById = new Map(inflated.map(node => [node.id, node]))
  const edgeIds = new Set<string>()
  for (const edge of input.edges) {
    if (edgeIds.has(edge.id)) throw new Error(`duplicate routing edge: ${edge.id}`)
    edgeIds.add(edge.id)
    validateEndpoint(edge.source, cards)
    validateEndpoint(edge.target, cards)
  }
  const routed = new Map<string, readonly LayoutPoint[]>()
  const failures = new Map<string, OrthogonalRoutingOutput["failures"][number]["reason"]>()
  let fallbackAttempts = 0
  const compareIds = (a: Edge, b: Edge) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  const ordered = [...input.edges].sort(compareIds)
  let visibility: ReturnType<typeof createVisibilityRouter> | undefined

  const clearSegment = (a: LayoutPoint, b: LayoutPoint): boolean => {
    const query = index.query({x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y)}, {limit: SEGMENT_HIT_LIMIT})
    return !query.truncated && query.ids.every(id => !intersectsInterior(a, b, inflatedById.get(id)!))
  }

  const check = (points: readonly LayoutPoint[], edge: Edge): boolean => {
    let legal = true
    for (let n = 1; n < points.length; n++) {
      const a = points[n - 1]!
      const b = points[n]!
      if (![a.x, a.y, b.x, b.y].every(Number.isFinite) || a.x !== b.x && a.y !== b.y) return false
      const query = index.query({x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y)}, {limit: SEGMENT_HIT_LIMIT})
      if (query.truncated) legal = false
      for (const id of query.ids) {
        if (id === edge.source.nodeId && n === 1 && outward(a, b, edge.source.side)) continue
        if (id === edge.target.nodeId && n === points.length - 1 && outward(b, a, edge.target.side)) continue
        const r = inflatedById.get(id)!
        const blocked = intersectsInterior(a, b, r)
        if (blocked) legal = false
      }
    }
    return legal && points.length >= 2 && outward(points[0]!, points[1]!, edge.source.side) && outward(points.at(-1)!, points.at(-2)!, edge.target.side)
  }

  for (let n = 0; n < ordered.length; n++) {
    const edge = ordered[n]!
    if (n >= maxEdges) { failures.set(edge.id, "EDGE_BUDGET"); continue }
    const source = cards.get(edge.source.nodeId)!
    const target = cards.get(edge.target.nodeId)!
    const candidates = paths(edge, source, target, clearance)
      .map(simplify)
      .map(points => ({points, length: length(points), key: JSON.stringify(points)}))
      .sort((a, b) => a.length - b.length || a.points.length - b.points.length || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    let accepted: readonly LayoutPoint[] | undefined
    for (const {points: candidate} of candidates) {
      if (check(candidate, edge)) { accepted = candidate; break }
    }
    // Малый полный набор безопасен для прежнего solver: соседние карточки не теряются.
    if (accepted === undefined && cards.size <= maxObstacles && fallbackAttempts < maxFallbacks && horizontal(edge.source.side) === horizontal(edge.target.side)) {
      fallbackAttempts++
      try {
        const candidate = existingRoute(edge, input.nodes, clearance)
        if (check(candidate, edge)) accepted = candidate
      } catch {
        // Отказ прежнего solver сохраняет возможность ограниченного общего поиска.
      }
    }
    let searchFailure: OrthogonalRoutingOutput["failures"][number]["reason"] | undefined
    if (accepted === undefined) {
      visibility ??= createVisibilityRouter(input.nodes, ordered.slice(0, maxEdges), clearance, maxGridPoints, maxSearchSteps, clearSegment)
      const result = visibility.route(edge.source, edge.target)
      if ("points" in result && result.points !== undefined) {
        const candidate = simplify([edge.source.point, ...result.points, edge.target.point])
        if (check(candidate, edge)) accepted = candidate
        else searchFailure = "SEARCH_FAILED"
      } else searchFailure = result.reason
    }
    if (accepted !== undefined) routed.set(edge.id, accepted)
    else failures.set(edge.id, searchFailure ?? "SEARCH_FAILED")
  }
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
  const include = (x: number, y: number) => { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y) }
  for (const node of input.nodes) { include(node.x, node.y); include(node.x + node.width, node.y + node.height) }
  for (const points of routed.values()) for (const point of points) include(point.x, point.y)
  const bounds = left === Infinity ? {x: 0, y: 0, width: 0, height: 0} : {x: left, y: top, width: right - left, height: bottom - top}
  if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) throw new RangeError("routing bounds overflow")
  return {
    edges: input.edges.flatMap(edge => routed.has(edge.id) ? [{id: edge.id, points: routed.get(edge.id)!}] : []),
    failures: input.edges.flatMap(edge => failures.has(edge.id) ? [{id: edge.id, reason: failures.get(edge.id)!}] : []),
    bounds,
    fallbackAttempts,
    gridPoints: visibility?.gridPoints ?? 0,
    searchSteps: visibility?.searchSteps ?? 0,
  }
}

function paths(edge: Edge, source: LayoutNodeGeometry, target: LayoutNodeGeometry, clearance: number): LayoutPoint[][] {
  const a = edge.source.point, b = edge.target.point
  const move = (endpoint: Endpoint): LayoutPoint => ({
    x: endpoint.point.x + (endpoint.side === "WEST" ? -clearance : endpoint.side === "EAST" ? clearance : 0),
    y: endpoint.point.y + (endpoint.side === "NORTH" ? -clearance : endpoint.side === "SOUTH" ? clearance : 0),
  })
  const s = move(edge.source), t = move(edge.target)
  const result = [[a, s, {x: s.x, y: t.y}, t, b], [a, s, {x: t.x, y: s.y}, t, b]]
  const xs = [source.x - clearance, source.x + source.width + clearance, target.x - clearance, target.x + target.width + clearance, s.x / 2 + t.x / 2]
  const ys = [source.y - clearance, source.y + source.height + clearance, target.y - clearance, target.y + target.height + clearance, s.y / 2 + t.y / 2]
  for (const x of xs) result.push([a, s, {x, y: s.y}, {x, y: t.y}, t, b])
  for (const y of ys) result.push([a, s, {x: s.x, y}, {x: t.x, y}, t, b])
  return result
}

function existingRoute(edge: Edge, nodes: readonly LayoutNodeGeometry[], clearance: number): readonly LayoutPoint[] {
  const rotate = !horizontal(edge.source.side)
  const transform = (p: LayoutPoint): LayoutPoint => rotate ? {x: p.y, y: -p.x} : p
  const restore = (p: LayoutPoint): LayoutPoint => rotate ? {x: -p.y / SCALE, y: p.x / SCALE} : {x: p.x / SCALE, y: p.y / SCALE}
  const integer = (n: number): number => {
    const v = Math.round(n * SCALE)
    if (!Number.isSafeInteger(v)) throw new RangeError("routing integer range")
    return v
  }
  const routeNodes: RouteNode[] = nodes.map(node => ({id: node.id, rect: rotate
    ? {x: integer(node.y), y: integer(-node.x - node.width), w: integer(node.height), h: integer(node.width)}
    : {x: integer(node.x), y: integer(node.y), w: integer(node.width), h: integer(node.height)}}))
  const endpoint = (port: Endpoint, id: string): RoutePort => {
    const p = transform(port.point)
    return {id, nodeId: port.nodeId, center: {x: integer(p.x), y: integer(p.y)}, side: port.side === "WEST" || port.side === "NORTH" ? "WEST" : "EAST"}
  }
  const c = integer(clearance)
  const left = Math.min(...routeNodes.map(node => node.rect.x)) - c * 4
  const top = Math.min(...routeNodes.map(node => node.rect.y)) - c * 4
  const right = Math.max(...routeNodes.map(node => node.rect.x + node.rect.w)) + c * 4
  const bottom = Math.max(...routeNodes.map(node => node.rect.y + node.rect.h)) + c * 4
  const result = routeGraph({direction: "RIGHT", unitsPerPixel: SCALE, clearance: c,
    bounds: {x: left, y: top, w: right - left, h: bottom - top}, viewport: {width: 1_000, height: 1_000},
    nodes: routeNodes, ports: [endpoint(edge.source, "source"), endpoint(edge.target, "target")],
    edges: [{id: edge.id, sourcePortId: "source", targetPortId: "target"}],
  })
  const section = result.sections[0]!
  return simplify([edge.source.point, ...section.bendPoints.map(restore), edge.target.point])
}

function validateEndpoint(endpoint: Endpoint, cards: ReadonlyMap<string, LayoutNodeGeometry>): void {
  const node = cards.get(endpoint.nodeId)
  if (node === undefined) throw new Error(`unknown routing node: ${endpoint.nodeId}`)
  const {x, y} = endpoint.point
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new RangeError("routing endpoint must be finite")
  const valid = endpoint.side === "WEST" ? x === node.x && y >= node.y && y <= node.y + node.height
    : endpoint.side === "EAST" ? x === node.x + node.width && y >= node.y && y <= node.y + node.height
    : endpoint.side === "NORTH" ? y === node.y && x >= node.x && x <= node.x + node.width
    : endpoint.side === "SOUTH" ? y === node.y + node.height && x >= node.x && x <= node.x + node.width : false
  if (!valid) throw new Error(`routing endpoint is detached: ${endpoint.nodeId}/${endpoint.side}`)
}

function horizontal(side: Endpoint["side"]): boolean { return side === "WEST" || side === "EAST" }
function intersectsInterior(a: LayoutPoint, b: LayoutPoint, r: LayoutNodeGeometry): boolean {
  return a.x === b.x
    ? a.x > r.x && a.x < r.x + r.width && Math.max(a.y, b.y) > r.y && Math.min(a.y, b.y) < r.y + r.height
    : a.y > r.y && a.y < r.y + r.height && Math.max(a.x, b.x) > r.x && Math.min(a.x, b.x) < r.x + r.width
}
function outward(a: LayoutPoint, b: LayoutPoint, side: Endpoint["side"]): boolean {
  return side === "WEST" ? a.y === b.y && b.x < a.x : side === "EAST" ? a.y === b.y && b.x > a.x
    : side === "NORTH" ? a.x === b.x && b.y < a.y : a.x === b.x && b.y > a.y
}
function simplify(points: readonly LayoutPoint[]): LayoutPoint[] {
  const result: LayoutPoint[] = []
  for (const p of points) {
    if (result.at(-1)?.x === p.x && result.at(-1)?.y === p.y) continue
    while (result.length >= 2) {
      const a = result.at(-2)!, b = result.at(-1)!
      if (a.x === b.x && b.x === p.x && (b.y - a.y) * (p.y - b.y) >= 0 ||
          a.y === b.y && b.y === p.y && (b.x - a.x) * (p.x - b.x) >= 0) result.pop()
      else break
    }
    result.push({x: p.x, y: p.y})
  }
  return result
}
function length(points: readonly LayoutPoint[]): number {
  let sum = 0
  for (let n = 1; n < points.length; n++) sum += Math.abs(points[n]!.x - points[n - 1]!.x) + Math.abs(points[n]!.y - points[n - 1]!.y)
  return sum
}
function budget(value: number, min: number, max: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`${name} must be an integer in [${min}, ${max}]`)
  return value
}

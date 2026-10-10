import {expect, test} from "bun:test"
import {routeOrthogonal, type OrthogonalRoutingInput} from "@zavx0z/immersive-nodes-layout/orthogonal"
import {layoutCompound} from "@zavx0z/immersive-nodes-layout/compound"

test("пустой вход и отсутствие связей сохраняют bounds размещённых карточек", () => {
  expect(routeOrthogonal({nodes: [], edges: []})).toEqual({edges: [], failures: [], bounds: {x: 0, y: 0, width: 0, height: 0}, fallbackAttempts: 0, gridPoints: 0, searchSteps: 0})
  expect(routeOrthogonal({nodes: [{id: "a", x: -20, y: -10, width: 100, height: 80}], edges: []}).bounds)
    .toEqual({x: -20, y: -10, width: 100, height: 80})
})

test("связь сохраняет точные anchors и обходит промежуточную карточку с clearance", () => {
  const input: OrthogonalRoutingInput = {
    nodes: [
      {id: "a", x: 0, y: 0, width: 100, height: 100},
      {id: "block", x: 140, y: 0, width: 100, height: 100},
      {id: "b", x: 280, y: 0, width: 100, height: 100},
    ],
    edges: [{id: "edge", source: {nodeId: "a", point: {x: 100, y: 50}, side: "EAST"}, target: {nodeId: "b", point: {x: 280, y: 50}, side: "WEST"}}],
  }
  const result = safe(input)
  expect(result.edges[0]!.points.length).toBeGreaterThan(2)
  expect(result.fallbackAttempts).toBe(0)
})

test("вертикальные и смешанные стороны обходят препятствия без поворота placement", () => {
  safe({
    nodes: [
      {id: "a", x: 0, y: 0, width: 100, height: 100},
      {id: "block", x: 0, y: 140, width: 100, height: 100},
      {id: "b", x: 0, y: 280, width: 100, height: 100},
    ],
    edges: [{id: "edge", source: {nodeId: "a", point: {x: 50, y: 100}, side: "SOUTH"}, target: {nodeId: "b", point: {x: 50, y: 280}, side: "NORTH"}}],
  })
  safe({
    nodes: [{id: "a", x: 0, y: 0, width: 100, height: 100}, {id: "b", x: 280, y: 200, width: 100, height: 100}],
    edges: [{id: "mixed", source: {nodeId: "a", point: {x: 100, y: 50}, side: "EAST"}, target: {nodeId: "b", point: {x: 330, y: 200}, side: "NORTH"}}],
  })
})

test("2000 связей широкого Repo безопасны без глобального solver", () => {
  const layout = layoutCompound({nodes: Array.from({length: 2_001}, (_, n) => ({id: String(n), width: 960, height: 676})), options: {spacing: 48, outerPadding: 96}})
  const source = layout.nodes[0]!
  const input: OrthogonalRoutingInput = {
    nodes: layout.nodes,
    edges: layout.nodes.slice(1).map(target => {
      const horizontal = Math.abs(target.x - source.x) > Math.abs(target.y - source.y)
      const forward = horizontal ? target.x >= source.x : target.y >= source.y
      return {id: target.id,
        source: {nodeId: source.id, point: {x: source.x + (horizontal ? forward ? source.width : 0 : source.width / 2), y: source.y + (horizontal ? 18 : forward ? source.height : 0)}, side: horizontal ? forward ? "EAST" : "WEST" : forward ? "SOUTH" : "NORTH"},
        target: {nodeId: target.id, point: {x: target.x + (horizontal ? forward ? 0 : target.width : target.width / 2), y: target.y + (horizontal ? 18 : forward ? 0 : target.height)}, side: horizontal ? forward ? "WEST" : "EAST" : forward ? "NORTH" : "SOUTH"},
      }
    }),
    options: {maxFallbacks: 0},
  }
  const result = routeOrthogonal(input)
  expect(result.edges).toHaveLength(2_000)
  expect(result.failures).toEqual([])
  expect(result.fallbackAttempts).toBe(0)
  // Независимая проверка всех карточек для выбранных дальних/ближних маршрутов.
  for (const id of ["1", "20", "400", "1200", "2000"]) checkRoute(input, result.edges.find(edge => edge.id === id)!)
})

test("исчерпание budget и закрытый anchor не публикуют небезопасную линию", () => {
  const input: OrthogonalRoutingInput = {
    nodes: [
      {id: "a", x: 0, y: 0, width: 100, height: 100},
      {id: "block", x: 100, y: 0, width: 100, height: 100},
      {id: "b", x: 300, y: 0, width: 100, height: 100},
    ],
    edges: [{id: "blocked", source: {nodeId: "a", point: {x: 100, y: 50}, side: "EAST"}, target: {nodeId: "b", point: {x: 300, y: 50}, side: "WEST"}}],
    options: {maxFallbacks: 0},
  }
  expect(routeOrthogonal(input).edges).toEqual([])
  expect(routeOrthogonal(input).failures).toEqual([{id: "blocked", reason: "SEARCH_FAILED"}])
  const straight = {nodes: [input.nodes[0]!, input.nodes[2]!], edges: [input.edges[0]!, {...input.edges[0]!, id: "second"}], options: {maxEdges: 1}}
  expect(routeOrthogonal(straight).edges).toHaveLength(1)
  expect(routeOrthogonal(straight).failures).toEqual([{id: "second", reason: "EDGE_BUDGET"}])
})

test("bounded existing solver вызывается для сложного закрытого коридора и возвращает явный отказ", () => {
  const result = routeOrthogonal({
    nodes: [{id: "a", x: 0, y: 0, width: 100, height: 100}, {id: "block", x: 100, y: 0, width: 100, height: 100}, {id: "b", x: 300, y: 0, width: 100, height: 100}],
    edges: [{id: "blocked", source: {nodeId: "a", point: {x: 100, y: 50}, side: "EAST"}, target: {nodeId: "b", point: {x: 300, y: 50}, side: "WEST"}}],
    options: {maxFallbacks: 1},
  })
  expect(result.fallbackAttempts).toBe(1)
  expect(result.edges).toEqual([])
  expect(result.failures).toHaveLength(1)
})

test("existing solver находит дополнительный коридор у препятствий за пределами быстрых lanes", () => {
  const input: OrthogonalRoutingInput = {
    nodes: [
      {id: "a", x: 0, y: 0, width: 100, height: 100},
      {id: "wall:1", x: 200, y: -50, width: 80, height: 250},
      {id: "wall:2", x: 400, y: -100, width: 80, height: 250},
      {id: "b", x: 600, y: 0, width: 100, height: 100},
    ],
    edges: [{id: "edge", source: {nodeId: "a", point: {x: 100, y: 50}, side: "EAST"}, target: {nodeId: "b", point: {x: 600, y: 50}, side: "WEST"}}],
  }
  expect(routeOrthogonal({...input, options: {maxFallbacks: 0, maxGridPoints: 0}}).edges).toEqual([])
  const result = safe(input)
  expect(result.fallbackAttempts).toBe(1)
})

test("frozen вход, дробные anchors и перестановка карточек сохраняют геометрию", () => {
  const input = Object.freeze({
    nodes: Object.freeze([{id: "a", x: .125, y: .25, width: 100.5, height: 50.75}, {id: "b", x: 300.25, y: .25, width: 100.5, height: 50.75}].map(node => Object.freeze(node))),
    edges: Object.freeze([{id: "e", source: {nodeId: "a", point: {x: 100.625, y: 18.125}, side: "EAST" as const}, target: {nodeId: "b", point: {x: 300.25, y: 18.125}, side: "WEST" as const}}]),
  })
  const first = safe(input)
  expect(routeOrthogonal({...input, nodes: [...input.nodes].reverse()})).toEqual(first)
})

test("невалидные anchors, повторения и неограниченные budgets отклоняются", () => {
  const nodes = [{id: "a", x: 0, y: 0, width: 100, height: 100}]
  expect(() => routeOrthogonal({nodes, edges: [{id: "e", source: {nodeId: "a", point: {x: 99, y: 50}, side: "EAST"}, target: {nodeId: "a", point: {x: 0, y: 50}, side: "WEST"}}]})).toThrow("detached")
  expect(() => routeOrthogonal({nodes: [...nodes, ...nodes], edges: []})).toThrow("duplicate")
  expect(() => routeOrthogonal({nodes, edges: [], options: {maxObstacles: 65}})).toThrow(RangeError)
  expect(() => routeOrthogonal({nodes, edges: [], options: {maxFallbacks: Infinity}})).toThrow(RangeError)
  expect(() => routeOrthogonal({nodes, edges: [], options: {clearance: NaN}})).toThrow(RangeError)
  expect(() => routeOrthogonal({nodes, edges: [], options: {maxGridPoints: 1_000_001}})).toThrow(RangeError)
  expect(() => routeOrthogonal({nodes, edges: [], options: {maxSearchSteps: Infinity}})).toThrow(RangeError)
})

test("сетка и общий поиск имеют отдельные явные пределы, безопасные простые связи не теряются", () => {
  const input: OrthogonalRoutingInput = {
    nodes: [{id: "a", x: 0, y: 0, width: 100, height: 100}, {id: "wall", x: 200, y: -100, width: 80, height: 300}, {id: "b", x: 600, y: 0, width: 100, height: 100}],
    edges: [{id: "complex", source: {nodeId: "a", point: {x: 100, y: 50}, side: "EAST"}, target: {nodeId: "b", point: {x: 600, y: 50}, side: "WEST"}}],
    options: {maxFallbacks: 0},
  }
  const noGrid = routeOrthogonal({...input, options: {...input.options, maxGridPoints: 1}})
  expect(noGrid.edges).toEqual([])
  expect(noGrid.failures).toEqual([{id: "complex", reason: "GRID_BUDGET"}])
  expect(noGrid.searchSteps).toBe(0)
  const noSearch = routeOrthogonal({...input, options: {...input.options, maxSearchSteps: 1}})
  expect(noSearch.edges).toEqual([])
  expect(noSearch.failures).toEqual([{id: "complex", reason: "SEARCH_BUDGET"}])
  expect(noSearch.searchSteps).toBe(1)
  expect(safe(input).edges).toHaveLength(1)
})

function safe(input: OrthogonalRoutingInput) {
  const result = routeOrthogonal(input)
  expect(result.failures).toEqual([])
  expect(result.edges).toHaveLength(input.edges.length)
  for (const route of result.edges) checkRoute(input, route)
  return result
}

function checkRoute(input: OrthogonalRoutingInput, route: ReturnType<typeof routeOrthogonal>["edges"][number]): void {
  const edge = input.edges.find(edge => edge.id === route.id)!
  expect(route.points[0]).toEqual(edge.source.point)
  expect(route.points.at(-1)).toEqual(edge.target.point)
  const c = input.options?.clearance ?? 12
  for (let n = 1; n < route.points.length; n++) {
    const a = route.points[n - 1]!, b = route.points[n]!
    expect(a.x === b.x || a.y === b.y).toBe(true)
    for (const card of input.nodes) {
      if (n === 1 && card.id === edge.source.nodeId || n === route.points.length - 1 && card.id === edge.target.nodeId) continue
      const left = card.x - c, top = card.y - c, right = card.x + card.width + c, bottom = card.y + card.height + c
      const blocked = a.x === b.x ? a.x > left && a.x < right && Math.max(a.y, b.y) > top && Math.min(a.y, b.y) < bottom
        : a.y > top && a.y < bottom && Math.max(a.x, b.x) > left && Math.min(a.x, b.x) < right
      expect(blocked).toBe(false)
    }
  }
}

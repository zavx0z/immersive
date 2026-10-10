import {expect, test} from "bun:test"
import {routeOrthogonal, type OrthogonalRoutingInput} from "@zavx0z/immersive-nodes-layout/orthogonal"

type Fixture = Readonly<{
  provenance: Readonly<{sha256: string; subjects: number}>
  cases: readonly Readonly<{viewport: Readonly<{width: number; height: number}>; input: OrthogonalRoutingInput}>[]
}>
const fixture: Fixture = await Bun.file(new URL("./references/orthogonal-actual.json", import.meta.url)).json()

for (const measured of fixture.cases) {
  test(`actual 428 subjects ${measured.viewport.width}×${measured.viewport.height}: каждая из 427 связей безопасна`, () => {
    expect(fixture.provenance.subjects).toBe(428)
    expect(fixture.provenance.sha256).toHaveLength(64)
    expect(measured.input.nodes).toHaveLength(428)
    expect(measured.input.edges).toHaveLength(427)
    const result = routeOrthogonal({...measured.input, options: {...measured.input.options, maxFallbacks: 0}})
    expect(result.failures).toEqual([])
    expect(result.edges).toHaveLength(427)
    expect(result.fallbackAttempts).toBe(0)
    expect(result.gridPoints).toBeGreaterThan(0)
    expect(result.gridPoints).toBeLessThanOrEqual(100_000)
    expect(result.searchSteps).toBeGreaterThan(0)
    expect(result.searchSteps).toBeLessThanOrEqual(1_000_000)
    const source = new Map(measured.input.edges.map(edge => [edge.id, edge]))
    const clearance = measured.input.options?.clearance ?? 12
    for (const route of result.edges) {
      const edge = source.get(route.id)!
      expect(route.points[0]).toEqual(edge.source.point)
      expect(route.points.at(-1)).toEqual(edge.target.point)
      const a0 = route.points[0]!, a1 = route.points[1]!
      const b0 = route.points.at(-1)!, b1 = route.points.at(-2)!
      expect(outward(a0, a1, edge.source.side)).toBe(true)
      expect(outward(b0, b1, edge.target.side)).toBe(true)
      for (let n = 1; n < route.points.length; n++) {
        const a = route.points[n - 1]!, b = route.points[n]!
        expect(a.x === b.x || a.y === b.y).toBe(true)
        for (const card of measured.input.nodes) {
          if (n === 1 && card.id === edge.source.nodeId || n === route.points.length - 1 && card.id === edge.target.nodeId) continue
          const left = card.x - clearance, top = card.y - clearance
          const right = card.x + card.width + clearance, bottom = card.y + card.height + clearance
          const crossing = a.x === b.x
            ? a.x > left && a.x < right && Math.max(a.y, b.y) > top && Math.min(a.y, b.y) < bottom
            : a.y > top && a.y < bottom && Math.max(a.x, b.x) > left && Math.min(a.x, b.x) < right
          expect(crossing).toBe(false)
        }
      }
    }
    // Общая сетка, tie-break и бюджет не зависят от перестановки входных массивов.
    const reversed = routeOrthogonal({...measured.input, nodes: [...measured.input.nodes].reverse(), edges: [...measured.input.edges].reverse(), options: {...measured.input.options, maxFallbacks: 0}})
    expect(new Map(reversed.edges.map(edge => [edge.id, edge.points]))).toEqual(new Map(result.edges.map(edge => [edge.id, edge.points])))
    expect(reversed.searchSteps).toBe(result.searchSteps)
  })
}

function outward(a: {x: number; y: number}, b: {x: number; y: number}, side: OrthogonalRoutingInput["edges"][number]["source"]["side"]): boolean {
  return side === "WEST" ? a.y === b.y && b.x < a.x : side === "EAST" ? a.y === b.y && b.x > a.x
    : side === "NORTH" ? a.x === b.x && b.y < a.y : a.x === b.x && b.y > a.y
}

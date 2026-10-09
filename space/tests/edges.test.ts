import {afterAll, beforeAll, describe, expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {createRoot} from "@zavx0z/immersive-component"
import {createDocument, MouseEvent as SemanticMouseEvent} from "@zavx0z/immersive-dom"
import {bindSpatialHit, createSpaceElementFactories, XRLineSegmentsElement} from "@zavx0z/immersive-space"
import type {BufferGeometry} from "@zavx0z/immersive-engine"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {SpatialEdgesProps} from "../shape/edges/contract/input.ts"
import type {SpatialEdge} from "../shape/edges/contract/edge.ts"
import {cacheSpatialRoutes, createSpatialBatch} from "../shape/edges/src/batch.ts"
import {hitSpatialBatch} from "../shape/edges/src/hit.ts"
import {spatialEdgeBounds, tessellateSpatialEdge} from "../shape/edges/src/geometry.ts"

let directory = ""
let edgesTemplate: CompiledTemplate<SpatialEdgesProps>

beforeAll(async () => {
  const space = resolve(import.meta.dir, "..")
  directory = await mkdtemp(join(import.meta.dir, ".edges-"))
  const result = await Bun.build({
    entrypoints: [join(space, "shape/edges.tsx")],
    outdir: directory,
    target: "bun",
    external: ["@zavx0z/immersive-space", "@zavx0z/immersive-component", "@zavx0z/immersive-dom", "@zavx0z/immersive-engine", "@zavx0z/immersive-template/compiled"],
    plugins: [createJsxBunPlugin({cwd: resolve(space, ".."), sourceRoots: [space]})],
  })
  if (!result.success) throw new AggregateError(result.logs, "SpatialEdges compilation failed")
  const entry = result.outputs.find(output => output.kind === "entry-point")!
  edgesTemplate = (await import(pathToFileURL(entry.path).href)).SpatialEdges
}, 30_000)

afterAll(async () => {
  if (directory) await rm(directory, {recursive: true, force: true})
})

const edges: readonly SpatialEdge[] = [
  {id: "entity-to-socket", route: {kind: "polyline", points: [{x: 0, y: 10, z: 20}, {x: 30, y: 40, z: 50}, {x: 60, y: 70, z: 80}]}, color: 0xff0000},
  {id: "cross-display", route: {kind: "cubic", points: [{x: 100, y: 0, z: 0}, {x: 100, y: 20, z: 20}, {x: 200, y: 20, z: 40}, {x: 200, y: 0, z: 60}], segments: 4}, color: 0x0000ff},
]

function geometry(element: XRLineSegmentsElement): BufferGeometry {
  return element.geometry!.factory!(element.geometry!)
}

describe("Общий batch рёбер XYZ", () => {
  test("смешивает bends и cubic в одном объекте без перемычки между рёбрами", () => {
    const document = createDocument({elementFactories: createSpaceElementFactories()})
    const root = createRoot(document)
    const ref = {current: null as XRLineSegmentsElement | null}
    root.render(edgesTemplate, {edges, geometryRevision: 1, ref})
    const element = ref.current!
    const batch = geometry(element)
    const material = element.material!.factory!(element.material!)
    expect(material).toHaveProperty("distanceFade", 0)
    expect(document.querySelectorAll("xr-line-segments")).toHaveLength(1)
    expect(batch.attributes.position!.count).toBe((2 + 4) * 2)
    expect(Array.from(batch.attributes.position!.array.slice(0, 12))).toEqual([0, 10, 20, 30, 40, 50, 30, 40, 50, 60, 70, 80])
    expect(Array.from(batch.attributes.position!.array.slice(12, 15))).toEqual([100, 0, 0])
    expect(Array.from(batch.attributes.position!.array.slice(-3))).toEqual([200, 0, 60])
    expect(batch.boundingSphere!.radius).toBeGreaterThan(0)
    root.unmount()
  })

  test("повторные render и выбор сохраняют route cache, position buffer и semantic Element", () => {
    const document = createDocument({elementFactories: createSpaceElementFactories()})
    const root = createRoot(document)
    root.render(edgesTemplate, {edges, geometryRevision: 1})
    const element = document.querySelector("xr-line-segments") as XRLineSegmentsElement
    const original = geometry(element)
    const positions = original.attributes.position
    const factory = element.geometry!.factory
    original.attributes.color!.clearUpdateRanges()
    for (let index = 0; index < 8; index++) root.render(edgesTemplate, {edges: edges.map(edge => ({...edge})), geometryRevision: 1})
    expect(element.geometry!.factory).toBe(factory)
    root.render(edgesTemplate, {edges, geometryRevision: 1, selectedId: "entity-to-socket", selectedColor: 0x00ff00})
    expect(geometry(element)).toBe(original)
    expect(original.attributes.position).toBe(positions)
    expect(original.attributes.position!.needsUpdate).toBe(false)
    expect(original.attributes.color!.updateRanges).toEqual([{offset: 0, count: 12}])
    expect(Array.from(original.attributes.color!.array.slice(0, 3))).toEqual([0, 1, 0])
    root.render(edgesTemplate, {edges, geometryRevision: 2})
    expect(geometry(element)).not.toBe(original)
    expect(document.querySelector("xr-line-segments")).toBe(element)
    root.unmount()
  })

  test("hidden исключает только своё ребро, disabled получает общий muted color", () => {
    const document = createDocument({elementFactories: createSpaceElementFactories()})
    const root = createRoot(document)
    root.render(edgesTemplate, {edges, geometryRevision: 1})
    const element = document.querySelector("xr-line-segments") as XRLineSegmentsElement
    root.render(edgesTemplate, {edges: [{...edges[0]!, hidden: true}, {...edges[1]!, disabled: true}], geometryRevision: 1})
    expect(geometry(element).attributes.position!.count).toBe(8)
    expect(geometry(element).attributes.color!.array[0]).toBeCloseTo(0x64 / 255)
    root.render(edgesTemplate, {edges: edges.map(edge => ({...edge, hidden: true})), geometryRevision: 1})
    expect(geometry(element).attributes.position!.count).toBe(0)
    expect(geometry(element).boundingSphere!.radius).toBe(0)
    root.unmount()
  })

  test("невалидный новый ввод не заменяет прежний batch", () => {
    const document = createDocument({elementFactories: createSpaceElementFactories()})
    const root = createRoot(document)
    root.render(edgesTemplate, {edges, geometryRevision: 1})
    const element = document.querySelector("xr-line-segments") as XRLineSegmentsElement
    const original = geometry(element)
    expect(() => root.render(edgesTemplate, {edges: [{...edges[0]!, color: -1}], geometryRevision: 2})).toThrow(RangeError)
    expect(() => root.render(edgesTemplate, {edges: [edges[0]!, edges[0]!], geometryRevision: 2})).toThrow(TypeError)
    expect(geometry(element)).toBe(original)
    root.unmount()
  })
})

describe("Числовые маршруты общего Space", () => {
  test("габарит cubic учитывает настоящую extrema даже при одном отрезке", () => {
    const route = {kind: "cubic", points: [{x: 0, y: 0, z: 0}, {x: 0, y: 100, z: 20}, {x: 100, y: 100, z: 40}, {x: 100, y: 0, z: 60}], segments: 1} as const
    expect(tessellateSpatialEdge(route)).toEqual([route.points[0], route.points[3]])
    expect(spatialEdgeBounds(route)).toEqual({min: {x: 0, y: 0, z: 0}, max: {x: 100, y: 75, z: 60}})
  })

  test("одинаковые XYZ остаются XYZ, а не теряют depth через двумерную проекцию", () => {
    const route = {kind: "polyline", points: [{x: -1, y: 12, z: 40}, {x: -1, y: 12, z: -90}]} as const
    expect(tessellateSpatialEdge(route)).toEqual(route.points)
    expect(spatialEdgeBounds(route)).toEqual({min: {x: -1, y: 12, z: -90}, max: {x: -1, y: 12, z: 40}})
  })

  test("невалидные координаты и незамкнутый договор cubic отвергаются", () => {
    expect(() => tessellateSpatialEdge({kind: "polyline", points: [{x: 0, y: 0, z: 0}]})).toThrow(RangeError)
    expect(() => tessellateSpatialEdge({kind: "polyline", points: [{x: 0, y: 0, z: 0}, {x: 1, y: Infinity, z: 2}]})).toThrow(RangeError)
    const route = edges[1]!.route
    if (route.kind === "cubic") expect(() => tessellateSpatialEdge({...route, segments: 0})).toThrow(RangeError)
  })
})


test("visibleIds материализует подмножество без чтения изменённого route и без маршрутизации по камере", () => {
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const root = createRoot(document)
  const edge = {...edges[1]!}
  const first = {...edges[0]!}
  const snapshot = [first, edge]
  root.render(edgesTemplate, {edges: snapshot, geometryRevision: 1, visibleIds: ["entity-to-socket"]})
  const element = document.querySelector("xr-line-segments") as XRLineSegmentsElement
  expect(geometry(element).attributes.position!.count).toBe(4)
  Object.defineProperty(edge, "route", {get() { throw new Error("Маршрут не должен читаться при движении ViewPoint") }})
  Object.defineProperty(first, "color", {get() { throw new Error("Стиль невидимого ребра не должен читаться при смене visibleIds") }})
  Object.defineProperty(first, "disabled", {get() { throw new Error("Disabled cache не должен обходить все рёбра при смене visibleIds") }})
  root.render(edgesTemplate, {edges: snapshot, geometryRevision: 1, visibleIds: new Set(["cross-display"])})
  expect(geometry(element).attributes.position!.count).toBe(8)
  expect(Array.from(geometry(element).attributes.position!.array.slice(-3))).toEqual([200, 0, 60])
  root.unmount()
})

test("луч XYZ выбирает ближайшее ребро с mm tolerance и исключает disabled", () => {
  const links = [
    {id: "near", route: {kind: "polyline", points: [{x: -10, y: 10, z: 0}, {x: 10, y: 10, z: 0}]}},
    {id: "far", route: {kind: "polyline", points: [{x: -10, y: 20, z: 0}, {x: 10, y: 20, z: 0}]}},
  ] as const
  const batch = createSpatialBatch(cacheSpatialRoutes(links), ["near", "far"])
  const ray = {origin: {x: 0, y: 0, z: 1}, direction: {x: 0, y: 2, z: 0}}
  expect(hitSpatialBatch(batch, ray, 2, new Set())).toEqual({id: "near", distance: 10, point: {x: 0, y: 10, z: 0}})
  expect(hitSpatialBatch(batch, ray, .5, new Set())).toBeNull()
  expect(hitSpatialBatch(batch, ray, 2, new Set(["near"]))?.id).toBe("far")
  expect(hitSpatialBatch(batch, {origin: ray.origin, direction: {x: 0, y: -1, z: 0}}, 2, new Set())).toBeNull()
})


test("SpatialEdges связывает onActivate с bubbling click и текущим мировым hit", () => {
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const root = createRoot(document)
  const activated: string[] = []
  root.render(edgesTemplate, {edges, geometryRevision: 1, onActivate: id => activated.push(id)})
  const element = document.querySelector("xr-line-segments") as XRLineSegmentsElement
  const hit = element.hitTest!({origin: {x: 30, y: 0, z: 50}, direction: {x: 0, y: 1, z: 0}})!
  expect(hit.id).toBe("entity-to-socket")
  const event = new SemanticMouseEvent("click", {bubbles: true})
  bindSpatialHit(event, hit)
  element.dispatchEvent(event)
  expect(activated).toEqual(["entity-to-socket"])
  root.unmount()
})


test("rounded polyline сохраняет endpoints, работает после XYZ rotation и лежит в консервативных bounds", () => {
  const points = [{x: 0, y: 0, z: 0}, {x: 10, y: 0, z: 0}, {x: 10, y: 10, z: 0}] as const
  const rotate = (point: {x: number; y: number; z: number}) => ({x: -point.y, y: point.z, z: point.x})
  const route = {kind: "polyline", points, cornerRadius: 4, cornerSegments: 4} as const
  const sampled = tessellateSpatialEdge(route)
  expect(sampled[0]).toEqual(points[0])
  expect(sampled.at(-1)).toEqual(points.at(-1))
  expect(sampled).toHaveLength(7)
  expect(sampled).not.toContainEqual(points[1])
  const rotated = tessellateSpatialEdge({...route, points: points.map(rotate)})
  expect(rotated).toEqual(sampled.map(rotate))
  const bounds = spatialEdgeBounds(route)
  for (const point of sampled) for (const axis of ["x", "y", "z"] as const) {
    expect(point[axis]).toBeGreaterThanOrEqual(bounds.min[axis])
    expect(point[axis]).toBeLessThanOrEqual(bounds.max[axis])
  }
})

test("rounded polyline ограничивает соседние срезы и не округляет вырожденные развороты", () => {
  const points = [{x: 0, y: 0, z: 2}, {x: 2, y: 0, z: 2}, {x: 2, y: 0, z: 2}, {x: 2, y: 1, z: 2}, {x: 4, y: 1, z: 2}] as const
  const sampled = tessellateSpatialEdge({kind: "polyline", points, cornerRadius: 100})
  expect(sampled[0]).toEqual(points[0])
  expect(sampled.at(-1)).toEqual(points.at(-1))
  expect(sampled.every(point => [point.x, point.y, point.z].every(Number.isFinite))).toBe(true)
  expect(sampled.filter(point => point.x === 2 && point.y === .5)).toHaveLength(2)
  const reversal = [{x: 0, y: 0, z: 0}, {x: 5, y: 0, z: 0}, {x: 0, y: 0, z: 0}] as const
  expect(tessellateSpatialEdge({kind: "polyline", points: reversal, cornerRadius: 3})).toEqual(reversal)
  const duplicate = {x: 1, y: 2, z: 3}
  expect(tessellateSpatialEdge({kind: "polyline", points: [duplicate, duplicate, duplicate], cornerRadius: 3})).toEqual([duplicate, duplicate])
  expect(() => tessellateSpatialEdge({kind: "polyline", points, cornerRadius: NaN})).toThrow(RangeError)
  expect(() => tessellateSpatialEdge({kind: "polyline", points, cornerSegments: 65})).toThrow(RangeError)
})


test("hit broadphase не читает segments пропущенных AABB и сохраняет tolerance", () => {
  const links = [
    {id: "left", route: {kind: "polyline", points: [{x: -10, y: 0, z: 0}, {x: -10, y: 10, z: 0}]}},
    {id: "right", route: {kind: "polyline", points: [{x: 10, y: 0, z: 0}, {x: 10, y: 10, z: 0}]}},
  ] as const
  const batch = createSpatialBatch(cacheSpatialRoutes(links), ["left", "right"])
  const attribute = batch.geometry.attributes.position!
  let coordinateReads = 0
  const tracked = new Proxy(attribute.array, {get(target, property) {
    if (typeof property === "string" && /^\d+$/.test(property)) coordinateReads++
    return Reflect.get(target, property, target)
  }})
  Object.defineProperty(attribute, "array", {get() { return tracked }})
  expect(hitSpatialBatch(batch, {origin: {x: 0, y: -5, z: 0}, direction: {x: 0, y: 1, z: 0}}, 2, new Set())).toBeNull()
  expect(coordinateReads).toBe(0)
  expect(hitSpatialBatch(batch, {origin: {x: -12, y: -5, z: 0}, direction: {x: 0, y: 1, z: 0}}, 2, new Set())?.id).toBe("left")
  expect(coordinateReads).toBeGreaterThan(0)
})

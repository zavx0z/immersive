import {afterAll, beforeAll, expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {createRoot} from "@zavx0z/immersive-component"
import {createDocument} from "@zavx0z/immersive-dom"
import {createSpaceElementFactories, XRMeshElement, type XRMaterialElement} from "@zavx0z/immersive-space"
import {GlassMaterial, HolographicMaterial, LineGlowMaterial} from "@zavx0z/immersive-engine"
import {readElementStyle} from "../../renderer/html/src/index.ts"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import type {SpatialVolumesProps} from "../shape/volumes/contract/input.ts"
import {cacheSpatialVolumes, createVolumeBatches, spatialVolumeCorners} from "../shape/volumes/src/geometry.ts"
import {resolveVolumeMaterialDefaults, volumeMaterial, volumeOutlineMaterial} from "../shape/volumes/src/material.ts"

let directory = ""
let template: CompiledTemplate<SpatialVolumesProps>
beforeAll(async () => {
  const space = resolve(import.meta.dir, "..")
  directory = await mkdtemp(join(import.meta.dir, ".volumes-"))
  const result = await Bun.build({entrypoints: [join(space, "shape/volumes.tsx")], outdir: directory, target: "bun",
    external: ["@zavx0z/immersive-space", "@zavx0z/immersive-component", "@zavx0z/immersive-dom", "@zavx0z/immersive-engine", "@zavx0z/immersive-template/compiled"],
    plugins: [createJsxBunPlugin({cwd: resolve(space, ".."), sourceRoots: [space]})]})
  if (!result.success) throw new AggregateError(result.logs, "SpatialVolumes compilation failed")
  template = (await import(pathToFileURL(result.outputs.find(output => output.kind === "entry-point")!.path).href)).SpatialVolumes
}, 30000)
afterAll(async () => {if (directory) await rm(directory, {recursive: true, force: true})})

const volumes = [
  {id: "parent", from: {x: -10, y: -5, z: 40, width: 20, height: 10}, to: {x: -10, y: -5, z: 30, width: 20, height: 10}, color: 0x00ffff},
  {id: "leaf", from: {x: 20, y: 10, z: 20, width: 8, height: 6}, to: {x: 20, y: 10, z: 10, width: 8, height: 6}, color: 0x00ffff},
  {id: "branch", from: {x: 0, y: 0, z: 30, width: 2, height: 2}, to: {x: 20, y: 10, z: 20, width: 8, height: 6}, color: 0x00ffff},
] as const

test("полные прямоугольные блоки включая leaf и ветви используют согласованные XYZ торцы", () => {
  const cache = cacheSpatialVolumes(volumes)
  for (const id of ["parent", "leaf", "branch"]) expect(cache.get(id)!.positions).toHaveLength(36 * 3)
  const batches = createVolumeBatches(cache, volumes.map(volume => volume.id), null)
  expect(batches).toHaveLength(1)
  expect(batches[0]!.surface.attributes.position!.count).toBe(36 * 3)
  expect(batches[0]!.outline.attributes.position!.count).toBe(24 * 3)
  const leaf = cache.get("leaf")!
  const zs = leaf.positions.filter((_, index) => index % 3 === 2)
  expect(new Set(zs)).toEqual(new Set([10, 20]))
  expect(spatialVolumeCorners(volumes[0].from)[0]).toEqual({x: -10, y: -5, z: 40})
  expect(batches[0]!.surface.boundingSphere!.radius).toBeGreaterThan(0)
})

test("arbitrary XYZ торцы допускают наклон и сохраняют конечные нормали", () => {
  const rotate = (point: {x: number; y: number; z: number}) => ({x: point.z, y: point.x, z: point.y})
  const from = spatialVolumeCorners(volumes[0].from).map(rotate) as [ReturnType<typeof rotate>, ReturnType<typeof rotate>, ReturnType<typeof rotate>, ReturnType<typeof rotate>]
  const to = spatialVolumeCorners(volumes[0].to).map(rotate) as typeof from
  const cache = cacheSpatialVolumes([{id: "rotated", from, to}])
  expect(cache.get("rotated")!.normals.every(Number.isFinite)).toBe(true)
  expect(cache.get("rotated")!.positions).toHaveLength(108)
  expect(() => cacheSpatialVolumes([{id: "bad", from: {...volumes[0].from, width: 0}, to: volumes[0].to}])).toThrow(RangeError)
})

test("compiled SpatialVolumes кеширует geometry при render и не читает данные при visible-set смене", () => {
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const root = createRoot(document)
  const input = volumes.map(volume => ({...volume}))
  root.render(template, {volumes: input, geometryRevision: 1})
  expect(document.querySelectorAll("xr-mesh")).toHaveLength(1)
  expect(document.querySelectorAll("xr-line-segments")).toHaveLength(1)
  const mesh = document.querySelector("xr-mesh") as XRMeshElement
  const factory = mesh.geometry!.factory
  for (let index = 0; index < 5; index++) root.render(template, {volumes: input, geometryRevision: 1})
  expect(mesh.geometry!.factory).toBe(factory)
  Object.defineProperty(input[0]!, "from", {get() {throw new Error("ViewPoint не читает route geometry")}})
  root.render(template, {volumes: input, geometryRevision: 1, visibleIds: ["leaf"]})
  const resource = mesh.geometry!.factory!(mesh.geometry!)
  expect(resource.attributes.position!.count).toBe(36)
  root.unmount()
})

test("материалы сохраняют прозрачность, lineage tint и публичную CSS appearance", () => {
  const material = volumeMaterial(0x00ffff)
  expect(material).toBeInstanceOf(HolographicMaterial)
  expect(material).toHaveProperty("opacity", .12)
  const glass = volumeMaterial(0xff0000, {color: {r: .5, g: 1, b: 1, a: 1}, opacity: .2, customProperties: {"--spatial-volume-appearance": "glass"}})
  expect(glass).toBeInstanceOf(GlassMaterial)
  expect((glass as GlassMaterial).tintColor.r).toBe(.5)
  expect((glass as GlassMaterial).tintColor.a).toBe(.2)
})


test("coarse hit выбирает entity face и пропускает живые Display IDs и ветви", async () => {
  const {hitVolumeBatch} = await import("../shape/volumes/src/hit.ts")
  const batch = createVolumeBatches(cacheSpatialVolumes(volumes), volumes.map(volume => volume.id), null)[0]!
  const ray = {origin: {x: 0, y: 0, z: 100}, direction: {x: 0, y: 0, z: -1}}
  expect(hitVolumeBatch(batch, ray, new Set())?.id).toBe("parent")
  expect(hitVolumeBatch(batch, ray, new Set(["parent", "branch"]))).toBeNull()
  expect(hitVolumeBatch(batch, {origin: {x: 1000, y: 1000, z: 100}, direction: ray.direction}, new Set())).toBeNull()
})

test("CSS family expression группирует готовые записи и selection сохраняет lineage", () => {
  const cssVolumes = volumes.map(volume => ({...volume, color: "var(--node-family-1, #00ffff)"}))
  const batch = createVolumeBatches(cacheSpatialVolumes(cssVolumes), ["parent", "leaf"], "leaf")
  expect(batch).toHaveLength(2)
  expect(batch.every(item => item.color === "var(--node-family-1, #00ffff)")).toBe(true)
  expect(batch.find(item => item.ids.includes("leaf"))?.selected).toBe(true)
  const material = volumeMaterial("var(--node-family-1, #00ffff)", {color: {r: .2, g: .4, b: .6, a: 1}, opacity: .12, customProperties: {}})
  expect((material as HolographicMaterial).color.b).toBe(.6)
})

test("material defaults остаются fallback: CSS предков меняет appearance и opacity без новой geometry", () => {
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const space = document.createElement("space")
  document.append(space)
  const root = createRoot(space)
  const defaults = {appearance: "glass", opacity: .10, outlineOpacity: .40, selectedOpacity: .18, selectedOutlineOpacity: .90} as const
  try {
    root.render(template, {volumes, geometryRevision: 1, visibleIds: ["parent"], materialDefaults: defaults})
    const mesh = space.querySelector("xr-mesh") as XRMeshElement
    const heldGeometry = mesh.geometry!.factory
    const surface = mesh.material!
    const outline = space.querySelector("xr-line-segments xr-material") as XRMaterialElement
    expect(project(surface)).toBeInstanceOf(GlassMaterial)
    expect((project(surface) as GlassMaterial).tintColor.a).toBe(.10)
    expect(project(outline)).toHaveProperty("opacity", .40)
    space.setAttribute("style", "--spatial-volume-opacity: .23; --spatial-volume-outline-opacity: .31; --spatial-volume-appearance: holographic")
    expect(project(surface)).toBeInstanceOf(HolographicMaterial)
    expect(project(surface)).toHaveProperty("opacity", .23)
    expect(project(outline)).toHaveProperty("opacity", .31)
    root.render(template, {volumes, geometryRevision: 1, visibleIds: ["parent"], materialDefaults: {...defaults, opacity: .05, outlineOpacity: .08}})
    expect(space.querySelector("xr-mesh")).toBe(mesh)
    expect(mesh.geometry!.factory).toBe(heldGeometry)
    expect(project(surface)).toHaveProperty("opacity", .23)
  } finally { root.unmount() }
  function project(element: XRMaterialElement) {
    const style = readElementStyle(document, element, ["--spatial-volume-appearance"])
    return element.factory!(element, {color: {r: 1, g: 1, b: 1, a: 1}, opacity: style.opacity, customProperties: style.customProperties})
  }
})

test("selected tokens сохраняют акцент при обычном CSS override и разрешают явное selected значение", () => {
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const space = document.createElement("space")
  document.append(space)
  const root = createRoot(space)
  try {
    root.render(template, {volumes, geometryRevision: 1, visibleIds: ["parent"], selectedId: "parent",
      materialDefaults: {appearance: "glass", opacity: .10, outlineOpacity: .40, selectedOpacity: .18, selectedOutlineOpacity: .90}})
    const mesh = space.querySelector("xr-mesh") as XRMeshElement
    const surface = mesh.material!
    const outline = space.querySelector("xr-line-segments xr-material") as XRMaterialElement
    const heldGeometry = mesh.geometry!.factory
    space.setAttribute("style", "--spatial-volume-opacity: .02; --spatial-volume-outline-opacity: .03")
    expect((project(surface) as GlassMaterial).tintColor.a).toBe(.18)
    expect(project(outline)).toHaveProperty("opacity", .90)
    space.setAttribute("style", "--spatial-volume-selected-opacity: .30; --spatial-volume-selected-outline-opacity: .75")
    expect((project(surface) as GlassMaterial).tintColor.a).toBe(.30)
    expect(project(outline)).toHaveProperty("opacity", .75)
    expect(mesh.geometry!.factory).toBe(heldGeometry)
  } finally { root.unmount() }
  function project(element: XRMaterialElement) {
    const style = readElementStyle(document, element, ["--spatial-volume-appearance"])
    return element.factory!(element, {color: {r: 1, g: 1, b: 1, a: 1}, opacity: style.opacity, customProperties: style.customProperties})
  }
})

test("material defaults отклоняют неконечную и выходящую за диапазон opacity", () => {
  for (const opacity of [NaN, Infinity, -1, 1.01]) {
    for (const key of ["opacity", "outlineOpacity", "selectedOpacity", "selectedOutlineOpacity"] as const) {
      expect(() => resolveVolumeMaterialDefaults({[key]: opacity})).toThrow(RangeError)
    }
  }
})

test("прозрачный полный outline использует depth-tested nonwriting mode без усиления или затухания", () => {
  const outline = volumeOutlineMaterial(0x80ffff, {color: {r: .5, g: 1, b: 1, a: .8}, opacity: .125, customProperties: {}})
  expect(outline).toBeInstanceOf(LineGlowMaterial)
  expect(outline).toMatchObject({visibilityMode: "silhouette", glowIntensity: 1, luminanceBoost: 1,
    shimmerAmount: 0, silhouetteAmount: 0, visualScale: 1, distanceFade: 0, opacity: .1})
  expect(outline.color.r).toBeCloseTo(128 / 255 * .5)
  expect(outline.color.g).toBe(1)
})

import {expect, test} from "bun:test"
import {
  BufferGeometry,
  GlassMaterial,
  LineGlowMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Matrix4,
} from "@zavx0z/immersive-engine"
import {RendererWebGpuDisplayPlane} from "../src/display-plane.ts"
import {classifyRenderItems, type RenderItem} from "../src/renderer/utils/render-list.ts"

function mesh(glass = false): RenderItem {
  const object = new Mesh(new BufferGeometry(), glass ? new GlassMaterial() : new MeshBasicMaterial())
  return {type: "static-mesh", object, worldMatrix: object.matrixWorld}
}

function line(mode: LineGlowMaterial["visibilityMode"]): RenderItem {
  const object = new LineSegments(new BufferGeometry(), new LineGlowMaterial({visibilityMode: mode}))
  return {type: "line", object, worldMatrix: object.matrixWorld}
}

test("one classification preserves stable pass order, duplicate draws and non-exclusive glass membership", () => {
  const regularA = mesh()
  const regularB = mesh()
  const silhouetteA = line("silhouette")
  const silhouetteB = line("silhouette")
  const overlayLine = line("overlay")
  const sceneLine = line("scene")
  const glass = mesh(true)
  const ui = mesh()
  const uiGlass = mesh(true)
  const uiOverlay = line("overlay")
  const uiRoot = new Object3D()
  uiRoot.renderLayer = "ui"
  for (const item of [ui, uiGlass, uiOverlay]) uiRoot.add(item.object)
  class GlassLineMaterial extends LineGlowMaterial {
    override readonly isGlassMaterial = true
  }
  const glassLineObject = new LineSegments(new BufferGeometry(), new GlassLineMaterial({visibilityMode: "overlay"}))
  const glassLine: RenderItem = {type: "line", object: glassLineObject, worldMatrix: glassLineObject.matrixWorld}
  const source = [
    regularA, overlayLine, silhouetteA, ui, glass, sceneLine, uiGlass,
    regularB, silhouetteB, uiOverlay, regularA, glassLine,
  ]
  const original = [...source]
  const result = classifyRenderItems(source)

  expect(result.regularObjects).toEqual([silhouetteA, silhouetteB, regularA, sceneLine, regularB, regularA])
  expect(result.uiObjects).toEqual([ui, uiGlass, uiOverlay])
  expect(result.glassObjects).toEqual([glass, uiGlass, glassLine])
  expect(result.overlayLines).toEqual([overlayLine, glassLine])
  expect(source).toEqual(original)
  expect(result.regularObjects[2]).toBe(regularA)
  expect(result.regularObjects[5]).toBe(regularA)
})

test("UI ancestry is read once within a frame but not retained across parent changes", () => {
  const parent = new Object3D()
  let layer: "world" | "ui" = "ui"
  let layerReads = 0
  Object.defineProperty(parent, "renderLayer", {
    get() {
      layerReads += 1
      return layer
    },
  })
  const items = Array.from({length: 1000}, () => {
    const item = mesh()
    // An explicit world marker does not override a UI ancestor in this contract.
    item.object.renderLayer = "world"
    parent.add(item.object)
    return item
  })
  expect(classifyRenderItems(items).uiObjects).toHaveLength(1000)
  expect(layerReads).toBe(1)
  layer = "world"
  expect(classifyRenderItems(items).regularObjects).toHaveLength(1000)
  expect(layerReads).toBe(2)
  const uiParent = new Object3D()
  uiParent.renderLayer = "ui"
  uiParent.add(items[0]!.object)
  const reparented = classifyRenderItems(items)
  expect(reparented.uiObjects).toEqual([items[0]!])
  expect(reparented.regularObjects).toHaveLength(999)
})

test("legacy display markers and very deep ancestry preserve classification without recursion", () => {
  const root = new Object3D()
  Object.defineProperty(root, "isUIDisplay", {value: true})
  let parent = root
  for (let depth = 0; depth < 10_000; depth += 1) {
    const child = new Object3D()
    parent.add(child)
    parent = child
  }
  const item = mesh()
  parent.add(item.object)
  const result = classifyRenderItems([item, item])
  expect(result.uiObjects).toEqual([item, item])
  expect(result.regularObjects).toEqual([])
})

test("Камера упорядочивает целые Display, сохраняя внутренние draw records и независимый HUD", () => {
  const hud = mesh()
  hud.object.renderLayer = "ui"
  const nearA = mesh()
  const nearB = mesh()
  const far = mesh()
  const plane = (items: RenderItem[], z: number) => {
    const content = new Object3D()
    content.renderLayer = "ui"
    for (const item of items) content.add(item.object)
    const display = new RendererWebGpuDisplayPlane({
      content,
      viewport: {width: 100, height: 100},
      rasterSize: {width: 100, height: 100},
      worldUnitsPerPixel: 1,
    })
    display.position.z = z
    display.updateWorldMatrix(true)
    return display
  }
  plane([nearA, nearB], -10)
  const distant = plane([far], -20)
  const rasterSurface = distant.surface
  const raster: RenderItem = {type: "static-mesh", object: rasterSurface, worldMatrix: rasterSurface.matrixWorld}
  const source = [hud, nearA, nearB, nearA, raster]
  const forward = classifyRenderItems(source, new Matrix4())
  expect(forward.uiObjects, "Растровая поверхность участвует в том же порядке Display, а повторные draws сохраняются").toEqual([raster, nearA, nearB, nearA, hud])
  expect(forward.regularObjects, "Растровая поверхность не попадает в ранний World pass").toEqual([])
  const reverse = new Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)
  expect(classifyRenderItems(source, reverse).uiObjects, "Смена направления камеры пересчитывает порядок поверхностей").toEqual([nearA, nearB, nearA, raster, hud])
  expect(source, "Исходный список и индексы ресурсов остаются неизменными").toEqual([hud, nearA, nearB, nearA, raster])
})

test("Граница raster root сохраняет World background перед Glass, а внешний Display участвует только в пространственном проходе", () => {
  const background = mesh()
  const glass = mesh(true)
  const hud = mesh()
  hud.object.renderLayer = "ui"
  const content = new Object3D()
  content.add(background.object)
  content.add(glass.object)
  content.add(hud.object)
  const display = new RendererWebGpuDisplayPlane({
    content,
    viewport: {width: 100, height: 100},
    rasterSize: {width: 25, height: 25},
    worldUnitsPerPixel: 1,
  })
  const source = [background, glass, hud]
  for (const viewMatrix of [undefined, new Matrix4()]) {
    const raster = classifyRenderItems(source, viewMatrix, content)
    expect(raster.regularObjects, "Raster background остаётся в opaque pass перед glass").toEqual([background])
    expect(raster.glassObjects, "Стекло сохраняет собственный optical pass").toEqual([glass])
    expect(raster.uiObjects, "Только собственный HUD рисуется после glass").toEqual([hud])
  }
  const outer = new Object3D()
  outer.add(display)
  const direct = classifyRenderItems(source, new Matrix4(), outer)
  expect(direct.regularObjects, "Direct Display сохраняет World background перед optical pass").toEqual([background])
  expect(direct.glassObjects, "Direct Display сохраняет Glass pass membership").toEqual([glass])
  expect(direct.uiObjects, "Engine World content не становится UI из-за внешнего Display").toEqual([hud])
  const surface = display.surface
  const presentation: RenderItem = {type: "static-mesh", object: surface, worldMatrix: surface.matrixWorld}
  expect(classifyRenderItems([presentation], new Matrix4(), outer).uiObjects,
    "Сама rasterSurface участвует в UI порядке внешних Display").toEqual([presentation])
})

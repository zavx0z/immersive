import {expect, test} from "bun:test"
import {Mesh, Object3D, PlaneGeometry, RoundedRectMaterial, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {Renderer} from "../src/renderer/index.ts"
import {RendererWebGpuDisplayPlane} from "../src/display-plane.ts"
import {setBackdrop} from "../src/backdrop.ts"

/** Проверяет выбранную ветвь до GPU, а не факт прежнего выделения rasterSurface. */
test("world backdrop switches only its Display to shared composition; none/zero/hidden restore raster eligibility", () => {
  const space = new Space()
  const view = new ViewPoint({position: {x: 0, y: -2000, z: 0}, target: {x: 0, y: 0, z: 0},
    viewport: {left: 0, top: 0, width: 600, height: 360}, near: .1, far: 5000})
  const content = new Object3D()
  const panel = new Mesh(new PlaneGeometry({width: 100, height: 80}), new RoundedRectMaterial({width: 100, height: 80, radius: 8}))
  content.add(panel)
  const options = {viewport: {width: 200, height: 120}, rasterSize: {width: 200, height: 120},
    worldUnitsPerPixel: 4000 * Math.tan(view.fov / 2) / 120}
  const display = new RendererWebGpuDisplayPlane({...options, content})
  const ordinary = new RendererWebGpuDisplayPlane({...options, content: new Object3D()})
  display.rotation.x = ordinary.rotation.x = Math.PI / 2
  space.add(display)
  space.add(ordinary)
  space.updateWorldMatrix(true)
  const renderer = new Renderer() as unknown as {
    prepareDisplayModes(root: Object3D, view: ViewPoint, viewport: {x: number, y: number, width: number, height: number}, raster: Set<RendererWebGpuDisplayPlane>): ReadonlySet<Object3D>
  }
  const select = () => {
    const raster = new Set<RendererWebGpuDisplayPlane>()
    const excluded = renderer.prepareDisplayModes(space, view, {x: 0, y: 0, width: 600, height: 360}, raster)
    expect(raster.has(ordinary)).toBeTrue()
    return {raster, excluded}
  }
  expect(select().raster.has(display)).toBeTrue()
  setBackdrop(panel, {sigma: 8, width: 100, height: 80})
  const shared = select()
  expect(shared.raster.has(display)).toBeFalse()
  expect(shared.excluded.has(content)).toBeFalse()
  expect(shared.excluded.has(display.rasterSurface!)).toBeTrue()
  expect(display.content === content).toBeTrue()
  setBackdrop(panel, {sigma: 0, width: 100, height: 80})
  expect(select().raster.has(display)).toBeTrue()
  setBackdrop(panel, {sigma: 8, width: 100, height: 80})
  content.visible = false
  expect(select().raster.has(display)).toBeTrue()
  content.visible = true
  expect(select().raster.has(display)).toBeFalse()
  setBackdrop(panel, undefined)
  expect(select().raster.has(display)).toBeTrue()
})

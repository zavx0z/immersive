import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {createDocument} from "@zavx0z/immersive-dom"
import {Color, Mesh, MeshBasicMaterial, PlaneGeometry, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {Renderer, RendererWebGpuBackend, RendererWebGpuDisplayPlane} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas} from "../native-canvas.ts"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics.ts"

/** World Mesh являются единственным источником полос за прозрачным CSS Display. */
const gpu = createGPUInstance()
const requestAdapter = gpu.requestAdapter.bind(gpu)
gpu.requestAdapter = async options => {
  const adapter = await requestAdapter(options)
  if (adapter === null) return null
  const requestDevice = adapter.requestDevice.bind(adapter)
  adapter.requestDevice = async descriptor => {
    const device = await requestDevice(descriptor)
    installShaderCompilationDiagnostics(device)
    return device
  }
  return adapter
}
Object.assign(globalThis, globalConstructors)
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu}})

const probes = {
  insideWhite: [76, 75], insideBlack: [83, 75], outsideWhite: [76, 8], outsideBlack: [83, 8],
  corner: [42, 22], child: [100, 42], childOutside: [92, 42],
  blue: [92, 72], blueOutside: [81, 72], red: [144, 72], redOutside: [133, 72],
} as const

async function run(candidate: "lowDpi" | "highDpi") {
  const width = 600, height = 360, distance = 2000
  let logical = {width: 200, height: 120}
  const intendedRasterSize = candidate === "lowDpi" ? {...logical} : {width, height}
  const canvas = new NativeGpuCanvas(width, height)
  const renderer = new Renderer()
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", "position:relative;width:200px;height:120px;background:transparent")
  document.append(root)
  const panel = document.createElement("div")
  const panelStyle = "position:absolute;left:40px;top:20px;width:120px;height:80px;border-radius:20px;background:transparent"
  panel.setAttribute("style", `${panelStyle};backdrop-filter:none`)
  root.append(panel)
  const child = document.createElement("div")
  child.setAttribute("style", "position:absolute;left:56px;top:12px;width:20px;height:20px;background:lime")
  panel.append(child)
  const layout = createDocumentRenderer({document, root, viewport: logical})
  const backend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
  const rootIdentity = backend.root
  const space = new Space()
  space.background = new Color(0, 0, 0)
  const viewPoint = new ViewPoint({position: {x: 0, y: -distance, z: 0}, target: {x: 0, y: 0, z: 0},
    viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
  const units = () => 2 * distance * Math.tan(viewPoint.fov / 2) / logical.height
  const display = new RendererWebGpuDisplayPlane({content: backend.root, viewport: logical,
    worldUnitsPerPixel: units(), rasterSize: intendedRasterSize})
  display.rotation.x = Math.PI / 2
  space.add(display)
  type WorldBox = {left: number, top: number, width: number, height: number, y: number}
  const world: {mesh: Mesh, box: WorldBox}[] = []
  const configure = (mesh: Mesh, box: WorldBox) => {
    const scale = units() * (distance + box.y) / distance
    mesh.scale.set(box.width * scale, box.height * scale, 1)
    mesh.position.set((box.left + box.width / 2 - logical.width / 2) * scale,
      box.y, (logical.height / 2 - box.top - box.height / 2) * scale)
  }
  const plane = (color: number, box: WorldBox) => {
    const mesh = new Mesh(new PlaneGeometry({width: 1, height: 1}), new MeshBasicMaterial({color}))
    mesh.rotation.x = Math.PI / 2
    configure(mesh, box)
    world.push({mesh, box})
    return mesh
  }
  const stripes = Array.from({length: 5}, (_, index) => {
    const mesh = plane(index % 2 ? 0xffffff : 0x000000, {left: index * 40, top: 0, width: 40, height: 120, y: 100})
    space.add(mesh)
    return mesh
  })
  const blue = plane(0x0000ff, {left: 84, top: 58, width: 20, height: 30, y: -100})
  const red = plane(0xff0000, {left: 136, top: 58, width: 16, height: 30, y: -100})
  const marker = () => backend.root.children.find(object => object.name.endsWith(":backdrop"))
  const childMesh = () => backend.root.children.find(object => !object.name.endsWith(":backdrop"))
  const frames: Record<string, Record<string, number[]>> = {}
  let edgeProfile: number[] = []
  try {
    await renderer.init(canvas.asHtmlCanvas())
    const device = canvas.getContext("webgpu")!.getConfiguration()!.device
    const render = async (name: string, apply = true) => {
      if (apply) backend.applyFrame(layout.flush())
      device.pushErrorScope("validation")
      renderer.renderComposition({space, viewPoint})
      const validation = await device.popErrorScope()
      if (validation !== null) throw new Error(`${candidate}/${name}: ${validation.message}`)
      const frame = await canvas.capture()
      if (name === "blurred") {
        edgeProfile = Array.from({length: 17}, (_, index) => {
          const x = Math.floor((72.5 + index) * width / logical.width)
          const y = Math.floor(75.5 * height / logical.height)
          return frame.rgba[(y * width + x) * 4]!
        })
      }
      const evidence = process.env.BACKDROP_SCENE_EVIDENCE_DIR
      if (evidence && ["none", "blurred", "foreground"].includes(name)) {
        await Bun.write(`${evidence}/${candidate}-${name}.png`, frame.png)
      }
      frames[name] = Object.fromEntries(Object.entries(probes).map(([name, [x, y]]) => {
        const physicalX = Math.floor((x + .5) * width / logical.width)
        const physicalY = Math.floor((y + .5) * height / logical.height)
        const offset = (physicalY * width + physicalX) * 4
        return [name, [...frame.rgba.slice(offset, offset + 4)]]
      }))
    }
    await render("none")
    const retainedChild = childMesh()
    panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(8px)`)
    await render("blurred")
    const retainedMarker = marker()
    if (retainedMarker === undefined) throw new Error("CSS blur не создал отдельный marker")
    const childReused = childMesh() === retainedChild
    space.add(blue)
    space.add(red)
    await render("foreground")
    panel.setAttribute("style", `${panelStyle};backdrop-filter:none`)
    await render("foregroundNone")
    const noneCleared = marker() === undefined && !backend.root.children.includes(retainedMarker)
    panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(8px)`)
    await render("reblurred")
    stripes.forEach((mesh, index) => {(mesh.material as MeshBasicMaterial).color.setHex(index % 2 ? 0x000000 : 0xffffff)})
    await render("dynamic")
    panel.setAttribute("style", `${panelStyle};backdrop-filter:none`)
    await render("dynamicNone")
    stripes.forEach((mesh, index) => {(mesh.material as MeshBasicMaterial).color.setHex(index % 2 ? 0xffffff : 0x000000)})
    space.remove(blue)
    space.remove(red)
    panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(8px)`)
    await render("beforeMove")
    const beforeMove = marker()
    panel.setAttribute("style", `${panelStyle};left:44px;backdrop-filter:blur(8px)`)
    await render("moved")
    const moveReused = marker() === beforeMove && childMesh() === retainedChild
    panel.setAttribute("style", `${panelStyle};backdrop-filter:blur(8px)`)
    logical = {width: 220, height: 132}
    layout.resize(logical)
    root.setAttribute("style", "position:relative;width:220px;height:132px;background:transparent")
    display.configure(logical, units())
    const resizedRasterSize = candidate === "lowDpi" ? {...logical} : {width: 660, height: 396}
    display.setRasterSize(resizedRasterSize)
    world.forEach(({mesh, box}) => {
      if (box.y > 0) box.height = logical.height
      configure(mesh, box)
    })
    await render("resized")
    const rootReused = backend.root === rootIdentity && display.content === rootIdentity
    const lastMarker = marker()
    backend.dispose()
    space.remove(display)
    renderer.releaseDisplay(display)
    const disposeCleared = lastMarker !== undefined && backend.root.children.length === 0
    stripes.forEach(mesh => {(mesh.material as MeshBasicMaterial).color.setHex(0xff00ff)})
    await render("released", false)
    stripes.forEach(mesh => {space.remove(mesh)})
    await render("empty", false)
    return {intendedRasterSize, resizedRasterSize, candidateFootprint: width / intendedRasterSize.width,
      frames, edgeProfile, childReused, moveReused, rootReused, noneCleared, disposeCleared}
  } finally {
    layout.dispose()
    backend.dispose()
    renderer.dispose()
    canvas.dispose()
  }
}

try {console.log(JSON.stringify({lowDpi: await run("lowDpi"), highDpi: await run("highDpi")}))}
finally {gpu.destroy()}

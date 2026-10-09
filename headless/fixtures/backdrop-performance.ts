import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {createDocument} from "@zavx0z/immersive-dom"
import {Color, Mesh, MeshBasicMaterial, PlaneGeometry, Space, ViewPoint} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {Renderer, RendererWebGpuBackend, RendererWebGpuDisplayPlane} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas} from "../native-canvas.ts"
import {installShaderCompilationDiagnostics} from "../shader-diagnostics.ts"
import {frameMotion, orders, parseConfig, summarize, type Density, type Motion, type Phase} from "./backdrop-performance-data.ts"

/** Воспроизводимый native workload: прежний scratch benchmark, без изменений Renderer. */
const config = parseConfig(Bun.argv.slice(2))
const project = decodeURIComponent(new URL("../..", import.meta.url).pathname)
const git = (...args: string[]) => {
  const result = Bun.spawnSync(["git", "-C", project, ...args], {stdout: "pipe", stderr: "pipe"})
  if (result.exitCode !== 0) {
    throw new Error(`Git provenance failed: ${result.stderr.toString()}`)
  }
  return result.stdout.toString()
}
const digest = (value: string | Uint8Array) => new Bun.CryptoHasher("sha256").update(value).digest("hex")
const revision = git("rev-parse", "HEAD").trim()
const untracked = git("ls-files", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean)
const untrackedDigests = await Promise.all(untracked.map(async path => ({path, sha256: digest(new Uint8Array(await Bun.file(`${project}/${path}`).arrayBuffer()))})))
const executionTree = {
  revision, base: git("rev-parse", config.base ?? "HEAD").trim(), label: config.label,
  dirty: git("status", "--porcelain=v1").trim().length > 0,
  trackedDiffSha256: digest(git("diff", "--binary", "HEAD")), untracked: untrackedDigests,
}
const frozenSource = Bun.file(`${import.meta.path}.source.json`)
const code = {implementation: await frozenSource.exists() ? await frozenSource.json() : executionTree, executionTree,
  entryArtifact: {path: import.meta.path, sha256: digest(new Uint8Array(await Bun.file(import.meta.path).arrayBuffer()))}}

type Counts = {
  texturesCreated: number
  texturesDestroyed: number
  buffersCreated: number
  buffersDestroyed: number
  bufferBytesCreated: number
  bufferBytesDestroyed: number
}
const counts: Counts = {texturesCreated: 0, texturesDestroyed: 0, buffersCreated: 0, buffersDestroyed: 0, bufferBytesCreated: 0, bufferBytesDestroyed: 0}
const snapshot = (): Counts => ({...counts})
const delta = (before: Counts, after = snapshot()): Counts => Object.fromEntries(Object.keys(before).map(key =>
  [key, after[key as keyof Counts] - before[key as keyof Counts]],
)) as Counts
const textureLabels = new Map<string, number>()
const passCounts = {render: 0, blur: 0}
let adapterInfo: unknown = null
let timestampQuerySupported = false
const gpu = createGPUInstance()
const requestAdapter = gpu.requestAdapter.bind(gpu)
gpu.requestAdapter = async options => {
  const adapter = await requestAdapter(options)
  if (!adapter) {
    return null
  }
  adapterInfo = adapter.info
  timestampQuerySupported = adapter.features.has("timestamp-query")
  const requestDevice = adapter.requestDevice.bind(adapter)
  adapter.requestDevice = async descriptor => {
    const device = await requestDevice(descriptor)
    installShaderCompilationDiagnostics(device)
    const createTexture = device.createTexture.bind(device)
    const createBuffer = device.createBuffer.bind(device)
    device.createTexture = descriptor => {
      const texture = createTexture(descriptor)
      counts.texturesCreated += 1
      const label = descriptor.label ?? "unlabelled"
      textureLabels.set(label, (textureLabels.get(label) ?? 0) + 1)
      const destroy = texture.destroy.bind(texture)
      let destroyed = false
      texture.destroy = () => {
        if (!destroyed) {
          destroyed = true
          counts.texturesDestroyed += 1
        }
        destroy()
      }
      return texture
    }
    device.createBuffer = descriptor => {
      const buffer = createBuffer(descriptor)
      counts.buffersCreated += 1
      counts.bufferBytesCreated += descriptor.size
      const destroy = buffer.destroy.bind(buffer)
      let destroyed = false
      buffer.destroy = () => {
        if (!destroyed) {
          destroyed = true
          counts.buffersDestroyed += 1
          counts.bufferBytesDestroyed += descriptor.size
        }
        destroy()
      }
      return buffer
    }
    const createCommandEncoder = device.createCommandEncoder.bind(device)
    device.createCommandEncoder = descriptor => {
      const encoder = createCommandEncoder(descriptor)
      const beginRenderPass = encoder.beginRenderPass.bind(encoder)
      encoder.beginRenderPass = descriptor => {
        passCounts.render++
        if (descriptor.label === "backdrop-blur") {
          passCounts.blur++
        }
        return beginRenderPass(descriptor)
      }
      return encoder
    }
    return device
  }
  return adapter
}
Object.assign(globalThis, globalConstructors)
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu}})

async function benchmark(width: number, height: number, density: Density, motion: Motion) {
  const initialAllocations = snapshot()
  const initialLabels = new Map(textureLabels)
  const canvas = new NativeGpuCanvas(width, height)
  const renderer = new Renderer()
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", `position:relative;width:${width}px;height:${height}px;background:transparent`)
  document.append(root)
  // Все три панели и их children остаются видимыми при none/one/three.
  const panels = Array.from({length: 3}, (_, index) => {
    const node = document.createElement("div")
    const style = `position:absolute;left:${width * (.1 + index * .2)}px;top:${height * (.1 + index * .15)}px;width:${width * .5}px;height:${height * .5}px;border-radius:12px;background:rgba(35,40,55,.15)`
    node.setAttribute("style", style)
    root.append(node)
    const child = document.createElement("div")
    const childStyle = "position:absolute;left:24px;top:24px;width:80px;height:24px;background:lime"
    child.setAttribute("style", childStyle)
    node.append(child)
    return {node, style, child, childStyle}
  })
  const layout = createDocumentRenderer({document, root, viewport: {width, height}})
  const backend = new RendererWebGpuBackend({invalidateGeometry: geometry => renderer.invalidateGeometry(geometry)})
  const space = new Space()
  space.background = new Color(0, 0, 0)
  const distance = 2000
  const viewPoint = new ViewPoint({position: {x: 0, y: -distance, z: 0}, target: {x: 0, y: 0, z: 0},
    viewport: {left: 0, top: 0, width, height}, near: .1, far: 5000})
  const units = 2 * distance * Math.tan(viewPoint.fov / 2) / height
  const intendedRasterSize = density === "low" ? {width: Math.round(width / 3), height: Math.round(height / 3)} : {width, height}
  const plane = new RendererWebGpuDisplayPlane({content: backend.root, viewport: {width, height}, worldUnitsPerPixel: units,
    rasterSize: intendedRasterSize})
  plane.rotation.x = Math.PI / 2
  space.add(plane)
  const world = (left: number, top: number, w: number, h: number, y: number, color: number) => {
    const unit = units * (distance + y) / distance
    const mesh = new Mesh(new PlaneGeometry({width: w * unit, height: h * unit}), new MeshBasicMaterial({color}))
    mesh.rotation.x = Math.PI / 2
    mesh.position.set((left + w / 2 - width / 2) * unit, y, (height / 2 - top - h / 2) * unit)
    space.add(mesh)
    return mesh
  }
  for (let index = 0; index < 20; index++) {
    world(index * width / 20, 0, width / 20, height, 100, index % 2 ? 0xffffff : 0x111111)
  }
  const foreground = world(width * .42, height * .4, width * .08, height * .2, -100, 0x0000ff)
  const initialX = foreground.position.x
  let fence: GPUBuffer | undefined
  type Sample = {
    frame: number
    prepareCpuMs: number
    wallMs: number
    renderCpuMs: number
    completionFenceMs: number
    renderPasses: number
    blurPasses: number
    allocations: Counts
  }
  const blocks: {
    index: number
    order: readonly Phase[]
    phases: {
      phase: Phase
      enabledBlurPanels: number
      setupAllocations: Counts
      warmupAllocations: Counts
      samples: Sample[]
      summary: ReturnType<typeof summarize>
      measuredAllocations: Counts
    }[]
  }[] = []
  try {
    await renderer.init(canvas.asHtmlCanvas())
    const context = canvas.getContext("webgpu")!
    const device = context.getConfiguration()!.device
    fence = device.createBuffer({label: "benchmark-completion-fence", size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ})
    for (const [blockIndex, order] of orders(config.first).entries()) {
      const block: (typeof blocks)[number] = {index: blockIndex, order, phases: []}
      blocks.push(block)
      for (const phase of order) {
        const enabledBlurPanels = phase === "none" ? 0 : phase === "one" ? 1 : 3
        const beforeSetup = snapshot()
        panels.forEach(({node, style, child, childStyle}, index) => {
          node.setAttribute("style", `${style};backdrop-filter:${index < enabledBlurPanels ? `blur(${config.sigma}px)` : "none"}`)
          child.setAttribute("style", childStyle)
        })
        backend.applyFrame(layout.flush())
        const setupAllocations = delta(beforeSetup)
        const beforeWarmup = snapshot()
        let warmupAllocations = delta(beforeWarmup)
        let beforeMeasured = snapshot()
        const samples: Sample[] = []
        device.pushErrorScope("validation")
        for (let frame = 0; frame < config.warmup + config.samples; frame++) {
          if (frame === config.warmup) {
            warmupAllocations = delta(beforeWarmup)
            beforeMeasured = snapshot()
          }
          const before = snapshot()
          const beforePasses = {...passCounts}
          // DOM/layout/backend подготовка не входит в Renderer CPU или primary wall.
          const prepareStarted = performance.now()
          const pose = frameMotion(motion, frame)
          foreground.position.x = initialX + pose.worldOffsetCssPx * units
          if (motion === "foreground") {
            const last = panels[panels.length - 1]!
            last.child.setAttribute("style", `${last.childStyle};left:${pose.childLeftCssPx}px`)
          }
          backend.applyFrame(layout.flush())
          const started = performance.now()
          renderer.renderComposition({space, viewPoint})
          const afterRender = performance.now()
          const encoder = device.createCommandEncoder()
          encoder.copyTextureToBuffer({texture: context.getCurrentTexture()}, {buffer: fence, bytesPerRow: 256, rowsPerImage: 1}, {width: 1, height: 1})
          device.queue.submit([encoder.finish()])
          await fence.mapAsync(GPUMapMode.READ)
          fence.unmap()
          const completed = performance.now()
          if (frame >= config.warmup) {
            samples.push({frame: frame - config.warmup, prepareCpuMs: started - prepareStarted,
              wallMs: completed - started, renderCpuMs: afterRender - started, completionFenceMs: completed - afterRender,
              renderPasses: passCounts.render - beforePasses.render, blurPasses: passCounts.blur - beforePasses.blur,
              allocations: delta(before)})
          }
        }
        const validation = await device.popErrorScope()
        if (validation) {
          throw new Error(`${width}×${height}/${density}/${motion}/${phase}: ${validation.message}`)
        }
        block.phases.push({phase, enabledBlurPanels, setupAllocations, warmupAllocations, samples,
          summary: summarize(samples.map(sample => sample.wallMs)), measuredAllocations: delta(beforeMeasured)})
      }
    }
  } finally {
    fence?.destroy()
    backend.dispose()
    layout.dispose()
    renderer.dispose()
    canvas.dispose()
  }
  const summary = Object.fromEntries((["none", "one", "three"] as const).map(phase => {
    const samples = blocks.flatMap(block => block.phases.filter(value => value.phase === phase).flatMap(value => value.samples))
    return [phase, {wall: summarize(samples.map(value => value.wallMs)), prepareCpu: summarize(samples.map(value => value.prepareCpuMs)),
      renderCpu: summarize(samples.map(value => value.renderCpuMs)),
      completionFence: summarize(samples.map(value => value.completionFenceMs)),
      renderPasses: {min: Math.min(...samples.map(value => value.renderPasses)), max: Math.max(...samples.map(value => value.renderPasses)),
        total: samples.reduce((sum, value) => sum + value.renderPasses, 0)},
      blurPasses: {min: Math.min(...samples.map(value => value.blurPasses)), max: Math.max(...samples.map(value => value.blurPasses)),
        total: samples.reduce((sum, value) => sum + value.blurPasses, 0)},
      zeroMeasuredAllocations: samples.every(value => Object.values(value.allocations).every(count => count === 0)),
      measuredAllocations: Object.fromEntries(Object.keys(counts).map(key => [key, samples.reduce((sum, value) => sum + value.allocations[key as keyof Counts], 0)]))}]
  }))
  return {width, height, density, motion, intendedRasterSize, candidateFootprint: width / intendedRasterSize.width,
    blocks, summary, allocationsIncludingInitAndDispose: delta(initialAllocations),
    createdTextureLabels: Object.fromEntries([...textureLabels].map(([label, value]) => [label, value - (initialLabels.get(label) ?? 0)]).filter(([, value]) => Number(value) > 0))}
}

try {
  const results = []
  for (const {width, height} of config.resolutions) {
    for (const density of config.densities) {
      for (const motion of config.motions) {
        const result = await benchmark(width, height, density, motion)
        results.push(result)
        console.error(JSON.stringify({width, height, density, motion, summary: result.summary}))
      }
    }
  }
  const output = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), code, config,
    hardware: {adapterInfo, platform: process.platform, arch: process.arch, bunVersion: Bun.version},
    metric: {primary: "wall ms: Renderer.renderComposition + 1px copy/map queue completion; DOM/layout/backend preparation excluded",
      prepareCpu: "CPU ms: motion mutation + layout.flush + backend.applyFrame before each Renderer timing interval",
      renderCpu: "CPU ms: Renderer.renderComposition only; excludes DOM/layout/backend preparation and queue completion",
      passes: "Per sample beginRenderPass calls, including render bundles' enclosing passes; blurPasses count label backdrop-blur",
      gpuTimestamps: {collected: false,
      adapterSupportsTimestampQuery: timestampQuerySupported,
      reason: "Production Renderer requests a device without timestamp-query; this harness preserves its device features and reports wall/completion timing only"},
      completion: "Reusable 256-byte MAP_READ buffer; copy 1px after renderer submission then mapAsync fence",
      allocations: "Per sample counts cover preparation + Renderer + completion fence; zeroMeasuredAllocations requires all creation/destruction/byte deltas zero. Counters are not GPU residency or driver allocations"},
    workload: {visiblePanels: 3, panelFraction: [.5, .5], worldStripes: 20, foregroundObjects: 1, sigmaCssPx: config.sigma,
      cssPxPerBackingPixel: 1, motionAmplitudeCssPx: 10, foregroundPhaseResetPerBlock: true, reversedOrderBlocks: 2,
      visibleChildren: 3, motionSequenceResetPerPhase: true,
      motions: {moving: "Blue World object moves; all DOM children stay fixed", static: "World and all DOM children stay fixed",
        foreground: "World stays fixed; only the last panel child moves through DOM/layout/backend, left=24+(frame%11)*2 CSS px, after every enabled backdrop"}},
    limits: ["Native synthetic scene, not browser FPS or pure GPU duration", "No background caching is inferred from equal timings or zero allocations",
      "Positive Display backdrop uses direct scene composition; low-DPI none may use raster", "No isolation from unrelated host workloads",
      "Warm steady-state samples exclude enabling/compilation frames when warmup > 0; setup/warmup counters remain visible"], results,
  }
  const json = JSON.stringify(output, null, 2) + "\n"
  if (config.output !== null) {
    await Bun.write(config.output, json)
  }
  console.log(json)
} finally {
  gpu.destroy()
}

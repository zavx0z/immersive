import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {BackdropFilter as CurrentBackdropFilter} from "../../webgpu/src/renderer/backdrop-filter.ts"
import {NativeGpuCanvas} from "../native-canvas.ts"

/** Изолированная проверка настоящих MSAA/prefilter/Gaussian pixels без CSS tint. */
Object.assign(globalThis, globalConstructors)
const gpu = createGPUInstance()
const adapter = await gpu.requestAdapter()
if (!adapter) throw new Error("Native WebGPU adapter unavailable")
const device = await adapter.requestDevice()
const baseline = process.env.BACKDROP_SAMPLING_BASELINE === "1"
let Filter = CurrentBackdropFilter
if (baseline) {
  // Исторический shader выполняется тем же workload без изменения checkout.
  const revision = process.env.BACKDROP_SAMPLING_REVISION ?? "HEAD"
  const worker = Bun.spawn(["git", "show", `${revision}:webgpu/src/renderer/backdrop-filter.ts`], {
    cwd: new URL("../..", import.meta.url).pathname, stdout: "pipe", stderr: "pipe",
  })
  const [exit, source, stderr] = await Promise.all([worker.exited, new Response(worker.stdout).text(), new Response(worker.stderr).text()])
  if (exit !== 0) throw new Error(stderr)
  const imports = source.replace(/from "(\.\/[^\"]+)"/g, (_, path) => `from "${new URL(`../../webgpu/src/renderer/${path}`, import.meta.url).href}"`)
  const transpiled = new Bun.Transpiler({loader: "ts"}).transformSync(imports)
  Filter = (await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`)).BackdropFilter
}
const vertex = `
@vertex fn vs(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let vertices = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(vertices[index], 0.0, 1.0);
}`
type Frame = {width: number, height: number, rgba: Uint8Array}
const frames = new Map<string, Frame>()
const results: Record<string, unknown> = {}

async function render(name: string, axis: "vertical" | "horizontal" | "diagonal" | "checker" | "constant" | "noise", sigma: number, period = 5,
  samples = 4, foreground: boolean | "all" | "mixed" = false, transparent = false, width = 256, height = 256, roi = false) {
  const canvas = new NativeGpuCanvas(width, height)
  canvas.getContext("webgpu")!.configure({device, format: "rgba8unorm"})
  const filter = new Filter(device, "rgba8unorm")
  const source = device.createTexture({size: [width, height], format: "rgba8unorm", sampleCount: samples,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING})
  const depth = foreground ? device.createTexture({size: [width, height], format: "depth32float", sampleCount: samples,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING}) : undefined
  const coordinate = axis === "vertical" ? "i32(p.x)" : axis === "horizontal" ? "i32(p.y)" : "i32(p.x) + i32(p.y)"
  const value = axis === "noise" ? "f32((i32(p.x) * 17 + i32(p.y) * 13) % 257) / 256.0" : axis === "checker" ? "f32((i32(p.x) + i32(p.y)) % 2)" : `select(0.0, 1.0, (${coordinate}) % ${period} == 0)`
  const module = device.createShaderModule({code: `${vertex}
${foreground ? "struct SourceOutput { @location(0) color: vec4f, @builtin(frag_depth) depth: f32 }" : ""}
@fragment fn fs(@builtin(position) p: vec4f${foreground ? ", @builtin(sample_index) sample: u32" : ""}) -> ${foreground ? "SourceOutput" : "@location(0) vec4f"} {
  let stripe = ${value};
  var color = ${axis === "constant" ? "vec4f(0.08, 0.16, 0.24, 0.4)" : transparent ? "vec4f(stripe * 0.4)" : "vec4f(vec3f(stripe), 1.0)"};
  var depth = 0.8;
  ${foreground ? `if (${foreground === "all" ? "true" : `p.x >= 99.25 && p.x < 154.75 && p.y >= 91.25 && p.y < 162.75${foreground === "mixed" ? " && sample % 2u == 0u" : ""}`}) { color = vec4f(1.0, 0.0, 0.0, 1.0); depth = 0.2; }` : ""}
  return ${foreground ? "SourceOutput(color, depth)" : "color"};
}`})
  const pipeline = device.createRenderPipeline({layout: "auto", vertex: {module, entryPoint: "vs"},
    fragment: {module, entryPoint: "fs", targets: [{format: "rgba8unorm"}]}, multisample: {count: samples},
    ...(depth ? {depthStencil: {format: "depth32float" as const, depthWriteEnabled: true, depthCompare: "always" as const}} : {}),
  })
  const compositeModule = device.createShaderModule({code: `${vertex}
@group(0) @binding(0) var blurred: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var<uniform> dimensions: vec4f;
@fragment fn fs(@builtin(position) p: vec4f) -> @location(0) vec4f {
  return textureSampleLevel(blurred, linearSampler, p.xy / dimensions.xy, 0.0);
}`})
  const composite = device.createRenderPipeline({layout: device.createPipelineLayout({bindGroupLayouts: [filter.compositeLayout]}),
    vertex: {module: compositeModule, entryPoint: "vs"}, fragment: {module: compositeModule, entryPoint: "fs", targets: [{format: "rgba8unorm"}]},
  })
  try {
    device.pushErrorScope("validation")
    const command = device.createCommandEncoder()
    const pass = command.beginRenderPass({colorAttachments: [{view: source.createView(), loadOp: "clear", storeOp: "store"}],
      ...(depth ? {depthStencilAttachment: {view: depth.createView(), depthLoadOp: "clear" as const, depthStoreOp: "store" as const, depthClearValue: 1}} : {}),
    })
    pass.setPipeline(pipeline)
    pass.draw(3)
    pass.end()
    filter.beginFrame(new Set([source]))
    const group = filter.encode(command, source, sigma, source, roi ? {left: 96, top: 88, right: 168, bottom: 176} : undefined, depth ? {texture: depth, plane: [0, 0, .5]} : undefined)
    const output = command.beginRenderPass({colorAttachments: [{view: canvas.getContext("webgpu")!.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store"}]})
    output.setPipeline(composite)
    output.setBindGroup(0, group)
    output.draw(3)
    output.end()
    device.queue.submit([command.finish()])
    filter.endFrame()
    const validation = await device.popErrorScope()
    if (validation) throw new Error(`${name}: ${validation.message}`)
    const frame = await canvas.capture()
    frames.set(name, frame)
    const central: number[] = []
    let colorLeak = 0, premultipliedError = 0
    for (let y = 64; y < height - 64; y++) for (let x = 64; x < width - 64; x++) {
      const index = (y * width + x) * 4
      central.push(frame.rgba[index]!)
      colorLeak = Math.max(colorLeak, Math.abs(frame.rgba[index]! - frame.rgba[index + 1]!))
      if (transparent) premultipliedError = Math.max(premultipliedError, Math.abs(frame.rgba[index]! - frame.rgba[index + 3]!))
    }
    results[name] = {axis, sigma, period, samples, foreground, transparent, min: Math.min(...central), max: Math.max(...central),
      mean: central.reduce((sum, value) => sum + value, 0) / central.length, colorLeak, premultipliedError,
      center: [...frame.rgba.slice((Math.floor(height / 2) * width + Math.floor(width / 2)) * 4, (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4 + 4)]}
    if (process.env.BACKDROP_SAMPLING_OUTPUT) await Bun.write(`${process.env.BACKDROP_SAMPLING_OUTPUT}/${name}.png`, frame.png)
  } finally {
    filter.dispose()
    source.destroy()
    depth?.destroy()
    canvas.getContext("webgpu")!.unconfigure()
  }
}

/** Одинаковый cold-filter workload для текущего shader и git baseline. */
async function benchmark(width: number, height: number, masked: boolean, panels: number) {
  const source = device.createTexture({size: [width, height], format: "rgba8unorm", sampleCount: 4,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT})
  const depth = masked ? device.createTexture({size: [width, height], format: "depth32float", sampleCount: 4,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT}) : undefined
  const filter = new Filter(device, "rgba8unorm")
  const fence = device.createBuffer({size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ})
  const output = device.createTexture({size: [1, 1], format: "rgba8unorm", usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC})
  try {
    device.pushErrorScope("validation")
    const seed = device.createCommandEncoder()
    const pass = seed.beginRenderPass({colorAttachments: [{view: source.createView(), loadOp: "clear", storeOp: "store", clearValue: [.2, .3, .4, 1]}],
      ...(depth ? {depthStencilAttachment: {view: depth.createView(), depthLoadOp: "clear" as const, depthStoreOp: "store" as const, depthClearValue: .8}} : {}),
    })
    pass.end()
    device.queue.submit([seed.finish()])
    const times: number[] = []
    for (let frame = 0; frame < 24; frame++) {
      const started = performance.now()
      filter.beginFrame(new Set([source]))
      const command = device.createCommandEncoder()
      for (let panel = 0; panel < panels; panel++) filter.encode(command, source, 16, source,
        {left: width * (.1 + panel * .1), top: height * (.1 + panel * .1), right: width * (.6 + panel * .1), bottom: height * (.6 + panel * .1)},
        depth ? {texture: depth, plane: [0, 0, .5]} : undefined)
      // Map ждёт всю очередь, включая предшествующий filter; 1px не входит в его source.
      command.copyTextureToBuffer({texture: output}, {buffer: fence, bytesPerRow: 256, rowsPerImage: 1}, {width: 1, height: 1})
      device.queue.submit([command.finish()])
      filter.endFrame()
      await fence.mapAsync(GPUMapMode.READ)
      fence.unmap()
      if (frame >= 8) times.push(performance.now() - started)
    }
    const validation = await device.popErrorScope()
    if (validation) throw new Error(validation.message)
    const sorted = [...times].sort((a, b) => a - b)
    return {width, height, masked, panels, sigma: 16, warmupFrames: 8, samples: times,
      median: (sorted[7]! + sorted[8]!) / 2, p95: sorted[15],
      metric: "cold BackdropFilter.encode + queue completion wall ms; fixed MSAA source; 50%-width/height ROI per panel"}
  } finally {
    filter.dispose()
    source.destroy()
    depth?.destroy()
    fence.destroy()
    output.destroy()
  }
}

try {
  if (Bun.argv[2] === "benchmark") {
    const cases = []
    for (const [width, height] of [[1280, 720], [2730, 2176]] as const) {
      for (const masked of [false, true]) for (const panels of [1, 3]) cases.push(await benchmark(width, height, masked, panels))
    }
    console.log(JSON.stringify({baseline, adapterInfo: adapter.info, benchmark: cases}))
  } else {
  for (const sigma of [.5, 1, 2, 4, 8, 16, 24, 40]) for (const axis of ["vertical", "horizontal", "diagonal"] as const) {
    for (const period of [3, 5, 7, 8, 11, 17]) await render(`${axis}-${sigma}-${period}`, axis, sigma, period)
  }
  await render("single-sample", "vertical", 16, 5, 1)
  await render("checker", "checker", 16)
  await render("constant", "constant", 16)
  await render("alpha", "diagonal", 16, 5, 4, false, true)
  await render("mixed-foreground", "diagonal", 16, 5, 4, "mixed")
  await render("all-foreground", "vertical", 16, 5, 4, "all")
  await render("foreground", "vertical", 16, 5, 4, true)
  await render("odd-vertical", "vertical", 16, 5, 4, false, false, 259, 257)
  await render("odd-horizontal", "horizontal", 16, 5, 4, false, false, 257, 259)
  await render("roi-full", "noise", 16)
  await render("roi-bounded", "noise", 16, 5, 4, false, false, 256, 256, true)
  let roiDifference = 0
  const full = frames.get("roi-full")!, bounded = frames.get("roi-bounded")!
  for (let y = 88; y < 176; y++) for (let x = 96; x < 168; x++) {
    const offset = (y * 256 + x) * 4
    for (let channel = 0; channel < 4; channel++) roiDifference = Math.max(roiDifference, Math.abs(full.rgba[offset + channel]! - bounded.rgba[offset + channel]!))
  }
  let rotationDifference = 0
  for (const [name, frame] of frames) if (name.startsWith("vertical-") || name === "odd-vertical") {
    const rotated = frames.get(name === "odd-vertical" ? "odd-horizontal" : name.replace("vertical", "horizontal"))!
    for (let y = 64; y < frame.height - 64; y++) for (let x = 64; x < frame.width - 64; x++) {
      rotationDifference = Math.max(rotationDifference, Math.abs(frame.rgba[(y * frame.width + x) * 4]! - rotated.rgba[(x * rotated.width + y) * 4]!))
    }
  }
  console.log(JSON.stringify({baseline, adapterInfo: adapter.info, rotationDifference, roiDifference, frames: results}))
  }
} finally {
  device.destroy()
  gpu.destroy()
}

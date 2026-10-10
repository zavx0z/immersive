/// <reference path="./assets.d.ts" />
import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {createDocument, HTMLImageElement, type Element, type Node} from "@zavx0z/immersive-dom"
import {component, createRoot, normalizeChildren, type ComponentValue} from "@zavx0z/immersive-component"
import {isCompiledTemplate} from "@zavx0z/immersive-template/compiled"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {Space, ViewPoint, TrueTypeFont} from "@zavx0z/immersive-engine"
import {Renderer, RendererWebGpuBackend, RendererWebGpuScreenOverlay, TextureLoader} from "@zavx0z/immersive-webgpu"
import {NativeGpuCanvas, type CapturedFrame} from "./native-canvas.ts"
import {installShaderCompilationDiagnostics} from "./shader-diagnostics.ts"
import {createImageBitmap, ImageBitmap} from "./image-bitmap.ts"
import {installExternalImageCopy} from "./external-image.ts"
import {registerHeadlessCompiler, repositoryRoot} from "./compiler.ts"
import defaultFontSource from "@zavx0z/immersive-engine/fonts/inter-regular.ttf" with {type: "file"}
import defaultStyleSheetSource from "@zavx0z/immersive-ui-component/theme/theme.css" with {type: "file"}
import type {HeadlessOptions} from "./contract/input.ts"
import type {Headless} from "./contract/output.ts"
import waitForTexture from "./wait-for-texture.ts"

export type {HeadlessOptions} from "./contract/input.ts"
export type {Headless} from "./contract/output.ts"

let gpuOperations: Promise<unknown> = Promise.resolve()
function exclusive<Result>(operation: () => Promise<Result>): Promise<Result> {
  const current = gpuOperations.then(operation, operation)
  gpuOperations = current.then(() => undefined, () => undefined)
  return current
}

/**
Создаёт один нативный host для компонентов любых пакетов выбранного проекта.

Test host заранее подключает `@zavx0z/immersive-headless/preload`, чтобы статические
TSX-импорты и JSX сценария компилировались Template. `createHeadless` идемпотентно
регистрирует тот же compiler и создаёт отдельный host. GPU-операции разных host выполняются последовательно;
глобальные WebGPU-объекты восстанавливаются после каждой операции.
Браузерные ImageBitmap API предоставляет тот же host; снимок ожидает текстуры
и повторный кадр после их загрузки.

@param options - Размер native Canvas и источники ресурсов окружения.
@returns Host с живым DOM, отдельным получением PNG и явным dispose.

@example
```tsx
import Typography from "@zavx0z/immersive-ui-component-typography"

const headless = createHeadless()
const element = await headless.render(
  <Typography
    text="Пример"
  />,
)
await Bun.write("typography.png", await headless.screenshot(element))
await headless.dispose()
```
*/
export function createHeadless(options: HeadlessOptions = {}): Headless {
  registerHeadlessCompiler(options.projectRoot ?? repositoryRoot(process.cwd()))
  const width = options.width ?? 1024
  const height = options.height ?? 768
  const canvas = new NativeGpuCanvas(width, height)
  const document = createDocument()
  const host = document.createElement("div")
  host.setAttribute("style", `width: ${width}px; height: ${height}px`)
  document.append(host)
  const componentRoot = createRoot(host)
  const renderer = new Renderer()
  let gpu: ReturnType<typeof createGPUInstance> | undefined
  let backend: RendererWebGpuBackend | undefined
  let layout: ReturnType<typeof createDocumentRenderer> | undefined
  let ready = false
  let disposed = false
  const lifetime = new AbortController()
  let presentationRequested = false
  const onImageSizeChanged = (): void => {
    layout?.invalidate(host)
    presentationRequested = true
  }
  const space = new Space()
  const viewPoint = new ViewPoint({viewport: {left: 0, top: 0, width, height}, position: {x: 0, y: -600, z: 0}})
  let overlay: RendererWebGpuScreenOverlay | undefined

  async function withGpu<Result>(operation: () => Promise<Result>): Promise<Result> {
    if (disposed) throw new Error("Headless уже освобождён")
    if (gpu === undefined) {
      gpu = createGPUInstance()
      const requestAdapter = gpu.requestAdapter.bind(gpu)
      gpu.requestAdapter = async adapterOptions => {
        const adapter = await requestAdapter(adapterOptions)
        if (adapter === null) return null
        const requestDevice = adapter.requestDevice.bind(adapter)
        adapter.requestDevice = async descriptor => {
          const device = await requestDevice(descriptor)
          installShaderCompilationDiagnostics(device)
          installExternalImageCopy(device)
          return device
        }
        return adapter
      }
    }
    const globals = {...globalConstructors, navigator: {gpu}, createImageBitmap, ImageBitmap}
    const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
    try {
      for (const [key, value] of Object.entries(globals)) {
        Object.defineProperty(globalThis, key, {value, writable: true, configurable: true})
      }
      return await operation()
    } finally {
      for (const [key, descriptor] of previous) {
        if (descriptor === undefined) Reflect.deleteProperty(globalThis, key)
        else Object.defineProperty(globalThis, key, descriptor)
      }
    }
  }

  async function initialize(): Promise<void> {
    if (ready) return
    const fontSource = options.fontSource ?? new URL(defaultFontSource, import.meta.url)
    const sources = options.styleSheetSources ?? [new URL(defaultStyleSheetSource, import.meta.url)]
    const font = new TrueTypeFont(await Bun.file(fontSource).arrayBuffer())
    const styleSheets = await Promise.all(sources.map(source => Bun.file(source).text()))
    backend = new RendererWebGpuBackend({
      font,
      invalidateGeometry: geometry => renderer.invalidateGeometry(geometry),
      requestPresentation: () => { presentationRequested = true },
    })
    layout = createDocumentRenderer({document, root: host, viewport: {width, height}, styleSheets, textMeasurer: backend.textMeasurer!,
      imageMeasurer: {measureImage: (src, signal) => renderer.readImageSize(src, onImageSizeChanged, signal)},
    })
    overlay = new RendererWebGpuScreenOverlay({content: backend.root, viewport: {width, height}})
    await renderer.init(canvas.asHtmlCanvas())
    ready = true
  }

  async function draw(): Promise<void> {
    do {
      if (lifetime.signal.aborted) throw lifetime.signal.reason
      presentationRequested = false
      componentRoot.flush()
      const frame = layout!.flush()
      backend!.applyFrame(frame)
      const device = canvas.getContext("webgpu")!.getConfiguration()!.device
      device.pushErrorScope("validation")
      renderer.renderFrame(space, overlay, viewPoint)
      const error = await device.popErrorScope()
      if (error !== null) throw new Error(`Ошибка GPU-кадра Headless: ${error.message}`)
      const sources = new Map<string, {nodes: Set<Node>, controller: AbortController}>()
      for (const item of frame.displayList) {
        if (item.kind !== "image") continue
        let source = sources.get(item.src)
        if (source === undefined) sources.set(item.src, source = {nodes: new Set(), controller: new AbortController()})
        source.nodes.add(item.node)
      }
      const frameChanged = new AbortController()
      const changedOwners = (): void => {
        for (const [src, source] of sources) {
          if (![...source.nodes].some(node => host.contains(node) && node instanceof HTMLImageElement && node.src === src)) {
            source.controller.abort(new DOMException("Изображение больше не принадлежит кадру", "AbortError"))
            frameChanged.abort(new DOMException("Кадр изменился во время загрузки изображения", "AbortError"))
            presentationRequested = true
          }
        }
      }
      const unsubscribe = document.subscribeMutations(changedOwners)
      const pendingSources = [...sources]
      let textures: PromiseSettledResult<void>[]
      try {
        changedOwners()
        textures = await Promise.allSettled(pendingSources.map(([src, source]) => waitForTexture({
          device,
          signal: AbortSignal.any([lifetime.signal, frameChanged.signal, source.controller.signal, AbortSignal.timeout(15_000)]),
          acquire: changed => TextureLoader.acquire(src, changed, {animate: false}),
        })))
      } finally { unsubscribe() }
      if (lifetime.signal.aborted) throw lifetime.signal.reason
      const failed = textures.find((result, index) => result.status === "rejected" && !pendingSources[index]![1].controller.signal.aborted)
      if (!frameChanged.signal.aborted && failed?.status === "rejected") throw failed.reason
    } while (presentationRequested)
  }

  const capture = (element: Element): Promise<CapturedFrame> => exclusive(() => withGpu(async () => {
    if (!ready || element.ownerDocument !== document || !host.contains(element)) {
      throw new Error("Снимок доступен только для смонтированного элемента этого Headless")
    }
    await draw()
    const bounds = element.getBoundingClientRect()
    const x = Math.floor(bounds.x)
    const y = Math.floor(bounds.y)
    return canvas.capture({x, y, width: Math.ceil(bounds.right) - x, height: Math.ceil(bounds.bottom) - y})
  }))

  function screenshot(element: Element): Promise<Buffer>
  function screenshot(element: Element, format: "image"): Promise<Bun.Image>
  async function screenshot(element: Element, format?: "image"): Promise<Buffer | Bun.Image> {
    const png = (await capture(element)).png
    return format === "image" ? new Bun.Image(png) : png
  }

  async function render(value: unknown): Promise<Element> {
    if (arguments.length !== 1) throw new TypeError("Headless.render принимает один JSX-аргумент")
    const child = normalizeChildren(value as ComponentValue)
    if (child === null) throw new TypeError("Headless.render принимает JSX скомпилированного компонента")
    return exclusive(() => withGpu(async () => {
      await initialize()
      componentRoot.render(child)
      await draw()
      if (host.children.length !== 1) throw new Error("Компонент должен вернуть один внешний элемент")
      return host.firstElementChild!
    }))
  }

  return {
    render,
    async renderComponent(type, props) {
      if (!isCompiledTemplate(type)) throw new TypeError("Headless.renderComponent принимает скомпилированный компонент и props")
      return render(component(type, props))
    },
    capture,
    screenshot,
    dispose(): Promise<void> {
      lifetime.abort(new DOMException("Headless освобождён", "AbortError"))
      return exclusive(async () => {
        if (disposed) return
        componentRoot.unmount()
        layout?.dispose()
        backend?.dispose()
        renderer.dispose()
        canvas.dispose()
        gpu?.destroy()
        host.remove()
        disposed = true
      })
    },
  }
}

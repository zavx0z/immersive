import {createDocumentNavigationHost} from "../navigation.ts"
import {createDocument} from "@zavx0z/immersive-dom"
import {createSpaceElementFactories, readSpaceTree} from "@zavx0z/immersive-space"
import {loadDocumentDefaultFont} from "@zavx0z/immersive-engine/default-font"
import type {TrueTypeFont} from "@zavx0z/immersive-engine"
import {createAttachedRoot, type Root as Presentation, type RootRuntimeFactory} from "../src/attach.ts"
import {createRootEnvironment, type RootEnvironment} from "../src/document-environment.ts"
import {claimBrowserPresentationHost} from "../src/presentation-host.ts"
import {createApplicationStyleSheets} from "../src/application-stylesheets.ts"
import {createDocumentSpaceRuntime} from "../src/space-runtime.ts"

export interface DocumentRootOptions {
  /** Положительное конечное число. По умолчанию используется devicePixelRatio окна. */
  readonly pixelRatio?: number
  /** Получает ошибки root.render, загрузки ресурсов и запуска GPU. По умолчанию console.error. */
  readonly onUncaughtError?: (error: Error) => void
}

/** Одно подключение DOM; Component и JSX не требуются для создания и изменения дерева. */
export interface DocumentRoot {
  readonly document: ReturnType<typeof createDocument>
  /** Ожидает представление последнего запрошенного состояния документа. */
  whenReady(): Promise<Presentation>
  /** Запускает подготовку первого кадра или явную синхронизацию существующего DOM. */
  render(): void
  /**
  Освобождает приложение. Незавершённая GPU-подготовка удерживает Canvas до cleanup.
  Повторный вызов безопасен; render после unmount запрещён.
  */
  unmount(): void
}

export interface DocumentRootInspection {
  readonly document: ReturnType<typeof createDocument>
  whenReady(): Promise<Presentation>
}

/** Внутреннее участие автора в общем lifecycle; DOM runtime не знает его реализацию. */
export interface DocumentContent {
  commit(): boolean
  flush(): number
  unmount(): void
}

const inspections = new WeakMap<DocumentRoot, DocumentRootInspection>()
/**
Подключает один semantic Document к Canvas независимо от способа авторства.

После построения дерева render запускает ресурсы и первый кадр. Изменения
подключённого DOM используют тот же ввод, проекции и планировщик кадров.
Unmount отменяет незавершённый запуск и освобождает подключение.
*/
export function createDocumentRoot(canvas: HTMLCanvasElement, options: DocumentRootOptions = {}): DocumentRoot {
  return createDocumentRootWithSeams(canvas, options, {
    loadFont: () => loadDocumentDefaultFont(canvas.ownerDocument),
    createRuntime: async (input, claim) => {
      return createDocumentSpaceRuntime(input, claim)
    },
    createStyleSheets: createApplicationStyleSheets,
  })
}

/** Internal seams used by lifecycle tests; not exported from the package entry. */
export function createDocumentRootWithSeams(
  canvas: HTMLCanvasElement,
  options: DocumentRootOptions,
  seams: {
    loadFont(): Promise<TrueTypeFont>
    createRuntime: RootRuntimeFactory
    createStyleSheets: typeof createApplicationStyleSheets
  },
  createContent?: (document: ReturnType<typeof createDocument>, environment: RootEnvironment) => DocumentContent,
): DocumentRoot {
  if (!canvas || typeof canvas.getContext !== "function" || typeof canvas.getBoundingClientRect !== "function") {
    throw new TypeError("createRoot expects a native Canvas")
  }
  if (options.pixelRatio !== undefined && (!Number.isFinite(options.pixelRatio) || options.pixelRatio <= 0)) {
    throw new TypeError("pixelRatio must be positive and finite")
  }
  const rect = canvas.getBoundingClientRect()
  const claim = claimBrowserPresentationHost(canvas)
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const html = document.createElement("html")
  const body = document.createElement("body")
  html.append(document.createElement("head"), body)
  document.append(html)
  const environment = createRootEnvironment(document, {
    width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)),
    left: rect.left ?? 0, top: rect.top ?? 0,
    dpr: options.pixelRatio ?? canvas.ownerDocument?.defaultView?.devicePixelRatio ?? 1,
  }, "demand")
  const navigation = createDocumentNavigationHost(document, canvas.ownerDocument)
  const content = createContent?.(document, environment)
  let active = true
  let updating = false
  let scheduled = false
  let driving = false
  let preparingPresentation = false
  let pending = false
  let presentation: Presentation | null = null
  let font: TrueTypeFont | null = null
  let revision = 0
  const waiters = new Set<{resolve(value: Presentation): void; reject(error: Error): void}>()
  const newReady = () => {
    const promise = new Promise<Presentation>((resolve, reject) => { waiters.add({resolve, reject}) })
    void promise.catch(() => {})
    return promise
  }
  let ready = newReady()
  const resolveReady = (value: Presentation) => {
    for (const waiter of waiters) waiter.resolve(value)
    waiters.clear()
  }
  const rejectReady = (error: Error) => {
    for (const waiter of waiters) waiter.reject(error)
    waiters.clear()
  }
  const reported = new WeakSet<Error>()
  const report = (error: Error) => {
    if (!active || reported.has(error)) return
    reported.add(error)
    if (options.onUncaughtError) options.onUncaughtError(error)
    else console.error(error)
  }
  const styles = seams.createStyleSheets(canvas, document, report)

  const drive = async () => {
    scheduled = false
    if (!active || driving) return
    driving = true
    try {
      while (active && pending) {
        pending = false
        const currentRevision = revision
        updating = true
        let hasContent = true
        try {
          hasContent = content?.commit() ?? true
          content?.flush()
        } finally { updating = false }
        if (!hasContent) {
          presentation?.unmount()
          presentation = null
          environment.connect(() => {})
          rejectReady(new Error("The Browser root has no rendered application"))
          continue
        }
        const tree = readSpaceTree(document)
        environment.setFrameloop(tree.space.frameloop)
        styles.refresh()
        await styles.whenReady()
        if (!active) return
        font ??= await seams.loadFont()
        if (!active) return
        if (currentRevision !== revision) continue
        if (presentation && (presentation.space !== tree.space || presentation.viewPoint !== tree.viewPoint)) {
          presentation.unmount()
          presentation = null
        }
        if (!presentation) {
          preparingPresentation = true
          try {
            presentation = await createAttachedRoot({
              canvas,
              font,
              ...(options.pixelRatio === undefined ? {} : {pixelRatio: options.pixelRatio}),
            },
              document, content ?? null, environment, {release() {}}, seams.createRuntime, undefined,
              {active: () => active, updating: () => updating})
          } finally { preparingPresentation = false }
          if (!active) {
            presentation.unmount()
            presentation = null
            return
          }
        } else {
          presentation.render()
        }
        if (currentRevision === revision) {
          const current = presentation
          resolveReady(Object.freeze({
            ...current,
            get presentedFrame() { return current.presentedFrame },
            get disposed() { return current.disposed },
            unmount: root.unmount,
          }))
        }
      }
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error))
      rejectReady(normalized)
      report(normalized)
    } finally {
      driving = false
      if (!active) claim.release()
      if (active && pending) schedule()
    }
  }
  const schedule = () => {
    if (scheduled || driving || !active) return
    scheduled = true
    queueMicrotask(() => { void drive() })
  }
  const root: DocumentRoot = Object.freeze({
    document,
    whenReady() {
      if (!active) return Promise.reject(new Error("Browser root was unmounted"))
      return ready
    },
    render() {
      if (!active) throw new Error("Cannot update an unmounted root")
      pending = true
      revision++
      ready = newReady()
      schedule()
    },
    unmount() {
      if (!active) return
      active = false
      navigation.dispose()
      pending = false
      rejectReady(new Error("Browser root was unmounted"))
      try { styles.dispose() } finally {
        updating = true
        try {
          content?.unmount()
          body.replaceChildren()
          document.querySelector("head")?.replaceChildren()
        } finally {
          updating = false
          try { presentation?.unmount() } finally {
            presentation = null
            environment.dispose()
            if (!preparingPresentation) claim.release()
          }
        }
      }
    },
  })
  inspections.set(root, {document, whenReady: root.whenReady})
  return root
}

/** Internal lookup used by the separate diagnostics entry. */
export function inspectDocumentRoot(root: DocumentRoot): DocumentRootInspection {
  const inspection = inspections.get(root)
  if (!inspection) throw new TypeError("Expected a Browser root")
  return inspection
}

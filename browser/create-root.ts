import {createDomRoot, type DOMRenderOptions} from "@zavx0z/immersive-dom/root"
import type {DOMComponentConstructor} from "@zavx0z/immersive-dom"
import {createDocumentRootWithSeams, inspectDocumentRoot, type DocumentRoot, type DocumentRootOptions, type DocumentRootInspection} from "./document/index.ts"
import {createDocumentSpaceRuntime} from "./src/space-runtime.ts"
import {createApplicationStyleSheets} from "./src/application-stylesheets.ts"
import {loadDocumentDefaultFont} from "@zavx0z/immersive-engine/default-font"

export type RootOptions = DocumentRootOptions
export type RootInspection = DocumentRootInspection

/** Один DOM host принимает готовые DOM-конструкторы и напрямую построенное дерево. */
export interface Root extends DocumentRoot {
  render(): void
  render<Props>(constructor: DOMComponentConstructor<Props> | ((props: Props) => unknown), props: Readonly<Props>, options?: DOMRenderOptions): void
  /** Авторский JSX становится таким значением при компиляции; проверяется готовый constructor. */
  render(construction: unknown): void
}

const inspections = new WeakMap<Root, RootInspection>()

/** Подключает тот же DOM к Canvas; код обновления находится в самих DOM-компонентах. */
export function createRoot(canvas: HTMLCanvasElement, options: RootOptions = {}): Root {
  return createRootWithSeams(canvas, options, {
    loadFont: () => loadDocumentDefaultFont(canvas.ownerDocument),
    createRuntime: (input, claim) => createDocumentSpaceRuntime(input, claim),
    createStyleSheets: createApplicationStyleSheets,
  })
}

/** Внутренний выбор ресурсов для тестов владельца и host integration. */
export function createRootWithSeams(
  canvas: HTMLCanvasElement,
  options: RootOptions,
  seams: Parameters<typeof createDocumentRootWithSeams>[2],
): Root {
  let pending: {input: unknown; props: unknown; options: DOMRenderOptions} | undefined
  let empty = false
  const host = createDocumentRootWithSeams(canvas, options, seams, document => {
    const body = document.querySelector("body")!
    const content = createDomRoot(body)
    return {
      commit() {
        const next = pending
        if (next !== undefined) {
          pending = undefined
          content.render(typeof next.input === "function"
            ? {type: next.input, props: next.props, ...next.options}
            : next.input)
          empty = next.input === null
          if (empty) body.replaceChildren()
        }
        return !empty
      },
      flush: () => document.flushTasks(),
      unmount: () => content.unmount(),
    }
  })
  const root: Root = Object.freeze({
    document: host.document,
    whenReady: host.whenReady,
    render(input?: unknown, props?: unknown, renderOptions: DOMRenderOptions = {}) {
      if (arguments.length !== 0) pending = {input, props, options: renderOptions}
      host.render()
    },
    unmount: host.unmount,
  })
  inspections.set(root, inspectDocumentRoot(host))
  return root
}

/** Диагностика существующего подключения без создания нового lifecycle. */
export function inspectBrowserRoot(root: Root): RootInspection {
  const inspection = inspections.get(root)
  if (!inspection) throw new TypeError("Expected a Browser root")
  return inspection
}

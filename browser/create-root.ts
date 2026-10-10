import {createRoot as createComponentRoot, provideContext, component, type ComponentValue} from "@zavx0z/immersive-component"
import {defineCompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import {rootContext} from "./src/root-context.ts"
import {createDocumentRootWithSeams, inspectDocumentRoot, type DocumentRootOptions, type DocumentRootInspection} from "./document/index.ts"
import {createDocumentSpaceRuntime} from "./src/space-runtime.ts"
import {createApplicationStyleSheets} from "./src/application-stylesheets.ts"
import {loadDocumentDefaultFont} from "@zavx0z/immersive-engine/default-font"

export type RootOptions = DocumentRootOptions
export type RootInspection = DocumentRootInspection

/** Компонентное авторство поверх общего подключения DOM к Canvas. */
export interface Root {
  render(app: JSX.Element | ComponentValue | null): void
  unmount(): void
}

const inspections = new WeakMap<Root, RootInspection>()
const empty = defineCompiledTemplate({
  displayName: "EmptyBrowserRoot",
  bindingCount: 0,
  mount() { return {nodes: [], bindings: []} },
  render() {},
})

/** Создаёт компонентный вход; ресурсами, вводом и кадрами владеет DocumentRoot. */
export function createRoot(canvas: HTMLCanvasElement, options: RootOptions = {}): Root {
  return createRootWithSeams(canvas, options, {
    loadFont: () => loadDocumentDefaultFont(canvas.ownerDocument),
    createRuntime: (input, claim) => createDocumentSpaceRuntime(input, claim),
    createStyleSheets: createApplicationStyleSheets,
  })
}

/** Внутренний выбор ресурсов для тестов и integration; из корня пакета не экспортируется. */
export function createRootWithSeams(
  canvas: HTMLCanvasElement,
  options: RootOptions,
  seams: Parameters<typeof createDocumentRootWithSeams>[2],
): Root {
  let next: JSX.Element | ComponentValue | null = null
  const host = createDocumentRootWithSeams(canvas, options, seams, (document, environment) => {
    const root = createComponentRoot(document.querySelector("body")!)
    return {
      commit() {
        root.render(provideContext(rootContext, environment,
          next === null ? component(empty, {}) : next as ComponentValue))
        return next !== null
      },
      flush: () => root.flush(),
      unmount: () => root.unmount(),
    }
  })
  const root: Root = Object.freeze({
    render(app: JSX.Element | ComponentValue | null) {
      next = app
      host.render()
    },
    unmount: () => host.unmount(),
  })
  inspections.set(root, inspectDocumentRoot(host))
  return root
}

/** Внутреннее чтение диагностики существующего компонентного подключения. */
export function inspectBrowserRoot(root: Root): RootInspection {
  const inspection = inspections.get(root)
  if (!inspection) throw new TypeError("Expected a Browser root")
  return inspection
}

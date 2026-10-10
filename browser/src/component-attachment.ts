import {createDocument, createDomRoot, type DOMConstruction} from "@zavx0z/immersive-dom"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import {createSpaceElementFactories, readSpaceTree} from "@zavx0z/immersive-space"
import {loadDocumentDefaultFont} from "@zavx0z/immersive-engine/default-font"
import {createRootEnvironment} from "./document-environment.ts"
import {claimBrowserPresentationHost} from "./presentation-host.ts"
import {createAttachedRoot, defaultRootSeams, validateOptions, readRootSize, type Root, type PresentationOptions, type RootRuntimeFactory, type RootSeams} from "./attach.ts"

export type ComponentPresentationOptions = PresentationOptions & Readonly<{app: JSX.Element | DOMConstruction<any>}>

/** Подмена GPU runtime для тестов владельца; из публичного Browser API не экспортируется. */
export async function attachWithRuntimeFactory(
  options: ComponentPresentationOptions,
  createRuntime: RootRuntimeFactory,
  seams: RootSeams = defaultRootSeams,
): Promise<Root> {
  validateOptions(options, createRuntime, seams)
  const size = readRootSize(options)
  const claim = claimBrowserPresentationHost(options.canvas)
  const document = createDocument({
    elementFactories: createSpaceElementFactories(),
  })
  const environment = createRootEnvironment(document, size, options.frameloop ?? "demand")
  const appRoot = createDomRoot(document)
  try {
    appRoot.render(options.app)
    appRoot.flush()
    readSpaceTree(document)
    const font = options.font ?? await loadDocumentDefaultFont(options.canvas.ownerDocument)
    return await createAttachedRoot({...options, font}, document, appRoot, environment, claim, createRuntime, seams)
  } catch (error) {
    try { appRoot.unmount() } finally { environment.dispose()
      claim.release() }
    throw error
  }
}

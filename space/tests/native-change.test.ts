import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {createDocument, createDomRoot, observeConnection, type DOMComponentConstructor} from "@zavx0z/immersive-dom"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import {createSpaceElementFactories, XRMeshElement, type XRObjectProjectionFactory, type SpatialHitTest} from "../src/index.ts"
import type {NativeMeshProps} from "./native-change.fixture.tsx"

test("реальный XRMesh наблюдает quaternion/scale/factory/hitTest в одном native DOM", () => {
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const mesh = document.createElement("xr-mesh") as XRMeshElement
  let changes = 0, snapshot: unknown[] = []
  const scope = observeConnection(mesh, {properties: ["quaternionX", "scaleX", "factory", "hitTest"], changed() {
    changes++
    snapshot = [mesh.quaternionX, mesh.scaleX, mesh.factory, mesh.hitTest]
  }})
  const factory: XRObjectProjectionFactory = () => { throw new Error("projection not requested") }
  const hit: SpatialHitTest = () => null
  document.transaction(() => {
    mesh.quaternionX = .25
    mesh.setAttribute("scale-x", "2")
    mesh.factory = factory
    mesh.hitTest = hit
  })
  expect(snapshot).toEqual([.25, 2, factory, hit])
  expect(changes).toBe(1)
  expect(() => { mesh.factory = {} as never }).toThrow("factory")
  expect(mesh.factory).toBe(factory)
  expect(changes).toBe(1)
  scope.dispose()
  mesh.quaternionX = .5
  expect(changes).toBe(1)
})

test("готовый JS constructor пересчитывает derived XR bindings после native writes без remount", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".native-change-"))
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const root = createDomRoot(document.createDocumentFragment())
  try {
    const result = await Bun.build({
      entrypoints: [resolve(import.meta.dir, "native-change.fixture.tsx")],
      outdir: directory,
      target: "bun",
      external: ["@zavx0z/immersive-dom", "@zavx0z/immersive-dom/*"],
      plugins: [createJsxBunPlugin({cwd: resolve(import.meta.dir, "../.."), sourceRoots: [resolve(import.meta.dir, "..")]})],
    })
    if (!result.success) throw new AggregateError(result.logs, "Native Mesh compilation failed")
    const entry = result.outputs.find(output => output.kind === "entry-point")!
    const emitted = await entry.text()
    expect(emitted).not.toContain("ComponentInstance")
    expect(emitted).not.toContain("defineCompiledTemplate")
    const NativeMesh = (await import(pathToFileURL(entry.path).href)).NativeMesh as DOMComponentConstructor<NativeMeshProps>
    const props: NativeMeshProps = {quaternionX: 0, scaleX: 1, factory: null, hitTest: null}
    root.render(NativeMesh, props)
    const mesh = root.current
    if (!(mesh instanceof XRMeshElement)) throw new TypeError("Native constructor must return the actual XRMeshElement")
    const factory: XRObjectProjectionFactory = function projection() { throw new Error("projection not requested") }
    const hit: SpatialHitTest = function rayHit() { return null }
    document.transaction(() => {
      mesh.quaternionX = .5
      mesh.scaleX = 3
      mesh.factory = factory
      mesh.hitTest = hit
    })
    expect(mesh.getAttribute("data-derived")).toBe("0.5:3:projection:rayHit")
    expect(root.current === mesh).toBeTrue()
    root.render(NativeMesh, {...props})
    expect(mesh.quaternionX).toBe(.5)
    expect(mesh.scaleX).toBe(3)
    expect(mesh.factory).toBe(factory)
    expect(mesh.hitTest).toBe(hit)
    root.unmount()
    expect(root.current).toBeNull()
  } finally {
    root.unmount()
    await rm(directory, {recursive: true, force: true})
  }
}, 30_000)

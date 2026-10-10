import {expect, test} from "bun:test"
import {Color, HolographicMaterial, Mesh, type TrueTypeFont} from "@zavx0z/immersive-engine"
import {acquireDocumentAuthorStyleSheetOwner} from "@zavx0z/immersive-dom"
import type {XRMaterialProjectionContext} from "@zavx0z/immersive-space"
import {attachFixture, createFakeRuntime, createFakeRuntimeState} from "./experience.fixture.ts"

/** Реальны semantic элементы и CSS каскад; seam заменяет только GPU presentation. */
test("материал получает inherited CSS variables и смену appearance без пересоздания geometry", async () => {
  const state = createFakeRuntimeState()
  const root = await attachFixture({canvas: {getContext: () => null, getBoundingClientRect: () => ({width: 800, height: 600, left: 0, top: 0})} as unknown as HTMLCanvasElement, font: {} as TrueTypeFont}, async options => createFakeRuntime(options, state))
  const styles = acquireDocumentAuthorStyleSheetOwner(root.document)
  try {
    const group = root.document.createElement("xr-group")
    const mesh = root.document.createElement("xr-mesh")
    const geometry = root.document.createElement("xr-geometry")
    const material = root.document.createElement("xr-material")
    let seen: XRMaterialProjectionContext | undefined
    material.styleProperties = ["--material-appearance"]
    material.factory = (_element, context) => {
      seen = context
      return new HolographicMaterial({color: new Color(context!.color.r, context!.color.g, context!.color.b), opacity: context!.opacity})
    }
    group.id = "themed-volume"
    group.setAttribute("style", "--theme-tint: rgb(128, 255, 0); --surface-alpha: .2; --family-appearance: glass; --material-appearance: var(--family-appearance); color: var(--theme-tint)")
    material.setAttribute("style", "opacity: var(--surface-alpha)")
    mesh.append(geometry, material)
    group.append(mesh)
    root.space.append(group)
    expect(seen?.color.r).toBeCloseTo(128 / 255)
    expect(seen?.opacity).toBe(.2)
    expect(seen?.customProperties["--material-appearance"]).toBe("glass")
    const projection = state.space!.children[0]!.children[0] as Mesh
    const heldGeometry = projection.geometry
    const oldMaterial = projection.material
    group.setAttribute("style", "--theme-tint: #ff00ff; --surface-alpha: .3; --material-appearance: holographic; color: var(--theme-tint)")
    expect(projection.geometry).toBe(heldGeometry)
    expect(projection.material).not.toBe(oldMaterial)
    expect(seen?.customProperties["--material-appearance"]).toBe("holographic")
    expect(seen?.opacity).toBe(.3)
    expect(seen?.color.b).toBe(1)
    const heldMaterial = projection.material
    root.render()
    expect(projection.material).toBe(heldMaterial)
    styles.replace([{id: "owner-theme", cssText: "#themed-volume { opacity: .5; }"}])
    expect(seen?.opacity).toBe(.15)
    expect(projection.geometry).toBe(heldGeometry)
  } finally {
    styles.release()
    root.unmount()
  }
})


test("compiled SpatialVolumes передаёт реальные CSS opacity и tint в Browser material projection", async () => {
  const {mkdtemp, rm} = await import("node:fs/promises")
  const {join, resolve} = await import("node:path")
  const {pathToFileURL} = await import("node:url")
  const {component} = await import("@zavx0z/immersive-component")
  const {attachWithRuntimeFactory} = await import("../src/component-attachment.ts")
  const {default: createJsxBunPlugin} = await import("@zavx0z/immersive-jsx-compiler-bun")
  const repository = resolve(import.meta.dir, "../..")
  const directory = await mkdtemp(join(import.meta.dir, ".volume-style-"))
  const state = createFakeRuntimeState()
  let root: Awaited<ReturnType<typeof attachWithRuntimeFactory>> | undefined
  try {
    await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: join(repository, "tsconfig.json"), include: ["app.tsx"], exclude: []}))
    const appPath = join(directory, "app.tsx")
    await Bun.write(appPath, `import {SpatialVolumes} from ${JSON.stringify(join(repository, "space/shape/volumes.tsx"))}
export function VolumeApp() {
  return <space>
    <viewpoint />
    <SpatialVolumes
      volumes={[{id: "entity", from: {x: 0, y: 0, z: 20, width: 30, height: 15}, to: {x: 0, y: 0, z: 10, width: 30, height: 15}, color: "var(--node-family-1, #00ffff)"}]}
      geometryRevision={1}
    />
  </space>
}
`)
    const result = await Bun.build({entrypoints: [appPath], outdir: join(directory, "out"), target: "bun",
      external: ["@zavx0z/immersive-space", "@zavx0z/immersive-component", "@zavx0z/immersive-dom", "@zavx0z/immersive-engine", "@zavx0z/immersive-template/compiled"],
      plugins: [createJsxBunPlugin({cwd: repository, sourceRoots: [join(repository, "space"), directory]})]})
    if (!result.success) throw new AggregateError(result.logs, "Volume CSS compilation failed")
    const template = (await import(pathToFileURL(result.outputs.find(output => output.kind === "entry-point")!.path).href)).VolumeApp
    root = await attachWithRuntimeFactory({app: component(template, {}), canvas: {getContext: () => null, getBoundingClientRect: () => ({width: 800, height: 600, left: 0, top: 0})} as unknown as HTMLCanvasElement, font: {} as TrueTypeFont}, async options => createFakeRuntime(options, state))
    const mesh = state.space!.children[0]!.children[0]!.children[0] as Mesh
    expect(mesh.material).toBeInstanceOf(HolographicMaterial)
    expect(mesh.material).toHaveProperty("opacity", .12)
    expect((mesh.material as HolographicMaterial).color.g).toBe(1)
    const geometry = mesh.geometry
    root.space.setAttribute("style", "--spatial-volume-opacity: .25; --spatial-volume-outline-opacity: .8; --node-family-1: #808080; --spatial-volume-appearance: glass")
    expect(mesh.geometry).toBe(geometry)
    expect(mesh.material).toHaveProperty("tintColor")
    expect((mesh.material as import("@zavx0z/immersive-engine").GlassMaterial).tintColor.a).toBe(.25)
    expect((mesh.material as import("@zavx0z/immersive-engine").GlassMaterial).tintColor.g).toBeCloseTo(128 / 255)
  } finally {
    root?.unmount()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

import {expect, test} from "bun:test"
import {BufferGeometry, Color, GlassMaterial, Mesh} from "@zavx0z/immersive-engine"
import {Renderer} from "../src/renderer/index.ts"
import type {RenderItem} from "../src/renderer/utils/render-list.ts"
import type {RenderCommandEncoder} from "../src/renderer/render-bundle-cache.ts"

/** Производственный выбор pipeline проверяется без подмены материала или shader. */
test("GlassMaterial использует собственный optical-depth pipeline", () => {
  const renderer = new Renderer() as unknown as {
    glassMeshPipeline: GPURenderPipeline
    staticMeshPipeline: GPURenderPipeline
    renderObjectList(encoder: RenderCommandEncoder, items: RenderItem[], indices: ReadonlyMap<RenderItem, number>): void
    renderMesh(): void
  }
  const glass = {} as GPURenderPipeline
  const opaque = {} as GPURenderPipeline
  renderer.glassMeshPipeline = glass
  renderer.staticMeshPipeline = opaque
  let draws = 0
  renderer.renderMesh = () => { draws++ }
  const chosen: GPURenderPipeline[] = []
  const encoder = {setPipeline(pipeline: GPURenderPipeline) {chosen.push(pipeline)}} as unknown as RenderCommandEncoder
  const mesh = new Mesh(new BufferGeometry(), new GlassMaterial({tintColor: new Color(.3, .6, .9, .2)}))
  const item: RenderItem = {type: "static-mesh", object: mesh, worldMatrix: mesh.matrixWorld}
  renderer.renderObjectList(encoder, [item], new Map([[item, 0]]))
  expect(chosen).toEqual([glass])
  expect(draws).toBe(1)
})

test("glass pipeline имеет два single-sample FP16 attachments; composite сохраняет MSAA opaque", async () => {
  const source = await Bun.file(new URL("../src/renderer/index.ts", import.meta.url)).text()
  const start = source.indexOf("this.glassMeshPipeline = await")
  const descriptor = source.slice(start, source.indexOf("this.thinFilmMeshPipeline = await", start))
  expect(descriptor).toContain("module: glassShaderModule")
  expect(descriptor.match(/format: "rgba16float"/gu)).toHaveLength(2)
  expect(descriptor).toContain("multisample: {count: 1}")
  expect(descriptor).toContain("depthWriteEnabled: false")
  expect(descriptor).toContain('depthCompare: "always"')
  expect(descriptor).toContain("multisample: {count: this.sampleCount}")
})

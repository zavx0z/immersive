import {expect, test} from "bun:test"
import {BufferGeometry, LineBasicMaterial, LineGlowMaterial, LineSegments} from "@zavx0z/immersive-engine"
import {Renderer} from "../src/renderer/index.ts"
import {BONE_MATRICES_SIZE, PER_OBJECT_UNIFORM_SIZE} from "../src/renderer/per-object-upload.ts"
import type {RenderItem} from "../src/renderer/utils/render-list.ts"
import lineShader from "../src/renderer/shader/line.wgsl" with {type: "text"}

function writer() {
  const renderer = new Renderer() as unknown as {
    perObjectDataCPU: Float32Array
    boneMatricesDataCPU: Float32Array
    updatePerObjectData(items: RenderItem[]): unknown
  }
  renderer.perObjectDataCPU = new Float32Array(PER_OBJECT_UNIFORM_SIZE / 4)
  renderer.boneMatricesDataCPU = new Float32Array(BONE_MATRICES_SIZE / 4)
  return renderer
}

test("LineBasic и LineGlow передают собственный fade coefficient в свободный uniform slot", () => {
  const renderer = writer()
  for (const material of [new LineBasicMaterial(), new LineGlowMaterial({glowIntensity: 2, luminanceBoost: 3})]) {
    const object = new LineSegments(new BufferGeometry(), material)
    object.position.set(0, 100000, 0)
    object.updateWorldMatrix()
    const item: RenderItem = {type: "line", object, worldMatrix: object.matrixWorld}
    renderer.updatePerObjectData([item])
    expect(renderer.perObjectDataCPU[30]).toBe(Math.fround(1 / 5000))
    material.distanceFade = 0
    renderer.updatePerObjectData([item])
    expect(renderer.perObjectDataCPU[30]).toBe(0)
    expect(renderer.perObjectDataCPU.slice(0, 16)).toEqual(new Float32Array(object.matrixWorld.elements))
    // На любой мировой дистанции normalizedDistance = distance * 0 = 0:
    // оба exponential fade равны 1, alpha не зависит от размера сцены.
    expect(Math.exp(-.5 * 100000 * renderer.perObjectDataCPU[30]!)).toBe(1)
    material.distanceFade = 5000
    renderer.updatePerObjectData([item])
    expect(Math.exp(-.5 * 100000 * renderer.perObjectDataCPU[30]!)).toBeLessThan(.0001)
    if (material instanceof LineGlowMaterial) {
      expect(renderer.perObjectDataCPU[20]).toBe(2)
      expect(renderer.perObjectDataCPU[21]).toBe(3)
    }
  }
})

test("shader читает fade материала, сохраняя прежний per-object ABI размер", () => {
  const uniforms = lineShader.match(/struct PerObjectUniforms \{([\s\S]*?)\};/)![1]!
  expect(uniforms).toContain("silhouetteAmount: f32")
  expect(uniforms).toContain("inverseDistanceFade: f32")
  expect(lineShader).toContain("distanceMm * perObject.inverseDistanceFade")
  expect(lineShader).not.toContain("5000")
  // 16 model + 4 color + 4 glow + 4 glowColor + 3 scalars,
  // округление структуры к align16 сохраняет 32 Float32.
  expect(uniforms.match(/: f32/g)).toHaveLength(7)
})


test("instanced shader и layout используют собственный коэффициент, без фиксированного расстояния", async () => {
  const source = await Bun.file(new URL("../src/renderer/index.ts", import.meta.url)).text()
  const shader = source.slice(source.indexOf("const lineInstancedWGSL ="), source.indexOf("const lineInstancedShaderModule"))
  expect(shader).toContain("@location(9) inverseDistanceFade: f32")
  expect(shader).toContain("@location(5) inverseDistanceFade: f32")
  expect(shader).toContain("out.inverseDistanceFade = inverseDistanceFade")
  expect(shader).toContain("distanceMm * in.inverseDistanceFade")
  expect(shader).not.toContain("5000")
  const layout = source.slice(source.indexOf("this.instancedLinePipeline ="), source.indexOf("this.instancedLinePipeline =") + 1500)
  expect(layout).toContain('arrayStride: 104')
  expect(layout).toContain('shaderLocation: 9, offset: 100, format: "float32"')
})

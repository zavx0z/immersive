import {expect, test} from "bun:test"
import {createDocument, type HTMLElement} from "@zavx0z/immersive-dom"
import {
  BufferGeometry, Color, InstancedRoundedRect, Mesh, RoundedRectMaterial,
  ROUNDED_RECT_INSTANCE_OFFSETS, ROUNDED_RECT_INSTANCE_RECORD_BYTE_LENGTH,
  type BufferAttribute,
} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {RendererWebGpuBackend} from "../src/webgpu-backend.ts"
import {Renderer} from "../src/renderer/index.ts"
import {BONE_MATRICES_SIZE, PER_OBJECT_UNIFORM_SIZE} from "../src/renderer/per-object-upload.ts"
import type {RenderItem} from "../src/renderer/utils/render-list.ts"

const mixed = "border-top:4px solid #ff0000;border-right:6px solid #00ff00;border-bottom:8px solid #0000ff;border-left:2px solid #ffff00"
const box = "display:block;box-sizing:border-box;width:80px;height:40px;border-radius:12px 10px 8px 6px;background:#ffffff"
const rgba = [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1]

function fixture(paints: readonly string[] = [mixed, mixed]) {
  const document = createDocument()
  const root = document.createElement("section")
  root.setAttribute("style", "display:flex;width:300px;height:60px;gap:10px")
  const append = (paint: string): HTMLElement => {
    const node = document.createElement("div")
    node.setAttribute("style", `${box};${paint}`)
    root.append(node)
    return node
  }
  const nodes = paints.map(append)
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 300, height: 60}})
  return {document, root, nodes, append, renderer}
}

function drawOf(backend: RendererWebGpuBackend): InstancedRoundedRect {
  const draw = backend.root.children.find(node => node instanceof InstancedRoundedRect)
  if (!(draw instanceof InstancedRoundedRect)) throw new Error("Ожидался один instanced rounded run")
  return draw
}

function record(draw: InstancedRoundedRect, order: number): Float32Array {
  const bytes = draw.layer.instances.readRecord(draw.layer.instances.handleAt(order))
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
}

function paletteOf(draw: InstancedRoundedRect): BufferAttribute {
  const attribute = draw.geometry.attributes.roundedRectBorderColors
  if (attribute === undefined) throw new Error("Разноцветная рамка должна создать Float32 палитру")
  return attribute
}

function paletteSlot(draw: InstancedRoundedRect, order: number): number[] {
  const slot = draw.layer.instances.handleAt(order).slot
  return [...paletteOf(draw).array.slice(slot * 16, (slot + 1) * 16)]
}

function uniformWriter() {
  const renderer = new Renderer() as unknown as {
    perObjectDataCPU: Float32Array
    boneMatricesDataCPU: Float32Array
    updatePerObjectData(items: RenderItem[]): unknown
  }
  renderer.perObjectDataCPU = new Float32Array(PER_OBJECT_UNIFORM_SIZE / 4)
  renderer.boneMatricesDataCPU = new Float32Array(BONE_MATRICES_SIZE / 4)
  return renderer
}

function countedUpload() {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "GPUBufferUsage")
  Object.defineProperty(globalThis, "GPUBufferUsage", {configurable: true, value: {COPY_DST: 8, INDEX: 16, VERTEX: 32, STORAGE: 128}})
  const counters = {created: 0, writes: [] as Array<{offset: number, bytes: number}>}
  const renderer = new Renderer() as unknown as {device: GPUDevice, getOrCreateGeometryBuffers(geometry: BufferGeometry): unknown}
  renderer.device = {
    createBuffer({size}: GPUBufferDescriptor) {
      counters.created += 1
      return {size, destroy() {}}
    },
    queue: {
      writeBuffer(_buffer: GPUBuffer, offset: number, data: ArrayBuffer | ArrayBufferView, _dataOffset?: number, size?: number) {
        const elementBytes = ArrayBuffer.isView(data) && "BYTES_PER_ELEMENT" in data ? Number(data.BYTES_PER_ELEMENT) : 1
        counters.writes.push({offset, bytes: size === undefined ? data.byteLength : size * elementBytes})
      },
    },
  } as unknown as GPUDevice
  return {
    counters,
    upload(geometry: BufferGeometry) { renderer.getOrCreateGeometryBuffers(geometry) },
    restore() {
      if (previous === undefined) Reflect.deleteProperty(globalThis, "GPUBufferUsage")
      else Object.defineProperty(globalThis, "GPUBufferUsage", previous)
    },
  }
}

test("CSS цвета сторон доходят до одного scalar quad и сохраняются при обновлении material", () => {
  const f = fixture([mixed])
  const invalidated: BufferGeometry[] = []
  const backend = new RendererWebGpuBackend({rectInstancing: "disabled", invalidateGeometry(geometry) { invalidated.push(geometry) }})
  try {
    backend.applyFrame(f.renderer.flush())
    expect(backend.diagnostics.rectScalarDraws).toBe(1)
    expect(backend.diagnostics.rectInstancedDraws).toBe(0)
    const mesh = backend.root.children.find(node => node instanceof Mesh) as Mesh
    const material = mesh.material as RoundedRectMaterial
    const geometry = mesh.geometry
    expect(material.borderColors?.flatMap(color => [...color.toArray()])).toEqual(rgba)
    expect(material.borderWidths).toEqual([4, 6, 8, 2])
    expect(material.radii).toEqual([12, 10, 8, 6])
    expect(geometry.attributes.position?.count).toBe(4)
    expect(geometry.index?.count).toBe(6)
    f.nodes[0]!.setAttribute("style", `${box};${mixed};border-right-color:rgba(17,34,51,0.375)`)
    backend.applyFrame(f.renderer.flush())
    expect(mesh.material).toBe(material)
    expect(mesh.geometry).toBe(geometry)
    expect(material.borderColors?.[1]!.toArray()).toEqual(new Float32Array([17 / 255, 34 / 255, 51 / 255, 0.375]))
    f.nodes[0]!.setAttribute("style", `${box};border:3px solid #123456`)
    backend.applyFrame(f.renderer.flush())
    expect(mesh.material).toBe(material)
    expect(material.borderColors).toBeNull()
    expect(material.border.toArray()).toEqual(new Color(0x123456).toArray())
    expect(invalidated).toEqual([])
  } finally {
    backend.dispose()
    f.renderer.dispose()
  }
})

test("scalar upload сохраняет Float32 RGBA в свободном normalMatrix без изменения uniform ABI", () => {
  const renderer = uniformWriter()
  const colors = [
    new Color(0.123456789, 0.234567891, 0.345678912, 0.456789123),
    new Color(0.987654321, 0.876543219, 0.765432198, 0.654321987),
    new Color(0, 0, 1, 0), new Color(0xffff00),
  ] as const
  const material = new RoundedRectMaterial({width: 80, height: 40, radius: 12, borderWidths: [4, 6, 8, 2], borderColors: colors})
  const mesh = new Mesh(new BufferGeometry(), material)
  mesh.position.set(12, 3, -7)
  mesh.updateWorldMatrix()
  const item: RenderItem = {type: "static-mesh", object: mesh, worldMatrix: mesh.matrixWorld}
  renderer.updatePerObjectData([item])
  expect(PER_OBJECT_UNIFORM_SIZE).toBe(256)
  expect(renderer.perObjectDataCPU.slice(0, 16)).toEqual(new Float32Array(mesh.matrixWorld.elements))
  expect(renderer.perObjectDataCPU.slice(16, 32)).toEqual(new Float32Array(colors.flatMap(color => [...color.toArray()])))
  expect(renderer.perObjectDataCPU[42]).toBe(1)
  expect(renderer.perObjectDataCPU.slice(60, 64)).toEqual(new Float32Array([4, 6, 8, 2]))
  material.borderColors = null
  renderer.updatePerObjectData([item])
  expect(renderer.perObjectDataCPU[42]).toBe(0)
  expect(renderer.perObjectDataCPU.slice(0, 16)).toEqual(new Float32Array(mesh.matrixWorld.elements))
})

test("mixed instanced run использует одну quad и отдельную палитру physical slot при ABI 128 B", () => {
  const f = fixture()
  const backend = new RendererWebGpuBackend({invalidateGeometry() {}})
  try {
    backend.applyFrame(f.renderer.flush())
    const draw = drawOf(backend)
    expect(backend.diagnostics.rectInstancedDraws).toBe(1)
    expect(backend.diagnostics.rectInstancedInstances).toBe(2)
    expect(backend.diagnostics.rectScalarDraws).toBe(0)
    expect(draw.count).toBe(2)
    expect(draw.geometry.attributes.position?.count).toBe(4)
    expect(draw.geometry.index?.count).toBe(6)
    expect(ROUNDED_RECT_INSTANCE_RECORD_BYTE_LENGTH).toBe(128)
    expect(draw.layer.instances.recordByteLength).toBe(128)
    expect(paletteOf(draw).array).toBeInstanceOf(Float32Array)
    expect(paletteOf(draw).itemSize).toBe(16)
    for (const order of [0, 1]) {
      expect(paletteSlot(draw, order)).toEqual(rgba)
      const values = record(draw, order)
      expect(values[ROUNDED_RECT_INSTANCE_OFFSETS.reserved]).toBe(1)
      expect([...values.slice(ROUNDED_RECT_INSTANCE_OFFSETS.borderWidths, ROUNDED_RECT_INSTANCE_OFFSETS.borderWidths + 4)]).toEqual([4, 6, 8, 2])
      expect([...values.slice(ROUNDED_RECT_INSTANCE_OFFSETS.radii, ROUNDED_RECT_INSTANCE_OFFSETS.radii + 4)]).toEqual([12, 10, 8, 6])
    }
  } finally {
    backend.dispose()
    f.renderer.dispose()
  }
})

test("нулевая ширина не создаёт палитру для одноцветных видимых сторон", () => {
  const paint = "border:4px solid #ff0000;border-right:0 solid #00ff00;border-left:0 solid #0000ff"
  const f = fixture([paint, paint])
  const backend = new RendererWebGpuBackend({invalidateGeometry() {}})
  try {
    backend.applyFrame(f.renderer.flush())
    const draw = drawOf(backend)
    expect(draw.geometry.attributes.roundedRectBorderColors).toBeUndefined()
    expect(record(draw, 0)[ROUNDED_RECT_INSTANCE_OFFSETS.reserved]).toBe(0)
    f.nodes[0]!.setAttribute("style", `${box};${paint};border-left-color:#ffff00`)
    backend.applyFrame(f.renderer.flush())
    expect(draw.geometry.attributes.roundedRectBorderColors).toBeUndefined()
    expect(backend.diagnostics.rectInstancedDraws).toBe(1)
  } finally {
    backend.dispose()
    f.renderer.dispose()
  }
})

test("прозрачная сторона сохраняет alpha=0 при ненулевой ширине в scalar и instanced путях", () => {
  for (const rectInstancing of ["disabled", "safe"] as const) {
    const paint = "border:4px solid #ff0000;border-right-color:transparent;border-bottom-color:rgba(0,0,255,0.375)"
    const f = fixture([paint, paint])
    const backend = new RendererWebGpuBackend({rectInstancing, invalidateGeometry() {}})
    try {
      backend.applyFrame(f.renderer.flush())
      const colors = rectInstancing === "disabled"
        ? (backend.root.children.find(node => node instanceof Mesh) as Mesh).material as RoundedRectMaterial
        : null
      const values = colors === null ? paletteSlot(drawOf(backend), 0) : colors.borderColors!.flatMap(color => [...color.toArray()])
      expect(values.slice(4, 8)).toEqual([0, 0, 0, 0])
      expect(values.slice(8, 12)).toEqual([0, 0, 1, 0.375])
      if (colors !== null) expect(colors.borderWidths).toEqual([4, 4, 4, 4])
      else expect([...record(drawOf(backend), 0).slice(20, 24)]).toEqual([4, 4, 4, 4])
    } finally {
      backend.dispose()
      f.renderer.dispose()
    }
  }
})

test("изменение одного mixed цвета пишет 64 B палитры без record/order churn; no-op стабилен", () => {
  const gpu = countedUpload()
  const f = fixture()
  const backend = new RendererWebGpuBackend({invalidateGeometry() {}})
  try {
    backend.applyFrame(f.renderer.flush())
    const draw = drawOf(backend)
    const instances = draw.layer.instances
    const palette = paletteOf(draw)
    gpu.upload(draw.geometry)
    const buffers = gpu.counters.created
    gpu.counters.writes.length = 0
    const before = {record: instances.recordAttribute.version, order: instances.orderAttribute.version, palette: palette.version, owner: instances.ownershipVersion}
    const handle = instances.handleAt(1)
    const records = instances.records.slice()
    const firstPalette = paletteSlot(draw, 0)
    f.nodes[1]!.setAttribute("style", `${box};${mixed};border-right-color:rgba(17,34,51,0.375)`)
    backend.applyFrame(f.renderer.flush())
    expect(drawOf(backend)).toBe(draw)
    expect(instances.handleAt(1)).toBe(handle)
    expect(instances.records).toEqual(records)
    expect(instances.recordAttribute.version).toBe(before.record)
    expect(instances.orderAttribute.version).toBe(before.order)
    expect(instances.ownershipVersion).toBe(before.owner)
    expect(palette.version).toBeGreaterThan(before.palette)
    expect(palette.fullUpdateRequired).toBe(false)
    expect(palette.updateRanges).toEqual([{offset: handle.slot * 16, count: 16}])
    expect(palette.updateRanges.reduce((bytes, range) => bytes + range.count * palette.array.BYTES_PER_ELEMENT, 0)).toBe(64)
    expect(paletteSlot(draw, 0)).toEqual(firstPalette)
    expect(paletteSlot(draw, 1).slice(4, 8)).toEqual([...new Float32Array([17 / 255, 34 / 255, 51 / 255, 0.375])])
    gpu.upload(draw.geometry)
    expect(gpu.counters.created).toBe(buffers)
    expect(gpu.counters.writes).toEqual([{offset: handle.slot * 64, bytes: 64}])
    gpu.counters.writes.length = 0
    const version = palette.version
    backend.applyFrame(f.renderer.flush())
    gpu.upload(draw.geometry)
    expect(gpu.counters.writes).toEqual([])
    expect(palette.version).toBe(version)
    expect(palette.updateRanges).toEqual([])
    expect(instances.recordAttribute.version).toBe(before.record)
    expect(instances.orderAttribute.version).toBe(before.order)
    f.nodes[1]!.setAttribute("style", `${box};border:4px solid #ff0000`)
    backend.applyFrame(f.renderer.flush())
    expect(instances.handleAt(1)).toBe(handle)
    expect(record(draw, 1)[ROUNDED_RECT_INSTANCE_OFFSETS.reserved]).toBe(0)
    expect([...record(draw, 1).slice(12, 16)]).toEqual([1, 0, 0, 1])
    expect(instances.orderAttribute.version).toBe(before.order)
    expect(palette.version).toBe(version)
    expect(backend.diagnostics.rectInstancedDraws).toBe(1)
  } finally {
    backend.dispose()
    f.renderer.dispose()
    gpu.restore()
  }
})

test("release/reuse и перестановка order не присваивают новой рамке палитру старого slot", () => {
  const f = fixture([mixed, mixed, mixed])
  const backend = new RendererWebGpuBackend({invalidateGeometry() {}})
  try {
    backend.applyFrame(f.renderer.flush())
    const draw = drawOf(backend)
    const instances = draw.layer.instances
    const released = instances.handleAt(0)
    const survivor = instances.handleAt(1)
    f.nodes[0]!.remove()
    backend.applyFrame(f.renderer.flush())
    expect(instances.has(released)).toBe(false)
    expect(instances.handleAt(0)).toBe(survivor)
    const replacement = f.append(`${mixed};border-top-color:#00ffff`)
    backend.applyFrame(f.renderer.flush())
    const reused = instances.handleAt(2)
    expect(reused.slot).toBe(released.slot)
    expect(reused.generation).not.toBe(released.generation)
    expect(paletteSlot(draw, 2).slice(0, 4)).toEqual([0, 1, 1, 1])
    expect(paletteSlot(draw, 0)).toEqual(rgba)
    f.root.insertBefore(replacement, f.root.firstChild)
    backend.applyFrame(f.renderer.flush())
    expect(instances.handleAt(0)).toBe(reused)
    expect(paletteSlot(draw, 0).slice(0, 4)).toEqual([0, 1, 1, 1])
    expect(instances.has(survivor)).toBe(true)
    expect(backend.diagnostics.rectInstancedDraws).toBe(1)
  } finally {
    backend.dispose()
    f.renderer.dispose()
  }
})

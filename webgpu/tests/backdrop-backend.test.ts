import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import {InstancedRoundedRect, Mesh, Object3D, RoundedRectMaterial} from "@zavx0z/immersive-engine"
import {createDocumentRenderer, type RectDisplayItem, type RenderFrame} from "@zavx0z/immersive-renderer-html"
import {readBackdrop, setBackdrop} from "../src/backdrop.ts"
import {RendererWebGpuBackend} from "../src/webgpu-backend.ts"

function fixture(count = 1, clipped = false) {
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", `position:relative;width:300px;height:100px;${clipped ? "overflow:hidden;border-radius:8px" : ""}`)
  document.append(root)
  for (let index = 0; index < count; index++) {
    const node = document.createElement("div")
    node.setAttribute("style", `position:absolute;left:${index * 30}px;width:20px;height:20px;background:white;border-radius:4px`)
    root.append(node)
  }
  const renderer = createDocumentRenderer({document, root, viewport: {width: 300, height: 100}})
  const {presentationTransforms: _transforms, ...initial} = renderer.flush()
  const rects = initial.displayList as readonly RectDisplayItem[]
  let revision = initial.revision
  const frame = (items: readonly RectDisplayItem[] = rects): RenderFrame => Object.freeze({
    ...initial, revision: ++revision, displayList: Object.freeze([...items]),
  })
  const backend = new RendererWebGpuBackend({invalidateGeometry() {}})
  return {rects, frame, backend, dispose() {backend.dispose(); renderer.dispose()}}
}

function mesh(backend: RendererWebGpuBackend, index = 0): Mesh {
  const object = backend.root.children[index]
  if (!(object instanceof Mesh) || !(object.material instanceof RoundedRectMaterial)) throw new Error("Expected scalar rounded rectangle")
  return object
}

test("backdrop metadata snapshots values, reuses equal values and clears its marker", () => {
  const object = new Object3D()
  const value = {sigma: 4, width: 20, height: 10}
  setBackdrop(object, value)
  const snapshot = readBackdrop(object)
  expect(Object.isFrozen(snapshot)).toBe(true)
  value.sigma = 8
  expect(snapshot).toEqual({sigma: 4, width: 20, height: 10})
  setBackdrop(object, {sigma: 4, width: 20, height: 10})
  expect(readBackdrop(object)).toBe(snapshot)
  setBackdrop(object, value)
  expect(readBackdrop(object)).toEqual(value)
  expect(readBackdrop(object)).not.toBe(snapshot)
  setBackdrop(object, undefined)
  expect(readBackdrop(object)).toBeUndefined()
})

test("retained backdrop keeps CSS dimensions, opacity, radii and transform while sigma changes", () => {
  const f = fixture()
  const original = f.rects[0]!
  const transform = Object.freeze({scaleX: 2, scaleY: 3, translateX: 8, translateY: 9})
  const backdrop = Object.freeze({...original, key: "backdrop", opacity: 0.4, transform, backdropBlur: 5})
  try {
    f.backend.applyFrame(f.frame([backdrop]))
    const object = mesh(f.backend)
    const snapshot = readBackdrop(object)
    expect(snapshot).toEqual({sigma: 5, width: 20, height: 20})
    expect((object.material as RoundedRectMaterial).opacity).toBe(0.4)
    expect((object.material as RoundedRectMaterial).radii).toEqual([4, 4, 4, 4])
    expect(object.scale.x).toBe(2)
    expect(object.scale.y).toBe(3)
    f.backend.applyFrame(f.frame([Object.freeze({...backdrop, x: backdrop.x + 1})]))
    expect(mesh(f.backend)).toBe(object)
    expect(readBackdrop(object)).toBe(snapshot)
    expect(f.backend.diagnostics.rectPlanReused).toBe(true)
    f.backend.applyFrame(f.frame([Object.freeze({...backdrop, backdropBlur: 7, width: 25})]))
    expect(mesh(f.backend)).toBe(object)
    expect(readBackdrop(object)).toEqual({sigma: 7, width: 25, height: 20})
    const {backdropBlur: _blur, ...ordinary} = backdrop
    f.backend.applyFrame(f.frame([Object.freeze(ordinary)]))
    expect(mesh(f.backend)).toBe(object)
    expect(readBackdrop(object)).toBeUndefined()
    f.backend.applyFrame(f.frame([backdrop]))
    f.backend.applyFrame(f.frame([]))
    expect(readBackdrop(object)).toBeUndefined()
    expect(object.parent).toBeNull()
    f.backend.applyFrame(f.frame([backdrop]))
    const last = mesh(f.backend)
    f.backend.dispose()
    expect(readBackdrop(last)).toBeUndefined()
  } finally {f.dispose()}
})

test("backdrop scalar barrier splits adjacent rectangle runs and updates instancing topology", () => {
  const f = fixture(5)
  const original = f.rects[2]!
  const middle = Object.freeze({...original, key: "backdrop"})
  const backdrop = Object.freeze({...middle, backdropBlur: 0})
  const items = [...f.rects]
  items[2] = middle
  try {
    f.backend.applyFrame(f.frame(items))
    expect(f.backend.root.children).toHaveLength(1)
    expect(f.backend.diagnostics.rectInstancedInstances).toBe(5)
    items[2] = backdrop
    f.backend.applyFrame(f.frame(items))
    expect(f.backend.diagnostics.rectPlanReused).toBe(false)
    expect(f.backend.diagnostics.rectInstancedInstances).toBe(4)
    expect(f.backend.root.children).toHaveLength(3)
    expect(f.backend.root.children[0]).toBeInstanceOf(InstancedRoundedRect)
    const object = mesh(f.backend, 1)
    expect(readBackdrop(object)).toEqual({sigma: 0, width: 20, height: 20})
    expect(f.backend.root.children[2]).toBeInstanceOf(InstancedRoundedRect)
    items[2] = middle
    f.backend.applyFrame(f.frame(items))
    expect(f.backend.diagnostics.rectPlanReused).toBe(false)
    expect(f.backend.diagnostics.rectInstancedInstances).toBe(5)
    expect(f.backend.root.children).toHaveLength(1)
    expect(readBackdrop(object)).toBeUndefined()
  } finally {f.dispose()}
})

test("backdrop retains the ordinary presentation clip chain when only sigma changes", () => {
  const f = fixture(1, true)
  const item = Object.freeze({...f.rects[0]!, key: "backdrop", backdropBlur: 3})
  try {
    f.backend.applyFrame(f.frame([item]))
    const object = mesh(f.backend)
    expect(object.presentationClips).toHaveLength(1)
    const clip = object.presentationClips[0]
    expect(clip?.halfSize).toEqual([150, 50])
    f.backend.applyFrame(f.frame([Object.freeze({...item, backdropBlur: 5})]))
    expect(mesh(f.backend)).toBe(object)
    expect(f.backend.diagnostics.rectPlanReused).toBe(true)
    expect(object.presentationClips[0]).toBe(clip)
    expect(readBackdrop(object)?.sigma).toBe(5)
  } finally {f.dispose()}
})

test("frozen backdrop accessors remain live and cannot reuse prepared paint", () => {
  const f = fixture()
  let sigma = 3
  const item = Object.freeze({...f.rects[0]!, key: "backdrop", get backdropBlur() {return sigma}})
  try {
    f.backend.applyFrame(f.frame([item]))
    const object = mesh(f.backend)
    sigma = 6
    f.backend.applyFrame(f.frame([item]))
    expect(mesh(f.backend)).toBe(object)
    expect(readBackdrop(object)?.sigma).toBe(6)
    sigma = Number.NaN
    expect(() => f.backend.applyFrame(f.frame([item]))).toThrow("backdropBlur")
    expect(readBackdrop(object)?.sigma).toBe(6)
  } finally {f.dispose()}
})

for (const sigma of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
  test(`invalid backdrop sigma ${sigma} rejects before retained mesh mutation`, () => {
    const f = fixture()
    const source = Object.freeze({...f.rects[0]!, key: "backdrop", backdropBlur: 2})
    try {
      f.backend.applyFrame(f.frame([source]))
      const object = mesh(f.backend)
      expect(() => f.backend.applyFrame(f.frame([Object.freeze({...source, backdropBlur: sigma})]))).toThrow("backdropBlur")
      expect(readBackdrop(object)?.sigma).toBe(2)
      expect(() => setBackdrop(object, {sigma, width: 20, height: 20})).toThrow("sigma")
    } finally {f.dispose()}
  })
}

test("backdrop rejects an analytical shadow and retains the previous scalar mesh", () => {
  const f = fixture()
  const source = Object.freeze({...f.rects[0]!, key: "backdrop", backdropBlur: 2})
  try {
    f.backend.applyFrame(f.frame([source]))
    const object = mesh(f.backend)
    expect(() => f.backend.applyFrame(f.frame([Object.freeze({...source, shadow: Object.freeze({blurRadius: 2, spreadRadius: 0})})]))).toThrow("cannot carry a shadow")
    expect(readBackdrop(object)?.sigma).toBe(2)
  } finally {f.dispose()}
})

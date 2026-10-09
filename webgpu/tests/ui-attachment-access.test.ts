import {expect, test} from "bun:test"
import {
  BufferGeometry, Color, ColorPickerMaterial, ImageMaterial, InstancedMesh, InstancedRoundedRect, InstancedStrokedPath,
  LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, RadialBackdropMaterial,
  RoundedRectInstanceLayer, RoundedRectMaterial, StrokedPathInstanceLayer, Text, TextMaterial, TrueTypeFont,
} from "@zavx0z/immersive-engine"
import {uiAttachmentAccess} from "../src/renderer/ui-attachment-access.ts"
import {classifyRenderItems, collectSpaceObjects, type RenderItem} from "../src/renderer/utils/render-list.ts"
import {setBackdrop} from "../src/backdrop.ts"

const font = new TrueTypeFont(await Bun.file(new URL("../../engine/static/font/inter-regular.ttf", import.meta.url)).arrayBuffer())
const draw = (type: RenderItem["type"], object: RenderItem["object"]): RenderItem => ({type, object, worldMatrix: object.matrixWorld})
const mesh = (material: Mesh["material"]) => {
  const object = new Mesh(new BufferGeometry(), material)
  object.renderLayer = "ui"
  return draw("static-mesh", object)
}
const text = (depthWrite = false) => {
  const object = new Text("UI", font, 12, new TextMaterial({depthWrite}))
  object.renderLayer = "ui"
  return object
}
const readOnly = {depthReadOnly: true, stencilReadOnly: true}

test("empty and known scalar UI pipelines keep both attachments read-only", () => {
  const materials = [new MeshBasicMaterial(), new RoundedRectMaterial({width: 20, height: 10, radius: 0}),
    new ImageMaterial({src: "fixture://image"}),
    new ColorPickerMaterial({width: 20, height: 10, mode: "alpha", hue: 0, saturation: 0, value: 1, alpha: 1,
      checkerPrimary: new Color(0xffffff), checkerSecondary: new Color(0x000000), checkerSize: 4}),
    new RadialBackdropMaterial({width: 20, height: 10, base: 0x000000,
      glowA: {color: 0xffffff, cx: .5, cy: .5, radius: 1}, glowB: {color: 0xffffff, cx: .5, cy: .5, radius: 1}})]
  expect(uiAttachmentAccess([])).toEqual(readOnly)
  const items = materials.map(material => mesh(material))
  for (const item of items) expect(uiAttachmentAccess([item])).toEqual(readOnly)
  expect(uiAttachmentAccess(Object.freeze(items))).toEqual(readOnly)
  expect(items.map(item => (item.object as Mesh).material)).toEqual(materials)
})

test("material arrays follow the first material selected by the UI mesh renderer", () => {
  const known = new MeshBasicMaterial(), unknown = new MeshLambertMaterial()
  expect(uiAttachmentAccess([mesh([known, unknown])])).toEqual(readOnly)
  expect(uiAttachmentAccess([mesh([unknown, known])])).toEqual({depthReadOnly: false, stencilReadOnly: true})
  expect(uiAttachmentAccess([mesh([])])).toEqual({depthReadOnly: false, stencilReadOnly: true})
})

test("retained instanced UI rectangle and path pipelines never write depth or stencil", () => {
  const rectangle = new InstancedRoundedRect(new RoundedRectInstanceLayer({maxCapacity: 1}))
  const path = new InstancedStrokedPath(new StrokedPathInstanceLayer({maxStyleCapacity: 1, maxSegmentCapacity: 1}))
  expect(uiAttachmentAccess([draw("instanced-rounded-rect", rectangle)])).toEqual(readOnly)
  expect(uiAttachmentAccess([draw("instanced-stroked-path", path)])).toEqual(readOnly)
  expect(uiAttachmentAccess([draw("instanced-rounded-rect", rectangle), draw("instanced-stroked-path", path)])).toEqual(readOnly)
})

test("text stencil and ordinary cover require writable stencil while depth remains read-only", () => {
  const object = text()
  try {
    const expected = {depthReadOnly: true, stencilReadOnly: false}
    expect(uiAttachmentAccess([draw("text-stencil", object)])).toEqual(expected)
    expect(uiAttachmentAccess([draw("text-cover", object)])).toEqual(expected)
    expect(uiAttachmentAccess([mesh(new MeshBasicMaterial()), draw("text-stencil", object), draw("text-cover", object)])).toEqual(expected)
  } finally {object.dispose()}
})

test("text depthWrite affects cover only and is resampled when the retained material changes", () => {
  const object = text(true)
  try {
    const stencil = draw("text-stencil", object), cover = draw("text-cover", object)
    expect(uiAttachmentAccess([stencil])).toEqual({depthReadOnly: true, stencilReadOnly: false})
    expect(uiAttachmentAccess([cover])).toEqual({depthReadOnly: false, stencilReadOnly: false})
    expect(uiAttachmentAccess([stencil, cover])).toEqual({depthReadOnly: false, stencilReadOnly: false})
    object.material.depthWrite = false
    expect(uiAttachmentAccess([stencil, cover])).toEqual({depthReadOnly: true, stencilReadOnly: false})
  } finally {object.dispose()}
})

test("unknown scalar, generic instanced and line draws conservatively retain writable depth", () => {
  const material = new MeshLambertMaterial()
  const instances = new InstancedMesh(new BufferGeometry(), new MeshBasicMaterial(), 0)
  const line = new LineSegments(new BufferGeometry(), new LineBasicMaterial())
  for (const item of [mesh(material), draw("instanced-mesh", instances), draw("line", line)]) {
    expect(uiAttachmentAccess([item])).toEqual({depthReadOnly: false, stencilReadOnly: true})
  }
  const object = text()
  try {
    expect(uiAttachmentAccess([mesh(material), draw("text-stencil", object), draw("text-cover", object)]))
      .toEqual({depthReadOnly: false, stencilReadOnly: false})
  } finally {object.dispose()}
})

test("collection and classification keep every text stencil/cover pair adjacent across backdrop boundaries", () => {
  const root = new Object3D()
  root.renderLayer = "ui"
  const before = text(), after = text(true), hidden = text()
  const backdrop = mesh(new RoundedRectMaterial({width: 20, height: 10, radius: 0})).object as Mesh
  setBackdrop(backdrop, {sigma: 4, width: 20, height: 10})
  // Даже дочерний backdrop посещается после полной пары родительского Text.
  before.add(backdrop)
  backdrop.add(after)
  hidden.visible = false
  root.add(before)
  root.add(hidden)
  try {
    const collected: RenderItem[] = []
    collectSpaceObjects(root, collected, [])
    const {uiObjects} = classifyRenderItems(collected)
    expect(uiObjects.map(item => item.type)).toEqual(["text-stencil", "text-cover", "static-mesh", "text-stencil", "text-cover"])
    expect(uiObjects.slice(0, 2).every(item => item.object === before)).toBe(true)
    expect(uiObjects.slice(3).every(item => item.object === after)).toBe(true)
    expect(uiAttachmentAccess(uiObjects.slice(0, 2))).toEqual({depthReadOnly: true, stencilReadOnly: false})
    expect(uiAttachmentAccess(uiObjects.slice(2))).toEqual({depthReadOnly: false, stencilReadOnly: false})
    expect(collected.some(item => item.object === hidden)).toBe(false)
  } finally {
    before.dispose()
    after.dispose()
    hidden.dispose()
  }
})

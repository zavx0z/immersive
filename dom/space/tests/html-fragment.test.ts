import {expect, test} from "bun:test"
import {createDocument, HTMLElement, Text} from "../../src/index.ts"

test("многострочный body.innerHTML сохраняет whitespace Nodes единого реального spatial DOM", async () => {
  const {createSpaceElementFactories, readSpaceTree} = await import("../../../space/src/index.ts")
  const {SpaceElement} = await import("../index.ts")
  const {ViewPointElement} = await import("../../viewpoint/index.ts")
  const {DisplayElement} = await import("../../display/index.ts")
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const body = document.createElement("body")
  document.append(body)
  const source = `<space>
  <viewpoint></viewpoint>
  <display width="254" height="254"><p>Содержимое</p></display>
</space>`
  body.innerHTML = source
  const tree = readSpaceTree(document)
  expect(tree.space).toBeInstanceOf(SpaceElement)
  expect(tree.viewPoint).toBeInstanceOf(ViewPointElement)
  expect(tree.displays[0]).toBeInstanceOf(DisplayElement)
  expect(tree.space.ownerDocument).toBe(document)
  expect(tree.viewPoint.ownerDocument).toBe(document)
  expect(tree.displays[0]!.ownerDocument).toBe(document)
  expect(tree.space.childNodes.map(node => node.nodeType)).toEqual([3, 1, 3, 1, 3])
  const whitespace = tree.space.firstChild! as Text
  expect(whitespace).toBeInstanceOf(Text)
  expect(whitespace.data).toBe("\n  ")
  expect(tree.objects).toEqual([])
  expect(tree.displays[0]!.textContent).toBe("Содержимое")
  expect(body.innerHTML).toBe(source)
  const previous = whitespace.data
  expect(() => { whitespace.data = "Значимый текст" }).toThrow("only whitespace")
  expect(whitespace.data).toBe(previous)
  expect(() => tree.space.append(document.createTextNode("\u00a0"))).toThrow("only spatial")
  document.customElementRegistry.define("spatial-fragment", class extends HTMLElement {})
  const host = document.createElement("spatial-fragment")
  tree.space.append(host)
  host.innerHTML = "\n  <!--граница-->\n"
  const nested = host.firstChild! as Text
  expect(nested.data).toBe("\n  ")
  expect(() => nested.appendData("Значимый текст")).toThrow("only whitespace")
  expect(nested.data).toBe("\n  ")
  expect(readSpaceTree(document).space).toBe(tree.space)
})

test("многострочные XRGroup/XRMesh сохраняют whitespace и точные владельцы Geometry/Material", async () => {
  const {createSpaceElementFactories, readSpaceTree, XRGroupElement, XRMeshElement, XRGeometryElement, XRMaterialElement} = await import("../../../space/src/index.ts")
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const body = document.createElement("body")
  document.append(body)
  body.innerHTML = `<space>
  <viewpoint></viewpoint>
  <xr-group>
    <xr-mesh>
      <xr-geometry kind="box"></xr-geometry>
      <xr-material kind="basic"></xr-material>
    </xr-mesh>
  </xr-group>
</space>`
  const tree = readSpaceTree(document)
  const [group, mesh] = tree.objects
  expect(group).toBeInstanceOf(XRGroupElement)
  expect(mesh).toBeInstanceOf(XRMeshElement)
  if (!(mesh instanceof XRMeshElement) || !(group instanceof XRGroupElement)) throw new Error("Ожидались точные spatial classes")
  expect(mesh.geometry).toBeInstanceOf(XRGeometryElement)
  expect(mesh.material).toBeInstanceOf(XRMaterialElement)
  expect(mesh.parentNode).toBe(group)
  expect(mesh.geometry!.parentNode).toBe(mesh)
  expect(mesh.material!.parentNode).toBe(mesh)
  expect(mesh.childNodes.map(node => node.nodeType)).toEqual([3, 1, 3, 1, 3])
  const whitespace = mesh.firstChild! as Text
  expect(whitespace.data).toBe("\n      ")
  expect(() => { whitespace.data = "Значимое" }).toThrow("only whitespace")
  expect(whitespace.data).toBe("\n      ")
  expect(() => group.append(document.createTextNode("текст"))).toThrow("only spatial")
  expect(() => mesh.append(document.createTextNode("\u00a0"))).toThrow("only spatial")
  expect(tree.objects).toEqual([group, mesh])
  expect(body.innerHTML).toContain("\n      <xr-geometry")
})

test("CustomElementRegistry не обещает constructor вместо native XR factory", async () => {
  const {createSpaceElementFactories, XRMeshElement} = await import("../../../space/src/index.ts")
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  class CustomMesh extends HTMLElement {}
  expect(() => document.customElementRegistry.define("xr-mesh", CustomMesh)).toThrow("native factory")
  expect(document.customElementRegistry.get("xr-mesh")).toBeUndefined()
  expect(document.createElement("xr-mesh")).toBeInstanceOf(XRMeshElement)
  document.customElementRegistry.define("x-button", class extends HTMLElement {})
  expect(document.createElement("x-button")).toBeInstanceOf(document.customElementRegistry.get("x-button")!)
})

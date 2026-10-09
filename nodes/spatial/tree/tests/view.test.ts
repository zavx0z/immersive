import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createSpaceElementFactories, type XRMeshElement, type XRMaterialElement} from "@zavx0z/immersive-space"
import {readElementStyle} from "../../../../renderer/html/src/index.ts"
import {GlassMaterial} from "@zavx0z/immersive-engine"
import {createDocument} from "@zavx0z/immersive-dom"
import {component, createRoot} from "@zavx0z/immersive-component"
import {defineCompiledTemplate, type CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import {createSpatialTreeScene} from "../src/scene.ts"
import {createSpatialTreeState} from "../src/controller.ts"
import type {SpatialTreeSnapshot} from "../contract/controller.ts"

const repo = resolve(import.meta.dir, "../../../..")
Bun.plugin(createJsxBunPlugin({cwd: repo, persistent: true, sourceRoots: [resolve(repo, "nodes"), resolve(repo, "space"), resolve(repo, "ui")]}))
const {SpatialTree} = await import("../src/view.tsx")
const content = defineCompiledTemplate({
  displayName: "EntityContent",
  bindingCount: 0,
  mount(document) {
    const button = document.createElement("button")
    button.textContent = "Содержимое"
    return {nodes: [button], bindings: []}
  },
  render() {},
})

test("объёмное дерево создаёт независимые Display в одном Space и сохраняет содержимое при выборе", () => {
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const space = document.createElement("space")
  document.append(space)
  const root = createRoot(space)
  const source = createSpatialTreeState()
  const scene = createSpatialTreeScene([{id: "p", label: "Родитель"}, {id: "c", parentId: "p", label: "Ребёнок"}], {width: 1000, height: 600})
  const hosts = new Map()
  const snapshot: SpatialTreeSnapshot = {
    nodes: scene.nodes, volumes: scene.volumes, geometryRevision: 1,
    visibleVolumeIds: new Set(scene.volumes.map(v => v.id)), disabledHitIds: new Set(),
    selectedId: "p", selectedVolumeId: scene.bodyIdByNode.get("p")!, floor: scene.floor,
    contentById: new Map([["p", component(content, {}, "p")]]),
    onHost: (id, host) => { if (host) hosts.set(id, host); else hosts.delete(id) },
    onActivate() {}, onVolumeActivate() {},
  }
  source.publish(snapshot)
  try {
    root.render(SpatialTree as unknown as CompiledTemplate<{source: typeof source}>, {source})
    expect(space.querySelectorAll("display")).toHaveLength(2)
    expect(space.querySelectorAll("space")).toHaveLength(0)
    expect(space.querySelectorAll("viewpoint")).toHaveLength(0)
    expect(hosts.size).toBe(2)
    const button = space.querySelector("button")!
    expect(button.textContent).toBe("Содержимое")
    expect(button.closest("display")).toBe(hosts.get("p"))
    source.publish({...snapshot, selectedId: "c"})
    root.render(SpatialTree as unknown as CompiledTemplate<{source: typeof source}>, {source})
    expect(space.querySelector("button")).toBe(button)
    expect(space.querySelector('[data-frame-id="c"]')?.getAttribute("aria-selected")).toBe("true")
  } finally { root.unmount() }
  expect(hosts.size).toBe(0)
})

test("Tree кеширует role streams и XYZ при subset; inherited CSS сохраняет geometry", () => {
  const document = createDocument({elementFactories: createSpaceElementFactories()})
  const space = document.createElement("space")
  document.append(space)
  const root = createRoot(space)
  const source = createSpatialTreeState()
  const scene = createSpatialTreeScene([{id: "p", label: "P"}, {id: "a", parentId: "p", label: "A"}, {id: "b", parentId: "p", label: "B"}], {width: 960, height: 540})
  const snapshot: SpatialTreeSnapshot = {nodes: [], volumes: scene.volumes, bodyVolumes: scene.bodyVolumes, branchVolumes: scene.branchVolumes,
    geometryRevision: 1, visibleVolumeIds: new Set(scene.volumes.map(volume => volume.id)), disabledHitIds: new Set(),
    selectedId: null, selectedVolumeId: null, floor: scene.floor, contentById: new Map(), onHost() {}, onActivate() {}, onVolumeActivate() {}}
  source.publish(snapshot)
  try {
    root.render(SpatialTree as unknown as CompiledTemplate<{source: typeof source}>, {source})
    const bodies = space.querySelector('[name="spatial-tree-bodies"]')!
    const branches = space.querySelector('[name="spatial-tree-branches"]')!
    const bodyMesh = bodies.querySelector("xr-mesh") as XRMeshElement
    const bodySurface = bodyMesh.material!
    const branchSurface = branches.querySelector("xr-mesh xr-material") as XRMaterialElement
    const bodyOutline = bodies.querySelector("xr-line-segments xr-material") as XRMaterialElement
    const branchOutline = branches.querySelector("xr-line-segments xr-material") as XRMaterialElement
    expect(project(bodySurface)).toBeInstanceOf(GlassMaterial)
    expect((project(bodySurface) as GlassMaterial).tintColor.a).toBe(.10)
    expect((project(branchSurface) as GlassMaterial).tintColor.a).toBe(.025)
    expect(project(bodyOutline)).toHaveProperty("opacity", .40)
    expect(project(branchOutline)).toHaveProperty("opacity", .10)
    Object.defineProperty(scene.bodyVolumes, "map", {value() {throw new Error("Полный role stream не сканируется при ViewPoint/subset обновлении")}})
    Object.defineProperty(scene.bodyVolumes[0]!, "from", {get() {throw new Error("Готовые XYZ торцы не читаются при subset обновлении")}})
    source.publish({...snapshot, visibleVolumeIds: new Set([scene.bodyIdByNode.get("p")!, scene.branchVolumes[0]!.id])})
    root.render(SpatialTree as unknown as CompiledTemplate<{source: typeof source}>, {source})
    expect(bodies.querySelector("xr-mesh")).toBe(bodyMesh)
    const heldGeometry = bodyMesh.geometry!.factory
    space.setAttribute("style", "--spatial-volume-opacity: .27; --spatial-volume-outline-opacity: .32")
    expect((project(bodySurface) as GlassMaterial).tintColor.a).toBe(.27)
    expect(project(bodyOutline)).toHaveProperty("opacity", .32)
    expect(bodyMesh.geometry!.factory).toBe(heldGeometry)
  } finally {root.unmount()}
  function project(element: XRMaterialElement) {
    const style = readElementStyle(document, element, ["--spatial-volume-appearance"])
    return element.factory!(element, {color: {r: 1, g: 1, b: 1, a: 1}, opacity: style.opacity, customProperties: style.customProperties})
  }
})

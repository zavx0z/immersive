import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createDocument, MouseEvent} from "@zavx0z/immersive-dom"
import {createRoot} from "@zavx0z/immersive-component"
import {createDocumentRenderer, readDisplayStyle} from "@zavx0z/immersive-renderer-html"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {SpatialGraphProps} from "../contract/input.ts"

const repo = resolve(import.meta.dir, "../../..")
Bun.plugin(createJsxBunPlugin({cwd: repo, persistent: true, sourceRoots: [resolve(repo, "nodes")]}))
const {SpatialGraph, spatialContentBounds, spatialGraphBounds} = await import("../index.ts")

function fixture() {
  const document = createDocument()
  const space = document.createElement("space")
  document.append(space)
  const root = createRoot(space)
  const selections: string[] = []
  const props: SpatialGraphProps = {
    bounds: {x: 0, y: 0, width: 480, height: 352},
    nodes: [
      {id: "parent", title: "Родитель", rect: {x: 0, y: 0, width: 480, height: 96}},
      {id: "child", title: "Часть", rect: {x: 0, y: 256, width: 480, height: 96}},
    ],
    links: [{id: "parent-child", title: "Принадлежит", route: {kind: "orthogonal", points: [{x: 40, y: 96}, {x: 40, y: 256}]}}],
    onSelect(id) { selections.push(id) },
  }
  const render = (next: SpatialGraphProps = props) => root.render(SpatialGraph as unknown as CompiledTemplate<SpatialGraphProps>, next)
  render()
  return {document, space, root, props, selections, render}
}

test("Пространственный граф держит связи и подписи независимо от прикладных Display", () => {
  const h = fixture()
  try {
    const displays = h.space.querySelectorAll("display")
    expect(displays, "Граф создаёт только поверхность диаграммы; Display приложения принадлежат приложению").toHaveLength(1)
    expect(Array.from(displays).every(display => display.parentElement === h.space), "Все Display — непосредственные соседи в существующем Space").toBe(true)
    expect(h.space.querySelectorAll("space"), "Просмотр не создаёт новое пространство").toHaveLength(0)
    expect(h.space.querySelectorAll("[data-spatial-node-id]"), "Подписи всего графа существуют до загрузки UI").toHaveLength(2)
    expect(h.space.querySelectorAll("[data-link-id]"), "Настоящая связь не зависит от residency").toHaveLength(1)
    const graph = h.space.querySelector('display[data-spatial-graph="true"]')!
    const renderer = createDocumentRenderer({document: h.document, root: graph, viewport: {width: 480, height: 352}})
    try {
      const frame = renderer.flush()
      expect(frame.displayList.some(item => item.kind === "path"), "Связь рисуется production Link").toBe(true)
      expect(frame.displayList.some(item => item.kind === "text" && item.text.includes("Родитель")), "Подпись входит в настоящую отрисовку").toBe(true)
    } finally { renderer.dispose() }
  } finally { h.root.unmount() }
})

test("Физическая поверхность, footprint графа и CSS viewport независимы", () => {
  const h = fixture()
  try {
    const graph = h.space.querySelector('display[data-spatial-graph="true"]')!
    const style = readDisplayStyle(h.document, graph as Parameters<typeof readDisplayStyle>[1])
    expect(style.viewport).toEqual({width: 480, height: 352})
    expect(Number(graph.getAttribute("width"))).toBe(120)
    expect(Number(graph.getAttribute("height"))).toBe(88)
    const geometry = spatialContentBounds(h.props.nodes[1]!.rect)
    expect(geometry).toEqual({x: 10, y: -.2, z: -76, width: 20, height: 12.5})
    expect(spatialGraphBounds(h.props.bounds)).toEqual({x: 60, y: 0, z: -44, width: 120, height: 88})
  } finally { h.root.unmount() }
})

test("Длинная подпись ограничена footprint, сохраняя полное доступное имя", () => {
  const h = fixture()
  const title = "Полное длинное название предмета не изменяет размеры графа и остаётся доступным"
  try {
    h.render({...h.props, nodes: h.props.nodes.map(node => node.id === "parent" ? {...node, title} : node)})
    const label = h.space.querySelector('[data-spatial-node-id="parent"]')!
    expect(label.getAttribute("aria-label"), "Доступное имя не сокращается").toBe(title)
    expect(label.getAttribute("title"), "Tooltip сохраняет полное имя").toBe(title)
    const graph = h.space.querySelector('display[data-spatial-graph="true"]')!
    const renderer = createDocumentRenderer({document: h.document, root: graph, viewport: {width: 480, height: 352}})
    try {
      const frame = renderer.flush()
      const box = frame.boxByNode.get(label)!
      expect(box.width, "Ширина подписи остаётся внутри footprint за маленьким Display").toBe(380)
      expect(frame.displayList.some(item => item.kind === "text" && item.node.parentElement === label && item.text.includes("…")), "Renderer сокращает длинный текст штатным CSS ellipsis").toBe(true)
    } finally { renderer.dispose() }
  } finally { h.root.unmount() }
})

test("Смена выбранной ноды сохраняет подписи и связи", () => {
  const h = fixture()
  try {
    const label = h.space.querySelector('[data-spatial-node-id="parent"]')!
    const link = h.space.querySelector('[data-link-id="parent-child"]')!
    h.render({...h.props, selectedId: "child"})
    expect(h.space.querySelector('[data-spatial-node-id="parent"]')).toBe(label)
    expect(h.space.querySelector('[data-link-id="parent-child"]')).toBe(link)
    label.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    expect(h.selections).toEqual(["parent"])
  } finally { h.root.unmount() }
})

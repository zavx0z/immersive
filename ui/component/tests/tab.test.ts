import {describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot} from "@zavx0z/immersive-component"
import {createDocument} from "@zavx0z/immersive-dom"
import {flushDocumentLayoutObservers} from "@zavx0z/immersive-dom/geometry"
import {createDocumentInteractionController, createDocumentRenderer, hitTestProjection} from "@zavx0z/immersive-renderer-html"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {Zavx0zImmersiveUiComponentSurfaceTab} from "@zavx0z/immersive-ui-component-surface-tab"
type TabProps = Zavx0zImmersiveUiComponentSurfaceTab.Input

const workspace = resolve(import.meta.dir, "../../..")
Bun.plugin(createJsxBunPlugin({cwd: workspace, persistent: true, sourceRoots: [resolve(workspace, "ui")]}))
const {default: Tab} = await import("@zavx0z/immersive-ui-component-surface-tab")
const {TabChildrenFixture, TabVerticalLabelFixture} = await import("./tab.fixture.tsx")
const theme = await Bun.file(resolve(workspace, "ui/component/theme/theme.css")).text()

/** Одинаковый компонент и локальный ввод в двух проекциях одного API, с отличающейся экранной геометрией. */
function mount(projection: "hud" | "display") {
  const document = createDocument()
  const owner = document.createElement(projection)
  if (projection === "display") {
    owner.setAttribute("width", "160")
    owner.setAttribute("height", "90")
  }
  owner.setAttribute("style", "position:relative;display:block;width:640px;height:360px")
  document.append(owner)
  const changes: Array<{edge: string; offset: number; phase: string}> = []
  const props: TabProps = {label: "Tab", length: 96, thickness: 28, onPositionChange(position, phase) { changes.push({...position, phase}) }}
  const component = createRoot(owner)
  const render = (patch: Partial<TabProps> = {}) => component.render(Tab as unknown as CompiledTemplate<TabProps>, {...props, ...patch})
  render()
  const renderer = createDocumentRenderer({document, root: owner, viewport: {width: 640, height: 360}, styleSheets: [theme],
    ...(projection === "display" ? {projectClientPoint: (point: {x: number; y: number}) => ({x: point.x * .5 + 40, y: point.y * .5 + 20})} : {}),
  })
  const interaction = createDocumentInteractionController({document, hitTest: hitTestProjection})
  const flush = () => {
    for (let round = 0; round < 5; round++) {
      component.flush()
      renderer.flush()
      if (!flushDocumentLayoutObservers(document)) {
        component.flush()
        return renderer.flush()
      }
    }
    throw new Error("Tab layout did not settle")
  }
  flush()
  const button = owner.querySelector("[data-tab]")!
  const point = () => {
    const box = flush().boxByNode.get(button)!
    return {clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, pointerId: 7, button: 0, buttons: 1}
  }
  return {document, owner, button, changes, component, render, renderer, interaction, flush, point,
    dispose() {
      interaction.dispose()
      component.unmount()
      renderer.dispose()
    },
  }
}

describe.each(["hud", "display"] as const)("Tab в %s", projection => {
  /** @remarks Требует css.properties.writing-mode и css.properties.text-orientation в Renderer. */
  test("боковая подпись идёт вдоль вертикального края", () => {
    const f = mount(projection)
    try {
      f.component.render(TabVerticalLabelFixture as unknown as CompiledTemplate<Record<string, never>>, {})
      const caption = f.owner.querySelector("[data-tab] span")!
      const box = f.flush().boxByNode.get(caption)!
      expect(box.height, "Вертикальная строка должна быть выше своей ширины").toBeGreaterThan(box.width)
    } finally { f.dispose() }
  })

  test("подпись определяет размер Tab без фиксированных габаритов", () => {
    const f = mount(projection)
    try {
      f.render({label: "Коротко", length: undefined, thickness: undefined})
      const label = f.button.querySelector("span")!
      let boxes = f.flush().boxByNode
      const firstHeight = boxes.get(f.button)!.height
      const firstWidth = boxes.get(f.button)!.width
      expect(firstWidth, "Справа у Tab остаётся только левая рамка толщиной 1 px").toBeCloseTo(boxes.get(label)!.width + 1)
      expect(boxes.get(f.button)!.height).toBeCloseTo(boxes.get(label)!.height + 14)
      f.render({label: "Более длинная подпись", length: undefined, thickness: undefined})
      boxes = f.flush().boxByNode
      expect(boxes.get(f.button)!.height).toBeGreaterThan(firstHeight)
      expect(boxes.get(f.button)!.x + boxes.get(f.button)!.width).toBe(640)
      expect(f.owner.querySelector("[data-tab]")).toBe(f.button)
    } finally { f.dispose() }
  })

  test("children сохраняет клик кнопки и позволяет перетаскивание за кнопку", () => {
    const f = mount(projection)
    try {
      f.component.render(TabChildrenFixture as unknown as CompiledTemplate<Pick<TabProps, "position">>, {position: {edge: "top", offset: .5}})
      f.flush()
      const tab = f.owner.querySelector("[data-tab]")!
      const child = tab.querySelector("button")!
      const body = tab.querySelector("div")!
      const boxes = f.flush().boxByNode
      expect(boxes.get(tab)!.width).toBeCloseTo(boxes.get(body)!.width + 2)
      expect(boxes.get(tab)!.height, "Сверху у Tab остаётся только нижняя рамка толщиной 1 px").toBeCloseTo(boxes.get(body)!.height + 1)
      expect(boxes.get(child)!.padding).toEqual({top: 2, bottom: 2, left: 6, right: 6})
      const point = (node: typeof child) => {
        const box = f.flush().boxByNode.get(node)!
        return {clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, pointerId: 11, button: 0, buttons: 1}
      }
      const click = point(child)
      f.interaction.pointerDown(f.flush(), click)
      expect(tab.hasPointerCapture(11)).toBe(false)
      f.interaction.pointerUp(f.flush(), {...click, buttons: 0})
      f.flush()
      expect(child.textContent).toBe("Нажатий: 1")
      const start = point(child)
      f.interaction.pointerDown(f.flush(), start)
      expect(tab.hasPointerCapture(11)).toBe(false)
      f.interaction.pointerMove(f.flush(), {...start, clientX: start.clientX - 300, clientY: start.clientY + 130})
      expect(tab.hasPointerCapture(11)).toBe(true)
      f.interaction.pointerUp(f.flush(), {...start, clientX: start.clientX - 400, clientY: start.clientY + 160, buttons: 0})
      f.flush()
      expect(tab.getAttribute("data-edge")).toBe("left")
      expect(f.flush().boxByNode.get(child)!.padding).toEqual({top: 6, bottom: 6, left: 2, right: 2})
      expect(tab.querySelector("button")).toBe(child)
      expect(child.textContent).toBe("Нажатий: 1")
    } finally { f.dispose() }
  })

  test("новая позиция прекращает активный drag без замены элемента", () => {
    const f = mount(projection)
    try {
      const start = f.point()
      f.interaction.pointerDown(f.flush(), start)
      expect(f.button.hasPointerCapture(7)).toBe(true)
      f.render({position: {edge: "bottom", offset: .5}})
      expect(f.flush().boxByNode.get(f.button)).toMatchObject({x: 272, y: 332})
      expect(f.button.hasPointerCapture(7)).toBe(false)
      f.interaction.pointerUp(f.flush(), {...start, buttons: 0})
      expect(f.flush().boxByNode.get(f.button)).toMatchObject({x: 272, y: 332})
      expect(f.changes).toHaveLength(0)
      expect(f.owner.querySelector("[data-tab]")).toBe(f.button)
    } finally { f.dispose() }
  })

  test("смена сценария переставляет тот же Tab, неизменные props сохраняют drag", () => {
    const f = mount(projection)
    try {
      for (const edge of ["left", "top", "bottom", "right"] as const) {
        f.render({position: {edge, offset: .25}})
        const box = f.flush().boxByNode.get(f.button)!
        expect(f.owner.querySelector("[data-tab]")).toBe(f.button)
        expect(f.button.getAttribute("data-edge")).toBe(edge)
        const text = f.flush().displayList.find(item => item.kind === "text" && item.text === "Tab")
        if (text?.kind !== "text") throw new Error("Нет текста Tab в кадре")
        expect(text.orientation).toBe(edge === "left" ? "sideways-rl" : edge === "right" ? "sideways-lr" : undefined)
        if (edge === "left") expect(box).toMatchObject({x: 0, y: 66})
        if (edge === "right") expect(box).toMatchObject({x: 612, y: 66})
        if (edge === "top") expect(box).toMatchObject({x: 136, y: 0})
        if (edge === "bottom") expect(box).toMatchObject({x: 136, y: 332})
      }
      expect(f.changes).toHaveLength(0)
      const start = f.point()
      f.interaction.pointerDown(f.flush(), start)
      f.interaction.pointerUp(f.flush(), {...start, clientX: 300, clientY: 12, buttons: 0})
      const moved = f.flush().boxByNode.get(f.button)!
      f.render({position: {edge: "right", offset: .25}, label: "Другой текст"})
      expect(f.flush().boxByNode.get(f.button)).toMatchObject({x: moved.x, y: moved.y})
      expect(f.button.getAttribute("data-edge")).toBe("top")
    } finally { f.dispose() }
  })

  test("перетаскивается с capture вдоль края и меняет сторону", () => {
    const f = mount(projection)
    try {
      expect(f.flush().boxByNode.get(f.button)).toMatchObject({x: 612, y: 132, width: 28, height: 96})
      const start = f.point()
      f.interaction.pointerDown(f.flush(), start)
      expect(f.button.hasPointerCapture(7)).toBe(true)
      f.interaction.pointerMove(f.flush(), {...start, clientY: 260})
      expect(f.flush().boxByNode.get(f.button)).toMatchObject({x: 612, y: 212})
      f.interaction.pointerUp(f.flush(), {...start, clientX: 300, clientY: 12, buttons: 0})
      expect(f.button.hasPointerCapture(7)).toBe(false)
      expect(f.button.getAttribute("data-edge")).toBe("top")
      expect(f.flush().boxByNode.get(f.button)).toMatchObject({x: 252, y: 0, width: 96, height: 28})
      expect(f.changes.at(-1)?.phase).toBe("end")
      expect(f.owner.querySelector("[data-tab]")).toBe(f.button)
      for (const tag of ["canvas", "space", "viewpoint", "window"]) expect(f.owner.querySelector(tag)).toBeNull()
    } finally { f.dispose() }
  })

  test("pointercancel и отключение возвращают исходное положение", () => {
    const f = mount(projection)
    try {
      const start = f.point()
      f.interaction.pointerDown(f.flush(), start)
      f.interaction.pointerMove(f.flush(), {...start, clientX: 12, clientY: 170})
      f.flush()
      expect(f.button.getAttribute("data-edge")).toBe("left")
      f.interaction.pointerCancel(f.flush(), start)
      f.flush()
      expect(f.button.getAttribute("data-edge")).toBe("right")
      expect(f.changes.at(-1)?.phase).toBe("cancel")
      f.interaction.pointerDown(f.flush(), start)
      f.interaction.pointerMove(f.flush(), {...start, clientX: 310, clientY: 0})
      f.render({disabled: true})
      f.flush()
      expect(f.button.hasPointerCapture(7)).toBe(false)
      expect(f.button.getAttribute("data-edge")).toBe("right")
      expect(f.changes.at(-1)?.phase).toBe("cancel")
    } finally { f.dispose() }
  })

  test("resize ограничивает размеры и сохраняет положение без события drag", () => {
    const f = mount(projection)
    try {
      f.owner.setAttribute("style", "position:relative;display:block;width:80px;height:18px")
      const box = f.flush().boxByNode.get(f.button)!
      expect(box).toMatchObject({x: 52, y: 0, width: 28, height: 18})
      expect(f.changes).toHaveLength(0)
      expect(f.owner.querySelector("[data-tab]")).toBe(f.button)
      f.component.unmount()
      f.owner.setAttribute("style", "width:100px;height:50px")
      f.renderer.flush()
      expect(flushDocumentLayoutObservers(f.document)).toBe(false)
    } finally { f.dispose() }
  })
})

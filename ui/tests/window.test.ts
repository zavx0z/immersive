import {describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot} from "@zavx0z/component"
import {createDocument, MouseEvent, KeyboardEvent, type HTMLInputElement} from "@zavx0z/dom"
import {flushDocumentLayoutObservers} from "@zavx0z/dom/geometry"
import {createDocumentInteractionController, createDocumentRenderer, hitTestProjection, type RenderCursor} from "@renderer/html"
import {createTemplateJsxBunPlugin} from "@zavx0z/template/bun"
import type {CompiledTemplate} from "@zavx0z/template/compiled"
import type {WindowProps} from "../surfaces/window/contract/input.ts"

const workspace = resolve(import.meta.dir, "../..")
Bun.plugin(createTemplateJsxBunPlugin({cwd: workspace, persistent: true, sourceRoots: [resolve(workspace, "ui")]}))
const {Window} = await import("../surfaces/window/index.tsx")
const {WindowPairFixture} = await import("./window.fixture.tsx")
const theme = await Bun.file(resolve(workspace, "ui/themes/theme.css")).text()

/** Настоящий layout и pointer routing одной проекции без отдельной механики компонента. */
function mount(projection: "hud" | "display", pair = false) {
  const document = createDocument()
  const owner = document.createElement(projection)
  if (projection === "display") {
    owner.setAttribute("width", "160")
    owner.setAttribute("height", "120")
  }
  owner.setAttribute("style", "position:relative;display:block;width:640px;height:480px")
  document.append(owner)
  const component = createRoot(owner)
  const changes: Array<{phase: string; x: number; y: number; width: number; height: number}> = []
  const props: WindowProps = {id: "window", title: "Окно", open: true, onOpenChange() {}, movable: true, resizable: true,
    onGeometryChange: (box, phase) => { changes.push({...box, phase}) }}
  if (pair) component.render(WindowPairFixture as unknown as CompiledTemplate<{}>, {})
  else component.render(Window as unknown as CompiledTemplate<WindowProps>, props)
  const renderer = createDocumentRenderer({document, root: owner, viewport: {width: 640, height: 480}, styleSheets: [theme],
    ...(projection === "display" ? {projectClientPoint: (point: {x: number; y: number}) => ({x: point.x * .5 + 40, y: point.y * .5 + 20})} : {}),
  })
  const input = createDocumentInteractionController({document, hitTest: hitTestProjection})
  const flush = () => {
    for (let round = 0; round < 5; round++) {
      component.flush()
      renderer.flush()
      if (!flushDocumentLayoutObservers(document)) {
        component.flush()
        return renderer.flush()
      }
    }
    throw new Error("Window layout did not settle")
  }
  const shell = owner.querySelector("[data-window]")!
  const box = () => {
    const rect = flush().boxByNode.get(shell)!
    return {x: rect.x, y: rect.y, width: rect.width, height: rect.height}
  }
  flush()
  return {document, owner, shell, component, props, changes, renderer, input, flush, box,
    dispose() {
      input.dispose()
      component.unmount()
      renderer.dispose()
    },
  }
}

describe.each(["hud", "display"] as const)("Window в %s", projection => {
  test("обе части переключают видимость, сохраняя DOM и пользовательский ввод", () => {
    const f = mount(projection, true)
    try {
      const input = f.owner.querySelector("input") as HTMLInputElement
      input.value = "Черновик пользователя"
      f.shell.querySelector("button")!.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      f.flush()
      expect(f.shell.hasAttribute("hidden")).toBeTrue()
      const control = f.owner.querySelector('button[aria-controls="pair-window"]')!
      expect(control.getAttribute("aria-expanded")).toBe("false")
      control.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      f.flush()
      expect(f.shell.hasAttribute("hidden")).toBeFalse()
      expect(f.owner.querySelector("input")).toBe(input)
      expect(input.value).toBe("Черновик пользователя")
      control.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      f.flush()
      expect(f.shell.hasAttribute("hidden")).toBeTrue()
    } finally { f.dispose() }
  })

  test("перемещение ограничено областью, отмена возвращает начало и освобождает capture", () => {
    const f = mount(projection)
    try {
      let frame = f.flush()
      const rect = frame.boxByNode.get(f.owner.querySelector("[data-window-title]")!)!
      const point = {clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2, pointerId: 7, button: 0, buttons: 1}
      f.input.pointerDown(frame, point)
      f.input.pointerMove(frame, {...point, clientX: point.clientX + 1000, clientY: point.clientY + 1000})
      frame = f.flush()
      expect(f.box()).toEqual({x: 320, y: 240, width: 320, height: 240})
      f.input.pointerCancel(frame, point)
      expect(f.box()).toEqual({x: 24, y: 24, width: 320, height: 240})
      expect(f.shell.hasPointerCapture(7)).toBeFalse()
      expect(f.changes.at(-1)?.phase).toBe("cancel")
    } finally { f.dispose() }
  })

  test("текст заголовка центрирован относительно всего окна при разных группах кнопок", () => {
    const f = mount(projection)
    try {
      f.component.render(Window as unknown as CompiledTemplate<WindowProps>, {...f.props, actions: [{key: "refresh", label: "Обновить"}]})
      const frame = f.flush()
      const text = frame.displayList.find(item => item.kind === "text" && item.text === "Окно")
      if (text?.kind !== "text") throw new Error("Нет текста заголовка")
      const box = f.box()
      expect(text.x + (text.width ?? 0) / 2).toBeCloseTo(box.x + box.width / 2, 0)
    } finally { f.dispose() }
  })

  test("ладонь на шапке меняется на захват во время перемещения", () => {
    const f = mount(projection)
    try {
      const title = f.owner.querySelector("[data-window-title]")!
      let frame = f.flush()
      const rect = frame.boxByNode.get(title)!
      const point = {clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2, pointerId: 11, button: 0, buttons: 1}
      expect(frame.hits.get(title)?.cursor).toBe("grab")
      f.input.pointerDown(frame, point)
      frame = f.flush()
      expect(frame.hits.get(title)?.cursor).toBe("grabbing")
      f.input.pointerUp(frame, point)
      expect(f.flush().hits.get(title)?.cursor).toBe("grab")
    } finally { f.dispose() }
  })

  test("кнопки шапки не наследуют ладонь и не запускают перемещение", () => {
    const f = mount(projection)
    try {
      f.component.render(Window as unknown as CompiledTemplate<WindowProps>, {...f.props, actions: [{key: "refresh", label: "Обновить"}, {key: "locked", label: "Недоступно", disabled: true}]})
      let frame = f.flush()
      const before = f.box()
      const header = f.owner.querySelector("[data-window-header]")!
      for (const button of header.querySelectorAll("button")) {
        expect(frame.hits.get(button)?.cursor).toBe(button.hasAttribute("disabled") ? "not-allowed" : "pointer")
        const rect = frame.boxByNode.get(button)!
        const point = {clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2, pointerId: 12, button: 0, buttons: 1}
        f.input.pointerDown(frame, point)
        f.input.pointerMove(frame, {...point, clientX: point.clientX + 40, clientY: point.clientY + 40})
        frame = f.flush()
        f.input.pointerUp(frame, {...point, clientX: point.clientX + 40, clientY: point.clientY + 40})
        frame = f.flush()
        expect(f.box()).toEqual(before)
        expect(f.shell.hasPointerCapture(12)).toBeFalse()
      }
      expect(f.changes).toEqual([])
    } finally { f.dispose() }
  })

  test("клавиатурный resize ограничен областью и минимальным размером", () => {
    const f = mount(projection)
    try {
      const handle = f.owner.querySelector('[data-window-resize="se"]')!
      handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight", shiftKey: true, bubbles: true, cancelable: true}))
      expect(f.box().width).toBe(330)
      for (let i = 0; i < 20; i++) handle.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft", shiftKey: true, bubbles: true, cancelable: true}))
      expect(f.box().width).toBe(240)
    } finally { f.dispose() }
  })

  test("скрытие во время жеста освобождает capture и сохраняет начальную геометрию", () => {
    const f = mount(projection)
    try {
      const frame = f.flush()
      const rect = frame.boxByNode.get(f.owner.querySelector("[data-window-title]")!)!
      const point = {clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2, pointerId: 9, button: 0, buttons: 1}
      f.input.pointerDown(frame, point)
      f.input.pointerMove(frame, {...point, clientX: point.clientX + 40})
      f.flush()
      f.component.render(Window as unknown as CompiledTemplate<WindowProps>, {...f.props, open: false})
      f.flush()
      expect(f.shell.hasPointerCapture(9)).toBeFalse()
      expect(f.changes.at(-1)).toEqual({x: 24, y: 24, width: 320, height: 240, phase: "cancel"})
    } finally { f.dispose() }
  })

  test.each(["n", "s", "e", "w"])("resize захватывает видимую рамку %s, а не только внутреннюю полосу", edge => {
    const f = mount(projection)
    try {
      const frame = f.flush()
      const before = f.box()
      const point = {
        clientX: edge === "w" ? before.x + .25 : edge === "e" ? before.x + before.width - .25 : before.x + before.width / 2,
        clientY: edge === "n" ? before.y + .25 : edge === "s" ? before.y + before.height - .25 : before.y + before.height / 2,
        pointerId: 10,
        button: 0,
        buttons: 1,
      }
      const hit = hitTestProjection(frame, point.clientX, point.clientY)
      const handle = f.owner.querySelector(`[data-window-resize="${edge}"]`)!
      const rect = frame.boxByNode.get(handle)!
      expect(hit?.node === handle, JSON.stringify({point, rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height}, hit: hit?.role, clips: frame.hits.get(handle)?.clips.map(clip => ({x: clip.x, y: clip.y, width: clip.width, height: clip.height}))})).toBeTrue()
      f.input.pointerDown(frame, point)
      const end = {...point, clientX: point.clientX + (edge === "w" ? -4 : edge === "e" ? 4 : 0), clientY: point.clientY + (edge === "n" ? -4 : edge === "s" ? 4 : 0)}
      f.input.pointerMove(frame, end)
      f.input.pointerUp(f.flush(), end)
      expect(f.box().width).toBe(before.width + (edge === "w" || edge === "e" ? 4 : 0))
      expect(f.box().height).toBe(before.height + (edge === "n" || edge === "s" ? 4 : 0))
    } finally { f.dispose() }
  })

  test.each(["n", "s", "e", "w", "ne", "nw", "se", "sw"])("resize %s сохраняет противоположные стороны", edge => {
    const f = mount(projection)
    try {
      let frame = f.flush()
      const handle = f.owner.querySelector(`[data-window-resize="${edge}"]`)!
      const rect = frame.boxByNode.get(handle)!
      expect(frame.hits.get(handle)?.cursor).toBe(({n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize"} as Record<string, RenderCursor>)[edge])
      const point = {clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2, pointerId: 8, button: 0, buttons: 1}
      f.input.pointerDown(frame, point)
      const end = {...point, clientX: point.clientX + (edge.includes("w") ? -20 : 20), clientY: point.clientY + (edge.includes("n") ? -20 : 20)}
      f.input.pointerMove(frame, end)
      frame = f.flush()
      f.input.pointerUp(frame, end)
      const box = f.box()
      expect(box.x).toBe(edge.includes("w") ? 4 : 24)
      expect(box.y).toBe(edge.includes("n") ? 4 : 24)
      expect(box.width).toBe(edge.includes("w") || edge.includes("e") ? 340 : 320)
      expect(box.height).toBe(edge.includes("n") || edge.includes("s") ? 260 : 240)
      expect(f.shell.hasPointerCapture(8)).toBeFalse()
    } finally { f.dispose() }
  })
})

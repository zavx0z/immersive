import {describe, expect, test} from "bun:test"
import {createRoot} from "@zavx0z/immersive-component"
import {createDocument, MouseEvent, PointerEvent, type HTMLElement, type HTMLInputElement} from "@zavx0z/immersive-dom"
import {createDocumentRenderer, hitTestProjection, createDocumentInteractionController} from "@zavx0z/immersive-renderer-html"
import {flushDocumentLayoutObservers} from "@zavx0z/immersive-dom/geometry"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import Windows from "./activity.fixture.tsx"

const theme = await Bun.file(new URL("../../../theme/theme.css", import.meta.url)).text()
const template = Windows as unknown as CompiledTemplate<Parameters<typeof Windows>[0]>

function fixture() {
  const document = createDocument()
  const space = document.createElement("space")
  document.append(space)
  const mounts: string[] = []
  const disposes: string[] = []
  const regions = (["hud", "display", "display"] as const).map((tag, index) => {
    const owner = document.createElement(tag)
    if (tag === "display") {
      owner.setAttribute("width", "160")
      owner.setAttribute("height", "120")
    }
    owner.setAttribute("style", "position:relative;display:block;width:640px;height:480px")
    space.append(owner)
    const root = createRoot(owner)
    const renderer = createDocumentRenderer({document, root: owner, viewport: {width: 640, height: 480}, styleSheets: [theme]})
    const input = createDocumentInteractionController({document, hitTest: hitTestProjection})
    const props = {prefix: `r${index}`, ids: ["a", "b", "c"], mounts: (id: string) => mounts.push(id), disposes: (id: string) => disposes.push(id)}
    root.render(template, props)
    const shell = (id: string) => owner.querySelector(`[id="r${index}-${id}"]`)! as HTMLElement
    const field = (id: string) => shell(id).querySelector("input")! as HTMLInputElement
    const dock = (id: string) => owner.querySelector(`[data-dock] button[aria-controls="r${index}-${id}"]`)! as HTMLElement
    const active = () => owner.querySelector('[data-window-active="true"]')?.id ?? null
    return {owner, root, renderer, input, props, shell, field, dock, active}
  })
  const flush = () => {
    for (let i = 0; i < 5; i++) {
      for (const r of regions) {
        r.root.flush()
        r.renderer.flush()
      }
      flushDocumentLayoutObservers(document)
    }
  }
  flush()
  return {document, regions, mounts, disposes, flush,
    dispose() {
      for (const r of regions) {
        r.input.dispose()
        r.root.unmount()
        r.renderer.dispose()
        r.owner.remove()
      }
    },
  }
}

const click = (node: HTMLElement) => node.dispatchEvent(new MouseEvent("click", {bubbles: true}))

describe("Независимые оконные слои одного Document", () => {
  test("HUD и каждый Display сохраняют собственное активное окно при переходе keyboard focus", () => {
    const f = fixture()
    try {
      expect(f.regions.map(r => r.active())).toEqual(["r0-c", "r1-c", "r2-c"])
      f.regions[0]!.field("a").focus()
      f.regions[1]!.field("b").focus()
      f.regions[2]!.field("a").focus()
      f.flush()
      expect(f.regions.map(r => r.active())).toEqual(["r0-a", "r1-b", "r2-a"])
      expect(f.document.activeElement).toBe(f.regions[2]!.field("a"))
      f.regions[0]!.dock("a").focus()
      f.flush()
      expect(f.regions.map(r => r.active())).toEqual(["r0-a", "r1-b", "r2-a"])
    } finally { f.dispose() }
  })

  test("A→B→A меняет реальный paint/hit order; hover и уход фокуса не меняют порядок", () => {
    const f = fixture()
    try {
      const r = f.regions[0]!
      const hit = () => hitTestProjection(r.renderer.flush(), 250, 90)?.node.closest("[data-window]")?.id
      expect(hit()).toBe("r0-c")
      for (const id of ["a", "b", "a"]) {
        r.field(id).focus()
        f.flush()
        expect(hit()).toBe(`r0-${id}`)
        const frame = r.renderer.flush()
        const positions = ["a", "b", "c"].map(name => frame.displayList.findLastIndex(item => item.node === r.shell(name).querySelector('[data-window-chrome]')))
        expect(positions[["a", "b", "c"].indexOf(id)]).toBe(Math.max(...positions))
      }
      r.input.pointerMove(r.renderer.flush(), {clientX: 500, clientY: 100, pointerId: 7})
      r.dock("a").focus()
      f.flush()
      expect(hit()).toBe("r0-a")
      expect(r.active()).toBe("r0-a")
    } finally { f.dispose() }
  })

  test("pointerdown поднимает нижнее окно даже при остановке bubbling дочерним контролом", () => {
    const f = fixture()
    try {
      const r = f.regions[0]!
      r.field("a").addEventListener("pointerdown", event => event.stopPropagation())
      r.field("a").dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0, pointerId: 1}))
      f.flush()
      expect(r.active()).toBe("r0-a")
      const frame = r.renderer.flush()
      r.input.pointerDown(frame, {clientX: 410, clientY: 200, pointerId: 2, button: 0})
      r.input.pointerUp(r.renderer.flush(), {clientX: 410, clientY: 200, pointerId: 2, button: 0})
      f.flush()
      expect(r.active()).toBe("r0-c")
    } finally { f.dispose() }
  })

  test("minimize/restore сохраняют поле, selection, scroll, состояние и прежний focus", () => {
    const f = fixture()
    try {
      const r = f.regions[0]!
      const field = r.field("a")
      const body = r.shell("a").querySelector('[data-window-body]')! as HTMLElement
      field.value = "Сохранённый текст"
      field.setSelectionRange(2, 7)
      click(body.querySelector("button")! as HTMLElement)
      body.scrollTop = 50
      field.focus()
      f.flush()
      const mounted = [...f.mounts]
      r.dock("a").focus()
      click(r.dock("a"))
      f.flush()
      expect(r.active()).toBe("r0-c")
      expect(r.shell("a").hasAttribute("hidden")).toBeTrue()
      click(r.dock("a"))
      f.flush()
      expect(r.active()).toBe("r0-a")
      expect(r.field("a")).toBe(field)
      expect(f.document.activeElement).toBe(field)
      expect([field.value, field.selectionStart, field.selectionEnd]).toEqual(["Сохранённый текст", 2, 7])
      expect(body.scrollTop).toBe(50)
      expect(body.querySelector("button")!.textContent).toBe("1")
      expect(f.mounts).toEqual(mounted)
      expect(f.disposes).toEqual([])
      expect(f.regions.slice(1).map(region => region.active())).toEqual(["r1-c", "r2-c"])
    } finally { f.dispose() }
  })

  test("закрытие неактивного окна и закрытие в другой проекции не похищают focus", () => {
    const f = fixture()
    try {
      const r = f.regions[0]!, other = f.regions[1]!
      other.field("b").focus()
      click(r.dock("a"))
      f.flush()
      expect(r.active()).toBe("r0-c")
      expect(f.document.activeElement).toBe(other.field("b"))
      click(r.dock("c"))
      f.flush()
      expect(r.active()).toBe("r0-b")
      expect(f.document.activeElement).toBe(other.field("b"))
    } finally { f.dispose() }
  })

  test("перестановка keyed-компонентов, обновление и unmount сохраняют lifecycle", () => {
    const f = fixture()
    try {
      const r = f.regions[0]!
      const field = r.field("a")
      r.field("c").focus()
      field.focus()
      f.flush()
      r.root.render(template, {...r.props, ids: ["c", "a", "b"]})
      f.flush()
      expect(r.field("a")).toBe(field)
      expect(r.active()).toBe("r0-a")
      expect(f.mounts.length).toBe(9)
      expect(f.disposes).toEqual([])
      r.root.render(template, {...r.props, ids: ["c", "b"]})
      f.flush()
      expect(r.active()).toBe("r0-c")
      expect(f.disposes).toEqual(["r0-a"])
      expect(f.document.activeElement).toBe(r.field("c"))
      r.root.unmount()
      expect(r.owner.querySelectorAll("[data-window]").length).toBe(0)
      expect(new Set(f.disposes).size).toBe(3)
    } finally { f.dispose() }
    expect(f.disposes.length).toBe(9)
    expect(new Set(f.disposes).size).toBe(9)
  })

  test("сворачивание кнопкой шапки возвращает focus содержимому, а удалённое поле заменяется оболочкой", () => {
    const f = fixture()
    try {
      const r = f.regions[0]!
      r.field("a").focus()
      f.flush()
      const minimize = r.shell("a").querySelector("button")! as HTMLElement
      minimize.focus()
      click(minimize)
      f.flush()
      click(r.dock("a"))
      f.flush()
      expect(f.document.activeElement).toBe(r.field("a"))
      click(r.dock("a"))
      f.flush()
      r.field("a").setAttribute("disabled", "")
      click(r.dock("a"))
      f.flush()
      expect(f.document.activeElement === r.shell("a")).toBeTrue()
      expect(r.shell("a").getAttribute("tabindex")).toBe("-1")
    } finally { f.dispose() }
  })

  test("последнее закрытое окно очищает активность, а удаление в другой проекции сохраняет focus", () => {
    const f = fixture()
    try {
      const r = f.regions[0]!, other = f.regions[1]!
      r.field("a").focus()
      other.field("b").focus()
      f.flush()
      r.root.render(template, {...r.props, ids: ["b", "c"]})
      f.flush()
      expect(f.document.activeElement).toBe(other.field("b"))
      click(r.dock("b"))
      click(r.dock("c"))
      f.flush()
      expect(r.active()).toBeNull()
      expect(f.document.activeElement).toBe(other.field("b"))
      click(r.dock("c"))
      f.flush()
      expect(r.active()).toBe("r0-c")
      expect(f.document.activeElement === r.shell("c")).toBeTrue()
    } finally { f.dispose() }
  })


  test("восстановление уважает авторское перенаправление focus в другой Display", () => {
    const f = fixture()
    try {
      const r = f.regions[0]!, other = f.regions[1]!
      const field = r.field("a")
      field.focus()
      click(r.dock("a"))
      f.flush()
      other.field("b").focus()
      field.addEventListener("focus", () => other.field("b").focus(), {once: true})
      click(r.dock("a"))
      f.flush()
      expect(f.document.activeElement === other.field("b")).toBeTrue()
      expect(r.active()).toBe("r0-a")
      expect(other.active()).toBe("r1-b")
    } finally { f.dispose() }
  })

})

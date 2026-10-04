import {expect, test} from "bun:test"
import {createDocument} from "@immersive/dom"
import {createDocumentRenderer, createDocumentInteractionController, createDocumentInteractionState} from "../src/index.ts"

/** Проверяет вычисленный CSS и hit metadata, не создавая нативного Canvas. */
function fixture(style = "") {
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", `width:200px;height:200px;${style}`)
  const button = document.createElement("button")
  button.setAttribute("style", "width:80px;height:40px")
  root.append(button)
  document.append(root)
  const interactionState = createDocumentInteractionState(document)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 200, height: 200}, interactionState,
    styleSheets: ["button:hover { cursor: grabbing; }"]})
  const input = createDocumentInteractionController({document, interactionState})
  return {root, button, renderer, input,
    cursor: () => renderer.flush().hits.get(button)?.cursor,
    dispose() {
      input.dispose()
      renderer.dispose()
    },
  }
}

test.each(["ns-resize", "ew-resize", "nwse-resize", "nesw-resize", "pointer", "text", "none"])("cursor %s наследуется в hit metadata", cursor => {
  const f = fixture(`cursor:${cursor}`)
  try { expect(f.cursor()).toBe(cursor) } finally { f.dispose() }
})

test("inherit, unset, initial и невалидные объявления сохраняют CSS-семантику", () => {
  const f = fixture("cursor:crosshair")
  try {
    for (const keyword of ["inherit", "unset"]) {
      f.button.setAttribute("style", `cursor:${keyword}`)
      expect(f.cursor()).toBe("crosshair")
    }
    f.button.setAttribute("style", "cursor:initial")
    expect(f.cursor()).toBe("auto")
    f.button.setAttribute("style", "cursor:ew-resize;cursor:not-a-cursor")
    expect(f.cursor()).toBe("ew-resize")
  } finally { f.dispose() }
})

test("var и hover обновляют cursor без изменения геометрии", () => {
  const f = fixture("--pointer: grab;cursor:var(--pointer)")
  try {
    const before = f.renderer.flush().boxByNode.get(f.button)!
    expect(f.cursor()).toBe("grab")
    f.root.setAttribute("style", "width:200px;height:200px;--pointer:help;cursor:var(--pointer)")
    expect(f.cursor()).toBe("help")
    f.input.pointerMove(f.renderer.flush(), {clientX: 10, clientY: 10})
    expect(f.cursor()).toBe("grabbing")
    const after = f.renderer.flush().boxByNode.get(f.button)!
    expect({x: after.x, y: after.y, width: after.width, height: after.height}).toEqual({x: before.x, y: before.y, width: before.width, height: before.height})
  } finally { f.dispose() }
})

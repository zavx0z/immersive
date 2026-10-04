import {expect, test} from "bun:test"
import {createDocument, HTMLElement} from "@zavx0z/immersive-dom"
import {createDocumentRenderer} from "../src/index.ts"

/** Обновление соседнего текста не меняет границы обрезки прокручиваемого содержимого. */
test("вложенный текст остаётся внутри собственного clip при прокрутке и обновлении соседа", () => {
  const document = createDocument()
  const root = document.createElement("div")
  const sibling = document.createElement("p")
  sibling.textContent = "status"
  root.append(sibling)
  root.setAttribute("style", "width:1000px;height:600px;overflow:hidden;padding-left:300px;box-sizing:border-box")
  document.append(root)
  const viewport = document.createElement("section")
  if (!(viewport instanceof HTMLElement)) throw new TypeError("Expected an HTML scroll container")
  viewport.setAttribute("style", "width:680px;height:560px;overflow:auto;padding:16px;box-sizing:border-box")
  let parent = root
  for (let depth = 0; depth < 4; depth++) {
    const wrapper = document.createElement("div")
    wrapper.setAttribute("style", "width:680px;height:580px;overflow:hidden")
    parent.append(wrapper)
    parent = wrapper
  }
  parent.append(viewport)
  for (let index = 0; index < 40; index++) {
    const paragraph = document.createElement("p")
    paragraph.textContent = `Heading ${index}`
    viewport.append(paragraph)
    const editor = document.createElement("section")
    editor.setAttribute("style", "display:flex;flex-direction:row;width:100%;height:auto;overflow:auto;border:1px solid #444;border-radius:4px;font-size:12px;line-height:16px")
    const code = document.createElement("code")
    code.setAttribute("style", "display:block;white-space:pre;padding:8px;min-width:100%")
    for (let line = 0; line < 3; line++) {
      const row = document.createElement("span")
      row.setAttribute("style", "display:block;height:16px;min-height:16px;white-space:pre")
      const token = document.createElement("span")
      token.setAttribute("style", "color:#aabbcc")
      token.textContent = `const value${index}_${line} = 123`
      row.append(token)
      code.append(row)
    }
    editor.append(code)
    viewport.append(editor)
  }
  const renderer = createDocumentRenderer({document, root, viewport: {width: 1000, height: 600}})
  try {
    renderer.flush()
    for (const top of [150, 350, 700, 0]) {
      document.transaction(() => {
        viewport.scrollTop = top
        sibling.textContent = `status ${top}`
      })
      const frame = renderer.flush()
      for (const item of frame.displayList) {
        if (item.kind !== "text" || !item.text.startsWith("const value")) continue
        const clip = item.clips.at(-1)!
        expect(item.y + item.lineHeight).toBeGreaterThan(clip.y)
        expect(item.y).toBeLessThan(clip.y + clip.height)
      }
    }
  } finally { renderer.dispose() }
})

import {expect, test} from "bun:test"
import {bindDocumentFullscreenHost, createDocument} from "@zavx0z/immersive-dom"
import {createDocumentRenderer} from "../src/index.ts"

test("fullscreen escapes parent clipping and transforms, fills the viewport and restores ordinary layout", async () => {
  const document = createDocument()
  const root = document.createElement("div")
  const target = document.createElement("section")
  const child = document.createElement("button")
  document.append(root)
  root.append(target)
  target.append(child)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 640, height: 480}, styleSheets: [
    "div {width:80px;height:60px;overflow:hidden;transform:translate(15px,20px)} section {width:40px;height:30px;margin:4px} section:fullscreen {background:#123456} button {box-sizing:border-box;width:100%;height:100%}",
  ]})
  const release = bindDocumentFullscreenHost(document, {enabled: () => true, async request() {}, async exit() {}})
  try {
    const previous = renderer.flush().boxByNode.get(target)!
    await target.requestFullscreen()
    const full = renderer.flush()
    expect(full.displayList[0]).toMatchObject({key: "ua:fullscreen-backdrop", color: "#000000", width: 640, height: 480})
    expect(full.displayList.find(item => item.node === target && item.key === "background")).toMatchObject({color: "#123456"})
    expect(full.boxByNode.get(target)).toMatchObject({x: 0, y: 0, width: 640, height: 480})
    expect(full.boxByNode.get(child)).toMatchObject({x: 0, y: 0, width: 640, height: 480})
    expect(full.boxByNode.has(root)).toBeFalse()
    expect(target.parentNode).toBe(root)
    renderer.resize({width: 800, height: 600})
    expect(renderer.flush().boxByNode.get(target)).toMatchObject({width: 800, height: 600})
    await document.exitFullscreen()
    expect(renderer.flush().boxByNode.get(target)).toMatchObject({x: previous.x, y: previous.y, width: 40, height: 30})
  } finally {renderer.dispose(); release()}
})

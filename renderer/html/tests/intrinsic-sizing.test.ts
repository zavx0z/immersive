import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/dom"
import {createDocumentRenderer} from "../src/index.ts"

function fixture(style: string, text = "hello world") {
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "width:80px;height:500px")
  document.append(root)
  const element = document.createElement("div")
  element.setAttribute("style", `font-size:20px;line-height:24px;${style}`)
  element.textContent = text
  root.append(element)
  const renderer = createDocumentRenderer({document, root, viewport: {width:80,height:500},
    textMeasurer: {measureTextAdvance: text => text.length * 10}})
  return {document, element, root, renderer}
}

for (const [keyword, width] of [["max-content", 110], ["fit-content", 80], ["min-content", 50]] as const) {
  test(`CSS width:${keyword} измеряет текст и переносы`, () => {
    const f = fixture(`width:${keyword}`)
    try {
      expect(f.element.getBoundingClientRect().width).toBe(width)
      expect(f.element.getBoundingClientRect().height).toBe(keyword === "max-content" ? 24 : 48)
      f.root.setAttribute("style", "width:30px")
      expect(f.element.getBoundingClientRect().width).toBe(keyword === "max-content" ? 110 : 50)
    } finally { f.renderer.dispose() }
  })
}

test("CSS intrinsic width учитывает вложенные inline, box-sizing, ограничения и изменение текста", () => {
  const f = fixture("width:max-content;padding:5px;border:2px solid red;max-width:200px")
  try {
    expect(f.element.getBoundingClientRect().width).toBe(124)
    f.element.textContent = "hello world hello world"
    expect(f.element.getBoundingClientRect().width).toBe(214)
    f.element.setAttribute("style", "width:max-content;box-sizing:border-box;padding:5px;border:2px solid red;max-width:200px")
    expect(f.element.getBoundingClientRect().width).toBe(200)
  } finally { f.renderer.dispose() }
})

for (const [style, width, height] of [
  ["width:200px;aspect-ratio:2", 200, 100],
  ["height:60px;aspect-ratio:2", 120, 60],
  ["width:200px;height:70px;aspect-ratio:2", 200, 70],
  ["width:200px;aspect-ratio:2;max-width:100px", 100, 50],
  ["width:200px;aspect-ratio:2;min-height:120px", 200, 120],
  ["width:200px;aspect-ratio:2;padding:10px", 220, 120],
  ["width:200px;aspect-ratio:2;padding:10px;box-sizing:border-box", 200, 100],
] as const) {
  test(`CSS aspect-ratio: ${style}`, () => {
    const f = fixture(style, "")
    try {
      const rect = f.element.getBoundingClientRect()
      expect({width:rect.width,height:rect.height}).toEqual({width,height})
    } finally { f.renderer.dispose() }
  })
}

test("aspect-ratio во flex column сохраняет квадрат при изменении CSS ширины", () => {
  const f = fixture("display:flex;flex-direction:column;width:180px", "")
  const square = f.document.createElement("div")
  square.setAttribute("style", "width:100%;aspect-ratio:1;flex-shrink:0")
  const inner = f.document.createElement("div")
  inner.setAttribute("style", "width:100%;height:100%")
  square.append(inner)
  f.element.append(square)
  try {
    for (const width of [180, 260]) {
      f.element.setAttribute("style", `display:flex;flex-direction:column;width:${width}px`)
      expect(square.getBoundingClientRect().height).toBe(width)
      expect(inner.getBoundingClientRect().height).toBe(width)
      expect(f.element.getBoundingClientRect().height).toBe(width)
    }
  } finally { f.renderer.dispose() }
})

test("fit-content: вложенные inline не разрывают слово на границе элементов", () => {
  const f = fixture("width:fit-content", "")
  const span = f.document.createElement("span")
  span.textContent = "hello"
  f.element.append(span, "world")
  try {
    expect(f.element.getBoundingClientRect().width).toBe(100)
  } finally { f.renderer.dispose() }
})

for (const [ratio, height] of [["1", 200], ["auto 1", 120]] as const) {
  test(`aspect-ratio:${ratio} изображения учитывает естественные размеры и border-box`, () => {
    const document = createDocument()
    const image = document.createElement("img")
    image.setAttribute("src", "test.png")
    image.setAttribute("style", `box-sizing:border-box;width:200px;padding:20px;aspect-ratio:${ratio}`)
    document.append(image)
    const renderer = createDocumentRenderer({document, root: image, viewport: {width:400,height:400},
      imageMeasurer: {measureImage: () => ({width:100,height:50})}})
    try { expect(image.getBoundingClientRect().height).toBe(height) }
    finally { renderer.dispose() }
  })
}

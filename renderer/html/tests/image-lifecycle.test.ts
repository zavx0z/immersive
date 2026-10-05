import {expect, test} from "bun:test"
import {createDocument} from "../../../dom/src/index.ts"
import {createDocumentRenderer} from "../src/index.ts"

function fixture() {
  const document = createDocument()
  const root = document.createElement("div")
  document.append(root)
  const measured = new Map<string, Set<AbortSignal>>()
  const renderer = createDocumentRenderer({
    document, root, viewport: {width: 320, height: 200},
    imageMeasurer: {measureImage(src, signal) {
      expect(signal).toBeDefined()
      let signals = measured.get(src)
      if (signals === undefined) measured.set(src, signals = new Set())
      signals.add(signal!)
      return null
    }},
  })
  const image = (src: string) => {
    const element = document.createElement("img")
    element.src = src
    root.append(element)
    renderer.flush()
    return element
  }
  return {document, root, renderer, measured, image}
}

test("pending измерение отменяется при src change и detach, peer того же source сохраняет собственный lease", () => {
  const f = fixture()
  try {
    const first = f.image("shared.png")
    const second = f.image("shared.png")
    const [firstSignal, secondSignal] = f.measured.get("shared.png")!
    expect(f.measured.get("shared.png")!.size).toBe(2)
    first.src = "new.png"
    expect(firstSignal!.aborted).toBeTrue()
    expect(secondSignal!.aborted).toBeFalse()
    f.renderer.flush()
    const replacement = [...f.measured.get("new.png")!][0]!
    expect(replacement.aborted).toBeFalse()
    first.remove()
    expect(replacement.aborted).toBeTrue()
    expect(secondSignal!.aborted).toBeFalse()
    second.remove()
    expect(secondSignal!.aborted).toBeTrue()
  } finally { f.renderer.dispose() }
})

test("same Document reparent внутри проекции сохраняет signal, удаление projection root и dispose освобождают его", () => {
  const f = fixture()
  try {
    const image = f.image("move.png")
    const signal = [...f.measured.get("move.png")!][0]!
    const destination = f.document.createElement("div")
    f.root.append(destination)
    f.document.transaction(() => destination.append(image))
    f.renderer.flush()
    expect(signal.aborted).toBeFalse()
    expect(f.measured.get("move.png")!.size).toBe(1)
    f.root.remove()
    expect(signal.aborted).toBeTrue()
    f.renderer.flush()
    expect(f.measured.get("move.png")!.size).toBe(1)
    f.document.append(f.root)
    f.renderer.flush()
    const restored = [...f.measured.get("move.png")!].find(value => !value.aborted)!
    expect(restored).toBeDefined()
    f.renderer.dispose()
    expect(restored.aborted).toBeTrue()
  } finally { f.renderer.dispose() }
})

import {expect, test} from "bun:test"
import {createDocument, isTextSourceRoot, registerTextSourceRoot} from "../src/index.ts"
import {registerTextSourceRoot as registerFromSubpath} from "@zavx0z/immersive-dom/text-source"

test("регистрации одного корня независимы, освобождение идемпотентно", () => {
  const document = createDocument()
  const root = document.createElement("div")
  root.textContent = "source"
  document.append(root)
  const first = registerTextSourceRoot(root)
  const second = registerFromSubpath(root)
  expect(isTextSourceRoot(root)).toBe(true)
  expect(isTextSourceRoot(root.firstChild!)).toBe(false)
  first()
  first()
  expect(isTextSourceRoot(root)).toBe(true)
  second()
  expect(isTextSourceRoot(root)).toBe(false)
  const replacement = registerTextSourceRoot(root)
  first()
  second()
  expect(isTextSourceRoot(root)).toBe(true)
  replacement()
})

test("отключение приостанавливает регистрацию, перенос внутри Document сохраняет её", () => {
  const document = createDocument()
  const parent = document.createElement("div")
  const other = document.createElement("div")
  const root = document.createElement("p")
  const container = document.createElement("main")
  container.append(parent, other)
  document.append(container)
  const release = registerTextSourceRoot(root)
  expect(isTextSourceRoot(root)).toBe(false)
  parent.append(root)
  expect(isTextSourceRoot(root)).toBe(true)
  other.append(root)
  expect(isTextSourceRoot(root)).toBe(true)
  root.remove()
  expect(isTextSourceRoot(root)).toBe(false)
  parent.append(root)
  expect(isTextSourceRoot(root)).toBe(true)
  release()
})

test("принятие другим Document требует новой регистрации, старый release не удаляет новую", () => {
  const first = createDocument()
  const second = createDocument()
  const root = first.createElement("div")
  first.append(root)
  const oldRelease = registerTextSourceRoot(root)
  second.append(root)
  expect(isTextSourceRoot(root)).toBe(false)
  const newRelease = registerTextSourceRoot(root)
  expect(isTextSourceRoot(root)).toBe(true)
  oldRelease()
  expect(isTextSourceRoot(root)).toBe(true)
  newRelease()
  expect(isTextSourceRoot(root)).toBe(false)
})

test("авторский ref принимается на platform boundary; чужой native объект отклоняется", () => {
  const foreign = Object.create(null) as globalThis.Element
  expect(() => registerTextSourceRoot(foreign)).toThrow(TypeError)
})


test("неосвобождённая lease не удерживает корень и Document после GC", async () => {
  const module = new URL("../src/index.ts", import.meta.url).href
  const script = `
    import {createDocument, registerTextSourceRoot} from ${JSON.stringify(module)}
    let release
    let rootRef
    let documentRef
    function setup() {
      const document = createDocument()
      const root = document.createElement("div")
      document.append(root)
      release = registerTextSourceRoot(root)
      rootRef = new WeakRef(root)
      documentRef = new WeakRef(document)
    }
    setup()
    for (let turn = 0; turn < 3; turn++) {
      await new Promise(resolve => setTimeout(resolve, 0))
      Bun.gc(true)
    }
    console.log(JSON.stringify([rootRef.deref() === undefined, documentRef.deref() === undefined]))
    release()
    release()
  `
  const child = Bun.spawn([process.execPath, "--eval", script], {stdout: "pipe", stderr: "pipe"})
  const [output, error, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ])
  expect(error).toBe("")
  expect(code).toBe(0)
  expect(JSON.parse(output)).toEqual([true, true])
})

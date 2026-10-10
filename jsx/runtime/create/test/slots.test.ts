import {afterAll, beforeAll, expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {resolve, join} from "node:path"
import {createDocument, createDomRoot, Event} from "@zavx0z/immersive-dom"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"

let compiled: Record<string, any>
let directory: string
beforeAll(async () => {
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [import.meta.dir]})
  try {
    const output = await compiler.compileFile(join(import.meta.dir, "slots.fixture.tsx"))
    expect(output.code).not.toMatch(/from ["']@zavx0z\/immersive(?:-component|\/XReact|-template)/u)
    directory = await mkdtemp(join(import.meta.dir, ".compiled-slots-"))
    const path = join(directory, "slots.ts")
    await Bun.write(path, output.code)
    compiled = await import(path)
  } finally { await compiler.close() }
}, 30_000)
afterAll(async () => { if (directory) await rm(directory, {recursive: true, force: true}) })

function fixture() {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  return {document, host, root: createDomRoot(host)}
}

test("готовый DOM-компонент принимает named/default массивы и fallback без JSX runtime", () => {
  const {host, root} = fixture()
  root.render(compiled.Receiver, {}, {content: {header: ["H", [0, "!"]], "": "body"}})
  expect(host.querySelector("header")!.textContent).toBe("H0!")
  expect(host.querySelector("main")!.textContent).toBe("body")
  root.render(compiled.Receiver, {}, {content: {header: "", "": 0}})
  expect(host.querySelector("header")!.textContent).toBe("fallback:header")
  expect(host.querySelector("main")!.textContent).toBe("0")
  root.render(compiled.Receiver, {}, {content: {header: null, "": []}})
  expect(host.textContent).toBe("fallback:headerfallback:default")
  root.unmount()
})

test("неизвестное имя отклоняется атомарно и __proto__ остаётся обычным именем", () => {
  const {host, root} = fixture()
  root.render(compiled.Receiver, {}, {content: {header: "before"}})
  const article = host.querySelector("article")
  expect(() => root.render(compiled.Receiver, {}, {content: {missing: "wrong"}})).toThrow()
  expect(host.querySelector("article")).toBe(article)
  expect(host.querySelector("header")!.textContent).toBe("before")
  root.render(compiled.ProtoReceiver, {}, {content: {["__proto__"]: "safe"}})
  expect(host.textContent).toBe("safe")
  root.unmount()
})

test("conditional named slot не сдвигает fixed sibling и не передаёт slot в DOM", () => {
  const {host, root} = fixture()
  root.render(compiled.Composition, {show: false, ids: []})
  const fixed = host.querySelector("header button")!
  fixed.dispatchEvent(new Event("click"))
  root.render(compiled.Composition, {show: true, ids: []})
  expect(host.querySelectorAll("header button")[1]).toBe(fixed)
  expect(fixed.textContent).toBe("fixed:1")
  expect(host.querySelector("[slot]")).toBeNull()
  root.render(compiled.Composition, {show: false, ids: []})
  expect(host.querySelector("header button")).toBe(fixed)
  root.unmount()
})

test("keyed перестановка сохраняет state и последующего fixed ребёнка", () => {
  const {host, root} = fixture()
  root.render(compiled.Composition, {show: false, ids: ["a", "b"]})
  const [a, b, tail] = host.querySelectorAll("main button")
  a!.dispatchEvent(new Event("click"))
  root.render(compiled.Composition, {show: false, ids: ["b", "a", "c"]})
  expect(host.querySelectorAll("main button")[0]).toBe(b)
  expect(host.querySelectorAll("main button")[1]).toBe(a)
  expect(host.querySelectorAll("main button")[3]).toBe(tail)
  expect(a!.textContent).toBe("a:1")
  expect(() => root.render(compiled.Composition, {show: false, ids: ["a", "a"]})).toThrow()
  expect(host.querySelectorAll("main button")[1]).toBe(a)
  root.unmount()
})

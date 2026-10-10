import {expect, test} from "bun:test"
import {mkdir, mkdtemp, readFile, rm, symlink} from "node:fs/promises"
import {resolve, join} from "node:path"
import JsxCompilerSession from "../index.ts"

test.each([
  {name: "именованный слот", file: "consumer.tsx", library: "library", before: "ПервыйЗаголовок", after: "ВторойЗаголовок"},
  {name: "default и именованный слот", file: "default-consumer.tsx", library: "default-library", before: "ПервыйЗаголовокПервый", after: "ВторойЗаголовокВторой"},
])("потребитель готового компонента читает декларацию без TSX: $name", async ({file, library, before, after}) => {
  const source = resolve(import.meta.dir, "published", file)
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [source]})
  const temporary = await mkdtemp(join(import.meta.dir, "published/.compiled-"))
  try {
    const result = await compiler.compileFile(source)
    expect(result.code).toContain(`./${library}/index.js`)
    expect(result.code).toContain('from "@zavx0z/immersive/XReact"')
    expect(result.code).toContain('from "@zavx0z/immersive/XReact/compiled"')
    expect(result.code).toContain('from "@zavx0z/immersive/XReact/slot"')
    expect(result.code).not.toContain('from "@zavx0z/immersive-component')
    expect(result.code).not.toContain('from "@zavx0z/immersive-template')
    expect(compiler.accepts(resolve(import.meta.dir, "published", library, "index.d.ts"))).toBeFalse()
    await expectRejected(compiler.compileFile(resolve(import.meta.dir, "published", library, "index.d.ts")), "source is outside the governed JSX roots")
    // Исполнение использует неизменённый готовый JS рядом с единственной декларацией.
    const output = join(temporary, "consumer.ts")
    await mkdir(join(temporary, "node_modules/@zavx0z"), {recursive: true})
    await symlink(resolve(import.meta.dir, "../../../.."), join(temporary, "node_modules/@zavx0z/immersive"))
    await Bun.write(join(temporary, "tsconfig.json"), JSON.stringify({compilerOptions: {paths: {}}}))
    await Bun.write(join(temporary, library, "index.js"), await readFile(resolve(import.meta.dir, "published", library, "index.js"), "utf8"))
    await Bun.write(output, result.code)
    const runtime = join(temporary, "runtime.ts")
    await Bun.write(runtime, `
import assert from "node:assert/strict"
import {createDocument} from "@zavx0z/immersive"
import {createRoot} from "@zavx0z/immersive/XReact"
import {Consumer} from "./consumer.ts"
const document = createDocument()
const root = createRoot(document)
try {
  root.render(Consumer, {value: "Первый"})
  const section = document.querySelector("section")!
  const header = document.querySelector("h1")!
  const body = document.querySelector("button")
  assert.equal(section.textContent, ${JSON.stringify(before)})
  root.render(Consumer, {value: "Второй"})
  assert.equal(document.querySelector("section"), section)
  assert.equal(document.querySelector("h1"), header)
  assert.equal(document.querySelector("button"), body)
  assert.equal(section.textContent, ${JSON.stringify(after)})
} finally {
  root.unmount()
}
`)
    // Обычная проверка исходников не требует предварительной сборки всей платформы.
    const process = Bun.spawn([Bun.which("bun")!, "--conditions=source", runtime], {
      cwd: temporary,
      stdout: "pipe",
      stderr: "pipe",
    })
    const [status, errors] = await Promise.all([process.exited, new Response(process.stderr).text()])
    expect(status, errors).toBe(0)
  } finally {
    await compiler.close()
    await rm(temporary, {recursive: true, force: true})
  }
}, 30000)

test("публичный XReact сохраняет распознавание hooks, memo, browser root и Document", async () => {
  const directory = resolve(import.meta.dir, "published")
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [directory]})
  try {
    const result = await compiler.compileFile(join(directory, "hooks.fixture.tsx"))
    expect(result.code).toContain('["header"]')
    expect(result.code).toContain('from "@zavx0z/immersive/XReact"')
    expect(result.code).toContain('from "@zavx0z/immersive/XReact/compiled"')
    expect(result.code).toContain("useDocument as")
    expect(result.code).toContain("createCanvasRoot(canvas).render(")
    expect(result.code).not.toContain("<PublicApp")
    expect(result.code).not.toContain('from "@zavx0z/immersive-component')
    await expectRejected(compiler.compileFile(join(directory, "invalid-hook.fixture.tsx")), "useState must be called unconditionally")
    await expectRejected(compiler.compileFile(join(directory, "invalid-browser-hook.fixture.tsx")), "useSpace must be called unconditionally")
  } finally {
    await compiler.close()
  }
}, 30000)

test("транзитивная декларация слотов инвалидирует кеш, чужой TSX остаётся закрытым", async () => {
  const directory = await mkdtemp(join(import.meta.dir, "published/.contracts-"))
  const source = join(directory, "consumer.tsx")
  await Bun.write(source, "")
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [source]})
  try {
    await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: "../tsconfig.json", include: ["**/*.ts", "**/*.tsx"]}))
    await Bun.write(join(directory, "library/index.d.ts"), `
import type {CompiledComponent, JSX} from "@zavx0z/immersive/XReact"
import type {Slots} from "./public.js"
declare const Prepared: CompiledComponent<{value: string}, JSX.Element<Slots>>
export default Prepared
`)
    await Bun.write(join(directory, "library/public.d.ts"), 'export type {Slots} from "./slots.js"\n')
    const slots = join(directory, "library/slots.d.ts")
    await Bun.write(slots, 'import type {JSX} from "@zavx0z/immersive/XReact"\nexport interface Slots {header: JSX.Element}\n')
    await Bun.write(source, await readFile(resolve(import.meta.dir, "published/consumer.tsx"), "utf8"))
    const first = await compiler.compileFile(source)
    expect(first.code).toContain('["header"]')
    expect(await compiler.compileFile(source)).toBe(first)
    await Bun.write(slots, 'import type {JSX} from "@zavx0z/immersive/XReact"\nexport interface Slots {toolbar: JSX.Element}\n')
    await expectRejected(compiler.compileFile(source), 'unknown slot "header"')
    await Bun.write(source, (await readFile(source, "utf8")).replace('slot="header"', 'slot="toolbar"'))
    const updated = await compiler.compileFile(source)
    expect(updated.code).toContain('["toolbar"]')
    expect(updated).not.toBe(first)
    expect(await compiler.compileFile(source)).toBe(updated)
    const foreign = join(directory, "library/foreign.tsx")
    await Bun.write(foreign, 'export default function Foreign() { return <section /> }\n')
    expect(compiler.accepts(foreign)).toBeFalse()
    await expectRejected(compiler.compileFile(foreign), "source is outside the governed JSX roots")
    await Bun.write(source, 'import Foreign from "./library/foreign"\nexport function App() { return <Foreign /> }\n')
    await expectRejected(compiler.compileFile(source), "does not resolve to a governed function component")
  } finally {
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

test("публичная декларация без номинального бренда не выдаёт себя за готовый компонент", async () => {
  const directory = await mkdtemp(join(import.meta.dir, "published/.counterfeit-"))
  const source = join(directory, "consumer.tsx")
  try {
    await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: "../tsconfig.json", include: ["**/*.ts", "**/*.tsx"]}))
    await Bun.write(source, 'import Fake from "./library.js"\nexport function App() { return <Fake /> }\n')
    for (const type of [
      '((props: {}) => JSX.Element) & {readonly "@zavx0z/immersive-component/compiled"?: true}',
      '((props: {}) => JSX.Element) & {readonly "@zavx0z/immersive-component/compiled"?: true; readonly [compiledComponentBrand]: true}',
      '((props: {}) => JSX.Element) & Partial<CompiledComponent<{}>>',
    ]) {
      await Bun.write(join(directory, "library.d.ts"), `
import type {CompiledComponent, JSX} from "@zavx0z/immersive/XReact"
declare const compiledComponentBrand: unique symbol
declare const Fake: ${type}
export default Fake
`)
      const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [source]})
      try {
        await expectRejected(compiler.compileFile(source), "does not resolve to a governed function component")
      } finally {
        await compiler.close()
      }
    }
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

async function expectRejected(result: Promise<unknown>, message: string): Promise<void> {
  const failure = await result.then(() => null, error => error)
  expect(failure).toBeInstanceOf(Error)
  expect(failure instanceof Error ? failure.message : undefined).toContain(message)
}

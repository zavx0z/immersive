import {expect, test} from "bun:test"
import {mkdir, mkdtemp, readFile, rm, symlink} from "node:fs/promises"
import {join, resolve} from "node:path"
import JsxCompilerSession from "../index.ts"
import {composeSourceRanges, sourceRangesForEdits} from "../src/source-ranges.ts"

test("in-memory текст сохраняет native file identity, imports и dependency-aware cache", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".source-text-"))
  const path = join(directory, "component.tsx")
  const source = 'import {label} from "./label.ts"\nexport const before = label\nexport function Counter(props: {label: string}) { return <button>{props.label}</button> }\nexport const after = label\n'
  const overlay = source.replace("export const before = label", 'export const before = "buffer"')
  await Bun.write(path, source)
  await Bun.write(join(directory, "label.ts"), 'export const label = "disk"\n')
  await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: "../../../../../tsconfig.json", files: ["component.tsx"]}))
  const session = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [directory]})
  try {
    const disk = await session.compileFile(path)
    const buffered = await session.compileFile(path, overlay)
    expect(buffered.code).toContain('from "./label.ts"')
    expect(buffered.code).toContain('export const before = "buffer"')
    expect(buffered.code).not.toContain("return <button>")
    expect(await session.compileFile(path, overlay)).toBe(buffered)
    const generated = buffered.code.indexOf("export const after")
    const range = buffered.sourceRanges.find(range => range.generatedStart <= generated && generated < range.generatedEnd)!
    expect(range.sourceStart + generated - range.generatedStart).toBe(overlay.indexOf("export const after"))
    expect(buffered.sourceRanges.some(range => buffered.code.slice(range.generatedStart, range.generatedEnd).includes("class Counter"))).toBeFalse()
    const changed = await session.compileFile(path, overlay.replace('"buffer"', '"changed"'))
    expect(changed).not.toBe(buffered)
    expect(changed.code).toContain('export const before = "changed"')
    const restored = await session.compileFile(path)
    expect(restored.code).toBe(disk.code)
    expect(await readFile(path, "utf8")).toBe(source)
    await expect(session.compileFile(join(directory, "../foreign.tsx"), overlay)).rejects.toThrow()
  } finally {
    await session.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

test("source ranges compose exact unchanged spans and leave generated replacements unmapped", () => {
  // abcdef -> aXXbcef -> !aXXbcef
  const first = sourceRangesForEdits(6, [{start: 1, end: 1, text: "XX"}, {start: 3, end: 4, text: ""}])
  const next = sourceRangesForEdits(7, [{start: 0, end: 0, text: "!"}])
  const composed = composeSourceRanges(next, first)
  const originalOffset = (offset: number) => {
    const range = composed.find(range => range.generatedStart <= offset && offset < range.generatedEnd)
    return range === undefined ? null : range.sourceStart + offset - range.generatedStart
  }
  expect(originalOffset(0)).toBeNull()
  expect(originalOffset(1)).toBe(0)
  expect(originalOffset(2)).toBeNull()
  expect(originalOffset(3)).toBeNull()
  expect(originalOffset(4)).toBe(1)
  expect(originalOffset(6)).toBe(4)
})

test("source ranges сохраняют явную копию внутри замены при последующем удалении imports", () => {
  // abcdef -> XcdYef -> cdYef
  const first = sourceRangesForEdits(6, [{
    start: 0, end: 4, text: "XcdY",
    copies: [{generatedStart: 1, generatedEnd: 3, sourceStart: 2}],
  }])
  const next = sourceRangesForEdits(6, [{start: 0, end: 1, text: ""}])
  expect(composeSourceRanges(next, first)).toEqual([
    {generatedStart: 0, generatedEnd: 2, sourceStart: 2},
    {generatedStart: 3, generatedEnd: 5, sourceStart: 4},
  ])
})

test("ready constructor render сохраняет исходные callee и receiver, но не generated JSX", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".source-text-"))
  const path = join(directory, "scenario.tsx")
  const source = `import {createDomRoot} from "@zavx0z/immersive"
import Counter from "./counter.js"
export function show(parent: Parameters<typeof createDomRoot>[0], props: {label: string}) {
  const root = createDomRoot(parent)
  root.render(
    <Counter label={props.label} />
  )
  root
    .render(
      <Counter {...props} />
    )
  createDomRoot(parent).render(
    <Counter label={props.label} />
  )
}
`
  await Bun.write(path, source)
  await Bun.write(join(directory, "counter.d.ts"), `import type {CompiledDOMComponent, JSX} from "@zavx0z/immersive/XReact"
declare const Counter: CompiledDOMComponent<{label: string}, JSX.Element>
export default Counter
`)
  await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({
    extends: "../../../../../tsconfig.json",
    compilerOptions: {jsxImportSource: "@zavx0z/immersive/XReact"},
    files: ["scenario.tsx"],
  }))
  await mkdir(join(directory, "node_modules/@zavx0z"), {recursive: true})
  await symlink(resolve(import.meta.dir, "../../../.."), join(directory, "node_modules/@zavx0z/immersive"))
  const session = new JsxCompilerSession({
    cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [path],
    sourceFiles: [path], customConditions: [],
  })
  try {
    const result = await session.compileFile(path, source)
    const originalOffset = (offset: number) => {
      const range = result.sourceRanges.find(range => range.generatedStart <= offset && offset < range.generatedEnd)
      return range === undefined ? null : range.sourceStart + offset - range.generatedStart
    }
    const first = result.code.indexOf("root.render(")
    expect(first).toBeGreaterThanOrEqual(0)
    expect(originalOffset(first)).toBe(source.indexOf("root.render("))
    expect(originalOffset(first + 5)).toBe(source.indexOf("root.render(") + 5)
    const spread = result.code.indexOf("root.render(", first + 1)
    expect(spread).toBeGreaterThan(first)
    expect(originalOffset(spread)).toBe(source.indexOf("root\n    .render("))
    expect(originalOffset(spread + 5)).toBe(source.indexOf(".render(", source.indexOf("root\n")) + 1)
    const direct = result.code.indexOf("createDomRoot(parent).render(")
    expect(direct).toBeGreaterThanOrEqual(0)
    expect(originalOffset(direct)).toBe(source.indexOf("createDomRoot(parent).render("))
    expect(originalOffset(direct + "createDomRoot(parent).".length)).toBe(source.indexOf("createDomRoot(parent).render(") + "createDomRoot(parent).".length)
    expect(originalOffset(first + "root.render(".length)).toBeNull()
    expect(result.code).not.toContain("<Counter")
    for (const range of result.sourceRanges) {
      expect(result.code.slice(range.generatedStart, range.generatedEnd)).toBe(source.slice(range.sourceStart, range.sourceStart + range.generatedEnd - range.generatedStart))
    }
  } finally {
    await session.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

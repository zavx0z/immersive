import {expect, test} from "bun:test"
import {mkdtemp, readFile, rm} from "node:fs/promises"
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

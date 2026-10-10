import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {createDocument, Event} from "@zavx0z/immersive-dom"
import JsxCompilerSession from "../index.ts"

test("готовый custom hook подтверждается compiler nominal .d.ts без компиляции чужого исходника", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".ready-hook-"))
  const source = join(directory, "consumer.tsx")
  const readySource = join(directory, "ready/source.ts")
  await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: "../../../../../tsconfig.json", include: ["**/*.ts", "**/*.tsx"]}))
  await Bun.write(readySource, `
import {useState} from "@zavx0z/immersive-component/authoring"
export function usePublished(initial: number) {
  const [count, setCount] = useState(initial)
  return {count, increment: () => setCount(value => value + 1)}
}
`)
  await Bun.write(source, `
import {usePublished} from "./ready/index.js"
export function Counter(props: {initial: number}) {
  const counter = usePublished(props.initial)
  return <button onClick={counter.increment}>{counter.count}</button>
}
`)
  const declaration = `
import type {CompiledHookFactory} from "@zavx0z/immersive-jsx-compiler-session"
import type {Result} from "./contract.js"
export declare const usePublished: CompiledHookFactory<(initial: number) => Result>
`
  await Bun.write(join(directory, "ready/index.d.ts"), declaration)
  const contract = join(directory, "ready/contract.d.ts")
  await Bun.write(contract, "export type Result = {count: number, increment(): void}\n")
  const producer = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [readySource]})
  const consumer = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [source]})
  try {
    const ready = await producer.compileFile(readySource)
    await Bun.write(join(directory, "ready/index.js"), new Bun.Transpiler({loader: "ts"}).transformSync(ready.code))
    const first = await consumer.compileFile(source)
    expect(await consumer.compileFile(source)).toBe(first)
    expect(consumer.accepts(readySource)).toBeFalse()
    await expectRejected(consumer.compileFile(readySource), "outside the governed JSX roots")
    const output = join(directory, "consumer.js")
    await Bun.write(output, new Bun.Transpiler({loader: "ts"}).transformSync(first.code))
    const {Counter} = await import(pathToFileURL(output).href)
    const document = createDocument()
    const host = document.createElement("div")
    document.append(host)
    const instance = new Counter(document, {initial: 2})
    host.append(instance)
    instance.dispatchEvent(new Event("click"))
    expect(instance.textContent).toBe("3")
    instance.props = {initial: 999}
    expect(instance.textContent).toBe("3")
    instance.dispose()
    await Bun.write(contract, "export type Result = {count: number, increment(): void, revision?: number}\n")
    expect(await consumer.compileFile(source)).not.toBe(first)
    for (const fake of [
      "declare const compiledHookFactoryBrand: unique symbol\nexport declare const usePublished: ((initial: number) => Result) & {readonly [compiledHookFactoryBrand]: true}",
      "export declare const usePublished: ((initial: number) => Result) & Partial<CompiledHookFactory<(initial: number) => Result>>",
    ]) {
      await Bun.write(join(directory, "ready/index.d.ts"), `import type {CompiledHookFactory} from "@zavx0z/immersive-jsx-compiler-session"\nimport type {Result} from "./contract.js"\n${fake}\n`)
      await expectRejected(consumer.compileFile(source), "does not resolve to a governed custom hook")
    }
  } finally {
    await producer.close()
    await consumer.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

async function expectRejected(result: Promise<unknown>, message: string) {
  const error = await result.then(() => null, error => error)
  expect(error).toBeInstanceOf(Error)
  expect(error instanceof Error ? error.message : "").toContain(message)
}

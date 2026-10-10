import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"

test("persistent plugins не перехватывают чужие roots и возвращают object для обычного TS", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".runtime-scope-"))
  const root = resolve(import.meta.dir, "../../../..")
  try {
    await Bun.write(join(directory, "first/plain.ts"), "export const value: number = 42\n")
    const commonJs = join(directory, "first/node_modules/published-cjs/index.js")
    await Bun.write(commonJs, "module.exports = function() { return 42 }\n")
    await Bun.write(join(directory, "first/node_modules/published-cjs/package.json"), JSON.stringify({name: "published-cjs", type: "commonjs", main: "./index.js"}))
    await Bun.write(join(directory, "second/counter.tsx"), 'export function Counter(props: {label: string}) { return <button>{props.label}</button> }\n')
    for (const name of ["first", "second"]) await Bun.write(join(directory, name, "tsconfig.json"), JSON.stringify({extends: join(root, "tsconfig.json"), include: ["*.ts", "*.tsx"]}))
    const source = `
import assert from "node:assert/strict"
import createPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import Session from "@zavx0z/immersive-jsx-compiler-session"
import {createDocument} from "@zavx0z/immersive-dom"
const sessions = []
for (const sourceRoot of ${JSON.stringify([join(directory, "first"), join(directory, "second")])}) {
  const session = new Session({cwd: ${JSON.stringify(root)}, sourceRoots: [sourceRoot]})
  sessions.push(session)
  Bun.plugin(createPlugin({session, sourceRoots: [sourceRoot], persistent: true}))
}
try {
assert.equal((await import(${JSON.stringify(join(directory, "first/plain.ts"))})).value, 42)
assert.equal((await import(${JSON.stringify(commonJs)})).default(), 42)
const {Counter} = await import(${JSON.stringify(join(directory, "second/counter.tsx"))})
const document = createDocument()
const element = new Counter(document, {label: "native"})
assert.equal(element.textContent, "native")
element.dispose()
} finally { for (const session of sessions) await session.close() }
`
    const process = Bun.spawn([Bun.which("bun")!, "--eval", source], {cwd: root, stdout: "pipe", stderr: "pipe"})
    const [status, error] = await Promise.all([process.exited, new Response(process.stderr).text()])
    expect(status, error).toBe(0)
  } finally { await rm(directory, {recursive: true, force: true}) }
}, 30000)

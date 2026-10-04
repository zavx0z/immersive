import {expect, test} from "bun:test"
import {mkdtemp, rm, writeFile} from "node:fs/promises"
import {join, resolve} from "node:path"
import JsxCompilerSession from "../index"

test.each(["compileFile", "refreshFiles"] as const)("%s использует новый текст открытого TSX без перезапуска сессии", async mode => {
  const root = await mkdtemp(join(import.meta.dir, ".source-update-"))
  const path = join(root, "component.tsx")
  const source = (text: string) => `export function Example() {\n  return <div>\n    ${text}\n  </div>\n}\n`
  await writeFile(join(root, "tsconfig.json"), JSON.stringify({extends: "../../../../../tsconfig.json", include: ["*.tsx"]}))
  const session = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [root]})
  try {
    await writeFile(path, source("before"))
    const before = await session.compileFile(path)
    expect(before.code).toContain("before")
    await writeFile(path, source("after"))
    if (mode === "refreshFiles") await session.refreshFiles([path])
    const after = await session.compileFile(path)
    expect(after.code).toContain("after")
    expect(after.code).not.toContain("before")
    expect(await session.compileFile(path)).toBe(after)
    await writeFile(path, source("again"))
    const again = await session.compileFile(path)
    expect(again.code).toContain("again")
    expect(again.code).not.toContain("after")
  } finally {
    await session.close()
    await rm(root, {recursive: true, force: true})
  }
}, 30000)

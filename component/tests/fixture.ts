import {afterAll} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"

const directory = await mkdtemp(join(import.meta.dir, ".compiled-"))
const source = join(import.meta.dir, "components.fixture.tsx")
const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../.."), sourceRoots: [source]})
let components: Record<string, any>
try {
  const result = await compiler.compileFile(source)
  const output = join(directory, "components.ts")
  await Bun.write(output, result.code)
  components = await import(pathToFileURL(output).href)
} catch (error) {
  await rm(directory, {recursive: true, force: true})
  throw error
} finally { await compiler.close() }
afterAll(() => rm(directory, {recursive: true, force: true}))

export {components}

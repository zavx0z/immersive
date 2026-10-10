import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"
import type {DOMComponentConstructor} from "@zavx0z/immersive-dom"

const directory = await mkdtemp(join(import.meta.dir, ".native-components-"))
const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../.."), sourceRoots: [import.meta.dir]})
let components: Record<string, DOMComponentConstructor<any>>
try {
  const compiled = await compiler.compileFile(join(import.meta.dir, "native-components.fixture.tsx"))
  if (/from ["']@zavx0z\/immersive(?:\/XReact|-component|-template)/.test(compiled.code)) throw new Error("Native Browser fixture imported an authoring runtime")
  const target = join(directory, "ready.js")
  await Bun.write(target, new Bun.Transpiler({loader: "ts"}).transformSync(compiled.code))
  components = await import(pathToFileURL(target).href)
} finally {
  await compiler.close()
  await rm(directory, {force: true, recursive: true})
}
export const nativeComponents = components!

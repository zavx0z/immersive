import {expect, test} from "bun:test"
import {mkdtemp, mkdir, rm, writeFile} from "node:fs/promises"
import {join, resolve} from "node:path"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"

test("изменение только правил слотов не повторяет проверку при компиляции готового компонента", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".slot-types-"))
  const authored = join(directory, "authored")
  const definitions = join(directory, "definitions")
  await mkdir(authored)
  await mkdir(definitions)
  await writeFile(join(directory, "tsconfig.json"), JSON.stringify({extends: "../../../../../tsconfig.json", include: ["**/*.ts", "**/*.tsx"]}))
  await writeFile(join(authored, "buttons.tsx"), `
export function Button(props: {text: string}) { return <button>{props.text}</button> }
export function OtherButton(props: {text: string}) { return <button>{props.text}</button> }
`)
  const allowed = join(definitions, "allowed.ts")
  await writeFile(allowed, 'import type {Button} from "../authored/buttons"\nexport type Allowed = typeof Button\n')
  await writeFile(join(definitions, "public.ts"), 'export type {Allowed as Action} from "./allowed"\n')
  await writeFile(join(definitions, "panel.ts"), 'import type {Action} from "./public"\nexport interface PanelSlots {default: Action}\n')
  await writeFile(join(authored, "panel.tsx"), `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {PanelSlots} from "../definitions/panel"
export function Panel(): JSX.Element<PanelSlots> { return <section><slot /></section> }
`)
  const entry = join(authored, "app.tsx")
  await writeFile(entry, `
import {Panel} from "./panel"
import {Button} from "./buttons"
export function App() { return <Panel><Button text="Первый" /></Panel> }
`)
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [authored]})
  try {
    const accepted = await compiler.compileFile(entry)
    expect(await compiler.compileFile(entry)).toBe(accepted)
    const receiver = await compiler.compileFile(join(authored, "panel.tsx"))
    const emitted = new Bun.Transpiler({loader: "ts"}).transformSync(receiver.code)
    expect(emitted).not.toContain("definitions")
    expect(emitted).not.toContain("buttons")
    await writeFile(allowed, 'import type {OtherButton} from "../authored/buttons"\nexport type Allowed = typeof OtherButton\n')
    expect(await compiler.compileFile(entry), "Схема проверяется сценарием, готовый код не содержит её runtime-представления")
      .toBe(accepted)
    expect(compiler.stats.cacheHits).toBeGreaterThan(0)
  } finally {
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30_000)

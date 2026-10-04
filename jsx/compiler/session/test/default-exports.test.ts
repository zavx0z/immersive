import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import {createDocument} from "@zavx0z/immersive-dom"
import {createRoot} from "@zavx0z/immersive-component"

test("default компонента и именованный API домена сохраняют template, слоты и состояние", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".imports-"))
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const root = createRoot(host)
  try {
    await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({
      extends: "../../../../../tsconfig.json",
      include: ["*.ts", "*.tsx"],
    }))
    await Bun.write(join(directory, "label.tsx"), `
import {useMemo} from "@zavx0z/immersive-component"
export default function useLabel(label: string) {
  return useMemo(() => label, [label])
}
`)
    await Bun.write(join(directory, "button.tsx"), `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import useLabel from "./label"
export interface ButtonProps {label: string}
export default function Button(props: ButtonProps): JSX.Element {
  const label = useLabel(props.label)
  return (
    <button>
      {label}
    </button>
  )
}
`)
    await Bun.write(join(directory, "panel.tsx"), `
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import Button from "./button"
export default function Panel(): JSX.Element<{header: typeof Button}> {
  return (
    <section>
      <slot name="header" />
    </section>
  )
}
`)
    await Bun.write(join(directory, "domain.ts"), `
export {default as Action} from "./button"
export type {ButtonProps as ActionProps} from "./button"
export {default as Panel} from "./panel"
`)
    await Bun.write(join(directory, "app.tsx"), `
import Direct from "./button"
import {Action, Panel, type ActionProps} from "./domain"
export {Direct, Action}
export default function App(props: ActionProps) {
  return (
    <article>
      <Panel>
        <Action
          slot="header"
          label={props.label}
        />
      </Panel>
      <Direct label={props.label} />
    </article>
  )
}
`)
    const result = await Bun.build({
      entrypoints: [join(directory, "app.tsx")],
      target: "bun",
      packages: "external",
      plugins: [createJsxBunPlugin({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [directory]})],
    })
    expect(result.success).toBeTrue()
    const output = join(directory, "compiled.js")
    await Bun.write(output, await result.outputs[0]!.text())
    const module = await import(pathToFileURL(output).href)
    expect(module.Direct).toBe(module.Action)
    expect(module.Direct.displayName).toBe("Button")
    root.render(module.default, {label: "До"})
    const button = host.querySelector("button")
    expect(button?.textContent).toBe("До")
    expect(host.querySelectorAll("button")).toHaveLength(2)
    root.render(module.default, {label: "После"})
    expect(host.querySelector("button")).toBe(button)
    expect(button?.textContent).toBe("После")
  } finally {
    root.unmount()
    await rm(directory, {recursive: true, force: true})
  }
}, 60_000)

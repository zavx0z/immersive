import {expect, test} from "bun:test"
import {dirname, resolve} from "node:path"
import * as ui from "@zavx0z/ui"
import Button from "@ui-buttons/button"
import TextField from "@ui-fields/text-field"
import MenuItem from "@ui-menus/menu-item"
import Notification from "@ui-feedback/notification"
import Window from "@ui-surfaces/window"
import WindowControl from "@ui-surfaces-window/control"
import List from "@ui-views/list"
import Tree from "@ui-widgets/tree"

const packageRoot = resolve(import.meta.dir, "..")

async function manifests() {
  const result: Array<{directory: string; manifest: Record<string, any>}> = []
  for await (const file of new Bun.Glob("**/package.json").scan({cwd: packageRoot})) {
    if (/(?:^|\/)(?:node_modules|spec|test|tests|fixture|fixtures)(?:\/|$)/u.test(file)) continue
    result.push({directory: dirname(file), manifest: await Bun.file(resolve(packageRoot, file)).json()})
  }
  return result
}

test("UI публикует именованные компоненты, типовой протокол и ресурсы", async () => {
  const manifest = await Bun.file(resolve(packageRoot, "package.json")).json()
  expect(manifest.name).toBe("@zavx0z/ui")
  expect(manifest.exports).toEqual({
    ".": "./index.ts",
    "./contract": "./contract/index.ts",
    "./theme/theme.css": "./theme/theme.css",
    "./theme/field-metrics.json": "./theme/field-metrics.json",
    "./theme/islands-dark.color-theme.json": "./theme/islands-dark.color-theme.json",
  })
  for (const [name, component] of Object.entries({Button, TextField, MenuItem, Notification, Window, WindowControl, List, Tree})) {
    expect(ui[name as keyof typeof ui], `Сохраняется исходная реализация ${name}`).toBe(component)
  }
  for (const name of ["default", "CodeEditorModel", "TerminalModel", "uiIcons", "normalizeNumberValue"]) {
    expect(Object.hasOwn(ui, name), name).toBe(false)
  }
})

test("пакеты UI имеют собственные публичные входы и единый workspace Repo", async () => {
  const packages = await manifests()
  const names = packages.map(item => item.manifest.name)
  expect(new Set(names).size).toBe(names.length)
  for (const {directory, manifest} of packages) {
    expect(manifest.workspaces, directory).toBeUndefined()
    expect(manifest.packageManager, directory).toBeUndefined()
    expect(manifest.engines, directory).toBeUndefined()
    expect(manifest.description, directory).toMatch(/\S/u)
    const entry = manifest.exports["."]
    expect(entry, directory).toMatch(/^\.\/index\.tsx?$/u)
    const source = await Bun.file(resolve(packageRoot, directory, entry)).text()
    expect(source, directory).toContain("@packageDocumentation")
    if (/^export default\b/mu.test(source)) {
      expect(Object.keys(manifest.exports), directory).toEqual(["."])
      expect(source.match(/^export default\b/gmu), directory).toHaveLength(1)
      expect(source, directory).not.toMatch(/^export (?:function|class|const|let|var)\b/mu)
    } else {
      expect(source, directory).not.toMatch(/^(?:export )?(?:function|class|const|let|var)\b/mu)
    }
    for (const target of Object.values(manifest.exports)) {
      expect(typeof target, directory).toBe("string")
      expect(await Bun.file(resolve(packageRoot, directory, target as string)).exists(), `${directory}: ${target}`).toBe(true)
    }
  }
})

test("UI сохраняет границу платформы во всех производственных пакетах", async () => {
  const forbidden = ["@zavx0z/browser", "@zavx0z/engine", "@nodes/layout", "@immersive/nodes", "@nodes/tree", "@renderer/html", "@zavx0z/space", "@zavx0z/webgpu"]
  for (const {directory, manifest} of await manifests()) {
    for (const name of forbidden) {
      expect(manifest.dependencies?.[name], directory).toBeUndefined()
      expect(manifest.peerDependencies?.[name], directory).toBeUndefined()
    }
  }
  for await (const file of new Bun.Glob("**/*.{ts,tsx}").scan({cwd: packageRoot})) {
    if (/(?:^|\/)(?:node_modules|spec|test|tests|fixture|fixtures)(?:\/|$)/u.test(file) || file.includes(".fixture.")) continue
    const source = await Bun.file(resolve(packageRoot, file)).text()
    for (const [, module] of source.matchAll(/(?:from\s+|import\()\s*["']([^"']+)["']/gu)) {
      expect(forbidden.some(name => module === name || module!.startsWith(`${name}/`)), `${file}: ${module}`).toBe(false)
    }
  }
})

test("FieldGroup, ToggleButtonGroup и виджеты сохраняют предметных владельцев", async () => {
  for (const [directory, name] of [["field/group", "FieldGroup"], ["button/toggle-group", "ToggleButtonGroup"], ["widget/inspector", "Inspector"], ["widget/editor", "Editor"], ["widget/terminal", "Terminal"], ["widget/tree", "Tree"]]) {
    const source = await Bun.file(resolve(packageRoot, directory!, "index.tsx")).text()
    expect(source).toContain(`export default function ${name}(`)
  }
})

import {expect, test} from "bun:test"
import {resolve} from "node:path"
import JsxCompilerSession from "@jsx-compiler/session"

const root = resolve(import.meta.dir, "../..")
const uiRoot = resolve(root, "ui")

test("[UI-COMPILED-SURFACE-001] shared surface chrome is governed TSX rather than CSS transport", async () => {
  for (const [directory, owner] of [["owner", "SurfaceOwner"], ["header", "SurfaceHeader"], ["title", "SurfaceTitle"], ["navigation", "SurfaceNavigation"], ["body", "SurfaceBody"], ["button", "SurfaceButton"]]) {
    const source = await Bun.file(resolve(uiRoot, "surfaces/chrome", directory!, "index.tsx")).text()
    expect(source).toContain(`export default function ${owner}(`)
    expect(source).not.toMatch(/export const surface\w*Css/u)
  }

  const compiler = new JsxCompilerSession({cwd: root, sourceRoots: [uiRoot]})
  try {
    for (const relativePath of [
      "surfaces/window/index.tsx",
      "surfaces/frame/index.tsx",
      "views/timeline/index.tsx",
    ]) {
      const result = await compiler.compileFile(resolve(uiRoot, relativePath))
      expect(result.code).toContain('from "@zavx0z/component"')
    }
  } finally {
    await compiler.close()
  }
}, 30_000)

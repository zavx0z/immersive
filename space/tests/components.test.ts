import {describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"

const root = resolve(import.meta.dir, "../..")
const spaceRoot = resolve(root, "space")

const owners = Object.freeze([
  ["gizmo/grid.tsx", "xr-line-segments"],
  ["abstraction/asset.tsx", "xr-asset"],
  ["abstraction/group.tsx", "xr-group"],
  ["shape/mesh.tsx", "xr-mesh"],
  ["shape/line.tsx", "xr-line"],
  ["shape/line-segments.tsx", "xr-line-segments"],
  ["abstraction/text.tsx", "xr-text"],
  ["staging/light.tsx", "xr-light"],
  ["abstraction/animation.tsx", "xr-animation"],
  ["shape/geometry.tsx", "xr-geometry"],
  ["shader/material.tsx", "xr-material"],
] as const)

describe("Публичные пространственные компоненты", () => {
  test("компоненты экспортируются из разделов без плоских дублей", async () => {
    const manifest = await Bun.file(resolve(spaceRoot, "package.json")).json()
    const components = Object.entries(manifest.exports as Record<string, string>).filter(([, path]) => path.endsWith(".tsx"))
    expect(manifest.exports["./gizmo/grid"]).toBe("./gizmo/grid.tsx")
    expect(components.every(([path]) => path.split("/").length === 3)).toBe(true)
    expect(new Set(components.map(([, path]) => path)).size).toBe(components.length)
    expect([...new Bun.Glob("*.tsx").scanSync({cwd: spaceRoot})]).toEqual([])
  })

  test("[SPC-001] каждый Component создаёт точный semantic Element", async () => {
    const compiler = new JsxCompilerSession({cwd: root, sourceRoots: [spaceRoot]})
    try {
      for (const [file, tagName] of owners) {
        const result = await compiler.compileFile(resolve(spaceRoot, file))
        expect(result.code).toContain(`document.createElement("${tagName}")`)
        expect(result.code).toContain('from "@zavx0z/immersive-component"')
      }
    } finally {
      await compiler.close()
    }
  }, 30_000)
})

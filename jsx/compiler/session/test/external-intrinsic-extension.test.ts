import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {resolve} from "node:path"
import JsxCompilerSession from "@jsx-compiler/session"

test.each(["@jsx-compiler/session", "@zavx0z/jsx"])("compiles an external intrinsic through %s", async (typesModule) => {
  const root = await mkdtemp(resolve(tmpdir(), "template-xr-intrinsic-"))
  const sourcePath = resolve(root, "scene.tsx")
  await Bun.write(resolve(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      exactOptionalPropertyTypes: true,
      customConditions: ["node"],
      jsx: "preserve",
      jsxImportSource: "@zavx0z/jsx",
      lib: ["ESNext", "DOM"],
      module: "Preserve",
      moduleResolution: "bundler",
      noEmit: true,
      paths: {
        "@zavx0z/dom": [resolve(import.meta.dir, "../../../../dom/src/index.ts")],
        "@zavx0z/jsx/jsx-runtime": [resolve(import.meta.dir, "../../../runtime/index.ts")],
        "@jsx-compiler/session": [resolve(import.meta.dir, "../index.ts")],
        "@zavx0z/jsx": [resolve(import.meta.dir, "../../../index.ts")],
      },
      skipLibCheck: false,
      strict: true,
      target: "ESNext",
    },
    files: ["scene.tsx"],
  }))
  await Bun.write(sourcePath, [
    'import type {Element as SemanticElement} from "@zavx0z/dom"',
    `import type {JSX} from "${typesModule}"`,
    "",
    "interface XRElement extends SemanticElement {",
    "  exposure: number",
    "}",
    "",
    `declare module "${typesModule}" {`,
    "  namespace JSX {",
    "    interface IntrinsicElements {",
    '      "test-scene": JSX.IntrinsicProperties<XRElement>',
    "    }",
    "  }",
    "}",
    "",
    "export function Scene() {",
    "  return <test-scene",
    "    exposure={2}",
    "    onClick={event => {",
    "      const target: XRElement = event.currentTarget",
    "      void target",
    "    }}",
    "    ref={element => {",
    "      const target: XRElement | null = element",
    "      void target",
    "    }}",
    "  />",
    "}",
    "",
  ].join("\n"))

  const compiler = new JsxCompilerSession({cwd: root, sourceRoots: [root]})
  try {
    const result = await compiler.compileFile(sourcePath)
    expect(result.code).toContain('document.createElement("test-scene")')
    expect(result.code).toContain('from "@zavx0z/component"')
    expect(result.capabilityUsages).toContainEqual(expect.objectContaining({
      kind: "intrinsic-element",
      profile: "template-extension",
      tagName: "test-scene",
    }))
  } finally {
    await compiler.close()
    await rm(root, {force: true, recursive: true})
  }
}, 30_000)

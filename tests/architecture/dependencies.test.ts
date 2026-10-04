import {describe, test} from "bun:test"
import {dirname, extname, isAbsolute, join, relative, resolve, sep} from "node:path"
import {assertRequirement} from "../assert.ts"
import {readUiWorkspaces} from "./ui-workspaces"

const root = join(import.meta.dir, "../..")

const basePackageDirectories = Object.freeze({
  "@immersive/engine": "engine",
  "@immersive/dom": "dom",
  "@immersive/template": "template",
  "@immersive/jsx": "jsx",
  "@immersive-jsx/compiler": "jsx/compiler",
  "@immersive-jsx/runtime": "jsx/runtime",
  "@immersive-jsx/development": "jsx/development",
  "@immersive-jsx/slot": "jsx/slot",
  "@immersive-jsx-runtime/fragment": "jsx/runtime/fragment",
  "@immersive-jsx-runtime/create": "jsx/runtime/create",
  "@immersive-jsx-development/create": "jsx/development/create",
  "@immersive-jsx/event": "jsx/event",
  "@immersive-jsx-slot/plan": "jsx/slot/plan",
  "@immersive-jsx-slot/child": "jsx/slot/child",
  "@immersive-jsx-compiler/session": "jsx/compiler/session",
  "@immersive-jsx-compiler/bun": "jsx/compiler/bun",
  "@immersive-jsx-slot/authoring": "jsx/slot/authoring",
  "@immersive-jsx-compiler/error": "jsx/compiler/error",
  "@immersive-jsx-slot/contract": "jsx/slot/contract",
  "@immersive/component": "component",
  "@immersive/renderer": "renderer",
  "@immersive-renderer/html": "renderer/html",
  "@immersive/markdown": "markdown",
  "@immersive/typedoc": "typedoc",
  "@immersive/webgpu": "webgpu",
  "@immersive/browser": "browser",
  "@immersive/space": "space",
  "@immersive-ui/component": "ui",
  "@immersive-nodes/node": "nodes/node",
  "@immersive/headless": "headless",
  "@immersive-nodes/parameter": "nodes/parameter",
  "@immersive-nodes/socket": "nodes/socket",
  "@immersive-nodes/tree": "nodes/tree",
  "@immersive-nodes/layout": "nodes/layout",
  "@immersive/nodes": "nodes",
  "@immersive/devtool": "devtool",
} as const)

const uiWorkspaces = await readUiWorkspaces(root)
const uiNames = ["@immersive-ui/component", ...uiWorkspaces.map(([, name]) => name)]
const packageDirectories: Readonly<Record<string, string>> = Object.freeze({
  ...basePackageDirectories,
  ...Object.fromEntries(uiWorkspaces.map(([directory, name]) => [name, directory])),
})


type StorybookPackageName = keyof typeof packageDirectories

const packageNames = Object.freeze(Object.keys(packageDirectories) as StorybookPackageName[])

const baseAllowedInternalDependencies: Readonly<Record<StorybookPackageName, readonly StorybookPackageName[]>> =
  Object.freeze({
    "@immersive/engine": [],
    "@immersive/dom": [],
    "@immersive/template": ["@immersive/dom"],
    "@immersive/jsx": ["@immersive-jsx/runtime", "@immersive-jsx/development", "@immersive-jsx/slot", "@immersive-jsx-compiler/session", "@immersive-jsx/event", "@immersive-jsx/compiler"],
    "@immersive-jsx/compiler": ["@immersive-jsx-compiler/session", "@immersive-jsx-compiler/bun", "@immersive-jsx-compiler/error"],
    "@immersive-jsx/runtime": ["@immersive-jsx-runtime/create", "@immersive-jsx-runtime/fragment"],
    "@immersive-jsx/development": ["@immersive-jsx-development/create", "@immersive-jsx-runtime/fragment"],
    "@immersive-jsx/slot": ["@immersive-jsx-slot/plan", "@immersive-jsx-slot/child", "@immersive-jsx-slot/authoring", "@immersive-jsx-slot/contract"],
    "@immersive-jsx-runtime/fragment": [],
    "@immersive-jsx-runtime/create": ["@immersive-jsx-runtime/fragment", "@immersive-jsx-compiler/session", "@immersive-jsx-slot/plan", "@immersive-jsx-slot/child", "@immersive/component", "@immersive/template"],
    "@immersive-jsx-development/create": ["@immersive-jsx-runtime/create", "@immersive-jsx-compiler/session", "@immersive/component"],
    "@immersive-jsx/event": ["@immersive/dom"],
    "@immersive-jsx-slot/plan": [],
    "@immersive-jsx-slot/child": [],
    "@immersive-jsx-compiler/session": ["@immersive/dom", "@immersive-jsx/event", "@immersive-jsx-slot/plan", "@immersive-jsx-slot/contract", "@immersive-jsx-slot/authoring", "@immersive-jsx-compiler/error", "@immersive/template"],
    "@immersive-jsx-compiler/bun": ["@immersive-jsx-compiler/session"],
    "@immersive-jsx-slot/authoring": ["@immersive-jsx-slot/plan", "@immersive-jsx-compiler/error"],
    "@immersive-jsx-compiler/error": [],
    "@immersive-jsx-slot/contract": ["@immersive-jsx-slot/authoring", "@immersive-jsx-compiler/error"],
    "@immersive/component": ["@immersive/dom", "@immersive/template", "@immersive-jsx-compiler/session"],
    "@immersive/renderer": [],
    "@immersive-renderer/html": ["@immersive/dom"],
    "@immersive/typedoc": ["@immersive/component", "@immersive/template", "@immersive-ui/component", "@immersive/markdown", "@immersive/jsx"],
    "@immersive/markdown": ["@immersive/component", "@immersive/dom", "@immersive/template", "@immersive-ui/component", "@immersive-nodes/node", "@immersive-nodes/layout", "@immersive/nodes", "@immersive/jsx", "@immersive-jsx-compiler/session"],
    "@immersive/devtool": ["@immersive/dom", "@immersive-renderer/html"],
    "@immersive/webgpu": ["@immersive/engine", "@immersive-renderer/html"],
    "@immersive/browser": [
      "@immersive/component",
      "@immersive/template",
      "@immersive/dom",
      "@immersive/engine",
      "@immersive-renderer/html",
      "@immersive/space",
      "@immersive/webgpu",
      "@immersive-jsx-compiler/session",
    ],
    "@immersive/space": [
      "@immersive/component",
      "@immersive/dom",
      "@immersive/engine",
      "@immersive/template",
      "@immersive/jsx",
      "@immersive-jsx-compiler/session",
    ],
    "@immersive-ui/component": ["@immersive/component", "@immersive/dom", "@immersive/template", "@immersive/jsx"],
    "@immersive-nodes/node": ["@immersive-nodes/tree", "@immersive-nodes/parameter", "@immersive-nodes/socket", "@immersive/component", "@immersive/template", "@immersive-ui/component", "@immersive/jsx", "@immersive-jsx-compiler/session"],
    "@immersive/headless": ["@immersive-renderer/html", "@immersive/component", "@immersive/dom", "@immersive/engine", "@immersive/template", "@immersive-ui/component", "@immersive/webgpu", "@immersive/jsx", "@immersive-jsx-compiler/session", "@immersive-jsx-slot/child", "@immersive-jsx-compiler/bun"],
    "@immersive-nodes/parameter": ["@immersive-nodes/tree", "@immersive-nodes/socket", "@immersive/component", "@immersive/dom", "@immersive/template", "@immersive-ui/component", "@immersive/jsx"],
    "@immersive-nodes/socket": ["@immersive-nodes/tree", "@immersive/component", "@immersive/template", "@immersive/jsx"],
    "@immersive-nodes/tree": [],
    "@immersive-nodes/layout": [],
    "@immersive/nodes": [
      "@immersive-nodes/node",
      "@immersive-nodes/parameter",
      "@immersive-nodes/socket",
      "@immersive/component",
      "@immersive/dom",
      "@immersive-nodes/layout",
      "@immersive-nodes/tree",
      "@immersive/template",
      "@immersive-ui/component",
      "@immersive/jsx",
      "@immersive-jsx-compiler/session",
    ],
  })

type PackageManifest = Readonly<{
  dependencies?: Readonly<Record<string, string>>
  optionalDependencies?: Readonly<Record<string, string>>
  peerDependencies?: Readonly<Record<string, string>>
}>

type SourceImport = Readonly<{
  file: string
  packageName: StorybookPackageName
  specifier: string
}>

const sourceGlob = new Bun.Glob("**/*.{ts,tsx,js,jsx,mjs,cjs}")
const uiPlatform = ["@immersive/component", "@immersive/dom", "@immersive/template", "@immersive/jsx", "@immersive-jsx-compiler/session"]
const allowedInternalDependencies = Object.fromEntries(packageNames.map(name => [name,
  uiNames.includes(name) ? [...uiNames, ...uiPlatform] : [
    ...(baseAllowedInternalDependencies[name] ?? []),
    ...(baseAllowedInternalDependencies[name]?.includes("@immersive-ui/component") ? uiNames : []),
  ],
])) as Readonly<Record<string, readonly string[]>>

const excludedSourceSegments = new Set([
  "bench",
  "coverage",
  "dist",
  "node_modules",
  "test",
  "tests",
])
const sourceImportCache = new Map<StorybookPackageName, Promise<readonly SourceImport[]>>()

async function readManifest(packageName: StorybookPackageName): Promise<PackageManifest> {
  return Bun.file(join(root, packageDirectories[packageName]!, "package.json")).json()
}

function declaredDependencies(manifest: PackageManifest): ReadonlySet<string> {
  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ])
}

function internalPackageName(specifier: string): StorybookPackageName | null {
  for (const packageName of packageNames) {
    if (specifier === packageName || specifier.startsWith(`${packageName}/`)) {
      return packageName
    }
  }
  return null
}

function isProductionSource(file: string): boolean {
  return !/\.(?:test|spec|fixture)\.[cm]?[jt]sx?$/u.test(file) &&
    !file.split("/").some(segment => excludedSourceSegments.has(segment))
}

function loaderFor(file: string): "js" | "jsx" | "ts" | "tsx" {
  switch (extname(file)) {
    case ".jsx": return "jsx"
    case ".tsx": return "tsx"
    case ".ts": return "ts"
    default: return "js"
  }
}

function scanPackageImports(packageName: StorybookPackageName): Promise<readonly SourceImport[]> {
  const cached = sourceImportCache.get(packageName)
  if (cached) return cached
  const scanning = scanPackageImportsUncached(packageName)
  sourceImportCache.set(packageName, scanning)
  return scanning
}

function belongsToPackage(packageName: StorybookPackageName, file: string): boolean {
  const packageRoot = resolve(root, packageDirectories[packageName]!)
  return !Object.values(packageDirectories).some(directory =>
    directory !== packageDirectories[packageName]! && resolve(packageRoot, file).startsWith(resolve(root, directory) + sep))
}

async function scanPackageImportsUncached(
  packageName: StorybookPackageName,
): Promise<readonly SourceImport[]> {
  const packageRoot = join(root, packageDirectories[packageName]!)
  const imports: SourceImport[] = []
  for await (const file of sourceGlob.scan({cwd: packageRoot, onlyFiles: true})) {
    if (!isProductionSource(file)) continue
    if (!belongsToPackage(packageName, file)) continue
    const source = await Bun.file(join(packageRoot, file)).text()
    const transpiler = new Bun.Transpiler({loader: loaderFor(file)})
    for (const sourceImport of transpiler.scanImports(source)) {
      imports.push(Object.freeze({
        file,
        packageName,
        specifier: sourceImport.path,
      }))
    }
  }
  return Object.freeze(imports)
}

async function internalDependencyGraph(): Promise<ReadonlyMap<StorybookPackageName, readonly StorybookPackageName[]>> {
  const graph = new Map<StorybookPackageName, readonly StorybookPackageName[]>()
  for (const packageName of packageNames) {
    const dependencies = new Set((await scanPackageImports(packageName)).map(item => item.specifier))
    graph.set(
      packageName,
      Object.freeze([...dependencies]
        .map(internalPackageName)
        .filter((dependency): dependency is StorybookPackageName => dependency !== null && dependency !== packageName)),
    )
  }
  return graph
}

describe("Направление производственных зависимостей", () => {
  test("[PKG-003] производственные зависимости пакетов не образуют циклов", async () => {
    const graph = await internalDependencyGraph()
    const visiting = new Set<StorybookPackageName>()
    const visited = new Set<StorybookPackageName>()

    const visit = (packageName: StorybookPackageName, path: readonly StorybookPackageName[]): void => {
      if (visited.has(packageName)) return
      assertRequirement(
        !visiting.has(packageName),
        "PKG-003",
        `обнаружен цикл: ${[...path, packageName].join(" -> ")}`,
      )
      visiting.add(packageName)
      for (const dependency of graph.get(packageName) ?? []) {
        visit(dependency, [...path, packageName])
      }
      visiting.delete(packageName)
      visited.add(packageName)
    }

    for (const packageName of packageNames) visit(packageName, [])
  })

  test("[PKG-004] пакет не импортирует внутренний src другого пакета", async () => {
    for (const packageName of packageNames) {
      const packageRoot = join(root, packageDirectories[packageName]!)
      for (const sourceImport of await scanPackageImports(packageName)) {
        const importedPackage = internalPackageName(sourceImport.specifier)
        if (importedPackage && importedPackage !== packageName) {
          const subpath = sourceImport.specifier.slice(importedPackage.length)
          assertRequirement(
            !/^\/src(?:\/|$)/u.test(subpath),
            "PKG-004",
            `${packageName}/${sourceImport.file} импортирует внутренний ${sourceImport.specifier}`,
          )
        }

        if (!sourceImport.specifier.startsWith(".")) continue
        const resolvedImport = resolve(packageRoot, dirname(sourceImport.file), sourceImport.specifier)
        for (const otherPackage of packageNames) {
          if (otherPackage === packageName) continue
          const otherSourceRoot = join(root, packageDirectories[otherPackage]!, "src")
          const pathFromOtherSource = relative(otherSourceRoot, resolvedImport)
          const pointsInsideOtherSource = pathFromOtherSource === "" || (
            pathFromOtherSource !== ".." &&
            !pathFromOtherSource.startsWith(`..${sep}`) &&
            !isAbsolute(pathFromOtherSource)
          )
          assertRequirement(
            !pointsInsideOtherSource,
            "PKG-004",
            `${packageName}/${sourceImport.file} обходит public export ${otherPackage}`,
          )
        }
      }
    }
  })

  test("[PKG-005] Engine не зависит от DOM, UI, Node и WebGPU", async () => {
    const dependencies = declaredDependencies(await readManifest("@immersive/engine"))
    for (const forbidden of [
      "@immersive/dom",
      "@immersive-ui/component",
      "@immersive-nodes/tree",
      "@immersive/nodes",
      "@immersive/webgpu",
    ]) {
      assertRequirement(
        !dependencies.has(forbidden),
        "PKG-005",
        `@immersive/engine не должен зависеть от ${forbidden}`,
      )
    }
  })

  test("[PKG-006] UI не зависит от Engine, Renderer, WebGPU и Nodes", async () => {
    for (const name of uiNames) {
      const dependencies = declaredDependencies(await readManifest(name))
      for (const forbidden of ["@immersive/browser", "@immersive/engine", "@immersive-renderer/html", "@immersive/webgpu", "@immersive/nodes", "@immersive-nodes/tree", "@immersive/space"]) {
        assertRequirement(!dependencies.has(forbidden), "PKG-006", `${name} не должен зависеть от ${forbidden}`)
      }
    }
  })

  test("[PKG-007] Nodes не создаёт Document, Canvas, Renderer и Space", async () => {
    const forbiddenConstructions = [
      ["Document", /\b(?:createDocument|new\s+Document)\s*\(/u],
      ["Canvas", /(?:<canvas(?:\s|>)|\bnew\s+(?:Offscreen)?Canvas\s*\(|\.createElement\s*\(\s*["'`]canvas["'`])/u],
      ["Renderer", /\b(?:createDocumentRenderer|createRenderer|new\s+[A-Za-z]*Renderer)\s*\(/u],
      ["Space", /(?:<space(?:\s|>)|\b(?:createSpace|new\s+Space)\s*\()/u],
    ] as const

    for (const packageName of packageNames.filter(name => name === "@immersive/nodes" || /^@immersive-nodes(?:-|\/)/u.test(name))) {
      const packageRoot = join(root, packageDirectories[packageName]!)
      for await (const file of sourceGlob.scan({cwd: packageRoot, onlyFiles: true})) {
        if (!isProductionSource(file) || !belongsToPackage(packageName, file)) continue
        const source = await Bun.file(join(packageRoot, file)).text()
        for (const [owner, pattern] of forbiddenConstructions) {
          assertRequirement(
            !pattern.test(source),
            "PKG-007",
            `${packageName}/${file} содержит создание владельца ${owner}`,
          )
        }
      }
    }
  })

  test("[PKG-008] сборка, тесты, файлы и процессы используют нативный Bun API там, где он применим", async () => {
    const manifests = [
      ["root", await Bun.file(join(root, "package.json")).json()],
      ...await Promise.all(packageNames.map(async packageName => [
        packageName,
        await Bun.file(join(root, packageDirectories[packageName]!, "package.json")).json(),
      ] as const)),
    ] as const

    for (const [owner, manifest] of manifests) {
      const scripts = (manifest as {scripts?: Readonly<Record<string, string>>}).scripts ?? {}
      for (const [name, command] of Object.entries(scripts)) {
        if (/^(?:build|check|test)(?::|$)/u.test(name)) {
          assertRequirement(
            command.startsWith("bun "),
            "PKG-008",
            `${owner} script ${name} должен запускаться через Bun: ${command}`,
          )
        }
        assertRequirement(
          !/(?:^|\s)(?:deno|node|npm|npx|pnpm|yarn|cp|find|grep|mv|rm)(?:\s|$)/u.test(command),
          "PKG-008",
          `${owner} script ${name} обходит Bun внешней командой: ${command}`,
        )
      }
    }

    const rootScripts = (manifests[0][1] as {
      scripts: Readonly<Record<string, string>>
    }).scripts
    assertRequirement(
      rootScripts.typecheck?.includes("bun run --parallel") === true &&
      rootScripts.test?.includes("bun run --parallel") === true &&
      rootScripts["test:packages"] === "bun run --workspaces --sequential test",
      "PKG-008",
      "Bun параллелит общие phases и тесты внутри пакета; package suites запускаются последовательно без двойной CPU-нагрузки",
    )

    for (const packageName of packageNames) {
      const manifest = await Bun.file(
        join(root, packageDirectories[packageName]!, "package.json"),
      ).json() as {scripts?: Readonly<Record<string, string>>; workspaces?: readonly string[]}
      if (manifest.scripts === undefined) {
        assertRequirement(Object.values(packageDirectories).some(path => path.startsWith(`${packageDirectories[packageName]!}/`)),
          "PKG-008", `${packageName} без scripts должен объединять пакеты из корневого workspace`)
        continue
      }
      const testPhases = (manifest.scripts.test ?? "").split(" && ")
      assertRequirement(
        testPhases.every(phase => phase.startsWith("bun test ") && phase.includes("--parallel")),
        "PKG-008",
        `${packageName} должен запускать каждую группу package tests нативным параллельным Bun test`,
      )
      assertRequirement(
        manifest.scripts.check === "bun run --parallel typecheck test",
        "PKG-008",
        `${packageName} должен параллельно запускать typecheck и test через Bun`,
      )
    }

    const packagesTest = await Bun.file(join(root, "tests/architecture/packages.test.ts")).text()
    assertRequirement(
      packagesTest.includes("Bun.Glob") && packagesTest.includes("Bun.file") &&
      !packagesTest.includes('node:fs'),
      "PKG-008",
      "проверка файловой структуры должна использовать Bun.Glob и Bun.file",
    )
  })

  test("[PKG-009] внутренние зависимости и импорты следуют принятому направлению графа", async () => {
    for (const packageName of packageNames) {
      const manifest = await readManifest(packageName)
      const declared = declaredDependencies(manifest)
      const allowed = new Set(allowedInternalDependencies[packageName])

      for (const dependency of declared) {
        const internalDependency = internalPackageName(dependency)
        if (!internalDependency || internalDependency === packageName) continue
        assertRequirement(
          allowed.has(internalDependency),
          "PKG-009",
          `${packageName} объявляет запрещённое направление к ${internalDependency}`,
        )
      }

      for (const sourceImport of await scanPackageImports(packageName)) {
        const importedPackage = internalPackageName(sourceImport.specifier)
        if (!importedPackage || importedPackage === packageName) continue
        assertRequirement(
          allowed.has(importedPackage),
          "PKG-009",
          `${packageName}/${sourceImport.file} импортирует запрещённый ${importedPackage}`,
        )
        assertRequirement(
          declared.has(importedPackage),
          "PKG-009",
          `${packageName}/${sourceImport.file} импортирует не объявленный ${importedPackage}`,
        )
      }
    }
  })
})

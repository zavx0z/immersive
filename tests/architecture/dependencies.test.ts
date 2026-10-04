import {describe, test} from "bun:test"
import {dirname, extname, isAbsolute, join, relative, resolve, sep} from "node:path"
import {assertRequirement} from "../assert.ts"
import {readUiWorkspaces} from "./ui-workspaces"

const root = join(import.meta.dir, "../..")

const basePackageDirectories = Object.freeze({
  "@zavx0z/immersive-engine": "engine",
  "@zavx0z/immersive-dom": "dom",
  "@zavx0z/immersive-template": "template",
  "@zavx0z/immersive-jsx": "jsx",
  "@zavx0z/immersive-jsx-compiler": "jsx/compiler",
  "@zavx0z/immersive-jsx-runtime": "jsx/runtime",
  "@zavx0z/immersive-jsx-development": "jsx/development",
  "@zavx0z/immersive-jsx-slot": "jsx/slot",
  "@zavx0z/immersive-jsx-runtime-fragment": "jsx/runtime/fragment",
  "@zavx0z/immersive-jsx-runtime-create": "jsx/runtime/create",
  "@zavx0z/immersive-jsx-development-create": "jsx/development/create",
  "@zavx0z/immersive-jsx-event": "jsx/event",
  "@zavx0z/immersive-jsx-slot-plan": "jsx/slot/plan",
  "@zavx0z/immersive-jsx-slot-child": "jsx/slot/child",
  "@zavx0z/immersive-jsx-compiler-session": "jsx/compiler/session",
  "@zavx0z/immersive-jsx-compiler-bun": "jsx/compiler/bun",
  "@zavx0z/immersive-jsx-slot-authoring": "jsx/slot/authoring",
  "@zavx0z/immersive-jsx-compiler-error": "jsx/compiler/error",
  "@zavx0z/immersive-jsx-slot-contract": "jsx/slot/contract",
  "@zavx0z/immersive-component": "component",
  "@zavx0z/immersive-renderer": "renderer",
  "@zavx0z/immersive-renderer-html": "renderer/html",
  "@zavx0z/immersive-markdown": "markdown",
  "@zavx0z/immersive-typedoc": "typedoc",
  "@zavx0z/immersive-webgpu": "webgpu",
  "@zavx0z/immersive-browser": "browser",
  "@zavx0z/immersive-space": "space",
  "@zavx0z/immersive-ui-component": "ui",
  "@zavx0z/immersive-nodes-node": "nodes/node",
  "@zavx0z/immersive-headless": "headless",
  "@zavx0z/immersive-nodes-parameter": "nodes/parameter",
  "@zavx0z/immersive-nodes-socket": "nodes/socket",
  "@zavx0z/immersive-nodes-tree": "nodes/tree",
  "@zavx0z/immersive-nodes-layout": "nodes/layout",
  "@zavx0z/immersive-nodes": "nodes",
  "@zavx0z/immersive-devtool": "devtool",
} as const)

const uiWorkspaces = await readUiWorkspaces(root)
const uiNames = ["@zavx0z/immersive-ui-component", ...uiWorkspaces.map(([, name]) => name)]
const packageDirectories: Readonly<Record<string, string>> = Object.freeze({
  ...basePackageDirectories,
  ...Object.fromEntries(uiWorkspaces.map(([directory, name]) => [name, directory])),
})


type Zavx0zStorybookPackageName = keyof typeof packageDirectories

const packageNames = Object.freeze(Object.keys(packageDirectories) as Zavx0zStorybookPackageName[])

const baseAllowedInternalDependencies: Readonly<Record<Zavx0zStorybookPackageName, readonly Zavx0zStorybookPackageName[]>> =
  Object.freeze({
    "@zavx0z/immersive-engine": [],
    "@zavx0z/immersive-dom": [],
    "@zavx0z/immersive-template": ["@zavx0z/immersive-dom"],
    "@zavx0z/immersive-jsx": ["@zavx0z/immersive-jsx-runtime", "@zavx0z/immersive-jsx-development", "@zavx0z/immersive-jsx-slot", "@zavx0z/immersive-jsx-compiler-session", "@zavx0z/immersive-jsx-event", "@zavx0z/immersive-jsx-compiler"],
    "@zavx0z/immersive-jsx-compiler": ["@zavx0z/immersive-jsx-compiler-session", "@zavx0z/immersive-jsx-compiler-bun", "@zavx0z/immersive-jsx-compiler-error"],
    "@zavx0z/immersive-jsx-runtime": ["@zavx0z/immersive-jsx-runtime-create", "@zavx0z/immersive-jsx-runtime-fragment"],
    "@zavx0z/immersive-jsx-development": ["@zavx0z/immersive-jsx-development-create", "@zavx0z/immersive-jsx-runtime-fragment"],
    "@zavx0z/immersive-jsx-slot": ["@zavx0z/immersive-jsx-slot-plan", "@zavx0z/immersive-jsx-slot-child", "@zavx0z/immersive-jsx-slot-authoring", "@zavx0z/immersive-jsx-slot-contract"],
    "@zavx0z/immersive-jsx-runtime-fragment": [],
    "@zavx0z/immersive-jsx-runtime-create": ["@zavx0z/immersive-jsx-runtime-fragment", "@zavx0z/immersive-jsx-compiler-session", "@zavx0z/immersive-jsx-slot-plan", "@zavx0z/immersive-jsx-slot-child", "@zavx0z/immersive-component", "@zavx0z/immersive-template"],
    "@zavx0z/immersive-jsx-development-create": ["@zavx0z/immersive-jsx-runtime-create", "@zavx0z/immersive-jsx-compiler-session", "@zavx0z/immersive-component"],
    "@zavx0z/immersive-jsx-event": ["@zavx0z/immersive-dom"],
    "@zavx0z/immersive-jsx-slot-plan": [],
    "@zavx0z/immersive-jsx-slot-child": [],
    "@zavx0z/immersive-jsx-compiler-session": ["@zavx0z/immersive-dom", "@zavx0z/immersive-jsx-event", "@zavx0z/immersive-jsx-slot-plan", "@zavx0z/immersive-jsx-slot-contract", "@zavx0z/immersive-jsx-slot-authoring", "@zavx0z/immersive-jsx-compiler-error", "@zavx0z/immersive-template"],
    "@zavx0z/immersive-jsx-compiler-bun": ["@zavx0z/immersive-jsx-compiler-session"],
    "@zavx0z/immersive-jsx-slot-authoring": ["@zavx0z/immersive-jsx-slot-plan", "@zavx0z/immersive-jsx-compiler-error"],
    "@zavx0z/immersive-jsx-compiler-error": [],
    "@zavx0z/immersive-jsx-slot-contract": ["@zavx0z/immersive-jsx-slot-authoring", "@zavx0z/immersive-jsx-compiler-error"],
    "@zavx0z/immersive-component": ["@zavx0z/immersive-dom", "@zavx0z/immersive-template", "@zavx0z/immersive-jsx-compiler-session"],
    "@zavx0z/immersive-renderer": [],
    "@zavx0z/immersive-renderer-html": ["@zavx0z/immersive-dom"],
    "@zavx0z/immersive-typedoc": ["@zavx0z/immersive-component", "@zavx0z/immersive-template", "@zavx0z/immersive-ui-component", "@zavx0z/immersive-markdown", "@zavx0z/immersive-jsx"],
    "@zavx0z/immersive-markdown": ["@zavx0z/immersive-component", "@zavx0z/immersive-dom", "@zavx0z/immersive-template", "@zavx0z/immersive-ui-component", "@zavx0z/immersive-nodes-node", "@zavx0z/immersive-nodes-layout", "@zavx0z/immersive-nodes", "@zavx0z/immersive-jsx", "@zavx0z/immersive-jsx-compiler-session"],
    "@zavx0z/immersive-devtool": ["@zavx0z/immersive-dom", "@zavx0z/immersive-renderer-html"],
    "@zavx0z/immersive-webgpu": ["@zavx0z/immersive-engine", "@zavx0z/immersive-renderer-html"],
    "@zavx0z/immersive-browser": [
      "@zavx0z/immersive-component",
      "@zavx0z/immersive-template",
      "@zavx0z/immersive-dom",
      "@zavx0z/immersive-engine",
      "@zavx0z/immersive-renderer-html",
      "@zavx0z/immersive-space",
      "@zavx0z/immersive-webgpu",
      "@zavx0z/immersive-jsx-compiler-session",
    ],
    "@zavx0z/immersive-space": [
      "@zavx0z/immersive-component",
      "@zavx0z/immersive-dom",
      "@zavx0z/immersive-engine",
      "@zavx0z/immersive-template",
      "@zavx0z/immersive-jsx",
      "@zavx0z/immersive-jsx-compiler-session",
    ],
    "@zavx0z/immersive-ui-component": ["@zavx0z/immersive-component", "@zavx0z/immersive-dom", "@zavx0z/immersive-template", "@zavx0z/immersive-jsx"],
    "@zavx0z/immersive-nodes-node": ["@zavx0z/immersive-nodes-tree", "@zavx0z/immersive-nodes-parameter", "@zavx0z/immersive-nodes-socket", "@zavx0z/immersive-component", "@zavx0z/immersive-template", "@zavx0z/immersive-ui-component", "@zavx0z/immersive-jsx", "@zavx0z/immersive-jsx-compiler-session"],
    "@zavx0z/immersive-headless": ["@zavx0z/immersive-renderer-html", "@zavx0z/immersive-component", "@zavx0z/immersive-dom", "@zavx0z/immersive-engine", "@zavx0z/immersive-template", "@zavx0z/immersive-ui-component", "@zavx0z/immersive-webgpu", "@zavx0z/immersive-jsx", "@zavx0z/immersive-jsx-compiler-session", "@zavx0z/immersive-jsx-slot-child", "@zavx0z/immersive-jsx-compiler-bun"],
    "@zavx0z/immersive-nodes-parameter": ["@zavx0z/immersive-nodes-tree", "@zavx0z/immersive-nodes-socket", "@zavx0z/immersive-component", "@zavx0z/immersive-dom", "@zavx0z/immersive-template", "@zavx0z/immersive-ui-component", "@zavx0z/immersive-jsx"],
    "@zavx0z/immersive-nodes-socket": ["@zavx0z/immersive-nodes-tree", "@zavx0z/immersive-component", "@zavx0z/immersive-template", "@zavx0z/immersive-jsx"],
    "@zavx0z/immersive-nodes-tree": [],
    "@zavx0z/immersive-nodes-layout": [],
    "@zavx0z/immersive-nodes": [
      "@zavx0z/immersive-nodes-node",
      "@zavx0z/immersive-nodes-parameter",
      "@zavx0z/immersive-nodes-socket",
      "@zavx0z/immersive-component",
      "@zavx0z/immersive-dom",
      "@zavx0z/immersive-nodes-layout",
      "@zavx0z/immersive-nodes-tree",
      "@zavx0z/immersive-template",
      "@zavx0z/immersive-ui-component",
      "@zavx0z/immersive-jsx",
      "@zavx0z/immersive-jsx-compiler-session",
    ],
  })

type PackageManifest = Readonly<{
  dependencies?: Readonly<Record<string, string>>
  optionalDependencies?: Readonly<Record<string, string>>
  peerDependencies?: Readonly<Record<string, string>>
}>

type SourceImport = Readonly<{
  file: string
  packageName: Zavx0zStorybookPackageName
  specifier: string
}>

const sourceGlob = new Bun.Glob("**/*.{ts,tsx,js,jsx,mjs,cjs}")
const uiPlatform = ["@zavx0z/immersive-component", "@zavx0z/immersive-dom", "@zavx0z/immersive-template", "@zavx0z/immersive-jsx", "@zavx0z/immersive-jsx-compiler-session"]
const allowedInternalDependencies = Object.fromEntries(packageNames.map(name => [name,
  uiNames.includes(name) ? [...uiNames, ...uiPlatform] : [
    ...(baseAllowedInternalDependencies[name] ?? []),
    ...(baseAllowedInternalDependencies[name]?.includes("@zavx0z/immersive-ui-component") ? uiNames : []),
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
const sourceImportCache = new Map<Zavx0zStorybookPackageName, Promise<readonly SourceImport[]>>()

async function readManifest(packageName: Zavx0zStorybookPackageName): Promise<PackageManifest> {
  return Bun.file(join(root, packageDirectories[packageName]!, "package.json")).json()
}

function declaredDependencies(manifest: PackageManifest): ReadonlySet<string> {
  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ])
}

function internalPackageName(specifier: string): Zavx0zStorybookPackageName | null {
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

function scanPackageImports(packageName: Zavx0zStorybookPackageName): Promise<readonly SourceImport[]> {
  const cached = sourceImportCache.get(packageName)
  if (cached) return cached
  const scanning = scanPackageImportsUncached(packageName)
  sourceImportCache.set(packageName, scanning)
  return scanning
}

function belongsToPackage(packageName: Zavx0zStorybookPackageName, file: string): boolean {
  const packageRoot = resolve(root, packageDirectories[packageName]!)
  return !Object.values(packageDirectories).some(directory =>
    directory !== packageDirectories[packageName]! && resolve(packageRoot, file).startsWith(resolve(root, directory) + sep))
}

async function scanPackageImportsUncached(
  packageName: Zavx0zStorybookPackageName,
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

async function internalDependencyGraph(): Promise<ReadonlyMap<Zavx0zStorybookPackageName, readonly Zavx0zStorybookPackageName[]>> {
  const graph = new Map<Zavx0zStorybookPackageName, readonly Zavx0zStorybookPackageName[]>()
  for (const packageName of packageNames) {
    const dependencies = new Set((await scanPackageImports(packageName)).map(item => item.specifier))
    graph.set(
      packageName,
      Object.freeze([...dependencies]
        .map(internalPackageName)
        .filter((dependency): dependency is Zavx0zStorybookPackageName => dependency !== null && dependency !== packageName)),
    )
  }
  return graph
}

describe("Направление производственных зависимостей", () => {
  test("[PKG-003] производственные зависимости пакетов не образуют циклов", async () => {
    const graph = await internalDependencyGraph()
    const visiting = new Set<Zavx0zStorybookPackageName>()
    const visited = new Set<Zavx0zStorybookPackageName>()

    const visit = (packageName: Zavx0zStorybookPackageName, path: readonly Zavx0zStorybookPackageName[]): void => {
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
    const dependencies = declaredDependencies(await readManifest("@zavx0z/immersive-engine"))
    for (const forbidden of [
      "@zavx0z/immersive-dom",
      "@zavx0z/immersive-ui-component",
      "@zavx0z/immersive-nodes-tree",
      "@zavx0z/immersive-nodes",
      "@zavx0z/immersive-webgpu",
    ]) {
      assertRequirement(
        !dependencies.has(forbidden),
        "PKG-005",
        `@zavx0z/immersive-engine не должен зависеть от ${forbidden}`,
      )
    }
  })

  test("[PKG-006] UI не зависит от Engine, Renderer, WebGPU и Nodes", async () => {
    for (const name of uiNames) {
      const dependencies = declaredDependencies(await readManifest(name))
      for (const forbidden of ["@zavx0z/immersive-browser", "@zavx0z/immersive-engine", "@zavx0z/immersive-renderer-html", "@zavx0z/immersive-webgpu", "@zavx0z/immersive-nodes", "@zavx0z/immersive-nodes-tree", "@zavx0z/immersive-space"]) {
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

    for (const packageName of packageNames.filter(name => name === "@zavx0z/immersive-nodes" || /^@zavx0z\/immersive-nodes(?:-|\/)/u.test(name))) {
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

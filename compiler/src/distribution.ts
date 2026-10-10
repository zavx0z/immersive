import {createHash} from "node:crypto"
import {mkdir, readFile, realpath, writeFile} from "node:fs/promises"
import {dirname, relative, resolve, sep} from "node:path"
import {pathToFileURL} from "node:url"
import {availableParallelism} from "node:os"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import {buildDeclarations} from "./declarations.ts"
import {distributionGraph, selectedDistributionGraph, sourceOwner} from "./distribution-graph.ts"
import {publicSourceExports, type SourceExport} from "./public-sources.ts"
import JsxCompilerSession, {createCompilerFileSystem} from "@zavx0z/immersive-jsx-compiler-session"
import {API} from "typescript/unstable/async"

type Entry = Readonly<{source: string; browser?: string; bun?: string}>
type BuildRecord = Readonly<{entrypoints: readonly string[]; sourceRoots: readonly string[]; splitting: boolean}>
type Metafile = NonNullable<Bun.BuildOutput["metafile"]> & {
  builds?: BuildRecord[]
  toolFiles?: readonly Readonly<{path: string; digest: string}>[]
}
type Inventory = Readonly<{
  schemaVersion: number
  name: string
  version: string
  entries: Readonly<Record<string, string>>
  sourceExports: Readonly<Record<string, readonly SourceExport[]>>
  files: readonly Readonly<{path: string; digest: string}>[]
}>

/**
Готовит один core и независимые публичные входы владельцев. При выборе entry
остальные готовые файлы подтверждаются прежним inventory и используются без
компиляции; новая запись inventory описывает полный согласованный граф.
*/
export default async function buildDistribution(root: string, outdir: string, selected?: string) {
  const started = performance.now()
  const manifest = await Bun.file(resolve(root, "package.json")).json() as {
    name: string; version: string; exports: Record<string, Entry | string>
  }
  const declared = Object.entries(manifest.exports).filter((entry): entry is [string, Entry] =>
    typeof entry[1] === "object" && typeof entry[1].source === "string")
  const specifier = (subpath: string) => `${manifest.name}${subpath === "." ? "" : subpath.slice(1)}`
  const browserEntries = declared.filter(([, entry]) => entry.browser)
  const serverEntries = declared.filter(([, entry]) => entry.bun)
  const browser = browserEntries.map(([path, entry]) => [specifier(path), resolve(root, entry.source)] as const)
  const previous = selected === undefined ? undefined : await Bun.file(resolve(outdir, "browser.json")).json() as Inventory
  const previousMetafile = previous === undefined ? undefined : await Bun.file(resolve(outdir, "metafile.json")).json() as Metafile
  const publishedSources = previous === undefined ? [] : [...new Set([
    ...browser.map(([, source]) => source), ...Object.values(previous.sourceExports).flat().map(entry => resolve(root, entry.source)),
  ])]
  const selection = selected === undefined ? undefined : publishedSources.find(source =>
    relative(root, source) === selected || source === resolve(root, selected) ||
    browser.some(([name, path]) => name === selected && path === source) ||
    Object.values(previous!.sourceExports).flat().some(entry => entry.specifier === selected && resolve(root, entry.source) === source))
  if (selected !== undefined && selection === undefined) throw new Error(`Unknown ready public distribution entry: ${selected}`)
  if (selection !== undefined && !previousMetafile!.builds?.some(build => !build.splitting && build.entrypoints.length === 1 && resolve(root, build.entrypoints[0]!) === selection)) {
    throw new Error("Selected component requires a complete independent distribution build first")
  }
  const serverSources = selection === undefined ? await publicSourceExports(root, serverEntries.map(([path, entry]) => [specifier(path), resolve(root, entry.source)] as const)) : {}
  const server = selection === undefined ? [...new Set([
    ...serverEntries.map(([, entry]) => resolve(root, entry.source)),
    ...Object.values(serverSources).flat().map(entry => resolve(root, entry.source)),
  ])] : []
  const graph = selection === undefined ? await distributionGraph(root, browser, server)
    : await selectedDistributionGraph(root, browser, previous!.sourceExports, selection)
  const allSources = [...new Set([...graph.entries, ...server])]
  const targets = new Map(allSources.map(source => [source, readyPath(root, outdir, source)]))
  if (selection !== undefined && !graph.independent.includes(selection)) {
    throw new Error(`Selected entry belongs to the shared core; rebuild the complete distribution: ${selected}`)
  }
  await mkdir(outdir, {recursive: true})
  if (previous) {
    if (previous.name !== manifest.name || previous.version !== manifest.version || previous.schemaVersion !== 1) {
      throw new Error("Selected component requires the same complete ready distribution identity")
    }
    for (const file of previous.files) {
      if (await digest(resolve(outdir, file.path)) !== file.digest) throw new Error(`Ready dependency changed outside its inventory: ${file.path}`)
    }
    if (!previousMetafile!.toolFiles) throw new Error("Selected component requires a complete ready compiler receipt")
    for (const file of previousMetafile!.toolFiles) {
      if (await digest(resolve(outdir, file.path)) !== file.digest) throw new Error(`Ready compiler changed outside its distribution: ${file.path}`)
    }
  }
  // Выбранный компонент использует compiler той же готовой поставки: source
  // compiler может уже требовать новый core ABI, который ещё не опубликован.
  const readyCompiler = serverEntries.find(([path]) => path === "./compiler")
  if (!readyCompiler) throw new Error("Distribution must declare its public compiler entry")
  const compilerPlugin: typeof createJsxBunPlugin = selection === undefined ? createJsxBunPlugin
    : (await import(pathToFileURL(readyPath(root, outdir, resolve(root, readyCompiler[1].source))).href)).default
  const readySession = serverEntries.find(([path]) => path === "./compiler/session")
  if (!readySession) throw new Error("Distribution must declare its public compiler session entry")
  const CompilerSession: typeof JsxCompilerSession = selection === undefined ? JsxCompilerSession
    : (await import(pathToFileURL(readyPath(root, outdir, resolve(root, readySession[1].source))).href)).default
  const sourceRecords = [...Object.values(graph.sourceExports).flat(), ...Object.values(serverSources).flat()]
  await validateOwnerExports(root, selection === undefined ? sourceRecords : sourceRecords.filter(entry => resolve(root, entry.source) === selection))
  const authoredFiles = [...graph.modules.values()].filter(module => module.authored).map(module => module.source)
  let declarations: Awaited<ReturnType<typeof buildDeclarations>>
  if (selection === undefined) {
    declarations = await buildDeclarations(root, outdir, [...graph.modules.keys(), ...server], {authoringFiles: authoredFiles})
  } else {
    declarations = await buildDeclarations(root, outdir, graph.dependencies(selection).files, {
      customConditions: [], preserve: true, authoringFiles: graph.dependencies(selection).files,
    })
  }
  await declarationEntries(root, outdir, selection === undefined ? allSources : [selection], declarations)
  await ownerEntries(root, outdir, selection === undefined ? sourceRecords : sourceRecords.filter(entry => resolve(root, entry.source) === selection))
  const merged: Metafile = previousMetafile ?? {inputs: {}, outputs: {}, builds: []}
  if (selection !== undefined) merged.builds = merged.builds!.filter(build => !build.entrypoints.some(path => resolve(root, path) === selection))
  const artifacts = new Set(previous?.files.map(file => file.path) ?? [])
  let builtInputs = 0
  const accept = (result: Bun.BuildOutput, entrypoints: readonly string[], sourceRoots: readonly string[], splitting: boolean) => {
    if (!result.success) throw new AggregateError(result.logs, "Independent distribution build failed")
    Object.assign(merged.inputs, result.metafile!.inputs)
    Object.assign(merged.outputs, result.metafile!.outputs)
    for (const output of result.outputs) artifacts.add(relative(outdir, output.path))
    builtInputs += Object.keys(result.metafile!.inputs).length
    merged.builds!.push({entrypoints: entrypoints.map(path => relative(root, path)), sourceRoots: sourceRoots.map(path => relative(root, path)), splitting})
  }
  if (selection === undefined) {
    const core = await Bun.build({
      entrypoints: graph.core, root, outdir, target: "browser", format: "esm", splitting: true,
      minify: true, sourcemap: "external", conditions: ["source"], loader: {".wgsl": "text"},
      naming: {entry: "[dir]/[name].[ext]", chunk: "chunks/[hash].[ext]", asset: "assets/[hash].[ext]"}, metafile: true,
    })
    accept(core, graph.core, [], true)
    console.log(`Immersive core: ${graph.core.length} entries`)
  }
  const independent = selection === undefined ? graph.independent : [selection]
  let completed = 0
  const buildEntry = async (source: string) => {
    const output = targets.get(source)!
    const unit = graph.dependencies(source)
    await assertReadyDependencies(root, unit.files)
    const links = new Map<string, string>()
    const needsCompiler = unit.files.some(path => graph.modules.get(path)?.authored)
    const compilerOptions = {
      cwd: root, sourceRoots: unit.files, customConditions: [], sourceFiles: unit.files,
      styleSourceRootIds: unit.files.map(path => `${manifest.name}/${relative(root, path).replaceAll(sep, "/")}`),
    }
    const session = needsCompiler ? new CompilerSession(compilerOptions) : undefined
    let result: Bun.BuildOutput
    try {
      // Native API/config filesystem инициализируются до Bun callbacks. Внутри
      // onStart остаётся проверка уже открытых собственных файлов, без нового project.
      await session?.prepareFiles(unit.files)
      result = await Bun.build({
      entrypoints: [source], root, outdir, target: "browser", format: "esm", splitting: false,
      minify: true, sourcemap: "external", conditions: ["source"], loader: {".wgsl": "text"},
      naming: {entry: "[dir]/[name].[ext]", asset: "assets/[hash].[ext]"}, metafile: true,
      plugins: [{
        name: "immersive-ready-dependencies",
        setup(builder) {
          builder.onResolve({filter: /.*/u}, async args => {
            if (!args.importer || args.path.startsWith("node:") || args.path.startsWith("bun:")) return
            const target = await realpath(Bun.resolveSync(args.path, dirname(args.importer)))
            const ready = targets.get(target)
            if (!ready || target === source) return
            if (!await Bun.file(ready).exists()) throw new Error(`Ready dependency is missing: ${relative(root, target)} for ${relative(root, source)}`)
            const path = modulePath(dirname(output), ready)
            links.set(path, `./${relative(outdir, ready).replaceAll(sep, "/")}`)
            return {path, external: true}
          })
        },
      }, ...(session ? [compilerPlugin({...compilerOptions, session})] : [])],
      })
    } finally { await session?.close() }
    if (result.metafile) for (const value of Object.values(result.metafile.outputs)) for (const edge of value.imports) {
      const path = links.get(edge.path)
      if (path) { edge.path = path; if ("external" in edge) delete edge.external }
    }
    accept(result, [source], needsCompiler ? unit.files : [], false)
    const foreign = Object.keys(result.metafile!.inputs).filter(path => targets.has(resolve(root, path)) && resolve(root, path) !== source)
    if (foreign.length) throw new Error(`Independent entry bundled a ready dependency: ${foreign.join(", ")}`)
    console.log(`Immersive entry ${++completed}/${independent.length}: ${relative(root, source)}`)
  }
  // Отдельные Bun/TS сессии сохраняют unit scope. Две задачи перекрывают IPC
  // ожидание, не объединяя entrypoints или исходники соседних компонентов.
  const limit = Math.min(2, availableParallelism())
  let active = 0
  let failed: unknown
  const waiting: (() => void)[] = []
  const jobs = new Map<string, Promise<void>>()
  for (const source of independent) jobs.set(source, (async () => {
    await Promise.all(graph.dependencies(source).dependencies.map(path => jobs.get(path)))
    while (active >= limit) await new Promise<void>(resolve => waiting.push(resolve))
    active++
    try {
      if (failed !== undefined) throw failed
      await buildEntry(source)
    } catch (error) { failed ??= error; throw error }
    finally { active--; waiting.shift()?.() }
  })())
  const results = await Promise.allSettled(jobs.values())
  const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected")
  if (failure) throw failure.reason
  if (selection === undefined) {
    const runtimeModules = new Set(graph.entries)
    const toolsDirectory = resolve(outdir, "server/chunks")
    const links = new Map<string, string>()
    const tools = await Bun.build({
      entrypoints: server, root, outdir, target: "bun", format: "esm", splitting: true, sourcemap: "external",
      naming: {entry: "server/chunks/[name]-[hash].[ext]", chunk: "server/chunks/[hash].[ext]", asset: "server/assets/[hash].[ext]"},
      conditions: ["source"], external: ["typescript", "typescript/*", "bun-webgpu"], metafile: true,
      plugins: [{name: "immersive-ready-runtime", setup(builder) {
        builder.onResolve({filter: /.*/u}, async args => {
          if (!args.importer || args.path.startsWith("node:") || args.path.startsWith("bun:")) return
          let target: string
          try { target = await realpath(Bun.resolveSync(args.path, dirname(args.importer))) } catch { return }
          if (!runtimeModules.has(target)) return
          const ready = targets.get(target)!
          const path = modulePath(toolsDirectory, ready)
          links.set(path, `./${relative(outdir, ready).replaceAll(sep, "/")}`)
          return {path, external: true}
        })
      }}],
    })
    if (!tools.success) throw new AggregateError(tools.logs, "Immersive tools build failed")
    const metafile = tools.metafile!
    const toolFiles = new Set(tools.outputs.map(output => relative(outdir, output.path)))
    for (const value of Object.values(metafile.outputs)) for (const edge of value.imports) {
      const path = links.get(edge.path)
      if (path) { edge.path = path; if ("external" in edge) delete edge.external }
    }
    // Entry и shared chunks находятся в одной директории, поэтому их relative
    // core imports имеют точную базу. Публичные entry URLs остаются прежними.
    for (const [path, value] of Object.entries(metafile.outputs)) {
      if (!("entryPoint" in value) || typeof value.entryPoint !== "string") continue
      const source = resolve(root, value.entryPoint)
      const entry = readyPath(root, outdir, source)
      await forward(entry, modulePath(dirname(entry), resolve(outdir, path)), await hasDefault(source))
      toolFiles.add(relative(outdir, entry))
      metafile.outputs[`./${relative(outdir, entry).replaceAll(sep, "/")}`] = {
        bytes: (await Bun.file(entry).arrayBuffer()).byteLength,
        inputs: {}, imports: [{path, kind: "import-statement"}], exports: value.exports,
      }
    }
    merged.toolFiles = await Promise.all([...toolFiles].sort().map(async path => ({path, digest: await digest(resolve(outdir, path))})))
    await Bun.write(resolve(outdir, "server-metafile.json"), JSON.stringify(metafile, null, 2))
  }
  const sourceExports = await refreshDigests(root, graph.sourceExports, selection)
  const files = await closedArtifacts(outdir, merged, graph.entries, targets, artifacts)
  const liveOutputs = new Set(files.filter(file => !file.path.endsWith(".map")).map(file => `./${file.path}`))
  merged.outputs = Object.fromEntries(Object.entries(merged.outputs).filter(([path]) => liveOutputs.has(path)))
  const liveInputs = new Set(Object.values(merged.outputs).flatMap(output => Object.keys(output.inputs)))
  merged.inputs = Object.fromEntries(Object.entries(merged.inputs).filter(([path]) => liveInputs.has(path)))
  await Bun.write(resolve(outdir, "metafile.json"), JSON.stringify(merged, null, 2))
  await Bun.write(resolve(outdir, "browser.json"), JSON.stringify({
    schemaVersion: 1, name: manifest.name, version: manifest.version,
    entries: Object.fromEntries(browserEntries.map(([path, entry]) => [specifier(path), relative(resolve(root, "dist"), resolve(root, entry.browser!))])),
    sourceExports, files,
  }, null, 2))
  console.log(`Immersive: ${selection ? "selected" : "full"} distribution; ${independent.length} independent entries, ${builtInputs} source inputs, ${files.length} browser artifacts; ${(performance.now() - started).toFixed(1)}ms`)
}

/** Native package exports обязаны замыкать типы зависимостей на declarations. */
async function assertReadyDependencies(root: string, files: readonly string[]) {
  const owners = new Set(await Promise.all(files.map(async file => (await sourceOwner(root, file)).root)))
  const api = new API({cwd: root, fs: createCompilerFileSystem([], files)!})
  const snapshot = await api.updateSnapshot({openFiles: [...files]})
  try {
    const project = await snapshot.getDefaultProjectForFile(files[0]!)
    if (!project) throw new Error(`Ready configured project is missing: ${files[0]}`)
    const diagnostics = await project.program.getSemanticDiagnostics()
    if (diagnostics.length) throw new Error(`Ready dependency types are invalid for ${relative(root, files[0]!)}:\n${JSON.stringify(diagnostics, null, 2)}`)
    for (const path of await project.program.getSourceFileNames()) {
      if (!/\.[cm]?tsx?$/u.test(path) || /\.d\.[cm]?ts$/u.test(path)) continue
      if (!path.startsWith(`${root}${sep}`)) throw new Error(`Ready dependency resolved to foreign source: ${path} from ${relative(root, files[0]!)}`)
      if (!owners.has((await sourceOwner(root, path)).root)) throw new Error(`Ready dependency resolved to foreign source: ${relative(root, path)} from ${relative(root, files[0]!)}`)
    }
  } finally { await snapshot.dispose(); await api.close() }
}

export async function prepareOwnerExports(root: string, entries: readonly SourceExport[], browser: ReadonlySet<string>) {
  const changes = new Map<string, Record<string, unknown>>()
  for (const entry of entries) {
    const path = resolve(root, entry.manifest)
    if (path === resolve(root, "package.json")) continue
    let manifest = changes.get(path)
    if (!manifest) { manifest = JSON.parse(await readFile(path, "utf8")); changes.set(path, manifest!) }
    const name = manifest!.name as string
    const subpath = entry.specifier === name ? "." : `.${entry.specifier.slice(name.length)}`
    if (typeof manifest!.exports === "string") manifest!.exports = {".": manifest!.exports}
    const exports = manifest!.exports as Record<string, unknown>
    const previous = exports[subpath]
    const source = `./${relative(dirname(path), resolve(root, entry.source)).replaceAll(sep, "/")}`
    const stem = `./dist/${relative(dirname(path), resolve(root, entry.source)).replaceAll(sep, "/").replace(/\.[cm]?tsx?$/u, "")}`
    const existing = typeof previous === "object" && previous !== null ? previous as Record<string, unknown> : {}
    const {source: _source, types: _types, browser: _browser, default: _default, bun: _bun, ...conditions} = existing
    exports[subpath] = {
      source, types: `${stem}.d.ts`, ...conditions,
      ...(browser.has(entry.specifier) ? {browser: `${stem}.js`} : {}),
      ...(_bun === undefined ? {} : {bun: `${stem}.js`}), default: `${stem}.js`,
    }
  }
  for (const [path, manifest] of changes) await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function validateOwnerExports(root: string, entries: readonly SourceExport[]) {
  for (const entry of entries) {
    const path = resolve(root, entry.manifest)
    if (path === resolve(root, "package.json")) continue
    const manifest = await Bun.file(path).json() as {name: string; exports: Record<string, unknown>}
    const subpath = entry.specifier === manifest.name ? "." : `.${entry.specifier.slice(manifest.name.length)}`
    const declaration = manifest.exports[subpath]
    if (typeof declaration !== "object" || declaration === null || !("source" in declaration) || !("types" in declaration) || !("default" in declaration)) {
      throw new Error(`Owner must declare source/types/ready exports: ${entry.specifier}`)
    }
  }
}

async function declarationEntries(root: string, outdir: string, entries: readonly string[], declarations: Awaited<ReturnType<typeof buildDeclarations>>) {
  for (const source of entries) {
    const path = readyPath(root, outdir, source).replace(/\.js$/u, ".d.ts")
    const target = declarations.declarationFor(source)
    if (!await Bun.file(target).exists()) throw new Error(`Ready declaration is missing: ${source}`)
    await forward(path, modulePath(dirname(path), target), await hasDefault(source))
  }
}

async function ownerEntries(root: string, outdir: string, entries: readonly SourceExport[]) {
  for (const entry of entries) {
    const owner = dirname(resolve(root, entry.manifest))
    if (owner === root) continue
    const source = resolve(root, entry.source)
    const file = resolve(owner, "dist", relative(owner, source).replace(/\.[cm]?tsx?$/u, ".js"))
    const target = readyPath(root, outdir, source)
    await forward(file, modulePath(dirname(file), target), await hasDefault(source))
    await forward(file.replace(/\.js$/u, ".d.ts"), modulePath(dirname(file), target), await hasDefault(source))
  }
}

async function forward(path: string, target: string, defaults: boolean) {
  const text = `export * from ${JSON.stringify(target)}\n${defaults ? `export {default} from ${JSON.stringify(target)}\n` : ""}`
  if (await Bun.file(path).exists() && await Bun.file(path).text() === text) return
  await mkdir(dirname(path), {recursive: true})
  await writeFile(path, text)
}
async function hasDefault(source: string) {
  return new Bun.Transpiler({loader: source.endsWith("x") ? "tsx" : "ts"}).scan(await Bun.file(source).text()).exports.includes("default")
}
function readyPath(root: string, outdir: string, source: string) {
  return resolve(outdir, relative(root, source).replace(/\.[cm]?tsx?$/u, ".js"))
}
function modulePath(parent: string, target: string) {
  const path = relative(parent, target).replaceAll(sep, "/")
    .replace(/\.d\.mts$/u, ".mjs").replace(/\.d\.cts$/u, ".cjs").replace(/\.d\.ts$/u, ".js")
  return path.startsWith(".") ? path : `./${path}`
}
async function digest(path: string) { return createHash("sha256").update(await readFile(path)).digest("hex") }

async function refreshDigests(root: string, sourceExports: Readonly<Record<string, readonly SourceExport[]>>, selected?: string) {
  const manifests = new Map<string, string>()
  const result: Record<string, SourceExport[]> = {}
  for (const [name, entries] of Object.entries(sourceExports)) result[name] = await Promise.all(entries.map(async entry => {
    if (selected !== undefined && resolve(root, entry.source) !== selected) return entry
    let hash = manifests.get(entry.manifest)
    if (!hash) { hash = await digest(resolve(root, entry.manifest)); manifests.set(entry.manifest, hash) }
    return {...entry, digest: hash}
  }))
  return result
}

async function closedArtifacts(outdir: string, metafile: Metafile, entries: readonly string[], targets: ReadonlyMap<string, string>, artifacts: ReadonlySet<string>) {
  const pending = entries.map(source => `./${relative(outdir, targets.get(source)!).replaceAll(sep, "/")}`)
  const files = new Set<string>()
  while (pending.length) {
    const path = pending.pop()!
    if (files.has(path)) continue
    const output = metafile.outputs[path]
    if (!output) throw new Error(`Ready output is absent from its build graph: ${path}`)
    files.add(path)
    for (const edge of output.imports) {
      if ("external" in edge && edge.external === true) throw new Error(`Browser output has an unresolved dependency: ${path} -> ${edge.path}`)
      pending.push(edge.path)
    }
  }
  const result = []
  for (const file of files) {
    const path = file.replace(/^\.\//u, "")
    result.push({path, digest: await digest(resolve(outdir, path))})
    if (artifacts.has(`${path}.map`)) result.push({path: `${path}.map`, digest: await digest(resolve(outdir, `${path}.map`))})
  }
  return result.sort((left, right) => left.path.localeCompare(right.path))
}

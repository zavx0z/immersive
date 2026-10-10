import {readFile, realpath} from "node:fs/promises"
import {dirname, relative, resolve, sep} from "node:path"
import {API, SymbolFlags} from "typescript/unstable/async"
import {isStringLiteral} from "typescript/unstable/ast/is"
import {createCompilerFileSystem, getAuthoringDeclarations} from "@zavx0z/immersive-jsx-compiler-session"
import {ownerExports, type SourceExport} from "./public-sources.ts"

type Owner = Readonly<{root: string; manifest: string; name: string}>
type Module = Readonly<{
  source: string
  owner: Owner
  imports: readonly string[]
  authored: boolean
  exports: readonly SourceExport[]
}>

/** Выбранный entry читает только собственные исходники; dependency addresses берутся из готовой поставки. */
export async function selectedDistributionGraph(
  root: string,
  publicEntries: readonly (readonly [string, string])[],
  sourceExports: Readonly<Record<string, readonly SourceExport[]>>,
  source: string,
) {
  const entries = [...new Set([
    ...publicEntries.map(([, path]) => path),
    ...Object.values(sourceExports).flat().map(entry => resolve(root, entry.source)),
  ])]
  const ready = new Set(entries)
  const owner = await sourceOwner(root, source)
  const fs = createCompilerFileSystem([], [source])
  const api = new API({cwd: root, ...(fs ? {fs} : {})})
  const snapshot = await api.updateSnapshot({openFiles: [source]})
  const modules = new Map<string, Module>()
  const files = new Set<string>(), dependencies = new Set<string>()
  const visit = async (path: string) => {
    if (path !== source && ready.has(path)) { dependencies.add(path); return }
    if (files.has(path)) return
    const currentOwner = await sourceOwner(root, path)
    if (currentOwner.root !== owner.root) throw new Error(`Private module crosses a ready owner boundary: ${path} from ${source}`)
    files.add(path)
    const project = await snapshot.getDefaultProjectForFile(path)
    const ast = await project?.program.getSourceFile(path)
    if (!ast) throw new Error(`Selected source AST is missing: ${path}`)
    const profile = getAuthoringDeclarations(ast)
    const authoring = new Set(profile.authoringImports)
    const declared = new Set(ast.imports.filter(isStringLiteral).map(value => value.text))
    const scanned = new Bun.Transpiler({loader: path.endsWith("x") ? "tsx" : "ts", tsconfig: {compilerOptions: {jsx: "preserve"}}}).scanImports(await Bun.file(path).text())
    const imports: string[] = []
    for (const entry of scanned) {
      if (!declared.has(entry.path) || authoring.has(entry.path) || entry.path.startsWith("node:") || entry.path.startsWith("bun:")) continue
      const target = await realpath(Bun.resolveSync(entry.path, dirname(path)))
      if (!target.startsWith(`${root}${sep}`) || !/\.[cm]?tsx?$/u.test(target) || target.endsWith(".d.ts")) continue
      imports.push(target)
      await visit(target)
    }
    modules.set(path, {source: path, owner, imports, authored: profile.components.length > 0 || profile.hooks.length > 0 || authoring.size > 0, exports: await ownerExports(root, path)})
  }
  try {
    await visit(source)
    return {
      modules, sourceExports, entries, core: [] as string[], independent: [source],
      dependencies: (_source: string) => ({files: [...files].sort(), dependencies: [...dependencies].sort()}),
    }
  } finally { await snapshot.dispose(); await api.close() }
}

export async function sourceOwner(root: string, source: string): Promise<Owner> {
  let directory = dirname(source)
  while (directory === root || directory.startsWith(`${root}${sep}`)) {
    const path = resolve(directory, "package.json")
    if (await Bun.file(path).exists()) {
      const manifest = await Bun.file(path).json() as {name: string}
      return {root: directory, manifest: path, name: manifest.name}
    }
    directory = dirname(directory)
  }
  throw new Error(`Distribution source has no owner: ${source}`)
}

/** Фактические source owners и compiler-owned авторство задают границы отдельных сборок. */
export async function distributionGraph(root: string, publicEntries: readonly (readonly [string, string])[], declarationProviders: readonly string[] = []) {
  const api = new API({cwd: root})
  const snapshot = await api.updateSnapshot({openFiles: publicEntries.map(([, source]) => source)})
  const modules = new Map<string, Module>()
  const owners = new Map<string, Owner>()
  const pending = new Set<string>()
  const ownerFor = async (source: string): Promise<Owner> => {
    let directory = dirname(source)
    while (directory === root || directory.startsWith(`${root}${sep}`)) {
      const cached = owners.get(directory)
      if (cached) return cached
      const path = resolve(directory, "package.json")
      if (await Bun.file(path).exists()) {
        const manifest = await Bun.file(path).json() as {name: string}
        const owner = {root: directory, manifest: path, name: manifest.name}
        owners.set(directory, owner)
        return owner
      }
      directory = dirname(directory)
    }
    throw new Error(`Distribution source has no owner: ${source}`)
  }
  const visit = async (candidate: string): Promise<void> => {
    const source = await realpath(candidate)
    if (modules.has(source) || pending.has(source) || !source.startsWith(`${root}${sep}`) ||
      !/\.[cm]?tsx?$/u.test(source) || source.endsWith(".d.ts")) return
    pending.add(source)
    const project = await snapshot.getDefaultProjectForFile(source)
    const ast = await project?.program.getSourceFile(source)
    if (!ast) throw new Error(`Distribution source AST is missing: ${source}`)
    const profile = getAuthoringDeclarations(ast)
    const authoring = new Set(profile.authoringImports)
    const imports: string[] = []
    const text = await readFile(source, "utf8")
    const declaredImports = new Set(ast.imports.filter(isStringLiteral).map(value => value.text))
    const scanned = new Bun.Transpiler({loader: source.endsWith("x") ? "tsx" : "ts", tsconfig: {compilerOptions: {jsx: "preserve"}}}).scanImports(text)
    for (const entry of scanned) {
      if (!declaredImports.has(entry.path) || authoring.has(entry.path) || entry.path.startsWith("bun:") || entry.path.startsWith("node:")) continue
      let target: string
      try { target = await realpath(Bun.resolveSync(entry.path, dirname(source))) }
      catch (error) { throw new Error(`Cannot resolve distribution dependency ${entry.path} from ${source}`, {cause: error}) }
      if (!target.startsWith(`${root}${sep}`) || !/\.[cm]?tsx?$/u.test(target) || target.endsWith(".d.ts")) continue
      imports.push(target)
      await visit(target)
    }
    modules.set(source, {
      source, owner: await ownerFor(source), imports,
      authored: profile.components.length > 0 || profile.hooks.length > 0 || authoring.size > 0,
      exports: await ownerExports(root, source),
    })
    pending.delete(source)
  }
  try {
    for (const [, source] of publicEntries) await visit(source)
    const providers = new Set(declarationProviders)
    const typeDependencies = new Map<string, Set<string>>()
    const checkedTypes = new Set<string>()
    const visitTypes = async (source: string, owner: Owner): Promise<void> => {
      const key = `${owner.root}:${source}`
      if (checkedTypes.has(key)) return
      checkedTypes.add(key)
      const project = await snapshot.getDefaultProjectForFile(source)
      const ast = await project?.program.getSourceFile(source)
      if (!ast) throw new Error(`Declaration dependency AST is missing: ${source}`)
      for (const literal of ast.imports.filter(isStringLiteral)) {
        if (literal.text.startsWith("node:") || literal.text.startsWith("bun:")) continue
        let target: string
        try { target = await realpath(Bun.resolveSync(literal.text, dirname(source))) } catch { continue }
        if (!target.startsWith(`${root}${sep}`) || target.includes(`${sep}node_modules${sep}`) || !/\.[cm]?tsx?$/u.test(target) || /\.d\.[cm]?ts$/u.test(target) || providers.has(target)) continue
        const exports = await ownerExports(root, target)
        if (exports.length) {
          await visit(target)
          const dependencies = typeDependencies.get(owner.root) ?? new Set<string>()
          dependencies.add(target)
          typeDependencies.set(owner.root, dependencies)
        } else {
          if ((await ownerFor(target)).root !== owner.root) throw new Error(`Private declaration crosses an owner boundary: ${target} from ${source}`)
          await visitTypes(target, owner)
        }
      }
    }
    for (const module of modules.values()) await visitTypes(module.source, module.owner)
    // Публичные компоненты и type-only входы владельцев публикуются независимо,
    // даже если текущий facade использует от sibling только тип входных props.
    const typeEntries = new Map<string, string[]>()
    for (const owner of new Map([...modules.values()].map(module => [module.owner.root, module.owner])).values()) {
      const manifest = await Bun.file(owner.manifest).json() as {exports?: string | Record<string, unknown>}
      const exported = typeof manifest.exports === "string" ? [manifest.exports] : Object.values(manifest.exports ?? {})
      for (const entry of exported) {
        const target = typeof entry === "string" ? entry : entry && typeof entry === "object" && "source" in entry ? entry.source : undefined
        if (typeof target !== "string" || !/\.[cm]?tsx?$/u.test(target) || target.endsWith(".d.ts")) continue
        const candidate = resolve(owner.root, target)
        if (!await Bun.file(candidate).exists()) continue
        const source = await realpath(candidate)
        if (modules.has(source)) continue
        const project = await snapshot.getDefaultProjectForFile(source)
        const ast = await project?.program.getSourceFile(source)
        const profile = ast && getAuthoringDeclarations(ast)
        if (profile && (profile.components.length > 0 || profile.hooks.length > 0)) {
          await visit(source)
          typeEntries.set(owner.root, [...typeEntries.get(owner.root) ?? [], source])
          continue
        }
        if (source.endsWith(".tsx")) continue
        const emitted = new Bun.Transpiler({loader: "ts"}).transformSync(await readFile(source, "utf8")).trim()
        if (emitted !== "" && emitted !== "export {};") {
          const symbol = ast && await project!.checker.getSymbolAtLocation(ast)
          if (!symbol) continue
          const exports = await project!.checker.getExportsOfModule(symbol)
          let runtime = false
          for (const exported of exports) {
            const target = (exported.flags & SymbolFlags.Alias) !== 0 ? await project!.checker.getAliasedSymbol(exported) : exported
            if ((target.flags & SymbolFlags.Value) !== 0) { runtime = true; break }
          }
          if (runtime || exports.length === 0) continue
        }
        await visit(source)
        typeEntries.set(owner.root, [...typeEntries.get(owner.root) ?? [], source])
      }
    }
    const sourceExports: Record<string, SourceExport[]> = {}
    for (const [specifier, source] of publicEntries) {
      const visited = new Set<string>()
      const exported: SourceExport[] = []
      const collect = (path: string) => {
        if (visited.has(path)) return
        visited.add(path)
        const module = modules.get(path)
        if (!module) return
        exported.push(...module.exports)
        for (const dependency of typeDependencies.get(module.owner.root) ?? []) collect(dependency)
        for (const typeEntry of typeEntries.get(module.owner.root) ?? []) collect(typeEntry)
        module.imports.forEach(collect)
      }
      collect(await realpath(source))
      sourceExports[specifier] = exported
    }
    const entries = new Set([
      ...publicEntries.map(([, source]) => source),
      ...Object.values(sourceExports).flat().map(entry => resolve(root, entry.source)),
    ])
    const authored = new Set([...modules.values()].filter(module => module.authored).map(module => module.source))
    let changed = true
    while (changed) {
      changed = false
      for (const module of modules.values()) {
        if (authored.has(module.source) || !module.imports.some(source => authored.has(source))) continue
        authored.add(module.source)
        changed = true
      }
    }
    const dependencies = (source: string) => {
      const module = modules.get(source)
      if (!module) throw new Error(`Distribution entry is outside its source graph: ${source}`)
      const files = new Set<string>()
      const dependencies = new Set<string>()
      const collect = (path: string) => {
        if (path !== source && entries.has(path)) { dependencies.add(path); return }
        if (files.has(path)) return
        const current = modules.get(path)
        if (!current) return
        if (current.owner.root !== module.owner.root) {
          throw new Error(`Private module crosses a distribution owner boundary: ${path} from ${source}`)
        }
        files.add(path)
        current.imports.forEach(collect)
      }
      collect(source)
      return {files: [...files].sort(), dependencies: [...dependencies].sort()}
    }
    const independent = [...entries].filter(source => authored.has(source)).sort()
    const core = [...entries].filter(source => !authored.has(source)).sort()
    const order: string[] = []
    const active = new Set<string>(), complete = new Set<string>()
    const append = (source: string) => {
      if (complete.has(source)) return
      if (active.has(source)) throw new Error(`Independent component dependency cycle: ${relative(root, source)}`)
      active.add(source)
      for (const dependency of dependencies(source).dependencies) if (authored.has(dependency)) append(dependency)
      active.delete(source)
      complete.add(source)
      order.push(source)
    }
    independent.forEach(append)
    return {modules, sourceExports, entries: [...entries], core, independent: order, dependencies}
  } finally {
    await snapshot.dispose()
    await api.close()
  }
}

/**
Сессия компиляции JSX в общий формат готового шаблона Template.

Сохраняет TypeScript project, семантические зависимости и кеш между файлами.
Преобразует проверенный сценариями JSX, слоты и CSS. Владелец закрывает сессию
после сборки через close; runtime Document и состояние компонентов сюда не входят.

Именованный default компонента сохраняется в готовом template; домен может
переэкспортировать его под публичным именем без изменения identity.

Авторский namespace JSX и типы intrinsic-элементов принадлежат контракту
компилятора; домен раскрывает этот же контракт без второго определения.

@packageDocumentation
*/
import {API, type Snapshot} from "typescript/unstable/async"
import {readFile} from "node:fs/promises"
import {resolve} from "node:path"
import JsxCompileError from "@jsx-compiler/error"
import {GovernedFiles, selectGovernedCompilerSource} from "./src/governed-paths.ts"
import {transformJsxSourceFile} from "./src/transform.ts"
import {buildJsxTransformSymbols} from "./src/symbols.ts"
import {normalizeStyleSourceRootIds, sourceHash, assertConfiguredProject} from "./src/session-support.ts"
import SlotAuthoring from "@jsx-slot/authoring"
import {
  collectCapabilityUsages,
} from "./src/capability-usage.ts"

import type {JsxCompilerSessionOptions} from "./contract/input.ts"
import type {JsxCompileResult} from "./contract/output.ts"
import type {JsxCompilerStats} from "./src/stats.ts"
export type {JsxCompilerSessionOptions} from "./contract/input.ts"
export type {JsxCompileResult} from "./contract/output.ts"

type DependencyFingerprint = Readonly<{
  authorization: string | null
  hash: string
  path: string
}>
type CachedTransform = Readonly<{
  dependencies: readonly DependencyFingerprint[]
  hash: string
  result: JsxCompileResult
}>

export default class JsxCompilerSession {
  private api: API
  private readonly cache = new Map<string, CachedTransform>()
  private readonly governedFiles: GovernedFiles
  private readonly hashes = new Map<string, string>()
  private readonly opened = new Set<string>()
  private snapshot: Snapshot | null = null
  private pending: Promise<void> = Promise.resolve()
  private cacheHits = 0
  private cacheMisses = 0
  private snapshots = 0
  private closed = false
  readonly cwd: string
  readonly sourceRoots: readonly string[]
  readonly styleSourceRootIds: readonly string[] | null

  constructor(options: JsxCompilerSessionOptions) {
    this.cwd = resolve(options.cwd)
    this.sourceRoots = Object.freeze(options.sourceRoots.map(root => resolve(root)))
    if (this.sourceRoots.length === 0) {
      throw new TypeError("JSX compiler session requires at least one source root")
    }
    this.styleSourceRootIds = normalizeStyleSourceRootIds(
      options.styleSourceRootIds,
      this.sourceRoots.length,
    )
    this.governedFiles = new GovernedFiles(this.sourceRoots)
    this.api = new API({cwd: this.cwd})
  }

  /** Проверяет принадлежность файла заданным корням компиляции. */
  accepts(path: string): boolean {
    return selectGovernedCompilerSource(this.governedFiles, path) !== null
  }

  get stats(): JsxCompilerStats {
    return Object.freeze({
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      snapshots: this.snapshots,
    })
  }

  async prepareFiles(sourcePaths: readonly string[]): Promise<void> {
    await this.refreshFiles(sourcePaths)
  }

  async refreshFiles(sourcePaths: readonly string[]): Promise<void> {
    await this.exclusive(() => this.refreshFilesLocked(sourcePaths))
  }

  async transformFile(sourcePath: string): Promise<string> {
    const result = await this.exclusive(() => this.compileFileLocked(sourcePath))
    return result.code
  }

  /**
  Compiles one governed source and retains its neutral usage projection.

  The transformed code and usages share one dependency-aware cache entry, so a
  cache hit returns the exact same immutable result object. A changed governed
  semantic dependency recreates the TypeScript API session before reanalysis;
  this avoids stale checker symbols across type-only re-export chains.
  Проверки авторства, типов и контрактов выполняются сценариями разработки.

  @param sourcePath - File inside one configured governed source root.
  @returns Transformed code and source-located capability usages.
  @throws {@link JsxCompileError} при недоступном исходнике или конструкции,
  которую невозможно выразить поддерживаемым форматом шаблона.
  */
  async compileFile(sourcePath: string): Promise<JsxCompileResult> {
    return this.exclusive(() => this.compileFileLocked(sourcePath))
  }

  /**
  Подготавливает транспорт слотов в сценариях без компиляции тестовых callbacks.

  При заданном transportModule сохраняет статические назначения условных детей
  и keyed map до JSX-трансляции среды исполнения. Исходный файл не изменяется.

  @param transportModule - Публичный модуль фабрики slotChild; без него возвращается исходный текст.
  @returns Исходник с необходимыми вызовами транспорта либо исходный текст.
  */
  async prepareSlotAuthoringFile(sourcePath: string, transportModule?: string): Promise<string> {
    return this.exclusive(async () => {
      if (this.closed) throw new Error("JSX compiler session is closed")
      const absolute = this.requireGoverned(resolve(sourcePath))
      await this.refreshFilesLocked([absolute])
      const project = await this.snapshot!.getDefaultProjectForFile(absolute)
      if (!project) throw new JsxCompileError("TypeScript 7 found no project", absolute)
      assertConfiguredProject(project, absolute)
      const source = await project?.program.getSourceFile(absolute)
      if (!source) throw new JsxCompileError("TypeScript 7 returned no source AST", absolute)
      return new SlotAuthoring(source).prepare(transportModule)
    })
  }

  private async compileFileLocked(sourcePath: string): Promise<JsxCompileResult> {
    if (this.closed) throw new Error("JSX compiler session is closed")
    const absolute = this.requireGoverned(resolve(sourcePath))
    const text = await readFile(absolute, "utf8")
    const hash = sourceHash(text)
    const previousHash = this.hashes.get(absolute)
    if (previousHash !== undefined && previousHash !== hash) {
      this.cache.clear()
      if (this.opened.has(absolute)) {
        await this.reloadOpenedFiles([absolute])
      }
    }
    this.hashes.set(absolute, hash)
    const cached = this.cache.get(absolute)
    if (cached?.hash === hash) {
      const changedDependencies = await this.changedDependencies(cached.dependencies)
      if (changedDependencies.length === 0) {
        this.cacheHits += 1
        return cached.result
      }
      this.cache.clear()
      const semanticClosure = cached.dependencies.map(dependency => dependency.path)
      await this.restartTypeScript([absolute, ...semanticClosure])
    }

    if (!this.snapshot || !this.opened.has(absolute)) {
      await this.updateSnapshot({openFiles: [absolute]})
      this.opened.add(absolute)
    }
    let project = await this.snapshot!.getDefaultProjectForFile(absolute)
    if (!project) throw new JsxCompileError("TypeScript 7 found no project", absolute)
    assertConfiguredProject(project, absolute)
    let sourceFile = await project.program.getSourceFile(absolute)
    if (!sourceFile) throw new JsxCompileError("TypeScript 7 returned no source AST", absolute)
    if (sourceFile.text !== text) {
      await this.reloadOpenedFiles([absolute])
      project = await this.snapshot!.getDefaultProjectForFile(absolute)
      if (!project) throw new JsxCompileError("TypeScript 7 found no project", absolute)
      assertConfiguredProject(project, absolute)
      sourceFile = await project.program.getSourceFile(absolute)
      if (!sourceFile || sourceFile.text !== text) {
        throw new JsxCompileError("on-disk source differs from compiler input", absolute)
      }
    }
    const symbols = await buildJsxTransformSymbols(sourceFile, project, this.governedFiles)
    const capabilityUsages = await collectCapabilityUsages(sourceFile, project, symbols)
    const styleSourceModuleId = this.styleSourceModuleId(absolute)
    const code = transformJsxSourceFile(
      sourceFile,
      symbols,
      styleSourceModuleId === undefined ? {} : {styleSourceModuleId},
    )
    const dependencies = await this.fingerprintDependencies(symbols.dependencyPaths)
    const result = Object.freeze({capabilityUsages, code})
    this.cache.set(absolute, Object.freeze({hash, result, dependencies}))
    this.cacheMisses += 1
    return result
  }

  async close(): Promise<void> {
    await this.pending
    if (this.closed) return
    this.closed = true
    await this.snapshot?.dispose()
    this.snapshot = null
    await this.api.close()
  }

  private styleSourceModuleId(sourcePath: string): string | undefined {
    if (this.styleSourceRootIds === null) return undefined
    const owner = this.governedFiles.matchFile(sourcePath)
    if (!owner) return undefined
    const relativePath = owner.relativePath.replaceAll("\\", "/")
    const rootId = this.styleSourceRootIds[owner.rootIndex]!
    return relativePath === "" ? rootId : `${rootId}/${relativePath}`
  }

  private exclusive<Result>(callback: () => Promise<Result>): Promise<Result> {
    const result = this.pending.then(callback, callback)
    this.pending = result.then(() => undefined, () => undefined)
    return result
  }

  private async updateSnapshot(
    parameters: Parameters<API["updateSnapshot"]>[0]
  ): Promise<void> {
    const previous = this.snapshot
    this.snapshot = await this.api.updateSnapshot(parameters)
    this.snapshots += 1
    await previous?.dispose()
  }

  private async restartTypeScript(sourcePaths: readonly string[]): Promise<void> {
    const previous = this.snapshot
    this.snapshot = null
    await previous?.dispose()
    await this.api.close()
    this.api = new API({cwd: this.cwd})
    this.opened.clear()
    const files = [...new Set(sourcePaths)]
    await this.updateSnapshot({openFiles: files})
    for (const sourcePath of files) this.opened.add(sourcePath)
  }

  /** Disk notifications не заменяют текст открытого буфера TypeScript: закрываем и открываем его раздельно. */
  private async reloadOpenedFiles(paths: readonly string[]): Promise<void> {
    const files = paths.filter(path => this.opened.has(path))
    this.api.clearSourceFileCache()
    await this.updateSnapshot({
      ...(files.length === 0 ? {} : {closeFiles: files}),
      fileChanges: {changed: [...paths]},
    })
    for (const path of files) this.opened.delete(path)
    if (files.length > 0) {
      await this.updateSnapshot({openFiles: files})
      for (const path of files) this.opened.add(path)
    }
  }

  private async refreshFilesLocked(sourcePaths: readonly string[]): Promise<void> {
    if (this.closed) throw new Error("JSX compiler session is closed")
    this.governedFiles.refresh()
    const files = [...new Set(sourcePaths.map(sourcePath => this.requireGoverned(resolve(sourcePath))))]
    const hashes = await Promise.all(files.map(async sourcePath => {
      const text = await readFile(sourcePath, "utf8")
      return sourceHash(text)
    }))
    const openFiles: string[] = []
    const changed: string[] = []
    for (let index = 0; index < files.length; index += 1) {
      const sourcePath = files[index]!
      const hash = hashes[index]!
      if (!this.opened.has(sourcePath)) openFiles.push(sourcePath)
      else if (this.hashes.get(sourcePath) !== hash) changed.push(sourcePath)
      this.hashes.set(sourcePath, hash)
    }
    if (changed.length > 0) this.cache.clear()
    if (openFiles.length === 0 && changed.length === 0) return
    if (changed.length > 0) await this.reloadOpenedFiles(changed)
    if (openFiles.length > 0) await this.updateSnapshot({openFiles})
    for (const sourcePath of openFiles) this.opened.add(sourcePath)
  }

  private async changedDependencies(
    dependencies: readonly DependencyFingerprint[],
  ): Promise<readonly string[]> {
    const changed: string[] = []
    for (const dependency of dependencies) {
      const text = await readFile(dependency.path, "utf8")
      const hash = sourceHash(text)
      this.hashes.set(dependency.path, hash)
      const authorization = this.governedFiles.authorizationKey(dependency.path)
      if (hash !== dependency.hash || authorization !== dependency.authorization) {
        changed.push(dependency.path)
      }
    }
    return changed
  }

  private async fingerprintDependencies(
    dependencyPaths: ReadonlySet<string>,
  ): Promise<readonly DependencyFingerprint[]> {
    const dependencies: DependencyFingerprint[] = []
    for (const path of [...dependencyPaths].sort()) {
      const text = await readFile(path, "utf8")
      const hash = sourceHash(text)
      const authorization = this.governedFiles.authorizationKey(path)
      if (authorization === null) {
        throw new JsxCompileError("dependency is outside the governed JSX roots", path)
      }
      this.hashes.set(path, hash)
      dependencies.push(Object.freeze({authorization, hash, path}))
    }
    return Object.freeze(dependencies)
  }

  private requireGoverned(sourcePath: string): string {
    if (this.governedFiles.matchFile(sourcePath) !== null) return sourcePath
    throw new JsxCompileError("source is outside the governed JSX roots", sourcePath)
  }
}

export type {JSX} from "./contract/authoring.ts"

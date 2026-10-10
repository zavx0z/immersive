import {mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile} from "node:fs/promises"
import {dirname, extname, relative, resolve, sep} from "node:path"
import {API, SignatureKind} from "typescript/unstable/async"
import SlotAuthoring from "@zavx0z/immersive-jsx-slot-authoring"
import {isFunctionDeclaration, isIdentifier, isImportTypeNode, isLiteralTypeNode, isModuleDeclaration, isStringLiteral, isTypeReferenceNode, isVariableStatement} from "typescript/unstable/ast/is"
import type {Node, SourceFile} from "typescript/unstable/ast"

/**
Получает обычные declarations штатным TypeScript и связывает их с готовой
поставкой. Импорты указывают на тот же граф объявлений; JSX-функции описываются
публичным CompiledComponent, который действительно исполняет собранный модуль.
Исходники владельцев не копируются и не изменяются.
*/
export async function buildDeclarations(root: string, outdir: string, inputs: readonly string[]) {
  await mkdir(resolve(root, "tmp"), {recursive: true})
  const temporary = await mkdtemp(resolve(root, "tmp/declarations-"))
  const configPath = resolve(temporary, "tsconfig.json")
  const destination = resolve(outdir, "types")
  const files = await filesIn(root)
  const globals = files.filter(path => path.endsWith(".d.ts"))
  const owners = new Map<string, string>()
  for (const path of files.filter(path => path.endsWith(`${sep}package.json`))) {
    const manifest = JSON.parse(await readFile(path, "utf8"))
    if (typeof manifest.name === "string") owners.set(manifest.name, dirname(path))
  }
  const entries = [...new Set([...inputs, ...globals])]
  const config = {
    extends: resolve(root, "tsconfig.json"),
    compilerOptions: {
      noEmit: false, declaration: true, emitDeclarationOnly: true,
      declarationMap: false, rootDir: dirname(root), outDir: destination,
      customConditions: ["source"], typeRoots: [resolve(root, "node_modules/@types")],
    },
    files: entries, include: [], exclude: [],
  }
  try {
    await writeFile(configPath, JSON.stringify(config))
    const listed = await tsc(root, configPath, ["--listFilesOnly"])
    const sourceFiles = listed.split(/\r?\n/u).filter(path => path.startsWith("/") && /\.[cm]?tsx?$/u.test(path) && !path.endsWith(".d.ts"))
    const common = commonDirectory([root, ...sourceFiles.map(dirname)])
    config.compilerOptions.rootDir = common
    config.files = [...new Set([...entries, ...sourceFiles])]
    await writeFile(configPath, JSON.stringify(config))
    await rm(destination, {recursive: true, force: true})
    await tsc(root, configPath)
    for (const path of listed.split(/\r?\n/u)) {
      if (!path.startsWith("/") || !path.endsWith(".d.ts") || path.includes(`${sep}node_modules${sep}`)) continue
      const target = resolve(destination, relative(common, path))
      await mkdir(dirname(target), {recursive: true})
      await writeFile(target, await readFile(path))
    }
    const declarations = (await filesIn(destination)).filter(path => path.endsWith(".d.ts"))
    const sourceFor = (path: string) => {
      const base = resolve(common, relative(destination, path).replace(/\.d\.ts$/u, ""))
      return sourceFiles.find(source => source === `${base}.tsx` || source === `${base}.ts`) ?? `${base}.d.ts`
    }
    const declarationFor = (path: string) => resolve(destination, relative(common, path.endsWith(".d.ts") ? path : path.replace(/\.[cm]?tsx?$/u, ".d.ts")))
    await withDeclarations(root, destination, declarations, async (project, source) => {
      const edits: Edit[] = []
      // TypeScript сохраняет reference относительно исходного .d.ts даже после
      // переноса declarations. В готовой поставке он указывает на её же файл.
      for (const reference of source.text.matchAll(/^[\t ]*\/\/\/\s*<reference\s+path=(['"])([^'"]+)\1/gmu)) {
        const target = resolve(dirname(source.fileName), reference[2]!)
        if (!globals.includes(target)) continue
        const start = reference.index! + reference[0].lastIndexOf(reference[2]!)
        const value = relative(dirname(source.fileName), declarationFor(target)).replaceAll(sep, "/")
        edits.push({start, end: start + reference[2]!.length, text: value.startsWith(".") ? value : `./${value}`})
      }
      const specifiers = new Set(source.imports)
      const styleReferences: Node[] = []
      const visit = (node: Node) => {
        if (isImportTypeNode(node) && isLiteralTypeNode(node.argument) && isStringLiteral(node.argument.literal)) specifiers.add(node.argument.literal)
        if (isModuleDeclaration(node) && isStringLiteral(node.name)) specifiers.add(node.name)
        if (isTypeReferenceNode(node) && isIdentifier(node.typeName) && node.typeName.text === "CssStyle") styleReferences.push(node.typeName)
        node.forEachChild(visit)
      }
      visit(source)
      for (const reference of styleReferences) {
        const symbol = await project.checker.getSymbolAtLocation(reference)
        if (!symbol?.declarations.some(declaration => declaration.path.endsWith("/template/css-global.d.ts"))) continue
        const specifier = modulePath(dirname(source.fileName), declarationFor(resolve(root, "template/css.ts")))
        edits.push({start: 0, end: 0, text: `import type {CssSourceValue as CssStyle} from ${JSON.stringify(specifier)}\n`})
        break
      }
      for (const specifier of specifiers) {
        if (!isStringLiteral(specifier) || specifier.text.startsWith(".")) continue
        let target: string
        try { target = await realpath(Bun.resolveSync(specifier.text, dirname(sourceFor(source.fileName)))) }
        catch {
          const name = specifier.text.startsWith("@") ? specifier.text.split("/").slice(0, 2).join("/") : specifier.text.split("/")[0]!
          const owner = owners.get(name)
          if (!owner) continue
          try { target = await realpath(Bun.resolveSync(specifier.text, owner)) }
          catch { continue }
        }
        if (target.endsWith(".json") && target.startsWith(`${root}${sep}`)) {
          const jsonPath = resolve(destination, relative(common, target))
          await mkdir(dirname(jsonPath), {recursive: true})
          await writeFile(jsonPath, await readFile(target))
          edits.push({start: specifier.getStart(source), end: specifier.end, text: JSON.stringify(modulePath(dirname(source.fileName), jsonPath))})
          continue
        }
        if (!sourceFiles.includes(target) && !globals.includes(target)) continue
        edits.push({start: specifier.getStart(source), end: specifier.end, text: JSON.stringify(modulePath(dirname(source.fileName), declarationFor(target)))})
      }
      await applyEdits(source, edits)
    })
    const componentTypes = declarationFor(resolve(root, "component/src/index.ts"))
    const sourceSlots = await componentSlots(root, sourceFiles)
    await withDeclarations(root, destination, declarations, async (project, source) => {
      if (!sourceFor(source.fileName).endsWith(".tsx")) return
      const edits: Edit[] = []
      const compiled = `import(${JSON.stringify(modulePath(dirname(source.fileName), componentTypes))}).CompiledComponent`
      const compiledResult = async (node: Node) => {
        const type = await project.checker.getTypeAtLocation(node)
        if (!type || Array.isArray(type)) return false
        const signatures = await project.checker.getSignaturesOfType(type, SignatureKind.Call)
        if (signatures.length !== 1) return false
        const result = await project.checker.getReturnTypeOfSignature(signatures[0]!)
        return result !== undefined && await project.checker.getPropertyOfType(result, "@zavx0z/immersive-jsx/element") !== undefined
      }
      for (const statement of source.statements) {
        if (isFunctionDeclaration(statement) && statement.name && statement.type && await compiledResult(statement.name)) {
          const modifiers = statement.modifiers?.map(node => node.getText(source)) ?? []
          const input = statement.parameters[0]?.type?.getText(source) ?? "Record<string, never>"
          const name = statement.name.text
          const slots = sourceSlots.get(sourceFor(source.fileName))?.get(name) ?? []
          const signature = `${compiled}<${input}, ${statement.type.getText(source)}>${slots.length ? ` & {readonly slots: readonly ${JSON.stringify(slots)}}` : ""}`
          const text = modifiers.includes("default")
            ? `declare const ${name}: ${signature}\nexport default ${name}`
            : `${modifiers.includes("export") ? "export " : ""}declare const ${name}: ${signature}`
          edits.push({start: statement.getStart(source), end: statement.end, text})
        } else if (isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            if (!isIdentifier(declaration.name) || !declaration.type || !await compiledResult(declaration.name)) continue
            const type = declaration.type.getText(source)
            edits.push({start: declaration.type.getStart(source), end: declaration.type.end,
              text: `${compiled}<Parameters<${type}>[0], ReturnType<${type}>>`})
          }
        }
      }
      await applyEdits(source, edits)
    })
    return {declarationFor, files: declarations}
  } finally { await rm(temporary, {recursive: true, force: true}) }
}

/** Публикует реальные outlets тем же анализатором, который использует JSX compiler. */
async function componentSlots(root: string, sourceFiles: readonly string[]) {
  const files = sourceFiles.filter(path => path.endsWith(".tsx"))
  const result = new Map<string, Map<string, readonly string[]>>()
  const api = new API({cwd: root})
  const snapshot = await api.updateSnapshot({openFiles: files})
  try {
    for (const file of files) {
      const project = await snapshot.getDefaultProjectForFile(file)
      const source = await project?.program.getSourceFile(file)
      if (!source) continue
      const authoring = new SlotAuthoring(source)
      const names = new Map<string, readonly string[]>()
      for (const statement of source.statements) {
        if (isFunctionDeclaration(statement) && statement.name) names.set(statement.name.text, authoring.outlets(statement))
      }
      result.set(file, names)
    }
    return result
  } finally {
    await snapshot.dispose()
    await api.close()
  }
}

async function tsc(root: string, config: string, args: string[] = []) {
  const process = Bun.spawn([resolve(root, "node_modules/.bin/tsc"), "--project", config, "--pretty", "false", ...args], {cwd: root, stdout: "pipe", stderr: "pipe"})
  const [exit, stdout, stderr] = await Promise.all([process.exited, new Response(process.stdout).text(), new Response(process.stderr).text()])
  if (exit !== 0) throw new Error(`Declaration preparation failed:\n${stdout}${stderr}`)
  return stdout
}

type Edit = {start: number; end: number; text: string}
async function applyEdits(source: SourceFile, edits: Edit[]) {
  if (edits.length === 0) return
  let text = source.text
  for (const edit of edits.sort((left, right) => right.start - left.start)) text = text.slice(0, edit.start) + edit.text + text.slice(edit.end)
  await writeFile(source.fileName, text)
}

async function withDeclarations(
  root: string,
  destination: string,
  paths: string[],
  action: (project: import("typescript/unstable/async").Project, source: SourceFile) => Promise<void>,
) {
  const config = resolve(destination, "tsconfig.json")
  await writeFile(config, JSON.stringify({compilerOptions: {noEmit: true, skipLibCheck: true, module: "Preserve", moduleResolution: "Bundler", target: "ESNext", typeRoots: [resolve(root, "node_modules/@types")]}, files: paths}))
  const api = new API({cwd: root})
  const snapshot = await api.updateSnapshot({openFiles: paths})
  try {
    const project = await snapshot.getDefaultProjectForFile(paths[0]!)
    if (!project) throw new Error("Declaration project is missing")
    for (const path of paths) {
      const source = await project.program.getSourceFile(path)
      if (source) await action(project, source)
    }
  } finally {
    await snapshot.dispose()
    await api.close()
    await rm(config, {force: true})
  }
}

const ignored = new Set(["node_modules", "dist", "tmp", "meta", "test", "tests", "spec", "fixture", "fixtures", "bench", "projects"])
async function filesIn(root: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(root, {withFileTypes: true})) {
    if (entry.name.startsWith(".") || ignored.has(entry.name)) continue
    const path = resolve(root, entry.name)
    if (entry.isDirectory()) result.push(...await filesIn(path))
    else if (entry.isFile()) result.push(path)
  }
  return result
}

function commonDirectory(paths: string[]) {
  let common = paths[0]!
  while (paths.some(path => path !== common && !path.startsWith(`${common}${sep}`))) common = dirname(common)
  return common
}

function modulePath(parent: string, target: string) {
  const path = relative(parent, target).replaceAll(sep, "/").replace(/\.d\.ts$/u, ".js")
  return path.startsWith(".") ? path : `./${path}`
}

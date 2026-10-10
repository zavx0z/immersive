import {createHash} from "node:crypto"
import {readFile, realpath} from "node:fs/promises"
import {existsSync} from "node:fs"
import {dirname, relative, resolve, sep} from "node:path"
import {API} from "typescript/unstable/async"
import {isExportDeclaration, isNamedExports, isStringLiteral} from "typescript/unstable/ast/is"

/** Происхождение готового входа: точный публичный export исходного владельца. */
type SourceExport = Readonly<{specifier: string; source: string; manifest: string; digest: string; file: string}>

/**
Связывает готовые входы с владельцами исходников для разработки самой платформы.
Потребитель использует только публичные ESM. При проверке исходного компонента
сборщик может подтвердить owner и подключить ту же готовую зависимость.
*/
export async function publicSourceExports(root: string, entries: readonly (readonly [string, string])[]) {
  const paths = entries.map(([, path]) => path)
  const api = new API({cwd: root})
  const snapshot = await api.updateSnapshot({openFiles: paths})
  const result: Record<string, SourceExport[]> = {}
  try {
    for (const [specifier, path] of entries) {
      const project = await snapshot.getDefaultProjectForFile(path)
      if (!project) throw new Error(`Public source project is missing: ${path}`)
      const visited = new Set<string>()
      const exports: SourceExport[] = []
      const visit = async (candidate: string) => {
        const file = await realpath(candidate)
        if (visited.has(file) || !file.startsWith(`${root}${sep}`)) return
        visited.add(file)
        exports.push(...await ownerExports(root, file))
        const source = await project.program.getSourceFile(file)
        if (!source) return
        for (const statement of source.statements) {
          if (!isExportDeclaration(statement) || statement.isTypeOnly || !statement.moduleSpecifier || !isStringLiteral(statement.moduleSpecifier)) continue
          if (statement.exportClause && isNamedExports(statement.exportClause) && statement.exportClause.elements.every(value => value.isTypeOnly)) continue
          const target = await realpath(Bun.resolveSync(statement.moduleSpecifier.text, dirname(file)))
          await visit(target)
        }
      }
      await visit(path)
      result[specifier] = exports
    }
    return result
  } finally {
    await snapshot.dispose()
    await api.close()
  }
}

async function ownerExports(root: string, source: string): Promise<SourceExport[]> {
  let directory = dirname(source)
  while (directory.startsWith(`${root}${sep}`)) {
    const manifest = resolve(directory, "package.json")
    if (existsSync(manifest)) {
      const text = await readFile(manifest, "utf8")
      const value = JSON.parse(text)
      if (typeof value.name === "string") {
        const entries = typeof value.exports === "string" ? [[".", value.exports]] : Object.entries(value.exports ?? {})
        const result: SourceExport[] = []
        for (const [subpath, entry] of entries) {
          const target = sourceTarget(entry)
          if (!target || !target.startsWith("./") || resolve(directory, target) !== source) continue
          result.push({
            specifier: `${value.name}${subpath === "." ? "" : subpath.slice(1)}`,
            source: relative(root, source), manifest: relative(root, manifest),
            digest: createHash("sha256").update(text).digest("hex"),
            file: relative(root, source).replace(/\.[cm]?tsx?$/u, ".js"),
          })
        }
        return result
      }
    }
    directory = dirname(directory)
  }
  return []
}

function sourceTarget(value: unknown): string | null {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const conditions = value as Record<string, unknown>
  return sourceTarget(conditions.source ?? conditions.default)
}

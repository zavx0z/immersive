import {createHash} from "node:crypto"
import type {Project} from "typescript/unstable/async"
import JsxCompileError from "@jsx-compiler/error"

export function normalizeStyleSourceRootIds(
  source: readonly string[] | undefined,
  expectedLength: number,
): readonly string[] | null {
  if (source === undefined) return null
  if (!Array.isArray(source) || source.length !== expectedLength) {
    throw new TypeError("styleSourceRootIds must match sourceRoots")
  }
  const ids = source.map(id => {
    if (typeof id !== "string" || id.trim() === "") {
      throw new TypeError("styleSourceRootIds require non-empty strings")
    }
    return id.trim().replace(/\/$/, "")
  })
  return Object.freeze(ids)
}

export function sourceHash(source: string): string {
  return createHash("sha256").update(source).digest("hex")
}

export function assertConfiguredProject(project: Project, sourcePath: string): void {
  const configFileName = project.configFileName.replaceAll("\\", "/")
  if (configFileName !== "/dev/null/inferred" || !/\.[cm]?tsx$/i.test(sourcePath)) return
  throw new JsxCompileError(
    "governed JSX source has no configured TypeScript project; include it in a tsconfig.json with compilerOptions jsx: preserve and jsxImportSource: @zavx0z/jsx",
    sourcePath,
  )
}

export function diagnosticText(
  diagnostic: Readonly<{
    messageChain?: readonly unknown[] | undefined
    text: string
  }>,
): string {
  const nested = diagnostic.messageChain?.flatMap(message =>
    diagnosticText(message as Readonly<{
      messageChain?: readonly unknown[] | undefined
      text: string
    }>)
  ) ?? []
  return [diagnostic.text, ...nested].join(" ")
}

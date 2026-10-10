import {readFileSync} from "node:fs"
import type {FileSystem} from "typescript/unstable/fs"
import {SyntaxKind} from "typescript/unstable/ast"
import {createScanner} from "typescript/unstable/ast/scanner"
import {isAbsolute} from "node:path"

/** Native project сохраняет пути/exports; изменяемый текст имеет исходную file identity. */
export function createCompilerFileSystem(customConditions: readonly string[] | undefined, sourceFiles?: readonly string[], sourceTexts?: ReadonlyMap<string, string>): FileSystem | undefined {
  if (customConditions === undefined && sourceFiles === undefined && !sourceTexts?.size) return undefined
  if (customConditions !== undefined && !customConditions.every(value => typeof value === "string" && value.length > 0)) throw new TypeError("customConditions requires non-empty strings")
  if (sourceFiles !== undefined && (sourceFiles.length === 0 || !sourceFiles.every(path => typeof path === "string" && isAbsolute(path)))) throw new TypeError("sourceFiles requires non-empty absolute file paths")
  const conditions = JSON.stringify(customConditions ?? [])
  return {readFile(path) {
    const text = sourceTexts?.get(path)
    if (text !== undefined) return text
    if (!/(?:^|[/\\])tsconfig[^/\\]*\.json$/u.test(path)) return undefined
    let source: string
    try { source = readFileSync(path, "utf8") } catch { return undefined }
    if (sourceFiles !== undefined) source = projectSourceFiles(source, sourceFiles)
    if (customConditions === undefined) return source
    const scanner = createScanner(true, undefined, source)
    const tokens: {kind: SyntaxKind, value: string, start: number, end: number}[] = []
    for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile; kind = scanner.scan()) {
      tokens.push({kind, value: scanner.getTokenValue(), start: scanner.getTokenStart(), end: scanner.getTokenEnd()})
    }
    let depth = 0
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index]!
      if (depth === 1 && token.kind === SyntaxKind.StringLiteral && token.value === "compilerOptions" && tokens[index + 1]?.kind === SyntaxKind.ColonToken && tokens[index + 2]?.kind === SyntaxKind.OpenBraceToken) {
        const first = index + 2
        let innerDepth = 0
        for (let cursor = first; cursor < tokens.length; cursor++) {
          const current = tokens[cursor]!
          if (innerDepth === 1 && current.kind === SyntaxKind.StringLiteral && current.value === "customConditions" && tokens[cursor + 1]?.kind === SyntaxKind.ColonToken) {
            const value = tokens[cursor + 2]!
            let end = cursor + 2, valueDepth = 0
            for (; end < tokens.length; end++) {
              const part = tokens[end]!
              if (part.kind === SyntaxKind.OpenBracketToken || part.kind === SyntaxKind.OpenBraceToken) valueDepth++
              if (part.kind === SyntaxKind.CloseBracketToken || part.kind === SyntaxKind.CloseBraceToken) valueDepth--
              if (valueDepth === 0) break
            }
            return source.slice(0, value.start) + conditions + source.slice(tokens[end]!.end)
          }
          if (current.kind === SyntaxKind.OpenBraceToken || current.kind === SyntaxKind.OpenBracketToken) innerDepth++
          if (current.kind === SyntaxKind.CloseBraceToken || current.kind === SyntaxKind.CloseBracketToken) innerDepth--
          if (innerDepth === 0) {
            const previous = tokens[cursor - 1]!
            const comma = cursor === first + 1 || previous.kind === SyntaxKind.CommaToken ? "" : ","
            return source.slice(0, current.start) + `${comma}"customConditions":${conditions}` + source.slice(current.start)
          }
        }
      }
      if (token.kind === SyntaxKind.OpenBraceToken || token.kind === SyntaxKind.OpenBracketToken) depth++
      if (token.kind === SyntaxKind.CloseBraceToken || token.kind === SyntaxKind.CloseBracketToken) depth--
    }
    const last = tokens.at(-1)
    if (last?.kind !== SyntaxKind.CloseBraceToken) return source
    const previous = tokens.at(-2)
    const comma = previous?.kind === SyntaxKind.OpenBraceToken || previous?.kind === SyntaxKind.CommaToken ? "" : ","
    return source.slice(0, last.start) + `${comma}"compilerOptions":{"customConditions":${conditions}}` + source.slice(last.start)
  }}
}

function projectSourceFiles(source: string, files: readonly string[]): string {
  const values = new Map([["files", JSON.stringify([...new Set(files)])], ["include", "[]"], ["exclude", "[]"]])
  const scanner = createScanner(true, undefined, source)
  const tokens: {kind: SyntaxKind, value: string, start: number, end: number}[] = []
  for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile; kind = scanner.scan()) tokens.push({kind, value: scanner.getTokenValue(), start: scanner.getTokenStart(), end: scanner.getTokenEnd()})
  const edits: {start: number, end: number, value: string}[] = []
  let depth = 0
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]!
    if (depth === 1 && token.kind === SyntaxKind.StringLiteral && values.has(token.value) && tokens[index + 1]?.kind === SyntaxKind.ColonToken) {
      const first = tokens[index + 2]!
      let end = index + 2, innerDepth = 0
      for (; end < tokens.length; end++) {
        const part = tokens[end]!
        if (part.kind === SyntaxKind.OpenBracketToken || part.kind === SyntaxKind.OpenBraceToken) innerDepth++
        if (part.kind === SyntaxKind.CloseBracketToken || part.kind === SyntaxKind.CloseBraceToken) innerDepth--
        if (innerDepth === 0) break
      }
      edits.push({start: first.start, end: tokens[end]!.end, value: values.get(token.value)!})
      values.delete(token.value)
    }
    if (token.kind === SyntaxKind.OpenBraceToken || token.kind === SyntaxKind.OpenBracketToken) depth++
    if (token.kind === SyntaxKind.CloseBraceToken || token.kind === SyntaxKind.CloseBracketToken) depth--
  }
  const last = tokens.at(-1)
  if (values.size && last?.kind === SyntaxKind.CloseBraceToken) {
    const previous = tokens.at(-2)
    const comma = previous?.kind === SyntaxKind.OpenBraceToken || previous?.kind === SyntaxKind.CommaToken ? "" : ","
    edits.push({start: last.start, end: last.start, value: comma + [...values].map(([name, value]) => `${JSON.stringify(name)}:${value}`).join(",")})
  }
  for (const edit of edits.sort((left, right) => right.start - left.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end)
  return source
}

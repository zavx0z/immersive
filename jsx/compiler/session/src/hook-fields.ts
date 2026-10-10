import {SyntaxKind} from "typescript/unstable/ast"
import {createScanner} from "typescript/unstable/ast/scanner"
import type {LoweredHooks} from "./hook-lowering.ts"

/** Персистентные значения конкретных hook-sites принадлежат самому DOM owner. */
export function ownHookFields(hooks: LoweredHooks, owner: string, symbolOwner?: string): LoweredHooks & {fieldNames: readonly string[]} {
  const names = new Set<string>()
  const declarations: {name: string, initial: string}[] = []
  for (const field of hooks.fields) {
    if (!/^(?:let|const)\s/.test(field)) throw new Error("Expected a generated hook field declaration")
    const scanner = createScanner(true, undefined, field)
    scanner.scan()
    let start = scanner.getTokenEnd(), depth = 0
    const declare = (end: number) => {
      const fragment = field.slice(start, end).trim()
      const match = /^(\w+)(?:\s*=\s*([\s\S]*))?$/.exec(fragment)
      if (!match) throw new Error("Invalid generated hook field declaration")
      names.add(match[1]!)
      declarations.push({name: match[1]!, initial: match[2] ?? "undefined"})
    }
    for (let kind = scanner.scan(); ; kind = scanner.scan()) {
      if (kind === SyntaxKind.EndOfFile) { declare(field.length); break }
      if (kind === SyntaxKind.CommaToken && depth === 0) { declare(scanner.getTokenStart()); start = scanner.getTokenEnd() }
      if (kind === SyntaxKind.OpenParenToken || kind === SyntaxKind.OpenBraceToken || kind === SyntaxKind.OpenBracketToken) depth++
      if (kind === SyntaxKind.CloseParenToken || kind === SyntaxKind.CloseBraceToken || kind === SyntaxKind.CloseBracketToken) depth--
    }
  }
  const rewrite = (source: string): string => {
    // Префикс предварительно выбран отсутствующим во всём авторском тексте.
    // Поэтому здесь встречаются только созданные compiler идентификаторы,
    // включая выражения внутри template literals и regular expressions.
    if (names.size === 0) return source
    return source.replace(new RegExp(`\\b(?:${[...names].join("|")})\\b`, "g"), name => `${owner}[${symbolOwner ?? ""}${name}Field]`)
  }
  return {
    source: rewrite(hooks.source),
    fieldNames: declarations.map(({name}) => `${name}Field`),
    fields: declarations.flatMap(({name, initial}) => [...(symbolOwner ? [] : [`const ${name}Field = Symbol()`]), `${owner}[${symbolOwner ?? ""}${name}Field] = ${rewrite(initial)}`]),
    commit: hooks.commit.map(rewrite), refs: hooks.refs.map(rewrite), insertion: hooks.insertion.map(rewrite),
    layout: hooks.layout.map(rewrite), passive: hooks.passive.map(rewrite),
    disconnect: hooks.disconnect.map(rewrite), checks: hooks.checks.map(rewrite),
    memoChecks: hooks.memoChecks.map(rewrite), adopt: hooks.adopt.map(rewrite), dispose: hooks.dispose.map(rewrite),
  }
}

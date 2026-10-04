import type {ImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"
type CodeEditorProps = ImmersiveUiComponentViewCodeEditor.Input
import type {CodeEditorSegment} from "../contract/types.ts"
import type {ImmersiveUiComponentViewCodeEditorViewModel} from "../contract"
type CodeEditorViewModel = ImmersiveUiComponentViewCodeEditorViewModel.Output
import type {NormalizedToken} from "./types"
import assertNonEmpty from "@zavx0z/immersive-tech-text-assert-non-empty"
import editorForeground from "@zavx0z/immersive-ui-view-code-editor-editor-foreground"
import isHexColor from "@zavx0z/immersive-tech-color-hex-valid"
import normalizeHexColor from "@zavx0z/immersive-tech-color-hex-normalize"
import resolveCodeEditorHighlighter from "@zavx0z/immersive-ui-component-view-code-editor-highlighter"
import type {Token} from "@zavx0z/highlighter"
import type {Tokens} from "@zavx0z/highlighter"
import resolveCodeEditorSyntaxScopeColorHex from "@zavx0z/immersive-ui-component-view-code-editor-syntax-theme-resolve-scope-color-hex"

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function buildViewModel(props: CodeEditorProps): CodeEditorViewModel {
  const value = props.value
  const lines = Object.freeze(value.split(/\r\n|\r|\n/u))
  const lineEndings = Object.freeze(value.match(/\r\n|\r|\n/gu) ?? [])
  const resolved = props.tokens === undefined
    ? tokenize(lines, props.languageId, props.path)
    : Object.freeze({tokens: normalizeTokens(props.tokens, lines, false), languageId: props.languageId ?? "supplied"})
  const snapshot: CodeEditorProps = Object.freeze({
    value,
    readOnly: props.readOnly,
    ...(props.model === undefined ? {} : {model: props.model}),
    ...(props.onChange === undefined ? {} : {onChange: props.onChange}),
    ...(props.ref === undefined ? {} : {ref: props.ref}),
    ...(props.onLineNumberClick === undefined ? {} : {onLineNumberClick: props.onLineNumberClick}),
    ...(props.languageId === undefined ? {} : {languageId: props.languageId}),
    ...(props.path === undefined ? {} : {path: props.path}),
    ...(props.tokens === undefined ? {} : {tokens: resolved.tokens as Tokens}),
    showLineNumbers: props.showLineNumbers ?? true,
    ...(props.title === undefined ? {} : {title: props.title}),
    ...(props.style === undefined ? {} : {style: props.style})
  })
  return Object.freeze({
    props: snapshot,
    lines,
    lineEndings,
    segments: Object.freeze(lines.map((line, index) => segmentsFor(line, resolved.tokens[index] ?? []))),
    resolvedLanguageId: resolved.languageId
  })
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function tokenize(
  lines: readonly string[],
  languageId: string | undefined,
  path: string | undefined
): Readonly<{tokens: readonly (readonly NormalizedToken[])[]; languageId: string}> {
  const highlighter = resolveCodeEditorHighlighter(languageId, path)
  const tokens = highlighter.tokenize(lines, {resolveForeground: resolveCodeEditorSyntaxScopeColorHex})
  return Object.freeze({tokens: normalizeTokens(tokens, lines, true), languageId: highlighter.id})
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function normalizeTokens(
  tokens: Tokens,
  lines: readonly string[],
  normalizeOverlaps: boolean
): readonly (readonly NormalizedToken[])[] {
  if (!Array.isArray(tokens) || tokens.length !== lines.length) {
    throw new RangeError("CodeEditor tokens must contain exactly one row per line")
  }
  return Object.freeze(tokens.map((row, lineIndex) => {
    if (!Array.isArray(row)) throw new TypeError(`CodeEditor tokens row ${lineIndex} must be an array`)
    const normalized = row.map((token, tokenIndex) => normalizeToken(token, lineIndex, tokenIndex, lines[lineIndex]!.length))
      .sort((left, right) => left.s - right.s || right.e - left.e)
    const flattened: NormalizedToken[] = []
    let end = 0
    for (const token of normalized) {
      if (token.s < end && !normalizeOverlaps) throw new RangeError(`CodeEditor tokens overlap on line ${lineIndex}`)
      const start = normalizeOverlaps ? Math.max(end, token.s) : token.s
      if (token.e <= start) continue
      const next = start === token.s ? token : Object.freeze({...token, s: start})
      flattened.push(next)
      end = next.e
    }
    return Object.freeze(flattened)
  }))
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function normalizeToken(
  token: Token,
  lineIndex: number,
  tokenIndex: number,
  lineLength: number
): NormalizedToken {
  if (typeof token !== "object" || token === null) throw new TypeError(`CodeEditor token ${lineIndex}:${tokenIndex} must be an object`)
  if (!Number.isSafeInteger(token.s) || !Number.isSafeInteger(token.e) || token.s < 0 || token.e <= token.s || token.e > lineLength) {
    throw new RangeError(`CodeEditor token ${lineIndex}:${tokenIndex} has an invalid range`)
  }
  assertNonEmpty(token.c, `CodeEditor token ${lineIndex}:${tokenIndex} category`)
  if (token.fg !== undefined) assertHexColor(token.fg, `CodeEditor token ${lineIndex}:${tokenIndex} foreground`)
  if (token.bg !== undefined) assertBackgroundColor(token.bg, `CodeEditor token ${lineIndex}:${tokenIndex} background`)
  return Object.freeze({
    s: token.s,
    e: token.e,
    c: token.c,
    ...(token.fg === undefined ? {} : {fg: normalizeHexColor(token.fg)}),
    ...(token.bg === undefined ? {} : {bg: normalizeBackgroundColor(token.bg)})
  })
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function segmentsFor(line: string, tokens: readonly NormalizedToken[]): readonly CodeEditorSegment[] {
  const segments: CodeEditorSegment[] = []
  let cursor = 0
  for (const token of tokens) {
    if (token.s > cursor) segments.push(segment(line, cursor, token.s, "plain"))
    segments.push(segment(line, token.s, token.e, token.c, token.fg, token.bg))
    cursor = token.e
  }
  if (cursor < line.length) segments.push(segment(line, cursor, line.length, "plain"))
  return Object.freeze(segments)
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function segment(
  line: string,
  start: number,
  end: number,
  category: string,
  foreground?: string,
  background?: string
): CodeEditorSegment {
  const color = foreground ?? categoryColor(category)
  const prefix = category === "plain" ? "gap" : "token"
  return Object.freeze({
    key: `${prefix}:${start}:${end}:${category}`,
    start,
    end,
    category,
    text: line.slice(start, end),
    foreground: color,
    ...(category === "plain" && foreground === undefined ? {inheritForeground: true as const} : {}),
    ...(background === undefined ? {} : {background})
  })
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function categoryColor(category: string): string {
  const scope = ({
    k: "keyword.control",
    s: "string.quoted",
    n: "constant.numeric",
    c: "comment",
    t: "entity.name.type",
    f: "entity.name.function",
    p: "punctuation",
    d: "variable.other"
  } as Readonly<Record<string, string>>)[category] ?? category
  return resolveCodeEditorSyntaxScopeColorHex([scope], editorForeground) ?? editorForeground
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function assertHexColor(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !isHexColor(value)) throw new TypeError(`${label} must be a hex color`)
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function assertBackgroundColor(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !isBackgroundColor(value)) {
    throw new TypeError(`${label} must be a supported CSS color`)
  }
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function isBackgroundColor(value: string): boolean {
  const color = value.trim()
  return isHexColor(color) || /^rgba?\(\s*[+\-.\d%]+(?:\s*(?:,|\/|\s)\s*[+\-.\d%]+){2,3}\s*\)$/iu.test(color)
}

/** Частная подготовка подготовка строк, токенов и оформления редактора. */
export function normalizeBackgroundColor(value: string): string {
  return isHexColor(value) ? normalizeHexColor(value) : value.trim()
}

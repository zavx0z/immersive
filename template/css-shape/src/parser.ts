import {containsTaggedTemplateMarker, parseTaggedTemplateSegments, type TaggedTemplateSegment} from "../../tagged-template.ts"
import type {CssTemplateAttributeSelector, CssTemplateRule, CssTemplateItem, CssTemplatePseudo, CssTemplateDeclaration} from "./types.ts"
const supportedPseudos: readonly CssTemplatePseudo[] = Object.freeze([
  ":focus-within",
  ":indeterminate",
  ":disabled",
  ":checked",
  ":active",
  ":hover",
  ":focus",
])


export function parseDeclarations(
  source: string,
  slotCount: number,
  seenSlots: Set<number>,
): CssTemplateDeclaration[] {
  const declarations: CssTemplateDeclaration[] = []
  for (const entry of splitCss(source, ";")) {
    const value = entry.trim()
    if (value.length === 0) continue
    declarations.push(parseDeclaration(value, slotCount, seenSlots))
  }
  return declarations
}

export function parseDeclaration(
  source: string,
  slotCount: number,
  seenSlots: Set<number>,
): CssTemplateDeclaration {
  const value = source.trim()
  const colon = findCssSeparator(value, ":")
  if (colon < 0) throw new Error(`Scoped CSS declaration is missing a colon: ${value}`)
  const property = value.slice(0, colon).trim()
  const declarationValue = value.slice(colon + 1).trim()
  if (containsTaggedTemplateMarker(property)) {
    throw new Error("CSS property names cannot contain interpolations")
  }
  if (!/^(?:--[a-zA-Z0-9_-]+|-?[a-z][a-z0-9-]*)$/.test(property)) {
    throw new Error(`Invalid scoped CSS property ${property}`)
  }
  if (declarationValue.length === 0) {
    throw new Error(`Scoped CSS property ${property} requires a value`)
  }
  const segments = parseTaggedTemplateSegments(declarationValue, slotCount)
  for (const segment of segments) {
    if (segment.type !== "slot") continue
    if (seenSlots.has(segment.index)) throw new Error(`Duplicate CSS interpolation ${segment.index}`)
    seenSlots.add(segment.index)
  }
  return Object.freeze({property, segments: Object.freeze(segments)})
}

export function parseScopedSelector(value: string): Readonly<{
  attributeSelectors: readonly CssTemplateAttributeSelector[]
  pseudoClass: string
  suffix: string
}> {
  if (containsTaggedTemplateMarker(value)) throw new Error("CSS selectors cannot contain interpolations")
  if (value === "&") {
    throw new Error(
      "Redundant component CSS selector & { ... }; write base declarations directly and remove the & { } wrapper",
    )
  }
  if (!value.startsWith("&")) {
    throw new Error(`Component CSS selector must start with &: ${value}`)
  }
  let cursor = 1
  let rootSuffix = ""
  const attributeSelectors: CssTemplateAttributeSelector[] = []
  while (value[cursor] === "[") {
    const attribute = readScopedAttributeSelector(value, cursor)
    attributeSelectors.push(attribute.selector)
    rootSuffix += attribute.source
    cursor = attribute.end
  }
  const pseudoClass = supportedPseudos.find(pseudo => value.startsWith(pseudo, cursor)) ?? ""
  cursor += pseudoClass.length
  let descendantSuffix = ""
  if (cursor < value.length) {
    if (!/\s/.test(value[cursor]!)) {
      throw new Error(`Unsupported component CSS selector ${value}`)
    }
    while (cursor < value.length && /\s/.test(value[cursor]!)) cursor += 1
    while (value[cursor] === "[") {
      const attribute = readScopedAttributeSelector(value, cursor)
      attributeSelectors.push(attribute.selector)
      descendantSuffix += attribute.source
      cursor = attribute.end
    }
    if (descendantSuffix === "" || cursor !== value.length) {
      throw new Error(`Unsupported component CSS selector ${value}`)
    }
  }
  if (cursor !== value.length) throw new Error(`Unsupported component CSS selector ${value}`)
  if (rootSuffix === "" && pseudoClass === "" && descendantSuffix === "") {
    throw new Error(`Unsupported component CSS selector ${value}`)
  }
  return Object.freeze({
    attributeSelectors: Object.freeze(attributeSelectors),
    pseudoClass,
    suffix: `${rootSuffix}${pseudoClass}${descendantSuffix === "" ? "" : ` ${descendantSuffix}`}`,
  })
}

function readScopedAttributeSelector(
  value: string,
  cursor: number,
): Readonly<{
  end: number
  selector: CssTemplateAttributeSelector
  source: string
}> {
  const match = /^\[([a-zA-Z_][a-zA-Z0-9_.:-]*)(?:=(["'])([^"'\\\]]*)\2)?\]/.exec(
    value.slice(cursor),
  )
  if (match === null) throw new Error(`Unsupported component CSS selector ${value}`)
  const name = match[1]!.toLowerCase()
  const attributeValue = match[3]
  return Object.freeze({
    end: cursor + match[0].length,
    selector: Object.freeze({
      name,
      value: attributeValue ?? null,
    }),
    source: attributeValue === undefined
      ? `[${name}]`
      : `[${name}=${JSON.stringify(attributeValue)}]`,
  })
}

type TopLevelBoundary = Readonly<{
  index: number
  type: "close" | "open" | "semicolon"
}> | Readonly<{
  type: "end"
}>

export function findTopLevelBoundary(source: string, start: number): TopLevelBoundary {
  let quote: "\"" | "'" | null = null
  let parentheses = 0
  for (let cursor = start; cursor < source.length; cursor += 1) {
    const character = source[cursor]
    if (quote) {
      if (character === "\\") cursor += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === "\"" || character === "'") {
      quote = character
      continue
    }
    if (character === "(") parentheses += 1
    else if (character === ")") {
      parentheses -= 1
      if (parentheses < 0) throw new Error("Scoped CSS contains an unexpected closing parenthesis")
    } else if (parentheses === 0 && character === "{") {
      return Object.freeze({type: "open", index: cursor})
    } else if (parentheses === 0 && character === "}") {
      return Object.freeze({type: "close", index: cursor})
    } else if (parentheses === 0 && character === ";") {
      return Object.freeze({type: "semicolon", index: cursor})
    }
  }
  if (quote) throw new Error("Scoped CSS contains an unclosed string")
  if (parentheses !== 0) throw new Error("Scoped CSS contains unbalanced parentheses")
  return Object.freeze({type: "end"})
}

export function findRuleClose(source: string, start: number): number {
  let quote: "\"" | "'" | null = null
  let parentheses = 0
  for (let cursor = start; cursor < source.length; cursor += 1) {
    const character = source[cursor]
    if (quote) {
      if (character === "\\") cursor += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === "\"" || character === "'") {
      quote = character
      continue
    }
    if (character === "(") parentheses += 1
    else if (character === ")") {
      parentheses -= 1
      if (parentheses < 0) throw new Error("Scoped CSS contains an unexpected closing parenthesis")
    } else if (character === "{" && parentheses === 0) {
      throw new Error("Nested component CSS rules are unsupported")
    } else if (character === "}" && parentheses === 0) return cursor
  }
  throw new Error("Scoped CSS rule is missing a closing brace")
}

function splitCss(source: string, separator: string): string[] {
  const result: string[] = []
  let quote: "\"" | "'" | null = null
  let parentheses = 0
  let start = 0
  for (let cursor = 0; cursor < source.length; cursor += 1) {
    const character = source[cursor]
    if (quote) {
      if (character === "\\") cursor += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === "\"" || character === "'") {
      quote = character
      continue
    }
    if (character === "(") parentheses += 1
    else if (character === ")") parentheses -= 1
    else if (character === separator && parentheses === 0) {
      result.push(source.slice(start, cursor))
      start = cursor + 1
    }
  }
  if (quote) throw new Error("Scoped CSS contains an unclosed string")
  if (parentheses !== 0) throw new Error("Scoped CSS contains unbalanced parentheses")
  result.push(source.slice(start))
  return result
}

function findCssSeparator(source: string, separator: string): number {
  let quote: "\"" | "'" | null = null
  let parentheses = 0
  for (let cursor = 0; cursor < source.length; cursor += 1) {
    const character = source[cursor]
    if (quote) {
      if (character === "\\") cursor += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === "\"" || character === "'") quote = character
    else if (character === "(") parentheses += 1
    else if (character === ")") parentheses -= 1
    else if (character === separator && parentheses === 0) return cursor
  }
  return -1
}

export function removeCssComments(source: string): string {
  let result = ""
  let quote: "\"" | "'" | null = null
  for (let cursor = 0; cursor < source.length; cursor += 1) {
    const character = source[cursor]!
    if (quote) {
      result += character
      if (character === "\\" && cursor + 1 < source.length) result += source[++cursor]
      else if (character === quote) quote = null
      continue
    }
    if (character === "\"" || character === "'") {
      quote = character
      result += character
      continue
    }
    if (character === "/" && source[cursor + 1] === "*") {
      const end = source.indexOf("*/", cursor + 2)
      if (end < 0) throw new Error("Scoped CSS contains an unclosed comment")
      result += " "
      cursor = end + 1
      continue
    }
    result += character
  }
  return result
}

export function skipWhitespace(source: string, start: number): number {
  let cursor = start
  while (cursor < source.length && /\s/.test(source[cursor]!)) cursor += 1
  return cursor
}

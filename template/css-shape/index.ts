/** Разбирает статическую структуру CSS-шаблона для HTML и JSX.

@packageDocumentation
*/
import {joinTaggedTemplateSource, readTaggedTemplateMarker} from "../tagged-template.ts"
import type {CssTemplateShape} from "./contract/output.ts"
import type {CssTemplateInput} from "./contract/input.ts"
import type {CssTemplateRule, CssTemplateItem, CssTemplateDeclaration} from "./src/types.ts"
import {removeCssComments, skipWhitespace, findTopLevelBoundary, parseScopedSelector, findRuleClose, parseDeclarations, parseDeclaration} from "./src/parser.ts"
export type {CssTemplateShape} from "./contract/output.ts"
export type {CssTemplateInput} from "./contract/input.ts"

export function parseCssTemplateShape(strings: CssTemplateInput): CssTemplateShape {
  const slotCount = strings.length - 1
  const source = removeCssComments(joinTaggedTemplateSource(strings))
  const rules: CssTemplateRule[] = []
  const items: CssTemplateItem[] = []
  const fragmentSlots: number[] = []
  const seenSlots = new Set<number>()
  let directDeclarations: CssTemplateDeclaration[] = []
  const flushDirectDeclarations = (): void => {
    if (directDeclarations.length === 0) return
    const rule = Object.freeze({
      attributeSelectors: Object.freeze([]),
      type: "rule" as const,
      pseudo: "",
      pseudoClass: "",
      declarations: Object.freeze(directDeclarations),
    })
    rules.push(rule)
    items.push(rule)
    directDeclarations = []
  }
  let cursor = 0
  while (true) {
    cursor = skipWhitespace(source, cursor)
    if (cursor >= source.length) break
    const fragment = readTaggedTemplateMarker(source, cursor, slotCount)
    if (fragment !== null) {
      const afterFragment = skipWhitespace(source, fragment.end)
      if (source[afterFragment] === ":") {
        throw new Error("CSS property names cannot contain interpolations")
      }
      flushDirectDeclarations()
      if (seenSlots.has(fragment.index)) throw new Error(`Duplicate CSS interpolation ${fragment.index}`)
      seenSlots.add(fragment.index)
      fragmentSlots.push(fragment.index)
      items.push(Object.freeze({type: "fragment", index: fragment.index}))
      cursor = fragment.end
      continue
    }
    const boundary = findTopLevelBoundary(source, cursor)
    if (boundary.type === "close") {
      throw new Error("Scoped CSS contains an unexpected closing brace")
    }
    if (boundary.type === "open") {
      flushDirectDeclarations()
      const selector = source.slice(cursor, boundary.index).trim()
      const parsedSelector = parseScopedSelector(selector)
      const close = findRuleClose(source, boundary.index + 1)
      const declarations = parseDeclarations(
        source.slice(boundary.index + 1, close),
        slotCount,
        seenSlots,
      )
      if (declarations.length === 0) throw new Error(`Scoped CSS selector ${selector} has no declarations`)
      const rule = Object.freeze({
        attributeSelectors: parsedSelector.attributeSelectors,
        type: "rule" as const,
        pseudo: parsedSelector.suffix,
        pseudoClass: parsedSelector.pseudoClass,
        declarations: Object.freeze(declarations)
      })
      rules.push(rule)
      items.push(rule)
      cursor = close + 1
      continue
    }
    const end = boundary.type === "semicolon" ? boundary.index : source.length
    const declaration = parseDeclaration(source.slice(cursor, end), slotCount, seenSlots)
    directDeclarations.push(declaration)
    cursor = boundary.type === "semicolon" ? boundary.index + 1 : source.length
  }
  flushDirectDeclarations()
  if (items.length === 0) throw new Error("A css template requires at least one declaration, scoped rule, or fragment")
  for (let index = 0; index < slotCount; index += 1) {
    if (!seenSlots.has(index)) {
      throw new Error(`CSS interpolation ${index} must occur in a declaration value or between rules`)
    }
  }
  return Object.freeze({
    items: Object.freeze(items),
    rules: Object.freeze(rules),
    fragmentSlots: Object.freeze(fragmentSlots),
    slotCount
  })
}

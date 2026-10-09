import type {Document, Element} from "@zavx0z/immersive-dom"
import {computeStyle, computedCustomProperty, type ComputedStyle} from "./css.ts"
import {cachedDocumentStyleRules, prepareHostStyleSheets} from "./stylesheet-cache.ts"
import type {DocumentInteractionState} from "./pseudo-state.ts"

/** Общий CSS-каскад пространственных ресурсов без layout и обхода потомков. */
export function readElementStyle(document: Document, element: Element, properties: readonly string[] = [], interactionState?: DocumentInteractionState) {
  const {rules} = cachedDocumentStyleRules(document, emptyHost)
  const ancestors: Element[] = []
  for (let current: Element | null = element; current !== null; current = current.parentElement) ancestors.push(current)
  let style: ComputedStyle | null = null
  let opacity = 1
  for (let index = ancestors.length - 1; index >= 0; index--) {
    style = computeStyle(ancestors[index]!, style, rules, interactionState)
    opacity *= style.opacity
  }
  const customProperties: Record<string, string> = {}
  for (const name of properties) {
    if (!name.startsWith("--")) throw new TypeError("Нужно имя CSS custom property")
    const value = computedCustomProperty(style!, name)
    if (value !== null) customProperties[name] = value
  }
  return {color: style!.color, opacity, customProperties}
}

const emptyHost = prepareHostStyleSheets([])

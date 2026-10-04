import codeEditorSyntaxTheme from "@immersive-ui-component-view-code-editor-syntax-theme/data"

/** Частная подготовка цвет синтаксической области редактора. */
export const foregroundRules = codeEditorSyntaxTheme.tokenColors.map(rule => ({
  foreground: rule.settings.foreground,
  scopes: ruleScopes(rule.scope).map(scope => ({scope, parts: scope.split(/\\s+|>/u).map(part => part.trim())})),
}))

/** Частная подготовка цвет синтаксической области редактора. */
export const foregroundCache = new Map<string, string | undefined>()

/** Частная подготовка цвет синтаксической области редактора. */
export const foregroundCacheLimit = 4096

/** Частная подготовка цвет синтаксической области редактора. */
export function foregroundFor(selectors: readonly string[]): string | undefined {
  const key = JSON.stringify(selectors)
  if (foregroundCache.has(key)) return foregroundCache.get(key)
  const color = resolveForeground(selectors)
  if (foregroundCache.size >= foregroundCacheLimit) foregroundCache.delete(foregroundCache.keys().next().value!)
  foregroundCache.set(key, color)
  return color
}

/** Частная подготовка цвет синтаксической области редактора. */
export function resolveForeground(selectors: readonly string[]): string | undefined {
  for (const exact of [true, false]) {
    for (const selector of selectors) {
      for (let index = foregroundRules.length - 1; index >= 0; index -= 1) {
        const rule = foregroundRules[index]
        if (rule === undefined) continue
        if (rule.scopes.some(({scope, parts}) => scope === selector || parts.some(part =>
          part === selector || !exact && (part.startsWith(`${selector}.`) || selector.startsWith(`${part}.`))))) return rule.foreground
      }
    }
  }
  return undefined
}

/** Частная подготовка цвет синтаксической области редактора. */
export function ruleScopes(scope: string | readonly string[] | undefined): readonly string[] {
  const values = typeof scope === "string" ? [scope] : scope ?? []
  const scopes: string[] = []
  for (const value of values) {
    for (const part of value.split(",")) {
      const trimmed = part.trim()
      if (trimmed.length > 0) scopes.push(trimmed)
    }
  }
  return scopes
}

/** Частная подготовка цвет синтаксической области редактора. */
export function normalizeHexColor(value: string | undefined): string | undefined {
  const raw = value?.trim()
  if (raw === undefined) return undefined
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/iu.exec(raw)
  if (match === null) return undefined
  const body = match[1]!
  return body.length === 3
    ? body.split("").map(character => character + character).join("").toLowerCase()
    : body.toLowerCase()
}

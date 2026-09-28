import type {TaggedTemplateSegment} from "../../tagged-template.ts"

export type CssTemplateDeclaration = Readonly<{
  property: string
  segments: readonly TaggedTemplateSegment[]
}>

export type CssTemplateAttributeSelector = Readonly<{
  name: string
  value: string | null
}>

export type CssTemplateRule = Readonly<{
  attributeSelectors: readonly CssTemplateAttributeSelector[]
  type: "rule"
  pseudo: string
  pseudoClass: string
  declarations: readonly CssTemplateDeclaration[]
}>

export type CssTemplateFragment = Readonly<{
  type: "fragment"
  index: number
}>

export type CssTemplateItem = CssTemplateRule | CssTemplateFragment

export type CssTemplatePseudo =
  | ":active"
  | ":checked"
  | ":disabled"
  | ":focus"
  | ":focus-within"
  | ":hover"
  | ":indeterminate"

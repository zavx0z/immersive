import type {CssSourceValue, CssTemplateValue} from "./css.ts"

/** Compile-time intrinsic настоящего CSS document, которым владеет Template. */
export interface CssCompilerIntrinsic {
  readonly "@immersive/template/css-compiler-intrinsic": true
  (strings: TemplateStringsArray, ...values: readonly CssTemplateValue[]): CssSourceValue & string
}

declare global {
  /** Авторский CSS intrinsic связывается компилятором, без runtime global. */
  var css: CssCompilerIntrinsic
  /** Branded CSS transport, передаваемый через props без runtime-парсинга. */
  interface CssStyle extends CssSourceValue {}
}

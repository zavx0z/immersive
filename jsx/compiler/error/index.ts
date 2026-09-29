/** Диагностика отклонённого JSX с точным исходным файлом.

@packageDocumentation
*/
import type {JsxErrorInput} from "./contract/input.ts"
import type {JsxErrorOutput} from "./contract/output.ts"
export type {JsxErrorInput} from "./contract/input.ts"
export type {JsxErrorOutput} from "./contract/output.ts"

export default class JsxCompileError extends Error implements JsxErrorOutput {
  override readonly name = "JsxCompileError"

  constructor(message: JsxErrorInput[0], readonly sourcePath: JsxErrorInput[1]) {
    super(`${sourcePath}: ${message}`)
  }
}

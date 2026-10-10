/**
Типовой automatic JSX protocol. Исполнение требует предварительной компиляции:
JSX превращается в самостоятельные DOM-компоненты, вызовов jsx/jsxs в результате нет.

@packageDocumentation
*/
import type {RuntimeInput} from "./contract/input.ts"
import type {RuntimeOutput} from "./contract/output.ts"
export type {JSX} from "./src/protocol.ts"
export type {RuntimeInput} from "./contract/input.ts"
export type {RuntimeOutput} from "./contract/output.ts"

/** Диагностика случайного запуска авторского JSX без compiler. */
export default function jsx(..._arguments: RuntimeInput): RuntimeOutput {
  throw new Error("JSX требует предварительной компиляции в DOM-компонент")
}

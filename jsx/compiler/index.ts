/**
Домен компиляции JSX: сессия преобразования, подключение Bun и диагностика.
Серверный API назначает имена компонентам и раскрывает их контракты.

@packageDocumentation
*/
export {default as JsxCompilerSession} from "@jsx-compiler/session"
export type {JsxCompilerSessionOptions, JsxCompileResult} from "@jsx-compiler/session"
export {default as createJsxBunPlugin} from "@jsx-compiler/bun"
export type {CreateJsxPluginOptions, JsxPlugin} from "@jsx-compiler/bun"
export {default as JsxCompileError} from "@jsx-compiler/error"
export type {JsxErrorInput, JsxErrorOutput} from "@jsx-compiler/error"

export type {JSX} from "@jsx-compiler/session"

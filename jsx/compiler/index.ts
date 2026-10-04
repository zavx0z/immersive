/**
Домен компиляции JSX: сессия преобразования, подключение Bun и диагностика.
Серверный API назначает имена компонентам и раскрывает их контракты.

@packageDocumentation
*/
export {default as JsxCompilerSession} from "@immersive-jsx-compiler/session"
export type {JsxCompilerSessionOptions, JsxCompileResult} from "@immersive-jsx-compiler/session"
export {default as createJsxBunPlugin} from "@immersive-jsx-compiler/bun"
export type {CreateJsxPluginOptions, JsxPlugin} from "@immersive-jsx-compiler/bun"
export {default as JsxCompileError} from "@immersive-jsx-compiler/error"
export type {JsxErrorInput, JsxErrorOutput} from "@immersive-jsx-compiler/error"

export type {JSX} from "@immersive-jsx-compiler/session"

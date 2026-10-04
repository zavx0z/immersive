/**
Домен компиляции JSX: сессия преобразования, подключение Bun и диагностика.
Серверный API назначает имена компонентам и раскрывает их контракты.

@packageDocumentation
*/
export {default as JsxCompilerSession} from "@zavx0z/immersive-jsx-compiler-session"
export type {JsxCompilerSessionOptions, JsxCompileResult} from "@zavx0z/immersive-jsx-compiler-session"
export {default as createJsxBunPlugin} from "@zavx0z/immersive-jsx-compiler-bun"
export type {CreateJsxPluginOptions, JsxPlugin} from "@zavx0z/immersive-jsx-compiler-bun"
export {default as JsxCompileError} from "@zavx0z/immersive-jsx-compiler-error"
export type {JsxErrorInput, JsxErrorOutput} from "@zavx0z/immersive-jsx-compiler-error"

export type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

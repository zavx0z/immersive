/**
JSX, hooks и compiler Immersive для авторинга и сборки.
Готовые компоненты исполняются в DOM и не импортируют этот модуль.

@packageDocumentation
*/
export * from "@zavx0z/immersive-component/authoring"
export {default as createJsxBunPlugin} from "@zavx0z/immersive-jsx-compiler-bun"
export {default as JsxCompilerSession} from "@zavx0z/immersive-jsx-compiler-session"

export {useSpace, useFrame} from "@zavx0z/immersive-browser/authoring"
export type {RootState, RootSize, FrameState, FrameCallback, FrameLoop} from "@zavx0z/immersive-browser"

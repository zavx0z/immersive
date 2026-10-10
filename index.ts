/**
Документ, элементы и подключение одного приложения Immersive.

Императивный код и декларативное содержимое используют один DOM, ввод и цикл
кадров. Компонентное авторство подключается отдельно через XReact; сам документ
не зависит от JSX и состояния компонентов.

@packageDocumentation
*/
export * from "@zavx0z/immersive-dom"
export * from "@zavx0z/immersive-dom/space"
export * from "@zavx0z/immersive-dom/viewpoint"
export * from "@zavx0z/immersive-dom/display"
export * from "@zavx0z/immersive-dom/hud"
export {createDocumentRoot as createRoot} from "@zavx0z/immersive-browser/document"
export type {DocumentRoot as Root, DocumentRootOptions as RootOptions} from "@zavx0z/immersive-browser/document"
export {createSpaceElementFactories} from "@zavx0z/immersive-space"
export * from "@zavx0z/immersive-browser/audio"
export * from "@zavx0z/immersive-browser/clipboard"

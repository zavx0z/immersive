/**
Подключение декларативного приложения к одному Canvas.

`createRoot(canvas).render(<App />)` подключает одно приложение. Browser владеет
общими ресурсами, вводом и планированием кадров.
Сгенерированный код получает состояние подключения и подписку на общий кадр
через documentEnvironment. Сцена, камера и интерфейс остаются элементами одного Document.

@packageDocumentation
*/
export {createRoot} from "../create-root.ts"
export type {Root, RootOptions} from "../create-root.ts"
export {createDocumentRoot} from "../document/index.ts"
export type {DocumentRoot, DocumentRootOptions} from "../document/index.ts"

export {documentEnvironment} from "./document-environment.ts"
export type {RootSize, RootState, FrameState, FrameCallback, FrameLoop} from "./document-environment.ts"
export type {DocumentClipboardController, ClipboardMenuState, ClipboardResult} from "../clipboard.ts"

/**
Документ, элементы и подключение одного приложения Immersive.

Императивный JavaScript, JS Template с CSS и готовые JSX-компоненты используют
одни узлы, состояние свойств, события и жизненный цикл Document. Browser
подключает этот Document к Canvas, общему вводу и циклу кадров.
XReact предоставляет авторские JSX, hooks и compiler в отдельном входе
`@zavx0z/immersive/XReact`; готовому компоненту этот модуль не требуется.

Компонент с одним intrinsic root создаёт сам этот Element. Для тегов,
предоставленных фабрикой Document, сохраняются её объект и prototype.
Фрагмент сохраняет область настоящих Nodes через DOMGroup; дополнительный
host Element не создаётся. Методы update/dispose исполняют код конкретного
компонента, а изменение дерева и lifecycle принадлежат DOM.

Содержимое слотов передаётся готовыми узлами. createDomRoot хранит фактический
результат в current; этот же Element или DOMGroup можно переносить обычным
append между областями одного Document. Выбранный для измерения внутренний
Element не заменяет весь DOMGroup при переносе.

Точные публичные пути принадлежат package.json#exports. UI, Nodes, Markdown
и пространственные компоненты загружаются отдельными готовыми ESM-модулями.
Компоненты не требуют MetaFor или Storybook.

@example
```ts
import {createDocument, createDomRoot} from "@zavx0z/immersive"

const {Pane} = await import("@zavx0z/immersive/ui")
const document = createDocument()
const host = document.createElement("main")
document.append(host)
const content = document.createElement("p")
content.textContent = "Обычный DOM внутри готового компонента"
const root = createDomRoot(host)
root.render(Pane, {variant: "outlined"}, {content: {"": content}})
```

@packageDocumentation
*/
export * from "@zavx0z/immersive-dom"
export * from "@zavx0z/immersive-dom/space"
export * from "@zavx0z/immersive-dom/viewpoint"
export * from "@zavx0z/immersive-dom/display"
export * from "@zavx0z/immersive-dom/hud"
export {createRoot, documentEnvironment} from "@zavx0z/immersive-browser"
export type {Root, RootOptions, RootState, FrameState, FrameCallback, RootSize, FrameLoop} from "@zavx0z/immersive-browser"
export {createRoot as createBrowserRoot} from "@zavx0z/immersive-browser/integration"
export type {IntegrationOptions, IntegrationRoot, Presentation, BrowserFontFaceSource, RootDocumentProjection, RootProjection, RootSpaceProjection, RootKeyInput, RootPointerInput, RootWheelInput, RootInput, RootWorldRay, RootLinkedAuthorStyleSheet} from "@zavx0z/immersive-browser/integration"
export {inspectRoot} from "@zavx0z/immersive-browser/diagnostics"
export {createSpaceElementFactories} from "@zavx0z/immersive-space"
export * from "@zavx0z/immersive-browser/audio"
export * from "@zavx0z/immersive-browser/clipboard"

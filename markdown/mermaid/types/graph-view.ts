import type {JsxSourceElement} from "@zavx0z/template/jsx-runtime"

/**
Содержимое slot-моста для {@link @webxr/nodes/view#GraphView | GraphView}.
Форма {@link JsxSourceElement} сохраняет авторский JSX-транспорт
[адаптера направления Mermaid](../src/graph-view.tsx).
Допускает пустой результат и несколько элементов без дополнительного DOM-контейнера.
*/
export type GraphContent = JsxSourceElement | readonly JsxSourceElement[] | null | undefined

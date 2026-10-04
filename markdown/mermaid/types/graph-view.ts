import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/**
Содержимое slot-моста для {@link @zavx0z/immersive-nodes/view#GraphView | GraphView}.
Форма {@link JSX.Element} сохраняет авторский JSX-транспорт
[адаптера направления Mermaid](../src/graph-view.tsx).
Допускает пустой результат и несколько элементов без дополнительного DOM-контейнера.
*/
export type GraphContent = JSX.Element | readonly JSX.Element[] | null | undefined

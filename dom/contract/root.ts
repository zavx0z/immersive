import type {Document} from "../src/document.ts"
import type {DocumentFragment} from "../src/document-fragment.ts"
import type {Element} from "../src/element.ts"
import type {Node} from "../src/node.ts"
import type {DocumentCompiledStyleSheetSnapshot} from "../src/compiled-style-sheet.ts"
import type {DOMComponent, DOMComponentConstructor, DOMComponentContent} from "./dom-component.ts"

/** Дополнительные входы одного назначения готового DOM-компонента. */
export interface DOMRenderOptions {
  readonly key?: string | number | null
  readonly content?: DOMComponentContent
  readonly context?: unknown
}

/** Владение одним фактическим DOM-результатом и местом его размещения. */
export interface DOMRoot {
  /** Тот же Element или DOMGroup; null до render, после render(null) и unmount. */
  readonly current: DOMComponent<unknown> | null
  render<Props>(constructor: DOMComponentConstructor<Props> | ((props: Props) => unknown), props: Readonly<Props>, options?: DOMRenderOptions): void
  render(construction: unknown): void
  flush(): void
  batch<Result>(callback: () => Result): Result
  /** Переносит весь существующий результат внутри Document, сохраняя окружающие siblings. */
  moveTo(parent: Element | DocumentFragment | Document, before?: Node | null): void
  readStyleSheets(): DocumentCompiledStyleSheetSnapshot
  /** Прекращает владение исходным контейнером даже при ошибке cleanup. */
  unmount(): void
}

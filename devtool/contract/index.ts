import type {Document, Node} from "@zavx0z/immersive-dom"
import type {DocumentRenderer, RenderFrame} from "@zavx0z/immersive-renderer-html"
import type {DomInspectorSnapshot, DomInspectorSubscriber} from "./types"

/** Публичный договор наблюдения одного семантического документа. */
export declare namespace ImmersiveDevtool {
  /**
  Источники данных инспектора.

  @property document - Единственный Document, которому принадлежат наблюдаемые узлы.

  @property [renderer] - Renderer того же документа. При снимке предоставляет актуальный кадр.

  @property [readFrame] - Возвращает кадр проекции узла, если Renderer скрыт владельцем Experience. Используется при отсутствии renderer.
  */
  type Input = Readonly<{
    document: Document
    renderer?: DocumentRenderer
    readFrame?: (node: Node) => RenderFrame | null
  }>

  /**
  Стабильная адресация узлов, снимки и наблюдение за документом.

  @property document - Документ, заданный при создании.

  @property idForNode - Возвращает стабильный положительный безопасный integer для узла документа. Чужой узел или закрытый инспектор отклоняется.

  @property nodeForId - Возвращает удерживаемый узел либо null для неизвестного ID, удалённого поддерева или закрытого инспектора.

  @property snapshot - Читает неизменяемый снимок поддерева. Без root использует документ. Чтение кадра может обновить Renderer.

  @property subscribe - Подписывает наблюдателя на изменения. Возвращает функцию отписки.

  @property dispose - Освобождает подписки и обратный индекс. Повторный вызов безопасен.
  */
  type Output = Readonly<{
    document: Document
    idForNode(node: Node): number
    nodeForId(id: number): Node | null
    snapshot(root?: Node): DomInspectorSnapshot
    subscribe(subscriber: DomInspectorSubscriber): () => void
    dispose(): void
  }>
}

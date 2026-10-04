import type {
  ExternalStore,
  NodeJsonValue,
  NodeTreeNodeSnapshot,
  ParameterReference,
  ParameterSnapshot,
  Socket,
} from "@zavx0z/immersive-nodes-tree"
import type {ImmersiveNodesProjectionParameter} from "@zavx0z/immersive-nodes-projection-parameter"
type ParameterInput = Parameters<NonNullable<ImmersiveNodesProjectionParameter.Input["onInput"]>>[0]

import type {ImmersiveNodesNode} from "@zavx0z/immersive-nodes-node/contract"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ImmersiveNodesLayout} from "@zavx0z/immersive-nodes-layout/contract"
type NodeRect = ImmersiveNodesLayout.Output["bounds"]
import type {ImmersiveNodesNodeParameter} from "@zavx0z/immersive-nodes-node-parameter"
type NodeAction = NonNullable<ImmersiveNodesNodeParameter.Input["actions"]>[number]

/** Собственные данные представления и общий протокол ноды. */
export declare namespace ImmersiveNodesNodeContent {
  /**
  Входные данные составной ноды с независимыми областями содержимого и параметров.

  Содержимое передаётся вложенной разметкой между тегами ContentNode
  в безымянный слот. Пустой слот оставляет область пустой;
  содержимое за границами области обрезается.
  Изменение `contentVisible`
  скрывает квадратную область без размонтирования, а `collapsed` независимо
  управляет полями параметров.

  @property id - Стабильный идентификатор ноды и адрес её сокетов.

  @property label - Видимая подпись и доступное имя ноды.

  @property [rect] - Положение ноды. Высоту составной ноды определяют
  область содержимого, параметры и состояния их раскрытия.

  @property [style] - CSS ноды: базовая ширина 180px, минимальная 100px.
  Ширина по содержимому задаётся width: max-content либо fit-content.

  @property [contentVisible=true] - Управляет видимостью области содержимого.

  @property [collapsed=false] - Независимо скрывает поля параметров.

  @property [onContentVisibleChange] - Передаёт владельцу запрос изменения видимости.

  @property [onParameterChange] - Передаёт владельцу подтверждённое изменение параметра.

  @example
  ```tsx
  import Typography from "@zavx0z/immersive-ui-component-typography"

  <ContentNode
    id="preview"
    label="Предпросмотр"
    contentVisible={true}
  >
    <Typography text="Содержимое предпросмотра" />
  </ContentNode>
  ```
  */
  interface Input extends ImmersiveNodesNode.Input {
    readonly frameId?: string | undefined
    readonly label: string
    readonly rect?: Pick<NodeRect, "x" | "y"> | undefined
    readonly category?: string | undefined
    readonly headerColor?: string | undefined
    readonly collapsed?: boolean | undefined
    readonly actions?: readonly NodeAction[] | undefined
    readonly parameters?: NodeTreeNodeSnapshot<ParameterReference, NodeJsonValue, NodeJsonValue>["parameters"] | undefined
    readonly sockets?: readonly Socket[] | undefined
    readonly parameterStore?: ((parameterId: string) => ExternalStore<ParameterSnapshot>) | undefined
    readonly connectedSocketKeys?: ReadonlySet<string> | undefined
    readonly resolvedSocketSides?: ReadonlyMap<string, "left" | "right"> | undefined
    readonly contentVisible?: boolean | undefined
    readonly onCollapseChange?: ((collapsed: boolean, event: Event) => void) | undefined
    readonly onParameterInput?: ((change: ParameterInput, event: Event) => void) | undefined
    readonly onParameterChange?: ((change: ParameterInput, event: Event) => void) | undefined
    readonly onSocketActivate?: ((socketId: string, event: Event) => void) | undefined
    readonly onContentVisibleChange?: ((visible: boolean, event: Event) => void) | undefined
  }

  /** Содержимое вызывающей стороны размещается в той же ноде и Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveNodesNode.Output & JSX.Element<Slots>
}

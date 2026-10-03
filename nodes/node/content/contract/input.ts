import type {
  ExternalStore,
  NodeJsonValue,
  NodeTreeNodeSnapshot,
  ParameterReference,
  ParameterSnapshot,
  Socket,
} from "@nodes/tree"
import type {NodesParameterProjection} from "@nodes/parameter-projection"
type ParameterInput = Parameters<NonNullable<NodesParameterProjection.Input["onInput"]>>[0]
import type {JSX} from "@jsx-compiler/session"
import type {
  NodeAction,
  NodeRect,
} from "../../shared/contracts.ts"

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
import Typography from "@ui/typography"

<ContentNode
  id="preview"
  label="Предпросмотр"
  contentVisible={true}
>
  <Typography text="Содержимое предпросмотра" />
</ContentNode>
```
*/
export interface ContentNodeProps {
  readonly id: string
  readonly frameId?: string | undefined
  readonly label: string
  readonly rect?: Pick<NodeRect, "x" | "y"> | undefined
  readonly elementRef?: JSX.Ref<HTMLElement> | undefined
  readonly title?: string | undefined
  readonly category?: string | undefined
  readonly headerColor?: string | undefined
  readonly selected?: boolean | undefined
  readonly hidden?: boolean | undefined
  readonly collapsed?: boolean | undefined
  readonly actions?: readonly NodeAction[] | undefined
  readonly parameters?: NodeTreeNodeSnapshot<ParameterReference, NodeJsonValue, NodeJsonValue>["parameters"] | undefined
  readonly sockets?: readonly Socket[] | undefined
  readonly parameterStore?: ((parameterId: string) => ExternalStore<ParameterSnapshot>) | undefined
  readonly connectedSocketKeys?: ReadonlySet<string> | undefined
  readonly resolvedSocketSides?: ReadonlyMap<string, "left" | "right"> | undefined
  readonly contentVisible?: boolean | undefined
  readonly style?: CssStyle | undefined
  readonly onActivate?: ((event: Event) => void) | undefined
  readonly onCollapseChange?: ((collapsed: boolean, event: Event) => void) | undefined
  readonly onParameterInput?: ((change: ParameterInput, event: Event) => void) | undefined
  readonly onParameterChange?: ((change: ParameterInput, event: Event) => void) | undefined
  readonly onSocketActivate?: ((socketId: string, event: Event) => void) | undefined
  readonly onContentVisibleChange?: ((visible: boolean, event: Event) => void) | undefined
}

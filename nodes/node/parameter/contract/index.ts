import type {
  ExternalStore,
  NodeJsonValue,
  NodeTreeNodeSnapshot,
  ParameterReference,
  ParameterSnapshot,
  Socket,
} from "@immersive-nodes/tree"
import type {ImmersiveNodesProjectionParameter} from "@immersive-nodes-projection/parameter"
type ParameterInput = Parameters<NonNullable<ImmersiveNodesProjectionParameter.Input["onInput"]>>[0]

import type {ImmersiveNodesNode} from "@immersive-nodes/node/contract"
import type {JSX} from "@immersive-jsx-compiler/session"
import type {ImmersiveNodesLayout} from "@immersive-nodes/layout/contract"
type NodeRect = ImmersiveNodesLayout.Output["bounds"]
import type {NodeAction} from "./types"

/** Собственные данные представления и общий протокол ноды. */
export declare namespace ImmersiveNodesNodeParameter {
  /**
  Входные данные ноды с заголовком, параметрами и адресуемыми сокетами.

  Компонент заимствует снимки и Store параметров, а запросы изменения возвращает
  владельцу через callbacks. Сворачивание скрывает поля, сохраняя сокеты и их
  связи в той же ноде.
  Корпус, заголовок, действия и поля принадлежат самому ParameterNode;
  высота заголовка вычисляется внутри компонента.
  Автор составляет независимые параметры JSX между тегами в безымянном слоте.
  Каждый параметр принимает собственные Socket через left/right; пустые слоты
  не создают сокеты. Для существующих потребителей сохранён путь проекции модели.
  Авторское содержимое не может использоваться одновременно с непустым
  списком `parameters`.

  @property id - Стабильный идентификатор ноды и адрес её сокетов.

  @property label - Видимая подпись и доступное имя ноды.

  @property [category] - Подпись категории рядом с названием.

  @property [actions] - Кнопки действий в шапке. Нажатие вызывает обработчик действия
  без всплытия к активации самой ноды.

  @property [rect] - Положение в CSS-пикселях графа.
  Высота раскрытой ноды определяется её содержимым, свёрнутой — шапкой и сокетами.

  @property [style] - CSS ноды, включая width, min-width и max-width.
  Базовая ширина — 360px, минимальная — 100px. Встроенная нода заполняет родителя.

  @property [parameters] - Снимки параметров из принятого снимка {@link NodeTreeNodeSnapshot}.

  @property [sockets] - Сокеты той же ноды; сторона может быть уточнена `resolvedSocketSides`.

  @property [parameterStore] - Возвращает адресный Store параметра без копирования значения.

  @property [collapsed=false] - Скрывает поля параметров, сохраняя адресуемые сокеты.

  @property [embedded=false] - Встраивает представление в составную ноду без второго `data-node-id`.

  @property [onParameterInput] - Получает промежуточное изменение значения.

  @property [onParameterChange] - Получает подтверждённое изменение значения.

  @property [onSocketActivate] - Получает идентификатор активированного сокета.

  @example
  ```tsx
  <ParameterNode
    id="source"
    label="Источник"
  >
    <TextParameter
      id="text"
      nodeId="source"
      label="Текст"
      value="Пример"
    >
      <Socket
        slot="left"
        id="in"
        nodeId="source"
        kind="string"
        direction="input"
        side="left"
        label="Вход"
      />
    </TextParameter>
    <NumberParameter
      id="scale"
      nodeId="source"
      label="Масштаб"
      value={1}
    />
  </ParameterNode>
  ```
  */
  interface Input extends ImmersiveNodesNode.Input {
    readonly frameId?: string | undefined
    readonly label: string
    readonly rect?: Pick<NodeRect, "x" | "y"> | undefined
    readonly category?: string | undefined
    readonly headerColor?: string | undefined
    readonly collapsed?: boolean | undefined
    readonly embedded?: boolean | undefined
    readonly actions?: readonly NodeAction[] | undefined
    readonly parameters?: NodeTreeNodeSnapshot<ParameterReference, NodeJsonValue, NodeJsonValue>["parameters"] | undefined
    readonly sockets?: readonly Socket[] | undefined
    readonly parameterStore?: ((parameterId: string) => ExternalStore<ParameterSnapshot>) | undefined
    readonly connectedSocketKeys?: ReadonlySet<string> | undefined
    readonly resolvedSocketSides?: ReadonlyMap<string, "left" | "right"> | undefined
    readonly onCollapseChange?: ((collapsed: boolean, event: Event) => void) | undefined
    readonly onParameterInput?: ((change: ParameterInput, event: Event) => void) | undefined
    readonly onParameterChange?: ((change: ParameterInput, event: Event) => void) | undefined
    readonly onSocketActivate?: ((socketId: string, event: Event) => void) | undefined
  }

  /** Содержимое вызывающей стороны размещается в той же ноде и Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveNodesNode.Output & JSX.Element<Slots>
}

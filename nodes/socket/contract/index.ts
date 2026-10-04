import type {Socket as CoreSocket} from "@zavx0z/immersive-nodes-tree"
import type {Zavx0zImmersiveNodesModelSocketKinds} from "@zavx0z/immersive-nodes-model-socket-kinds"
import type {Zavx0zImmersiveNodesModelSocketShapes} from "@zavx0z/immersive-nodes-model-socket-shapes"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Адресуемый Socket сохраняет состояние и взаимодействие в Document приложения. */
export declare namespace Zavx0zImmersiveNodesSocket {
  /**
  Вход адресуемого {@link @zavx0z/immersive-nodes-socket#default | Socket} в общем Document приложения.
  Состояние соединения и обработчик активации принадлежат вызывающему компоненту.

  @property id - Непустой идентификатор сокета внутри ноды; пробельное имя вызывает TypeError.

  @property nodeId - Непустой идентификатор ноды; вместе с id образует адрес сокета.

  @property kind - Ключ предустановки типа, формы и цвета; неизвестный ключ вызывает TypeError.

  @property direction - Направление input, output или bidirectional; другие значения отклоняются.

  @property side - Физическая сторона left или right, независимая от направления данных.

  @property label - Непустое доступное имя; в режиме row также отображается рядом со знаком.

  @property [title] - Авторская подсказка; при отсутствии используется имя предустановки и подпись.

  @property [shape] - Переопределяет форму предустановки, сохраняя kind и цвет; неизвестная форма отклоняется.

  @property [connected=false] - Показывает состояние соединения, не создавая саму связь.

  @property [selected=false] - Подсвечивает сокет независимо от соединения.

  @property [disabled=false] - Отключает стандартную кнопку сокета.

  @property [presentation=endpoint] - Режим row включает подпись и занимает ширину строки.

  @property [style] - Авторское переопределение CSS после основных стилей сокета.

  @property [onActivate] - Получает исходное событие активации; создание связей остаётся у приложения.

  @example
  ```tsx
  <Socket
    id="value"
    nodeId="source"
    kind="float"
    direction="output"
    side="right"
    label="Значение"
  />
  ```
  */
  interface Input {
    readonly id: string
    readonly nodeId: string
    readonly kind: Zavx0zImmersiveNodesModelSocketKinds.Output[number]
    readonly direction: CoreSocket["direction"]
    readonly side: NonNullable<CoreSocket["side"]>
    readonly label: string
    readonly title?: string | undefined
    readonly shape?: Zavx0zImmersiveNodesModelSocketShapes.Output[number] | undefined
    readonly connected?: boolean | undefined
    readonly selected?: boolean | undefined
    readonly disabled?: boolean | undefined
    readonly presentation?: "endpoint" | "row" | undefined
    readonly style?: CssStyle | undefined
    readonly onActivate?: ((event: Event) => void) | undefined
  }

  type Output = JSX.Element
}

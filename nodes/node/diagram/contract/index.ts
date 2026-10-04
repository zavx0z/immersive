
import type {ImmersiveNodesNode} from "@immersive-nodes/node/contract"
import type {JSX} from "@immersive-jsx-compiler/session"
import type {ImmersiveNodesLayout} from "@immersive-nodes/layout/contract"
type NodeRect = ImmersiveNodesLayout.Output["bounds"]
import type {ImmersiveNodesGeometryNodeProject} from "@immersive-nodes-geometry-node/project"
type NodeShape = NonNullable<NonNullable<ImmersiveNodesGeometryNodeProject.Input[4]>["shape"]>

/** Собственные данные представления и общий протокол ноды. */
export declare namespace ImmersiveNodesNodeDiagram {
  /**
  Данные отображения диаграммной ноды. Компонент показывает описание внутри Pane,
  а выбор состояния и обработка действий остаются у вызывающей стороны.

  @property id - Идентификатор ноды, передаваемый во внешний article как data-node-id.
  Не заменяет JSX key, который задаёт вызывающая сторона при монтировании списка.

  @property description - Отображаемый текст и доступное имя внешнего элемента.
  Пустая строка допустима; текст заполняет внутренний Pane без отдельных полей параметров.

  @property [rect] - Положение и размеры в CSS-пикселях относительно содержащего блока.
  Без rect начало находится в (0, 0), а размеры определяются содержимым.
  При форме circle высота берётся из rect.width, значение rect.height не используется.

  @property [intrinsic=false] - Включает естественное измерение содержимого вместо заданной ширины.
  Для круга измеренную ширину затем передают через rect, чтобы получить квадратный внешний бокс.

  @property [elementRef] - Ссылка на внешний article для измерения и наблюдения за компонентом.
  Жизненным циклом ссылки управляет общий component runtime.

  @property [shape=rectangle] - Выбирает прямоугольник, овал или круг.
  Овал и круг используют скругление 50%; круг также имеет увеличенные горизонтальные отступы.

  @property [selected=false] - Управляет aria-selected внешнего элемента и активным видом Pane.
  Компонент не меняет это значение самостоятельно при нажатии.

  @property [hidden=false] - Скрывает внешний article через display: none, сохраняя элемент.

  @property [title] - Подсказка внутреннего Pane; не заменяет видимое описание.

  @property [style] - Финальный CSS override внешнего article.
  Оформление Pane и текста настраивается наследуемыми CSS-переменными --diagram-node-*.

  @property [onActivate] - Получает событие click внешнего article.
  Вызывающая сторона решает, как изменить выбор или состояние графа.

  @example
  ```ts
  const input: ImmersiveNodesNodeDiagram.Input = {
    id: "example",
    description: "Описание узла",
    shape: "rectangle",
    rect: {x: 40, y: 20, width: 240, height: 100},
  }
  ```
  */
  interface Input extends ImmersiveNodesNode.Input {
    readonly description: string
    readonly rect?: NodeRect | undefined
    readonly intrinsic?: boolean | undefined
    readonly shape?: NodeShape | undefined
  }

  type Output = ImmersiveNodesNode.Output & JSX.Element
}

import type {ImmersiveUiComponentSurface} from "@immersive-ui-component/surface/contract"
import type {WindowAction} from "./types.ts"
import type {WindowGeometry} from "./types.ts"

import type {JSX} from "@immersive-jsx-compiler/session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentSurfaceWindow {
  /**
  Оболочка окна в позиционированной области HUD, Display или обычного контейнера.
  Безымянный слот содержит тело окна; скрытие сохраняет его DOM и состояние.
  Парный WindowControl размещается независимо и получает те же open/onOpenChange.

  @property id - Уникальный в Document адрес окна для aria-controls управляющей кнопки.
  @property title - Единственный центрированный заголовок, без подзаголовка.
  @property open - Видимость всей оболочки. false оставляет доступным внешний control.
  @property onOpenChange - Запрос изменения видимости. Принимающий компонент обновляет open.
  @property [geometry] - Положение и размер в CSS px локальной области. Начально 24,24,320,240.
  Изменённые значения обновляют то же окно; прежние значения сохраняют пользовательский drag.
  @property [onGeometryChange] - Геометрия после движения, resize или отмены жеста.
  @property [movable=false] - Разрешает перемещение за свободное место шапки.
  Наведение использует grab, активное перетаскивание — grabbing.
  @property [resizable=false] - Разрешает resize по четырём сторонам и четырём углам.
  Фокусируемые зоны поддерживают стрелки с шагом 1 px, Shift увеличивает шаг до 10 px.
  @property [minWidth=240] - Минимальная ширина в CSS px, ограниченная размером области.
  @property [minHeight=160] - Минимальная высота в CSS px, ограниченная размером области.
  @property [layout=floating] - fill заполняет родителя и отключает перемещение/resize.
  @property [actions] - Дополнительные кнопки справа в шапке; не изменяют видимость автоматически.
  @property [onAction] - Передаёт выбранный ключ дополнительного действия.
  @property [style] - Финальное оформление оболочки branded CSS document.
  */
  interface Input {
    readonly id: string
    readonly title: string
    readonly open: boolean
    readonly onOpenChange: (open: boolean, event: Event) => void
    readonly geometry?: WindowGeometry | undefined
    readonly onGeometryChange?: ((geometry: WindowGeometry, phase: "change" | "end" | "cancel") => void) | undefined
    readonly movable?: boolean | undefined
    readonly resizable?: boolean | undefined
    readonly minWidth?: number | undefined
    readonly minHeight?: number | undefined
    readonly layout?: "floating" | "fill" | undefined
    readonly actions?: readonly WindowAction[] | undefined
    readonly onAction?: ((key: string, event: Event) => void) | undefined
    readonly style?: CssStyle | undefined
  }

  /** Содержимое вызывающей стороны размещается в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveUiComponentSurface.Output & JSX.Element<Slots>
}

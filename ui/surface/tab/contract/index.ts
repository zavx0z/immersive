

import type {JSX} from "@jsx-compiler/session"

/** Собственный вход и JSX-результат компонента. */
export declare namespace UiSurfacesTab {
  /**
  Вход пристыкованного Tab. Компонент занимает область своего позиционированного
  родителя; сам таб остаётся на её периметре. Родитель задаёт размеры области
  обычным CSS как в HUD, так и в Display или вложенной поверхности.

  @property [label] - Текст таба, если безымянный слот пуст. При вложенном содержимом подпись не требуется.
  Слева текст идёт сверху вниз, справа снизу вверх: низ букв обращён к краю области.
  Сверху и снизу текст горизонтальный.
  Вдоль подписи по 6 CSS px: слева и справа в горизонтальном виде,
  сверху и снизу в вертикальном. Поперечные отступы нулевые.
  Вложенные компоненты между тегами Tab попадают в безымянный слот вместо подписи label.
  Направление текста наследуется от стороны Tab так же, как для label.
  Короткое нажатие на кнопку или ссылку сохраняет её действие; движение от 4 CSS px
  начинает drag Tab. Поля и редактируемый текст сохраняют собственный ввод.
  @property [position] - Объявленная сторона и доля доступного пути вдоль края
  от 0 до 1. По умолчанию правая сторона, середина. Новые значения перемещают тот же
  элемент и прекращают активный drag; равные значения сохраняют пользовательское положение.
  Изменение props не вызывает onPositionChange.
  @property [length] - Явная длина вдоль края в CSS px; без значения размер определяется содержимым.
  @property [thickness] - Явная толщина в CSS px; без значения размер определяется содержимым.
  Явные размеры — положительные конечные числа.
  Размеры ограничиваются текущей областью при её уменьшении.
  @property [disabled=false] - Запрещает перетаскивание таба и отменяет активный жест.
  @property [style] - Финальное оформление таба через branded CSS document.
  По умолчанию CSS рассчитывает размер по label или содержимому слота; положение принадлежит перетаскиванию.
  @property [onPositionChange] - Получает сторону и долю пути при движении и завершении.
  Отмена возвращает начальное положение жеста и phase cancel. Resize не считается жестом.
  */
  interface Input {
    readonly label?: string | null | undefined
    readonly position?: Readonly<{edge: "left" | "right" | "top" | "bottom"; offset: number}> | undefined
    readonly length?: number | undefined
    readonly thickness?: number | undefined
    readonly disabled?: boolean | undefined
    readonly style?: CssStyle | undefined
    readonly onPositionChange?: ((position: NonNullable<Input["position"]>, phase: "change" | "end" | "cancel") => void) | undefined
  }

  /** Содержимое предоставляется вызывающей стороной в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = JSX.Element<Slots>
}

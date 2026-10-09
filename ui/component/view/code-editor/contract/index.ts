import type {ImmersiveUiComponentView} from "@zavx0z/immersive-ui-component-view/contract"
import type {CodeEditorLineMarker} from "./types"
import type {CodeEditorHandle} from "./types"
import type {CodeEditorLineDecoration} from "./types"
import type {CodeEditorSelectionSet} from "./types"
import type {Tokens} from "@zavx0z/highlighter"
import type CodeEditorModel from "@zavx0z/immersive-tech-text-editor"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentViewCodeEditor {
  /**
  Исходный текст, оформление и взаимодействие редактора.

  @property value - Полный авторский текст; оформление и визуальные переносы не меняют его содержимое.

  @property readOnly - Запретить редактирование текста; действия полей строки задаются отдельно.

  @property [model] - Внешняя модель текста и выделения; без неё редактор использует собственную.

  @property [onChange] - Получает полный текст после пользовательского редактирования.

  @property [ref] - Получает корневой Element редактора и null при отключении; не создаёт отдельный Document.

  @property [onLineNumberClick] - Действие номера: индекс логической строки с нуля и исходный MouseEvent. Не вызывается кликом поля метки.

  @property [onReady] - Получает публичные операции фокуса, выделения и прокрутки, затем null при освобождении.

  @property [onSelectionChange] - Получает актуальные направленные выделения текстовой модели.

  @property [lineDecorations] - Оформление уникальных логических строк с нуля: фон текста, полоса пути, поле и рамка номера.

  @property [languageId] - Язык подсветки; без него определение может использовать path.

  @property [path] - Имя документа для определения языка, не разрешение доступа к файлу.

  @property [tokens] - Готовая токенизация именно value; неподтверждённая локальная правка её не переиспользует.

  @property [showLineNumbers=true] - Показывать номера; поле меток может оставаться отдельно.

  @property [title] - Доступная подпись области редактора.

  @property [style] - Дополнительный branded CSS принимающей композиции.

  @property [lineMarkers] - Метки с уникальными индексами строк. При наличии меток резервируется узкое поле слева от номеров; строки за пределами текста пока не отображаются.

  @property [showLineMarkers] - Явно показать или скрыть поле меток, в том числе пустое и недоступное. Без значения поле появляется при наличии меток либо обработчика.

  @property [onLineMarkerClick] - Действие поля маркера, включая пустое место; получает строку с нуля и исходное событие. Не вызывает onLineNumberClick и не меняет выделение текста.

  @property [lineMarkerLabel] - Доступное имя пустого поля по индексу строки; по умолчанию «Метка строки N». Подпись существующей метки берётся из lineMarkers.

  @property [softBreaks] - Возрастающие UTF-16 смещения визуальных переносов внутри
  текста. Применяются только при readOnly; исходные символы и копирование сохраняются.

  @property [showFormattingCharacters=true] - Показывать escape-последовательности
  переносов в местах softBreaks. При false они сохраняются в тексте и копировании,
  но не рисуются; буквальные экранированные обратные слеши остаются видимыми.
  */
  interface Input {
    readonly value: string
    readonly readOnly: boolean
    readonly model?: CodeEditorModel | undefined
    readonly onChange?: ((value: string) => void) | undefined
    readonly ref?: ((root: HTMLElement | null) => void) | undefined
    readonly onLineNumberClick?: ((line: number, event: MouseEvent) => void) | undefined
    readonly showLineMarkers?: boolean | undefined
    readonly lineMarkers?: readonly CodeEditorLineMarker[] | undefined
    readonly onLineMarkerClick?: ((line: number, event: MouseEvent) => void) | undefined
    readonly lineMarkerLabel?: ((line: number) => string) | undefined
    readonly onReady?: ((handle: CodeEditorHandle | null) => void) | undefined
    readonly onSelectionChange?: ((selection: CodeEditorSelectionSet) => void) | undefined
    readonly lineDecorations?: readonly CodeEditorLineDecoration[] | undefined
    readonly languageId?: string | undefined
    readonly path?: string | undefined
    readonly tokens?: Tokens | undefined
    readonly showLineNumbers?: boolean | undefined
    readonly softBreaks?: readonly number[] | undefined
    readonly showFormattingCharacters?: boolean | undefined
    readonly title?: string | undefined
    readonly style?: CssStyle | undefined
  }

  type Output = ImmersiveUiComponentView.Output & JSX.Element
}

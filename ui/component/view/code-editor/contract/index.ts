import type {ImmersiveUiComponentView} from "@zavx0z/immersive-ui-component-view/contract"
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

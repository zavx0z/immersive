import type {ImmersiveUiComponentBadge} from "@zavx0z/immersive-ui-component-badge"
import type {ImmersiveTechTextEditor} from "@zavx0z/immersive-tech-text-editor"
type CodeEditorRange = ImmersiveTechTextEditor.Output["snapshot"]["selections"][number]

/**
Операции того же редактора без доступа к частному renderer.

@property focus - Передаёт фокус редактируемому коду; аргументов и результата нет.

@property isFocused - Возвращает, принадлежит ли фокус этому редактору.

@property getSelection - Возвращает направленные выделения и индекс основного.

@property setSelections - Принимает выделения модели и необязательный индекс основного; границы проверяет модель.

@property scrollToLine - Принимает логическую строку с нуля и выравнивание start/center/end/nearest; материализует её в виртуальном окне.
*/
export type CodeEditorHandle = Readonly<{
  focus(): void
  isFocused(): boolean
  getSelection(): CodeEditorSelectionSet
  setSelections(selections: readonly CodeEditorRange[], primary?: number): void
  scrollToLine(line: number, options?: Readonly<{block?: "start" | "center" | "end" | "nearest"}>): void
}>

/**
Наблюдение выделений текущей текстовой модели.

@property selections - Направленные диапазоны модели, без изменения исходника.

@property primary - Индекс основного диапазона с нуля.
*/
export type CodeEditorSelectionSet = Readonly<{selections: readonly CodeEditorRange[]; primary: number}>

/**
Оформление логической строки без изменения исходного текста.

@property line - Уникальный индекс логической строки с нуля.

@property [lineTone] - Фон строки исходника.

@property [markerTone] - Тон тонкой полосы возле текста.

@property [gutterTone] - Фон всего поля номера, сохранённый для существующих потребителей.

@property [numberTone] - Тон скруглённой рамки только вокруг цифр, без отдельной стрелки или заливки строки.

@property [title] - Подсказка строки.
*/
export type CodeEditorLineDecoration = Readonly<{
  line: number
  lineTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
  markerTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
  numberTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
  gutterTone?: ImmersiveUiComponentBadge.Input["tone"] | undefined
  title?: string | undefined
}>


/**
Метка строки, смысл которой задаёт приложение; редактор не исполняет связанное действие.

@property line - Индекс логической строки с нуля; визуальный перенос не создаёт новую метку.

@property iconSrc - Ресурс значка, отображаемый в поле слева от номера.

@property label - Доступное имя и подсказка метки; пустая подпись не допускается.

@property [disabled=false] - Показывать метку, но не вызывать действие по ней.
*/
export type CodeEditorLineMarker = Readonly<{
  line: number
  iconSrc: string
  label: string
  disabled?: boolean | undefined
}>

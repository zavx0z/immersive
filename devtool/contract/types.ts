import type {
  RenderBorder,
  RenderClip,
  RenderEdges,
  RenderTransform,
} from "@zavx0z/immersive-renderer-html"

/**
Атрибут элемента на момент чтения снимка.

@property name - Имя атрибута.

@property value - Текущее текстовое значение.
*/
export type DomInspectorAttribute = Readonly<{
  name: string
  value: string
}>

/**
Геометрия узла из кадра рендерера того же документа.

@property depth - Глубина узла в раскладке.

@property display - Вид раскладки узла.

@property x - Левый край в системе кадра.

@property y - Верхний край в системе кадра.

@property width - Ширина border box.

@property height - Высота border box.

@property contentX - Левый край содержимого.

@property contentY - Верхний край содержимого.

@property contentWidth - Ширина содержимого.

@property contentHeight - Высота содержимого.

@property margin - Внешние отступы.

@property padding - Внутренние отступы.

@property border - Границы сторон.

@property transform - Преобразование узла.
*/
export type DomInspectorBox = Readonly<{
  depth: number
  display: "block" | "inline" | "flex"
  x: number
  y: number
  width: number
  height: number
  contentX: number
  contentY: number
  contentWidth: number
  contentHeight: number
  margin: RenderEdges
  padding: RenderEdges
  border: RenderBorder
  transform: RenderTransform
}>

/**
Область узла, участвующая в поиске цели ввода.

@property x - Левый край.

@property y - Верхний край.

@property width - Ширина области.

@property height - Высота области.

@property interactive - Участвует ли узел в интерактивном вводе.

@property disabled - Заблокирован ли ввод.

@property role - Семантическая роль либо null.

@property clips - Ограничения видимой области.

@property transform - Преобразование области.
*/
export type DomInspectorHit = Readonly<{
  x: number
  y: number
  width: number
  height: number
  interactive: boolean
  disabled: boolean
  role: string | null
  clips: readonly RenderClip[]
  transform: RenderTransform
}>

/**
Команда отрисовки узла в текущем кадре.

@property key - Ключ команды внутри узла.

@property kind - Вид команды отрисовки.
*/
export type DomInspectorDisplay = Readonly<{
  key: string
  kind: "rect" | "text" | "image" | "path"
}>

/**
Наблюдаемое состояние HTML-элемента.

@property focused - Владеет ли элемент фокусом Document.

@property scrollLeft - Горизонтальная прокрутка.

@property scrollTop - Вертикальная прокрутка.
*/
export type DomInspectorHTMLElementState = Readonly<{
  focused: boolean
  scrollLeft: number
  scrollTop: number
}>

/**
Состояние поля ввода вместе с фокусом и прокруткой.

@property type - Тип поля.

@property value - Текущее значение.

@property checked - Состояние переключателя.

@property selectionStart - Начальное UTF-16 смещение выделения либо null.

@property selectionEnd - Конечное UTF-16 смещение выделения либо null.

@property selectionDirection - Направление выделения либо null.
*/
export type DomInspectorInputState = DomInspectorHTMLElementState & Readonly<{
  type: string
  value: string
  checked: boolean
  selectionStart: number | null
  selectionEnd: number | null
  selectionDirection: "forward" | "backward" | "none" | null
}>

/**
Состояние многострочного поля.

@property value - Текущее значение.

@property rows - Объявленное число строк.

@property cols - Объявленное число столбцов.

@property selectionStart - Начальное UTF-16 смещение выделения.

@property selectionEnd - Конечное UTF-16 смещение выделения.

@property selectionDirection - Направление выделения либо null.
*/
export type DomInspectorTextAreaState = DomInspectorHTMLElementState & Readonly<{
  value: string
  rows: number
  cols: number
  selectionStart: number
  selectionEnd: number
  selectionDirection: "forward" | "backward" | "none"
}>

/**
Состояние элемента на момент чтения снимка.
*/
export type DomInspectorLiveState =
  | DomInspectorHTMLElementState
  | DomInspectorInputState
  | DomInspectorTextAreaState

/**
Идентичность и связи узла внутри снимка.

@property id - Устойчивый ID инспектора.

@property nodeType - Тип DOM-узла.

@property nodeName - Имя DOM-узла.

@property localName - Локальное имя элемента либо null.

@property nodeValue - Текстовое значение узла либо null.

@property attributes - Атрибуты элемента.

@property parent - ID родителя в снимке либо null.

@property children - ID дочерних узлов в порядке документа.
*/
type DomInspectorNodeBase = Readonly<{
  id: number
  nodeType: number
  nodeName: string
  localName: string | null
  nodeValue: string | null
  attributes: readonly DomInspectorAttribute[]
  parent: number | null
  children: readonly number[]
}>

/**
Узел снимка с доступной геометрией и состоянием.

@property [box] - Геометрия кадра или null.

@property [hit] - Область ввода или null.

@property [display] - Команды отрисовки узла.

@property [state] - Состояние поддерживаемого HTML-элемента.
*/
export type DomInspectorNode = DomInspectorNodeBase & Readonly<{
  box?: DomInspectorBox | null
  hit?: DomInspectorHit | null
  display?: readonly DomInspectorDisplay[]
  state?: DomInspectorLiveState
}>

/**
Сериализуемый неизменяемый снимок поддерева.

@property mutationVersion - Версия структуры документа.

@property stateVersion - Версия состояния документа.

@property root - ID корня снимка.

@property nodes - Узлы поддерева, включая корень.
*/
export type DomInspectorSnapshot = Readonly<{
  mutationVersion: number
  stateVersion: number
  root: number
  nodes: readonly DomInspectorNode[]
}>

/**
Изменение структуры или состояния документа.

@property kind - Источник изменения.

@property mutationVersion - Версия структуры документа.

@property stateVersion - Версия состояния документа.

@property changedNodeIds - ID затронутых узлов.
*/
export type DomInspectorChange = Readonly<{
  kind: "mutation" | "state"
  mutationVersion: number
  stateVersion: number
  changedNodeIds: readonly number[]
}>

/**
Получает пакет изменений в порядке уведомлений Document.
*/
export type DomInspectorSubscriber = (change: DomInspectorChange) => void


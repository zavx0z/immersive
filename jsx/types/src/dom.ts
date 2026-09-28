import type {IntrinsicProperties} from "../contract/input.ts"
import type {HUDElement} from "@zavx0z/dom/hud"
import type {SpaceElement} from "@zavx0z/dom/space"
import type {ViewPointElement} from "@zavx0z/dom/viewpoint"
import type {Element as AuthoredElement} from "../contract/output.ts"
import type {jsxEventNames} from "@jsx/events"
import type {Element as SemanticElement, EventTarget as SemanticEventTarget} from "@zavx0z/dom"
import type {DisplayElement} from "@zavx0z/dom/display"

/** Значения обычных author attributes без объектов и runtime CSS. */
type PrimitiveAttributeValue = string | number | bigint | boolean | null | undefined

/** Native и semantic Element на границе типового DOM facade. */
export type ElementTarget = Element | SemanticElement
/** Получатель события для стандартного и semantic DOM. */
export type EventTargetValue = EventTarget | SemanticEventTarget

/** Сравнивает свойства типов, сохраняя различие readonly. */
type StrictlyEqual<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
    (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false

/** Выбирает свойство, которое разрешено изменять через авторский JSX. */
type WritableKey<Source, Key extends keyof Source> = StrictlyEqual<
  Pick<Source, Key>,
  {-readonly [Current in Key]: Source[Current]}
> extends true ? Key : never

/** Writable primitive поля без обработчиков, raw HTML и специальных style свойств. */
type PrimitiveWritableKeys<Source> = {
  [Key in keyof Source]-?: Key extends string
    ? Key extends `on${string}` | "className" | "innerHTML" | "outerHTML" | "style"
      ? never
      : WritableKey<Source, Key> extends never
        ? never
        : Source[Key] extends PrimitiveAttributeValue
          ? Key
          : never
    : never
}[keyof Source]

/** Необязательные author values для изменяемых primitive DOM properties. */
export type PrimitiveProperties<Target extends ElementTarget> = Readonly<{
  [Key in PrimitiveWritableKeys<Target>]?: Target[Key] | null | undefined
}>

/** Native событие сохраняет точный currentTarget компонента. */
export type DomEventFor<
  Target extends EventTargetValue,
  NativeEvent extends Event,
> = NativeEvent & Readonly<{
  currentTarget: Target
}>

/** Callback получает событие того же DOM-получателя. */
export type DomEventHandler<
  Target extends EventTargetValue,
  NativeEvent extends Event,
> = (event: DomEventFor<Target, NativeEvent>) => unknown

/** Callback ref указывает на текущий Element и очищается через null. */
export type Ref<Target extends EventTargetValue> = (
  target: Target | null
) => void | (() => void)

/** JSX event props и capture варианты используют единую таблицу DOM имён. */
export type EventProperties<Target extends EventTargetValue> = Readonly<{
  [Name in keyof typeof jsxEventNames]?: DomEventHandler<
    Target,
    HTMLElementEventMap[typeof jsxEventNames[Name]]
  > | null | undefined
}> & Readonly<{
  [Name in keyof typeof jsxEventNames as `${Name}Capture`]?: DomEventHandler<
    Target,
    HTMLElementEventMap[typeof jsxEventNames[Name]]
  > | null | undefined
}>

/** Вложенное содержимое JSX: Element, текст, пустые значения и readonly группы. */
export type Child =
  | AuthoredElement<object>
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | readonly Child[]

/** Авторские data-* и aria-* значения сохраняют стандартные имена. */
export type DataAndAriaProperties = Readonly<{
  [Name: `data-${string}`]: PrimitiveAttributeValue
  [Name: `aria-${string}`]: PrimitiveAttributeValue
}>

/** Стандартные input поля допускают авторские числовые значения. */
type InputAttributeOverrides = Readonly<{
  max?: string | number | null | undefined
  min?: string | number | null | undefined
  step?: string | number | null | undefined
  value?: string | number | null | undefined
}>

/** Стандартный HTML tag получает точные props своего DOM Element. */
export type StandardIntrinsicElements = Readonly<{
  [TagName in keyof HTMLElementTagNameMap]:
    TagName extends "input"
      ? Omit<IntrinsicProperties<HTMLInputElement>, keyof InputAttributeOverrides> &
        InputAttributeOverrides
      : IntrinsicProperties<HTMLElementTagNameMap[TagName]>
}>

/** HTML и platform-owned built-in tags в едином Document. */
export type BuiltinElements = Omit<StandardIntrinsicElements, "slot"> & Readonly<{
  slot: Readonly<{name?: string; slot?: string; children?: Child}>
  hud: IntrinsicProperties<HUDElement>
  space: IntrinsicProperties<SpaceElement>
  viewpoint: IntrinsicProperties<ViewPointElement>
  display: IntrinsicProperties<DisplayElement>
  "vector-path": IntrinsicProperties<HTMLElement> & Readonly<{
    d?: string | null | undefined
  }>
}>

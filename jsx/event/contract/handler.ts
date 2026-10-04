import type jsxEventNames from "../index.ts"
import type {EventTarget as SemanticEventTarget} from "@immersive/dom"

/** Получатель события для стандартного и semantic DOM. */
export type EventTargetValue = EventTarget | SemanticEventTarget

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

/**
Типовой namespace авторского JSX.

Element сохраняет принадлежность JSX и необязательный контракт точек вставки.
Типы props, событий и refs относятся к стандартному DOM. Namespace является
native интерфейсом TypeScript JSX и дополняется объявлениями custom tags.
Его объявления стираются; runtime registry и самостоятельной функции здесь нет.
Сценарий вызова для type-only protocol не создаётся: проверяемое использование
составляют типы автора и native semantic diagnostics компилятора.

@packageDocumentation
*/
import type {} from "@zavx0z/template"
import type {Element as AuthoredElement} from "./contract/output.ts"
import type {IntrinsicProperties as AuthoredProperties} from "./contract/input.ts"
import type {
  BuiltinElements,
  Child as AuthoredChild,
  DomEventFor,
  DomEventHandler,
  ElementTarget,
  EventTargetValue,
  Ref as AuthoredRef,
  StandardIntrinsicElements as StandardElements,
} from "./src/dom.ts"

/** Native namespace объединяет контракт автора и расширения intrinsic тегов. */
export namespace JSX {
  /** Авторское JSX-значение; Slots не добавляет runtime-полей. */
  export type Element<Slots extends object = never> = AuthoredElement<Slots>

  /** Native TypeScript принимает компоненты с любым конкретным объектным контрактом слотов. */
  export type ElementType = keyof IntrinsicElements | ((props: any) => Element<object>)

  /** Вложенное содержимое JSX, включая текст, пустые значения и readonly коллекции. */
  export type Child = AuthoredChild

  /** Callback ref конкретного DOM Element, получающий null при очистке. */
  export type Ref<Target extends EventTargetValue> = AuthoredRef<Target>

  /** Native DOM event с уточнённым currentTarget. */
  export type Event<Target extends EventTargetValue, NativeEvent extends globalThis.Event> = DomEventFor<Target, NativeEvent>

  /** Обработчик события одного конкретного DOM-получателя. */
  export type EventHandler<Target extends EventTargetValue, NativeEvent extends globalThis.Event> = DomEventHandler<Target, NativeEvent>

  /** Props intrinsic Element из первичного входного контракта. */
  export type IntrinsicProperties<Target extends ElementTarget> = AuthoredProperties<Target>

  /** Стандартные HTML-теги с точными DOM props и событиями. */
  export type StandardIntrinsicElements = StandardElements

  /** Native связь синтаксической вложенности с входом компонента. */
  export interface ElementChildrenAttribute {
    children: unknown
  }

  /** Compiler-owned идентификатор экземпляра и статическое назначение слоту. */
  export interface IntrinsicAttributes {
    key?: string | number
    slot?: string
  }

  /** Вложенность проверяется компилятором по контракту получателя. */
  export type LibraryManagedAttributes<Component, Props> = Props & {children?: Child}

  /** Custom tags добавляются у владельца через стандартное module augmentation. */
  export interface IntrinsicElements extends BuiltinElements {}
}

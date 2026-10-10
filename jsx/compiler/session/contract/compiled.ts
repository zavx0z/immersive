import type {Document, Element, HTMLElement, DOMComponent, DOMComponentConstructor, DOMComponentContent, DOMGroup} from "@zavx0z/immersive-dom"
import type {nativeElementClasses} from "./native-elements.ts"

declare const compiledHookFactoryBrand: unique symbol

/** Публичное авторство и готовый самостоятельный DOM constructor описывают один экспорт. */
type NativeConstructors = typeof import("@zavx0z/immersive-dom") & typeof import("@zavx0z/immersive-dom/space") & typeof import("@zavx0z/immersive-dom/viewpoint") & typeof import("@zavx0z/immersive-dom/display") & typeof import("@zavx0z/immersive-dom/hud")
export type DOMIntrinsicTarget<Tag extends string> = Tag extends "slot" ? DOMGroup : Tag extends keyof typeof nativeElementClasses
  ? (typeof nativeElementClasses)[Tag] extends keyof NativeConstructors
    ? NativeConstructors[(typeof nativeElementClasses)[Tag]] extends abstract new(...arguments_: any[]) => any
      ? InstanceType<NativeConstructors[(typeof nativeElementClasses)[Tag]]>
      : DOMGroup
    : DOMGroup
  : Element

type Constructor<Props, Target> = Target extends HTMLElement
  ? {new(document?: Document, props?: Readonly<Props>, content?: DOMComponentContent, context?: unknown): Target}
  : {new(document: Document, props?: Readonly<Props>, content?: DOMComponentContent, context?: unknown): Target}

export type CompiledDOMComponent<Props, Result, Target extends DOMComponent<Props> = DOMGroup & DOMComponent<Props>> =
  Pick<DOMComponentConstructor<Props>, keyof DOMComponentConstructor<Props>> & Constructor<Props, Target> & ((props: Props) => Result)

/** Только build-time договор фабрики: её конкретные методы генерируются из исходного hook. */
export type CompiledHookFactory<Author extends (...arguments_: any[]) => any> = Author & {
  readonly [compiledHookFactoryBrand]: true
}

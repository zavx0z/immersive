import type {Child, DataAndAriaProperties, ElementTarget, EventProperties, PrimitiveProperties, Ref} from "../src/dom.ts"

/**
Авторские свойства intrinsic Element: изменяемые DOM-значения, события,
данные, refs и вложенное содержимое. CSS остаётся контрактом владельца Template.

@property children - Семантическое содержимое intrinsic контейнера.

@property ref - Ссылка на тот же Element; очистка принадлежит Component lifecycle.

@property style - Подготовленный branded CSS document.
*/
export type IntrinsicProperties<Target extends ElementTarget> =
  PrimitiveProperties<Target> & EventProperties<Target> & DataAndAriaProperties & Readonly<{
    children?: Child
    ref?: Ref<Target> | {current: Target | null} | null | undefined
    style?: CssStyle | undefined
  }>

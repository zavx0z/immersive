import type {JSX as AuthorJSX} from "@jsx/types"

/**
Native namespace automatic JSX требует негeneric Element для типа expression.
Авторский generic-контракт остаётся у @jsx/types; ElementType принимает
функции с конкретным объектным контрактом, а синтаксис JSX возвращает Element
с отсутствующим phantom-контрактом. Объявления namespace стираются.
*/
export namespace JSX {
  /** Native JSX expression; конкретный контракт читается из объявления компонента. */
  export type Element = AuthorJSX.Element

  /** Допустимые intrinsic имена и функции с объектными контрактами. */
  export type ElementType = AuthorJSX.ElementType

  /** Native связь синтаксической вложенности и props. */
  export interface ElementChildrenAttribute extends AuthorJSX.ElementChildrenAttribute {}

  /** Native ключ и статическое назначение ребёнка. */
  export interface IntrinsicAttributes extends AuthorJSX.IntrinsicAttributes {}

  /** Управление типами вложенности делегируется авторскому контракту. */
  export type LibraryManagedAttributes<Component, Props> = AuthorJSX.LibraryManagedAttributes<Component, Props>

  /** Расширения custom tags принадлежат общему авторскому namespace. */
  export interface IntrinsicElements extends AuthorJSX.IntrinsicElements {}
}

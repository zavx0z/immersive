/**
Навигация по иерархическому пути с текущим последним сегментом.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {BreadcrumbItemView} from "./src/helpers.tsx"
import type {BreadcrumbsProps} from "./contract/input.ts"
import {normalizeItems} from "./src/helpers.tsx"

export type {BreadcrumbsProps} from "./contract/input"
export type {BreadcrumbsItem} from "./contract/types"

import type {JSX} from "@jsx-compiler/session"

export default function Breadcrumbs(props: BreadcrumbsProps): JSX.Element {
  const items = normalizeItems(props.items)
  return <nav
    aria-label={props.label ?? "Путь"}
    style={css`
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
      height: 100%;
      overflow: clip;

      ${props.style}
    `}
  >
    <ol
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        align-items: center;
        min-width: 0;
        height: 100%;
        gap: 0;
        margin: 0;
        padding: 0;
        overflow: clip;
        list-style: none;
      `}
    >
      {items.map(item => <BreadcrumbItemView
        key={item.id}
        item={item}
        current={item.current}
        onNavigate={props.onNavigate}
      />)}
    </ol>
  </nav>
}

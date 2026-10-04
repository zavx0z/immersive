/**
Навигация по иерархическому пути с текущим последним сегментом.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {BreadcrumbItemView} from "./src/helpers.tsx"
import type {ImmersiveUiComponentNavigationBreadcrumb} from "./contract"
import {normalizeItems} from "./src/helpers.tsx"


export type {ImmersiveUiComponentNavigationBreadcrumb} from "./contract"

export default function Breadcrumbs(props: ImmersiveUiComponentNavigationBreadcrumb.Input): ImmersiveUiComponentNavigationBreadcrumb.Output {
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

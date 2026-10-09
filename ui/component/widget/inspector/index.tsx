/**
Инспектор категорий и панелей с поиском и сохраняемым содержимым.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {InspectorHeader} from "./src/header"

import {CategoryButton} from "./src/helpers.tsx"
import {InspectorContextRowView} from "./src/helpers.tsx"
import type {ImmersiveUiComponentWidgetInspector as Contract} from "./contract"
import {assertInspectorProps} from "./src/helpers.tsx"


export type {ImmersiveUiComponentWidgetInspector} from "./contract"

export default function Inspector(props: Contract.Input): Contract.Output {
  assertInspectorProps(props)
  return <aside
    aria-label={props.ariaLabel ?? "Inspector"}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: clip;
      border: var(--border-width-control) solid var(--material-editor-border);
      border-radius: var(--widget-radius);
      background: var(--widget-surface-background);
      color: rgb(var(--surface-150));
      font-size: var(--font-size-sm);

      ${props.style}
    `}
  >
    <slot name="header">
      <InspectorHeader input={props} />
    </slot>
    <div
      style={css`
        display: flex;
        flex-direction: row;
        width: 100%;
        min-height: 0;
        flex-grow: 1;
      `}
    >
      <nav
        aria-label={props.categoriesLabel ?? "Categories"}
        style={css`
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          width: 30px;
          height: 100%;
          gap: 0;
          padding: 8px 0;
          background: var(--widget-text-background);
        `}
      >
        {props.categories.map(category => <CategoryButton
          key={category.id}
          category={category}
          selected={category.id === props.selectedCategoryId}
          onChange={props.onCategoryChange}
        />)}
      </nav>
      <div
        role="region"
        aria-label="Inspector content"
        style={css`
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          flex-grow: 1;
          background: var(--widget-surface-background);
        `}
      >
        {props.context === undefined ? null : <InspectorContextRowView
          context={props.context}
          secondary={false}
        />}
        {props.context?.secondary === undefined ? null : <InspectorContextRowView
          context={props.context.secondary}
          secondary={true}
        />}
        <div
          data-inspector-panels=""
          style={css`
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 0;
            flex-grow: 1;
            gap: var(--widget-content-gap);
            padding: var(--widget-content-padding);
            overflow-y: auto;
            scrollbar-width: thin;
            background: var(--widget-surface-background);
          `}
        >
          <slot />
        </div>
      </div>
    </div>
  </aside>
}

/**
Инспектор категорий и панелей с поиском и сохраняемым содержимым.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {InspectorActionButton} from "./src/action-button"

import {CategoryButton} from "./src/helpers.tsx"
import {InspectorContextRowView} from "./src/helpers.tsx"
import type {UiWidgetsInspector as Contract} from "./contract"
import {assertInspectorProps} from "./src/helpers.tsx"
import IconButton from "@ui-buttons/icon-button"
import TextField from "@ui-fields/text-field"
import searchIcon from "@ui-themes-icons/search"


export type {UiWidgetsInspector} from "./contract"

export default function Inspector(props: Contract.Input): Contract.Output {
  assertInspectorProps(props)
  const onInput = (query: string, event: Event) => props.onQueryChange?.(query, event)
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
      border-radius: 6px;
      background: var(--widget-number-background-readonly);
      color: rgb(var(--surface-150));
      font-size: var(--font-size-sm);

      ${props.style}
    `}
  >
    <header
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        height: 30px;
        gap: 4px;
        padding: 4px;
        background: var(--widget-number-background-readonly);
      `}
    >
      <div
        style={css`
          display: flex;
          flex-direction: row;
          align-items: center;
          width: 0;
          min-width: 22px;
          flex-grow: 1;
          gap: 2px;
        `}
      >
        {(props.toolbarLeadingActions ?? []).map(action => <InspectorActionButton
          key={action.id}
          label={action.label}
          iconSrc={action.iconSrc}
          title={action.title}
          disabled={action.disabled === true}
          selected={action.selected}
          iconSize={14}
          onClick={action.action}
        />)}
      </div>
      <div
        style={css`
          position: relative;
          display: block;
          width: 115px;
          min-width: 115px;
          height: 22px;
        `}
      >
        <img
          src={searchIcon}
          alt=""
          aria-hidden="true"
          width={13}
          height={13}
          style={css`
            position: absolute;
            left: 6px;
            top: 4px;
            width: 13px;
            height: 13px;
            object-fit: contain;
            pointer-events: none;
          `}
        />
        <TextField
          type="search"
          value={props.query}
          placeholder={props.searchPlaceholder}
          title={props.searchLabel}
          style={css`
            width: 100%;
            height: 22px;
            --text-field-width: 100%;
            --text-field-height: 22px;
            --text-field-padding: 2px 8px 2px 23px;
          `}
          onInput={onInput}
        />
      </div>
      <div
        style={css`
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          width: 0;
          min-width: 22px;
          flex-grow: 1;
          gap: 2px;
        `}
      >
        {(props.toolbarActions ?? []).map(action => <InspectorActionButton
          key={action.id}
          label={action.label}
          iconSrc={action.iconSrc}
          title={action.title}
          disabled={action.disabled === true}
          selected={action.selected}
          iconSize={14}
          onClick={action.action}
        />)}
      </div>
    </header>
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
          background: var(--widget-number-background-readonly);
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
            gap: 2px;
            padding: 7px;
            overflow-y: auto;
            scrollbar-width: thin;
            background: var(--widget-number-background-readonly);
          `}
        >
          <slot />
        </div>
      </div>
    </div>
  </aside>
}

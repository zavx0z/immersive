import {InspectorActionButton} from "./action-button"
import TextField from "@zavx0z/immersive-ui-component-field-text"
import searchIcon from "@zavx0z/immersive-ui-theme-icon-search"
import type {ImmersiveUiComponentWidgetInspector as Contract} from "../contract"

/** Штатная шапка остаётся fallback именованного слота приложения. */
export function InspectorHeader({input: props}: Readonly<{input: Contract.Input}>) {
  const onInput = (query: string, event: Event) => props.onQueryChange?.(query, event)
  return <header
      hidden={props.showSearch === false && (props.toolbarLeadingActions?.length ?? 0) === 0 && (props.toolbarActions?.length ?? 0) === 0}
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

        &[hidden] {
          display: none;
        }
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
        hidden={props.showSearch === false}
        style={css`
          position: relative;
          display: block;
          width: 115px;
          min-width: 115px;
          height: 22px;

          &[hidden] {
            display: none;
          }
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
}

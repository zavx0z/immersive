/**
Панель содержимого с заголовком и действиями.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentSurfacePanel as Contract} from "./contract"
import {useId} from "@zavx0z/immersive-component"
import Button from "@zavx0z/immersive-ui-component-button-basic"
import CheckboxField from "@zavx0z/immersive-ui-component-field-checkbox"
import IconButton from "@zavx0z/immersive-ui-component-button-icon"
import chevronDownIcon from "@zavx0z/immersive-ui-theme-icon-chevron-down"
import chevronRightIcon from "@zavx0z/immersive-ui-theme-icon-chevron-right"


export type {ImmersiveUiComponentSurfacePanel} from "./contract"

export default function Panel(props: Contract.Input): Contract.Output {
  if (props.label.length === 0) throw new Error("Panel label must not be empty")
  const contentId = useId()
  const onClick = (event: Event) => props.onToggle?.(!props.expanded, event)
  return <section
    data-panel=""
    hidden={props.hidden === true}
    style={css`
      display: flex;
      flex-direction: column;
      width: 100%;
      overflow: clip;
      border-radius: var(--panel-radius, 4px);
      background: var(--widget-regular-outline);

      &[hidden] {
        display: none;
      }

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
        height: 26px;
        gap: 2px;
        padding-left: var(--panel-header-inset, 0px);
        background: var(--panel-header-background, var(--widget-regular-outline));
      `}
    >
      {props.checked !== undefined ? <IconButton
        label={`${props.expanded ? "Свернуть" : "Развернуть"} ${props.label}`}
        iconSrc={props.expanded ? chevronDownIcon : chevronRightIcon}
        iconSize={14}
        style={css`
          width: 18px;
          min-width: 18px;
          height: 22px;
          padding: 2px;
          border: 0;
          background: transparent;
          box-shadow: none;
        `}
        onClick={onClick}
      /> : null}
      {props.checked !== undefined ? <CheckboxField
        checked={props.checked}
        title={`Использовать ${props.label}`}
        disabled={props.checkDisabled}
        onChange={props.onCheckedChange}
      /> : null}
      <Button
        label={props.label}
        startIcon={props.checked === undefined ? (props.expanded ? chevronDownIcon : chevronRightIcon) : undefined}
        iconSize={14}
        title={props.title}
        aria-expanded={String(props.expanded)}
        aria-controls={contentId}
        style={css`
          width: 0;
          min-width: 0;
          height: 26px;
          flex-grow: 1;
          padding: 0 5px;
          border: 0;
          border-radius: 4px;
          background: transparent;
          box-shadow: none;
          justify-content: flex-start;

          ${props.expanded && css`
            border-radius: 4px 4px 0 0;
          `}
        `}
        onClick={onClick}
      />
      <nav
        aria-label={`${props.label} actions`}
        style={css`
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 2px;
          padding-right: 2px;
        `}
      >
        {(props.actions ?? []).map(action => <IconButton
          key={action.id}
          label={action.label}
          iconSrc={action.iconSrc}
          title={action.title}
          disabled={action.disabled === true}
          selected={action.selected}
          iconSize={14}
          style={css`
            width: 22px;
            min-width: 22px;
            height: 22px;
            padding: 2px;
            border: 0;
            background: transparent;
            box-shadow: none;
          `}
          onClick={action.action}
        />)}
      </nav>
    </header>
    <div
      id={contentId}
      hidden={!props.expanded}
      style={css`
        box-sizing: border-box;
        display: block;
        width: 100%;
        padding: var(--panel-content-padding, 6px);
        background: var(--panel-content-background, var(--widget-regular-outline));

        &[hidden] {
          display: none;
        }
      `}
    >
      <slot />
    </div>
  </section>
}

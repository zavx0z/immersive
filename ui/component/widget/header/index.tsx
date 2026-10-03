/**
Общий заголовок составного виджета со статусом и действиями.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import WidgetActionButton from "@ui-widgets-header/action"
import type {UiWidgetsHeader as Contract} from "./contract"
import Badge from "@ui/badge"


export type {UiWidgetsHeader} from "./contract"

export default function WidgetHeader(props: Contract.Input): Contract.Output {
  return <header
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      min-width: 0;
      height: 36px;
      min-height: 36px;
      gap: 6px;
      padding: 6px 16px;
      background: var(--widget-toolbar-background);
      color: var(--widget-toolbar-content);
      user-select: none;
    `}
  >
    <strong
      title={props.title}
      style={css`
        min-width: 0;
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--font-size-sm);
      `}
    >
      {props.title}
    </strong>
    <span
      style={css`
        font-size: var(--font-size-xs);
        color: var(--widget-text-content-readonly);
        white-space: nowrap;
      `}
    >
      {props.subtitle ?? ""}
    </span>
    <span
      hidden={!props.status}
      style={css`
        display: flex;

        &[hidden] {
          display: none;
        }
      `}
    >
      <Badge
        label={props.status ?? ""}
        tone={props.statusTone}
      />
    </span>
    <nav
      aria-label={`${props.title} actions`}
      style={css`
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 3px;
      `}
    >
      {(props.actions ?? []).map(action => <WidgetActionButton
        key={action.id}
        action={action}
      />)}
    </nav>
  </header>
}

/**
Действие заголовка виджета с необязательной меткой состояния.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiWidgetsHeaderAction as Contract} from "./contract"
import Badge from "@ui/badge"
import Button from "@ui-buttons/button"
import Divider from "@ui/divider"

export default function WidgetActionButton(props: Contract.Input): Contract.Output {
  const action = props.action
  return <div
    style={css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 3px;
    `}
  >
    <Button
      label={action.label}
      aria-label={action.label}
      iconSrc={action.iconSrc}
      iconOnly={action.iconSrc !== undefined}
      title={action.iconSrc === undefined ? undefined : action.label}
      disabled={action.disabled === true}
      selected={action.selected}
      tone={action.tone}
      onClick={event => {
        if (props.stopPropagation) event.stopPropagation()
        action.onAction?.(event)
      }}
      size="small"
    />
    <span
      hidden={action.badge === undefined}
      style={css`
        display: flex;

        &[hidden] {
          display: none;
        }
      `}
    >
      <Badge
        label={action.badge ?? ""}
        tone={action.badgeTone}
      />
    </span>
    {action.dividerAfter ? <Divider
      style={css`
        width: 1px;
        height: 18px;
        margin: 0 2px;
      `}
    /> : null}
  </div>
}

export type {UiWidgetsHeaderAction} from "./contract"

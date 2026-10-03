import IconButton from "@ui-buttons/icon-button"
import type {UiButtonsIconButton} from "@ui-buttons/icon-button"
import type {JSX} from "@jsx-compiler/session"

/** Действие коллекции сохраняет числовой размер и скрывает неприменимую перестановку. */
export function CollectionActionButton(props: UiButtonsIconButton.Input & {hidden?: boolean}): JSX.Element {
  return <IconButton
    label={props.label}
    iconSrc={props.iconSrc}
    iconSize={props.iconSize}
    variant={props.variant}
    tone={props.tone}
    size={props.size}
    disabled={props.disabled}
    selected={props.selected}
    title={props.title}
    onClick={props.onClick}
    style={css`
      width: 28px;
      min-width: 28px;
      height: var(--field-collection-action-height);
      padding: 0;
      border-radius: 4px;

      ${props.hidden && css`display: none;`}
    `}
  />
}

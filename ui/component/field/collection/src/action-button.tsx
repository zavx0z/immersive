import IconButton from "@zavx0z/immersive-ui-component-button-icon"
import type {Zavx0zImmersiveUiComponentButtonIcon} from "@zavx0z/immersive-ui-component-button-icon"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Действие коллекции сохраняет числовой размер и скрывает неприменимую перестановку. */
export function CollectionActionButton(props: Zavx0zImmersiveUiComponentButtonIcon.Input & {hidden?: boolean}): JSX.Element {
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

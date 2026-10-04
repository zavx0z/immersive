import IconButton from "@zavx0z/immersive-ui-component-button-icon"
import type {ImmersiveUiComponentButtonIcon} from "@zavx0z/immersive-ui-component-button-icon"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Кнопка действия инспектора сохраняет единое оформление шапки и панелей. */
export function InspectorActionButton(props: ImmersiveUiComponentButtonIcon.Input): JSX.Element {
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
      width: 22px;
      min-width: 22px;
      height: 22px;
      padding: 2px;
      border: 0;
      background: transparent;
      box-shadow: none;
    `}
  />
}

import {hasSlot} from "@zavx0z/component/slot-presence"

export type PaneVariant = "filled" | "outlined" | "transparent"
export type PaneTextContent = string | number | bigint | boolean | null | undefined

export type PaneProps = Readonly<{
  content?: PaneTextContent
  variant?: PaneVariant | undefined
  title?: string | undefined
  active?: boolean | undefined
  style?: CssStyle | undefined
}>

export function Pane(props: PaneProps) {
  if (hasSlot() && props.content != null) {
    throw new Error("Pane accepts either slot content or primitive content, not both")
  }
  const variant = props.variant ?? "filled"
  return <section
    title={props.title}
    data-variant={variant}
    data-active={props.active === true ? "true" : undefined}
    style={css`
      box-sizing: border-box;
      display: block;
      min-width: 0;
      padding: 8px;
      overflow: hidden;
      border: 1px solid var(--widget-box-outline);
      border-radius: 4px;
      background: var(--widget-box-background);
      color: var(--widget-box-content);

      &[data-variant="outlined"] {
        background: transparent;
      }

      &[data-variant="transparent"] {
        border-color: transparent;
        background: transparent;
      }

      &[data-active="true"] {
        border-color: var(--material-editor-outline-active);
      }

      ${props.style}
    `}
  >
    <slot>
      {props.content}
    </slot>
  </section>
}

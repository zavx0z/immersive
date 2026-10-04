import {InspectorActionButton} from "./action-button"
import type {CategoryButtonProps} from "./types"
import type {InspectorContextRow} from "../contract/types.ts"
import type {ImmersiveUiComponentWidgetInspector} from "../contract/index"
type InspectorProps = ImmersiveUiComponentWidgetInspector.Input
import Button from "@zavx0z/immersive-ui-component-button-basic"
import IconButton from "@zavx0z/immersive-ui-component-button-icon"



/** Частная подготовка инспектор категорий и панелей с поиском и сохраняемым содержимым. */
export function CategoryButton(props: CategoryButtonProps) {
  const onClick = (event: Event) => props.onChange?.(props.category.id, event)
  return <Button
    label={props.category.label}
    iconSrc={props.category.iconSrc}
    iconOnly={props.category.iconSrc !== undefined}
    iconSize={16}
    title={props.category.title ?? (
      props.category.iconSrc === undefined ? undefined : props.category.label
    )}
    aria-label={props.category.label}
    disabled={props.category.disabled === true}
    selected={props.selected}
    style={css`
      width: 26px;
      min-width: 26px;
      height: 28px;
      margin-left: 4px;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;

      ${props.category.groupStart === true && css`
        margin-top: 8px;
      `}

      ${props.selected && css`
        border-radius: 4px 0 0 4px;
        background: var(--widget-number-background-readonly);
        color: rgb(var(--surface-50));
      `}
    `}
    onClick={onClick}
  />
}

/** Частная подготовка инспектор категорий и панелей с поиском и сохраняемым содержимым. */
export function InspectorContextRowView(props: Readonly<{
  context: InspectorContextRow
  secondary: boolean
}>) {
  return <div
    data-secondary={props.secondary ? "true" : undefined}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      height: 28px;
      gap: 4px;
      padding: 3px 6px;
      background: var(--widget-number-background-readonly);

      &[data-secondary="true"] {
        height: 24px;
      }
    `}
  >
    <img
      src={props.context.iconSrc ?? ""}
      alt=""
      aria-hidden="true"
      width={16}
      height={16}
      hidden={props.context.iconSrc === undefined}
      style={css`
        width: 16px;
        height: 16px;
        object-fit: contain;
        flex-shrink: 0;

        &[hidden] {
          display: none;
        }
      `}
    />
    <span
      title={props.context.title ?? props.context.label}
      style={css`
        display: inline;
        min-width: 0;
        flex-grow: 1;
        overflow: clip;
        white-space: nowrap;
        text-overflow: ellipsis;
      `}
    >
      {props.context.label}
    </span>
    <nav
      aria-label={`${props.context.label} actions`}
      style={css`
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 2px;
      `}
    >
      {(props.context.actions ?? []).map(action => <InspectorActionButton
        key={action.id}
        label={action.label}
        iconSrc={action.iconSrc}
        title={action.title}
        disabled={action.disabled === true}
        selected={action.selected}
        iconSize={14}
        onClick={action.action}
      />)}
    </nav>
  </div>
}

/** Частная подготовка инспектор категорий и панелей с поиском и сохраняемым содержимым. */
export function assertInspectorProps(props: InspectorProps): void {
  const categoryIds = new Set<string>()
  for (const category of props.categories) {
    if (category.id.length === 0) throw new Error("Inspector category id must not be empty")
    if (categoryIds.has(category.id)) throw new Error(`Inspector category id must be unique: ${category.id}`)
    categoryIds.add(category.id)
  }
  if (props.categories.length === 0) {
    if (props.selectedCategoryId !== "") throw new Error("Inspector selected category must be empty when categories are empty")
  } else if (!categoryIds.has(props.selectedCategoryId)) {
    throw new Error(`Inspector selected category does not exist: ${props.selectedCategoryId}`)
  }
}

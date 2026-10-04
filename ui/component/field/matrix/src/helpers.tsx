import type {MatrixRowProps} from "./types.ts"
import updateMatrixValue from "@immersive-ui-field-matrix-value/update"
import FieldGroup from "@immersive-ui-component-field/group"
import NumberField from "@immersive-ui-component-field/number"

/** Частная подготовка поле интерфейса: матрица чисел. */
export function MatrixRow(props: MatrixRowProps) {
  const update = (column: number, value: number): readonly (readonly number[])[] =>
    updateMatrixValue(props.matrix, props.rowIndex, column, value)
  return <FieldGroup
    density={props.density}
    style={css`
      width: 100%;
    `}
  >
    {props.row.map((value, column) => <NumberField
      key={String(column)}
      label={`${props.rowIndex + 1}${column + 1}`}
      value={value}
      step={props.step}
      disabled={props.disabled}
      readOnly={props.readOnly}
      style={css`
        width: 0;
        min-width: 0;
        height: var(--field-group-content-height);
        flex-grow: 1;
        --field-label-width: 20px;
        border-width: 0;
        border-radius: 0;
        box-shadow: none;

        ${column < props.row.length - 1 && css`
          border-right: var(--border-width-control) solid var(--widget-regular-outline);
        `}
      `}
      onInput={(next, event) => props.onInput?.(update(column, next), event)}
      onChange={(next, event) => props.onChange?.(update(column, next), event)}
    />)}
  </FieldGroup>
}

/**
Поле интерфейса: матрица чисел.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsMatrixField as Contract} from "./contract"
import {MatrixRow} from "./src/helpers.tsx"
import normalizeMatrixValue from "@ui-fields-matrix-value/normalize-matrix-value"


export type {UiFieldsMatrixField} from "./contract"

export default function MatrixField(props: Contract.Input): Contract.Output {
  const normalized = normalizeMatrixValue(props.value, props.step)
  const hasLabel = props.label !== undefined
  return <div
    data-has-label={hasLabel ? "true" : undefined}
    title={props.title}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      width: auto;
      min-width: 0;
      padding: 0;
      color: var(--widget-list-content);

      &[data-has-label="true"] {
        width: 100%;
        gap: var(--field-label-gap);
      }

      ${props.style}
    `}
  >
    <span
      hidden={!hasLabel}
      style={css`
        box-sizing: border-box;
        display: block;
        width: 40%;
        min-width: 0;
        height: var(--field-label-height);
        line-height: var(--field-label-height);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--widget-list-content);
        font-size: var(--font-size-sm);

        &[hidden] {
          display: none;
        }
      `}
    >
      {props.label ?? ""}
    </span>
    <div
      data-labelled={hasLabel ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: 100%;
        min-width: 0;
        gap: var(--field-matrix-row-gap);

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }
      `}
    >
      {normalized.value.map((row, rowIndex) => <MatrixRow
        key={String(rowIndex)}
        row={row}
        rowIndex={rowIndex}
        step={normalized.step}
        matrix={normalized.value}
        density={props.density ?? "regular"}
        disabled={props.disabled === true}
        readOnly={props.readOnly === true}
        onInput={props.onInput}
        onChange={props.onChange}
      />)}
    </div>
  </div>
}

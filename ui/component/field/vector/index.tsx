/**
Поле интерфейса: вектор чисел.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentFieldVector as Contract} from "./contract"
import normalizeVectorValue from "@zavx0z/immersive-ui-field-vector-value-normalize"
import updateVectorValue from "@zavx0z/immersive-ui-field-vector-value-update"
import FieldGroup from "@zavx0z/immersive-ui-component-field-group"
import NumberField from "@zavx0z/immersive-ui-component-field-number"


export type {ImmersiveUiComponentFieldVector} from "./contract"

export default function VectorField(props: Contract.Input): Contract.Output {
  const normalized = normalizeVectorValue(props.value, props.axes, props.step)
  const onInput = (index: number, value: number, event: Event) => {
    props.onInput?.(updateVectorValue(normalized.value, index, value), event)
  }
  const onChange = (index: number, value: number, event: Event) => {
    props.onChange?.(updateVectorValue(normalized.value, index, value), event)
  }
  return <FieldGroup
    label={props.label}
    density={props.density}
    title={props.title}
    style={props.style}
  >
    {normalized.value.map((value, index) => <NumberField
      key={normalized.axes[index]!}
      label={normalized.axes[index]!}
      value={value}
      min={props.min}
      max={props.max}
      step={normalized.step}
      disabled={props.disabled}
      readOnly={props.readOnly}
      style={css`
        width: 0;
        min-width: 0;
        height: var(--field-group-content-height);
        flex-grow: 1;
        --field-label-width: 18px;
        border-width: 0;
        border-radius: 0;
        box-shadow: none;

        ${index === 0 && css`
          --field-label-content: rgb(var(--axis-x-500));
        `}

        ${index === 1 && css`
          --field-label-content: rgb(var(--axis-y-500));
        `}

        ${index === 2 && css`
          --field-label-content: rgb(var(--axis-z-500));
        `}

        ${index === 3 && css`
          --field-label-content: var(--widget-list-content);
        `}

        ${index < normalized.value.length - 1 && css`
          border-right: var(--border-width-control) solid var(--widget-regular-outline);
        `}
      `}
      onInput={(next, event) => onInput(index, next, event)}
      onChange={(next, event) => onChange(index, next, event)}
    />)}
  </FieldGroup>
}

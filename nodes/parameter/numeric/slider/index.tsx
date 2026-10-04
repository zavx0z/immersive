/**
SliderParameter соединяет публичный SliderField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import SliderField from "@ui-fields/slider-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersSlider as Contract} from "./contract"

export type {NodesParametersSlider} from "./contract"

/**
Авторский контракт SliderParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

@property min - Обязательная нижняя граница диапазона.

@property max - Обязательная верхняя граница диапазона.
*/
export default function SliderParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="slider"
    connected={props.connected}
    hidden={props.hidden}
    disabled={props.disabled}
    readOnly={props.readOnly}
    title={props.title}
    style={props.style}
  >
    <slot
      name="left"
      slot="left"
    />
    <slot
      name="right"
      slot="right"
    />
    <SliderField
      value={props.value}
      min={props.min}
      max={props.max}
      step={props.step}
      density={props.density ?? "compact"}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --field-label-width: 18px;
      `}
      onInput={props.onInput}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

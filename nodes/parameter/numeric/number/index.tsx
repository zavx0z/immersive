/**
NumberParameter соединяет публичный NumberField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import NumberField from "@immersive-ui-component-field/number"
import ParameterLayout from "@immersive-nodes-parameter-shared/layout"
import type {ImmersiveNodesParameterNumericNumber as Contract} from "./contract"

export type {ImmersiveNodesParameterNumericNumber} from "./contract"

/**
Авторский контракт NumberParameter; общий протокол описан в ImmersiveNodesParameter, сокеты назначаются слотам left/right.

@property [softMin] - Мягкая нижняя граница перетаскивания; жёсткая валидация задаётся min.

@property [softMax] - Мягкая верхняя граница перетаскивания; жёсткая валидация задаётся max.
*/
export default function NumberParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="number"
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
    <NumberField
      label={props.labelHidden === true ? undefined : props.label}
      value={props.value}
      min={props.min}
      max={props.max}
      softMin={props.softMin}
      softMax={props.softMax}
      step={props.step}
      precision={props.precision}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.title}
      onInput={props.onInput}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

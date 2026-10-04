/**
SelectParameter соединяет публичный SelectField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import SelectField from "@ui-fields/select-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersSelect as Contract} from "./contract"

export type {NodesParametersSelect} from "./contract"

/**
Авторский контракт SelectParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

@property [state] - Передаёт особое состояние выбора публичному SelectField.
*/
export default function SelectParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="select"
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
    <SelectField
      label={props.labelHidden === true ? undefined : props.label}
      value={props.value}
      options={props.options}
      state={props.state}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.title}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

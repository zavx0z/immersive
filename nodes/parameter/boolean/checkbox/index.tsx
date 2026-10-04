/**
CheckboxParameter соединяет публичный CheckboxField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import CheckboxField from "@ui-fields/checkbox-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersCheckbox as Contract} from "./contract"

export type {NodesParametersCheckbox} from "./contract"

/**
Авторский контракт CheckboxParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

@property [indeterminate] - Смешанное отображение; checked остаётся логическим значением.
*/
export default function CheckboxParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="checkbox"
    fieldBeforeLabel
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
    <CheckboxField
      checked={props.checked}
      indeterminate={props.indeterminate}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.labelHidden === true ? props.title : undefined}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

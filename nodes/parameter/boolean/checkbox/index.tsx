/**
CheckboxParameter соединяет публичный CheckboxField с композицией сокетов ноды.
Подключённый параметр сохраняет подпись и Socket, скрывая собственное поле.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import CheckboxField from "@ui-fields/checkbox-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersCheckbox as Contract} from "./contract"

export type {NodesParametersCheckbox} from "./contract"

/**
Авторский контракт CheckboxParameter; общие свойства сокетов описаны в ParameterBaseProps.

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
    sockets={props.sockets}
    connected={props.connected}
    hidden={props.hidden}
    disabled={props.disabled}
    readOnly={props.readOnly}
    title={props.title}
    style={props.style}
    onSocketActivate={props.onSocketActivate}
  >
    <CheckboxField
      checked={props.checked}
      indeterminate={props.indeterminate}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.labelHidden === true && props.connected !== true ? props.title : undefined}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

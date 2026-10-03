/**
SwitchParameter соединяет публичный SwitchField с композицией сокетов ноды.
Подключённый параметр сохраняет подпись и Socket, скрывая собственное поле.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import SwitchField from "@ui-fields/switch-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersSwitch as Contract} from "./contract"

export type {NodesParametersSwitch} from "./contract"

/**
Авторский контракт SwitchParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

@property onChange - Запрашивает новое checked без записи во внешний Store.
*/
export default function SwitchParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="switch"
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
    <SwitchField
      checked={props.checked}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.connected === true ? undefined : props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --field-label-width: 18px;
      `}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

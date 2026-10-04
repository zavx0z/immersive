/**
SwitchParameter соединяет публичный SwitchField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import SwitchField from "@immersive-ui-component-field/switch"
import ParameterLayout from "@immersive-nodes-parameter-shared/layout"
import type {ImmersiveNodesParameterBooleanSwitch as Contract} from "./contract"

export type {ImmersiveNodesParameterBooleanSwitch} from "./contract"

/**
Авторский контракт SwitchParameter; общий протокол описан в ImmersiveNodesParameter, сокеты назначаются слотам left/right.

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
      label={props.labelHidden === true ? undefined : props.label}
      checked={props.checked}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
      `}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

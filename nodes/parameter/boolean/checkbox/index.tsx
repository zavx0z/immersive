/**
CheckboxParameter соединяет публичный CheckboxField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import CheckboxField from "@immersive-ui-component-field/checkbox"
import ParameterLayout from "@immersive-nodes-parameter-shared/layout"
import type {ImmersiveNodesParameterBooleanCheckbox as Contract} from "./contract"

export type {ImmersiveNodesParameterBooleanCheckbox} from "./contract"

/**
Авторский контракт CheckboxParameter; общий протокол описан в ImmersiveNodesParameter, сокеты назначаются слотам left/right.

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
      label={props.labelHidden === true ? undefined : props.label}
      checked={props.checked}
      indeterminate={props.indeterminate}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.title}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

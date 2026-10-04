/**
CycleParameter соединяет публичный CycleField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import CycleField from "@zavx0z/immersive-ui-component-field-cycle"
import ParameterLayout from "@zavx0z/immersive-nodes-parameter-shared-layout"
import type {Zavx0zImmersiveNodesParameterChoiceCycle as Contract} from "./contract"

export type {Zavx0zImmersiveNodesParameterChoiceCycle} from "./contract"

/**
Авторский контракт CycleParameter; общий протокол описан в Zavx0zImmersiveNodesParameter, сокеты назначаются слотам left/right.

@property [open] - Управляемое состояние списка; onOpenChange возвращает запрос изменения.
*/
export default function CycleParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="cycle"
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
    <CycleField
      label={props.labelHidden === true ? undefined : props.label}
      value={props.value}
      options={props.options}
      density="compact"
      disabled={props.disabled}
      readOnly={props.readOnly}
      open={props.open}
      title={props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
      `}
      onChange={props.onChange}
      onOpenChange={props.onOpenChange}
    />
  </ParameterLayout>
}

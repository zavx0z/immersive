/**
CycleParameter соединяет публичный CycleField с композицией сокетов ноды.
Подключённый параметр сохраняет подпись и Socket, скрывая собственное поле.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import CycleField from "@ui-fields/cycle-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersCycle as Contract} from "./contract"

export type {NodesParametersCycle} from "./contract"

/**
Авторский контракт CycleParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

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
      value={props.value}
      options={props.options}
      density="compact"
      disabled={props.disabled}
      readOnly={props.readOnly}
      open={props.open}
      title={props.connected === true ? undefined : props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --field-label-width: 18px;
      `}
      onChange={props.onChange}
      onOpenChange={props.onOpenChange}
    />
  </ParameterLayout>
}

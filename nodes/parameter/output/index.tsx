/**
OutputParameter соединяет публичный текстовый вывод с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.
Показывает значение только для чтения; направление соединения задаётся у Socket.

@packageDocumentation
*/

import {ParameterOutput} from "./src/output"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersOutput as Contract} from "./contract"

export type {NodesParametersOutput} from "./contract"

/**
Авторский контракт OutputParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

@property value - Отображается как текст или JSON; не изменяется этим компонентом.
*/
export default function OutputParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="output"
    connected={props.connected}
    hidden={props.hidden}
    disabled={props.disabled}
    readOnly
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
    <ParameterOutput
      value={props.value}
      title={props.title}
    />
  </ParameterLayout>
}

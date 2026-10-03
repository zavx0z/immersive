/**
OutputParameter соединяет публичный текстовый вывод с композицией сокетов ноды.
Подключённый параметр сохраняет подпись и Socket, скрывая собственное поле.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.
Показывает значение только для чтения; направление соединения задаётся у Socket.

@packageDocumentation
*/

import {ParameterOutput} from "./src/output"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersOutput as Contract} from "./contract"

export type {NodesParametersOutput} from "./contract"

/**
Авторский контракт OutputParameter; общие свойства сокетов описаны в ParameterBaseProps.

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
    sockets={props.sockets}
    connected={props.connected}
    hidden={props.hidden}
    disabled={props.disabled}
    readOnly
    title={props.title}
    style={props.style}
    onSocketActivate={props.onSocketActivate}
  >
    <ParameterOutput
      value={props.value}
      title={props.connected === true ? undefined : props.title}
    />
  </ParameterLayout>
}

/**
TextParameter соединяет публичный TextField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import TextField from "@ui-fields/text-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersText as Contract} from "./contract"

export type {NodesParametersText} from "./contract"

/**
Авторский контракт TextParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

@property value - Текущее строковое значение; изменение публикуется через onInput/onChange.
*/
export default function TextParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="text"
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
    <TextField
      value={props.value}
      type={props.type}
      placeholder={props.placeholder}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --field-label-width: 18px;
      `}
      onInput={props.onInput}
      onChange={props.onChange}
    />
  </ParameterLayout>
}

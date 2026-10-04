/**
PathParameter соединяет публичный PathField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import PathField from "@ui-fields/path-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersPath as Contract} from "./contract"

export type {NodesParametersPath} from "./contract"

/**
Авторский контракт PathParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

@property [onBrowse] - Запрашивает действие приложения; компонент не открывает файловую систему.
*/
export default function PathParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="path"
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
    <PathField
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      readOnly={props.readOnly}
      density="compact"
      title={props.title}
      browseTitle={props.browseTitle}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --field-label-width: 18px;
      `}
      onInput={props.onInput}
      onChange={props.onChange}
      onBrowse={props.onBrowse}
    />
  </ParameterLayout>
}

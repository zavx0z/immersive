/**
ColorParameter соединяет публичный ColorField с композицией сокетов ноды.
Подключённый параметр сохраняет подпись и Socket, скрывая собственное поле.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import ColorField from "@ui-fields/color-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersColor as Contract} from "./contract"

export type {NodesParametersColor} from "./contract"

/**
Авторский контракт ColorParameter; общие свойства сокетов описаны в ParameterBaseProps.

@property value - Одно RGBA-значение; всплывающий выбор цвета остаётся композицией UI.

@property [open] - Управляемая видимость панели выбора цвета без изменения значения.
*/
export default function ColorParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="color"
    sockets={props.sockets}
    connected={props.connected}
    hidden={props.hidden}
    disabled={props.disabled}
    readOnly={props.readOnly}
    title={props.title}
    style={props.style}
    onSocketActivate={props.onSocketActivate}
  >
    <ColorField
      value={props.value}
      open={props.open}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.connected === true ? undefined : props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --field-label-width: 18px;
      `}
      onInput={props.onInput}
      onChange={props.onChange}
      onOpenChange={props.onOpenChange}
    />
  </ParameterLayout>
}

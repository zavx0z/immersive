/**
VectorParameter соединяет публичный VectorField с композицией сокетов ноды.
Подключённый параметр сохраняет подпись и Socket, скрывая собственное поле.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import VectorField from "@ui-fields/vector-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersVector as Contract} from "./contract"

export type {NodesParametersVector} from "./contract"

/**
Авторский контракт VectorParameter; общие свойства сокетов описаны в ParameterBaseProps.

@property value - От двух до четырёх числовых компонент.

@property [axes] - Подписи и ключи ячеек; соответствуют длине value.
*/
export default function VectorParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="vector"
    sockets={props.sockets}
    connected={props.connected}
    hidden={props.hidden}
    disabled={props.disabled}
    readOnly={props.readOnly}
    title={props.title}
    style={props.style}
    onSocketActivate={props.onSocketActivate}
  >
    <VectorField
      value={props.value}
      axes={props.axes}
      min={props.min}
      max={props.max}
      step={props.step}
      density={props.density ?? "compact"}
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
    />
  </ParameterLayout>
}

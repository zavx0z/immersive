/**
CollectionParameter соединяет публичный CollectionField с композицией сокетов ноды.
Подключённый параметр сохраняет подпись и Socket, скрывая собственное поле.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import CollectionField from "@ui-fields/collection-field"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersCollection as Contract} from "./contract"

export type {NodesParametersCollection} from "./contract"

/**
Авторский контракт CollectionParameter; общие свойства сокетов описаны в ParameterBaseProps.

@property items - Внешний список; компонент не сохраняет его локальную копию.

@property [onMove] - Запрашивает перестановку элемента; приложение публикует новый порядок.
*/
export default function CollectionParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="collection"
    sockets={props.sockets}
    connected={props.connected}
    hidden={props.hidden}
    disabled={props.disabled}
    readOnly={props.readOnly}
    title={props.title}
    style={props.style}
    onSocketActivate={props.onSocketActivate}
  >
    <CollectionField
      items={props.items}
      selectedId={props.selectedId}
      visibleRows={props.visibleRows}
      emptyLabel={props.emptyLabel}
      density="compact"
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.connected === true ? undefined : props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --field-label-width: 18px;
      `}
      onSelect={props.onSelect}
      onAdd={props.onAdd}
      onRemove={props.onRemove}
      onMove={props.onMove}
    />
  </ParameterLayout>
}

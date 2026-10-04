/**
CollectionParameter соединяет публичный CollectionField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import CollectionField from "@immersive-ui-component-field/collection"
import ParameterLayout from "@immersive-nodes-parameter-shared/layout"
import type {ImmersiveNodesParameterCollection as Contract} from "./contract"

export type {ImmersiveNodesParameterCollection} from "./contract"

/**
Авторский контракт CollectionParameter; общий протокол описан в ImmersiveNodesParameter, сокеты назначаются слотам left/right.

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
    <CollectionField
      label={props.labelHidden === true ? undefined : props.label}
      items={props.items}
      selectedId={props.selectedId}
      visibleRows={props.visibleRows}
      emptyLabel={props.emptyLabel}
      density="compact"
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
      `}
      onSelect={props.onSelect}
      onAdd={props.onAdd}
      onRemove={props.onRemove}
      onMove={props.onMove}
    />
  </ParameterLayout>
}

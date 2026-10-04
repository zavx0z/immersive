/**
Список элементов с выбором и доступным пустым состоянием.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {EmptyListRow} from "./src/helpers.tsx"
import type {Zavx0zImmersiveUiComponentViewList as Contract} from "./contract"
import {ListRow} from "./src/helpers.tsx"
import {assertListProps} from "./src/helpers.tsx"


export type {Zavx0zImmersiveUiComponentViewList} from "./contract"

export default function List(props: Contract.Input): Contract.Output {
  const selectedKey = assertListProps(props)
  return <ul
    role="listbox"
    title={props.title}
    aria-disabled={String(props.disabled === true)}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 300px;
      max-height: 180px;
      gap: 0;
      padding: 2px;
      overflow-y: auto;
      border: var(--border-width-control) solid var(--widget-regular-outline);
      border-radius: 4px;
      background: var(--widget-text-background);

      ${props.style}
    `}
  >
    {props.items.length === 0 ? <EmptyListRow label={props.emptyLabel ?? ""} /> : null}
    {props.items.map(item => <ListRow
      key={item.key}
      item={item}
      selected={item.key === selectedKey}
      disabled={props.disabled === true || item.disabled === true}
      dense={props.dense === true}
      embedded={props.variant === "embedded"}
      onSelect={props.onSelect}
    />)}
  </ul>
}

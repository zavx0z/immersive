/**
Поле интерфейса: коллекция элементов.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {CollectionActionButton} from "./src/action-button"

import type {CollectionFieldMoveDirection} from "./contract/types.ts"
import type {ImmersiveUiComponentFieldCollection as Contract} from "./contract"
import IconButton from "@immersive-ui-component-button/icon"
import arrowDownIcon from "@immersive-ui-theme-icon/arrow-down"
import arrowUpIcon from "@immersive-ui-theme-icon/arrow-up"
import minusIcon from "@immersive-ui-theme-icon/minus"
import plusIcon from "@immersive-ui-theme-icon/plus"
import List from "@immersive-ui-component-view/list"
import collectionVisibleRowsHeight from "@immersive-ui-field-collection-model/visible-rows-height"
import normalizeCollectionItems from "@immersive-ui-field-collection-model/normalize-items"
import normalizeCollectionVisibleRows from "@immersive-ui-field-collection-model/normalize-visible-rows"


export type {ImmersiveUiComponentFieldCollection} from "./contract"

export default function CollectionField(props: Contract.Input): Contract.Output {
  const items = normalizeCollectionItems(props.items, props.selectedId)
  const visibleRows = normalizeCollectionVisibleRows(props.visibleRows)
  const visibleHeight = collectionVisibleRowsHeight(visibleRows)
  const density = props.density ?? "regular"
  if (density !== "regular" && density !== "compact") throw new Error(`Unknown CollectionField density: ${density}`)
  const hasLabel = props.label !== undefined
  const selectedIndex = props.selectedId === null ? -1 : items.findIndex(item => item.id === props.selectedId)
  const selected = selectedIndex < 0 ? undefined : items[selectedIndex]
  const onSelect = (key: string, event: Event) => {
    if (props.disabled !== true) props.onSelect?.(key, event)
  }
  const onAdd = (event: Event) => {
    if (props.disabled !== true && props.readOnly !== true) props.onAdd?.(event)
  }
  const onRemove = (event: Event) => {
    if (props.disabled !== true && props.readOnly !== true && props.selectedId !== null) props.onRemove?.(props.selectedId, event)
  }
  const move = (direction: CollectionFieldMoveDirection, event: Event) => {
    if (props.disabled !== true && props.readOnly !== true && props.selectedId !== null) props.onMove?.(props.selectedId, direction, event)
  }
  return <div
    data-has-label={hasLabel ? "true" : undefined}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      width: 320px;
      min-width: 0;
      padding: 0;
      color: var(--widget-list-content);

      &[data-has-label="true"] {
        width: 100%;
        gap: var(--field-label-gap);
      }

      ${props.style}
    `}
  >
    <span
      hidden={!hasLabel}
      style={css`
        box-sizing: border-box;
        display: block;
        width: 40%;
        min-width: 0;
        height: var(--field-label-height);
        line-height: var(--field-label-height);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--widget-list-content);
        font-size: var(--font-size-sm);

        &[hidden] {
          display: none;
        }
      `}>
      {props.label ?? ""}
    </span>
    <div
      data-labelled={hasLabel ? "true" : undefined}
      data-readonly={props.readOnly === true ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        width: 0;
        min-width: 0;
        flex-grow: 1;
        min-height: var(--field-label-height);
        gap: var(--field-label-gap);

        &[data-readonly="true"] {
          color: var(--widget-text-content-readonly);
        }
      `}>
      <List
        items={items.map(item => ({
          key: item.id,
          label: item.label,
          iconSrc: item.iconSrc,
          detail: item.description,
          disabled: item.disabled
        }))}
        selectedKey={props.selectedId}
        disabled={props.disabled === true}
        dense={density === "compact"}
        variant="embedded"
        emptyLabel={props.emptyLabel ?? "No items"}
        title={props.title}
        style={css`
          width: 0;
          flex-grow: 1;
          padding: 2px;
          height: ${visibleHeight}px;
          max-height: ${visibleHeight}px;
        `}
        onSelect={onSelect}
      />
      <div
        style={css`
          display: flex;
          flex-direction: column;
          width: 28px;
          gap: var(--field-collection-action-gap);
        `}>
        <CollectionActionButton
          label="Add item"
          iconSrc={plusIcon}
          disabled={props.disabled === true || props.readOnly === true || props.onAdd === undefined}
          onClick={onAdd}
        />
        <CollectionActionButton
          label="Remove selected item"
          iconSrc={minusIcon}
          disabled={props.disabled === true || props.readOnly === true || selected === undefined || selected.disabled === true || props.onRemove === undefined} onClick={onRemove}
        />
        <CollectionActionButton
          label="Move selected item up"
          iconSrc={arrowUpIcon}
          disabled={props.disabled === true || props.readOnly === true || selectedIndex <= 0 || selected?.disabled === true || props.onMove === undefined} hidden={props.onMove === undefined}
          onClick={event => move("up", event)}
        />
        <CollectionActionButton
          label="Move selected item down"
          iconSrc={arrowDownIcon}
          disabled={props.disabled === true || props.readOnly === true || selectedIndex < 0 || selectedIndex >= items.length - 1 || selected?.disabled === true || props.onMove === undefined} hidden={props.onMove === undefined}
          onClick={event => move("down", event)}
        />
      </div>
    </div>
  </div>
}

import type {SelectFieldOption} from "../contract/types.ts"

/** Частная подготовка поле интерфейса: выбор значения. */
export function SelectOption(props: Readonly<{option: SelectFieldOption; selected: boolean; hidden: boolean}>) {
  return <option
    value={props.option.value}
    selected={props.selected}
    disabled={props.option.disabled === true}
    hidden={props.hidden}
    title={props.option.title ?? props.option.description}
  >
    {props.option.label}
  </option>
}

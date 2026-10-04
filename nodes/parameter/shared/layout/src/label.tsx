/**
Подпись строки параметра размещается рядом с полем и сокетами.
Описание получает одну видимую цель по действующему контракту всплывающей подсказки.

@packageDocumentation
*/

export function ParameterLabel(props: Readonly<{
  label: string
  hidden?: boolean | undefined
  expanded?: boolean | undefined
  title?: string | undefined
}>) {
  return <span
    data-parameter-label=""
    data-expanded={props.expanded === true ? "true" : undefined}
    hidden={props.hidden === true}
    title={props.title}
    style={css`
      display: block;
      min-width: 0;
      width: 40%;
      overflow: hidden;
      color: var(--widget-list-content);
      font-size: var(--font-size-xs);
      white-space: nowrap;
      text-overflow: ellipsis;

      &[data-expanded="true"] {
        width: 0;
        flex-grow: 1;
      }

      &[hidden] {
        display: none;
      }
    `}
  >
    {props.label}
  </span>
}

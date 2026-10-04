/**
Размещает авторские Socket одной стороны, не создавая их из данных параметра.
Пустой слот не резервирует ширину и не создаёт Socket.

@packageDocumentation
*/
import type Socket from "@immersive-nodes/socket"
import type {JSX} from "@immersive-jsx-compiler/session"
import {hasSlot} from "@immersive/component/slot-presence"

export function ParameterEndpoints(props: Readonly<{
  side: "left" | "right"
}>): JSX.Element<{default?: readonly typeof Socket[]}> {
  const supplied = hasSlot()
  return <span
    data-parameter-sockets={props.side}
    style={css`
      display: flex;
      align-items: center;
      min-width: ${supplied ? "12px" : "0"};
      gap: 2px;
    `}
  >
    <slot />
  </span>
}

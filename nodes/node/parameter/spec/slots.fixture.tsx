/** Авторская композиция самостоятельных параметров и готовых Socket. */
import ParameterNode from "@immersive-nodes-node/parameter"
import TextParameter from "@immersive-nodes-parameter/text"
import NumberParameter from "@immersive-nodes-parameter-numeric/number"
import CheckboxParameter from "@immersive-nodes-parameter-boolean/checkbox"
import Socket from "@immersive-nodes/socket"

export default function AuthoredParameterNode(props: Readonly<{
  socketIds: readonly string[]
  value: string
  connected: boolean
  collapsed: boolean
  onInput: (value: string, event: Event) => void
  onSocketActivate: (id: string, event: Event) => void
}>) {
  return <ParameterNode
    id="authored-node"
    label="Авторская нода"
    collapsed={props.collapsed}
  >
    <TextParameter
      id="text"
      nodeId="authored-node"
      label="Текст"
      value={props.value}
      connected={props.connected}
      onInput={props.onInput}
    >
      {props.socketIds.map(id => <Socket
        key={id}
        slot="left"
        id={id}
        nodeId="authored-node"
        kind="string"
        direction="input"
        side="left"
        label={id}
        connected={props.connected}
        onActivate={event => props.onSocketActivate(id, event)}
      />)}
      {props.socketIds.map(id => <Socket
        key={id}
        slot="right"
        id={`${id}-output`}
        nodeId="authored-node"
        kind="string"
        direction="output"
        side="right"
        label={id}
        onActivate={event => props.onSocketActivate(`${id}-output`, event)}
      />)}
    </TextParameter>
    <NumberParameter
      id="number"
      nodeId="authored-node"
      label="Число"
      value={3}
    />
    <CheckboxParameter
      id="boolean"
      nodeId="authored-node"
      label="Флаг"
      checked
    />
  </ParameterNode>
}

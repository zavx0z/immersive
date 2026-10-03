import TextField from "@ui-fields/text-field"
import ParameterLayout from "@nodes-parameters/layout"

export default function CustomParameter(props: Readonly<{connected: boolean}>) {
  return <ParameterLayout
    id="custom"
    nodeId="source"
    label="Свой параметр"
    kind="custom"
    connected={props.connected}
  >
    <TextField
      value="Содержимое"
    />
  </ParameterLayout>
}

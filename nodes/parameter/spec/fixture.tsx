import TextField from "@ui-fields/text-field"
import {TextParameter, NumberParameter, SliderParameter, CheckboxParameter, SwitchParameter, SelectParameter, CycleParameter, OptionGroupParameter, ColorParameter, VectorParameter, MatrixParameter, PathParameter, ReferenceParameter, CollectionParameter, OutputParameter, ParameterLayout} from "@nodes/parameters"

export default function ParameterExamples(props: Readonly<{connected: boolean}>) {
  return <section>
    <TextParameter
      value="Пример"
      id="text"
      nodeId="source"
      label="TextParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <NumberParameter
      value={2.5}
      id="number"
      nodeId="source"
      label="NumberParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <SliderParameter
      value={.4}
      min={0}
      max={1}
      id="slider"
      nodeId="source"
      label="SliderParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <CheckboxParameter
      checked={true}
      id="checkbox"
      nodeId="source"
      label="CheckboxParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <SwitchParameter
      checked={false}
      id="switch"
      nodeId="source"
      label="SwitchParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <SelectParameter
      value="first"
      options={[{key: "first", value: "first", label: "Первый"}]}
      id="select"
      nodeId="source"
      label="SelectParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <CycleParameter
      value="first"
      options={[{key: "first", value: "first", label: "Первый"}]}
      id="cycle"
      nodeId="source"
      label="CycleParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <OptionGroupParameter
      value="first"
      options={[{key: "first", value: "first", label: "Первый"}]}
      id="option-group"
      nodeId="source"
      label="OptionGroupParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <ColorParameter
      value={{r: .25, g: .55, b: .85, a: 1}}
      id="color"
      nodeId="source"
      label="ColorParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <VectorParameter
      value={[1, 2, 3]}
      id="vector"
      nodeId="source"
      label="VectorParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <MatrixParameter
      value={[[1, 0], [0, 1]]}
      id="matrix"
      nodeId="source"
      label="MatrixParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <PathParameter
      value="/assets/example.png"
      id="path"
      nodeId="source"
      label="PathParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <ReferenceParameter
      value={{id: "object-a", label: "Объект", kind: "object"}}
      id="reference"
      nodeId="source"
      label="ReferenceParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <CollectionParameter
      items={[{id: "first", label: "Первый"}]}
      selectedId="first"
      id="collection"
      nodeId="source"
      label="CollectionParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <OutputParameter
      value={{message: "Готово"}}
      id="output"
      nodeId="source"
      label="OutputParameter"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    />
    <ParameterLayout
      id="custom"
      nodeId="source"
      label="Пользовательский параметр"
      kind="custom"
      connected={props.connected}
      sockets={[{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}]}
    >
      <TextField
        value="Содержимое"
      />
    </ParameterLayout>
  </section>
}

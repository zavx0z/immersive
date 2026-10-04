/** Готовые поля и пользовательская композиция разделяют адрес, сокеты и состояние подключения. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import ParameterNode from "@nodes-node/parameter"
import Socket from "@nodes/sockets"
import TextField from "@ui-fields/text-field"
import {TextParameter, NumberParameter, SliderParameter, CheckboxParameter, SwitchParameter, SelectParameter, CycleParameter, OptionGroupParameter, ColorParameter, VectorParameter, MatrixParameter, PathParameter, ReferenceParameter, CollectionParameter, OutputParameter, ParameterLayout} from "@nodes/parameters"

describe.each([{name: "Поля", props: {connected: false}}, {
  name: "Подключённые параметры",
  props: {connected: true}
}])("$name", async ({props}) => {
  const headless = createHeadless({width: 720, height: 1800})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <ParameterNode
      id="source"
      label="Параметры"
    >
      <TextParameter
        value="Пример"
        id="text"
        nodeId="source"
        label="TextParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </TextParameter>
      <NumberParameter
        value={2.5}
        id="number"
        nodeId="source"
        label="NumberParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </NumberParameter>
      <SliderParameter
        value={.4}
        min={0}
        max={1}
        id="slider"
        nodeId="source"
        label="SliderParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </SliderParameter>
      <CheckboxParameter
        checked={true}
        id="checkbox"
        nodeId="source"
        label="CheckboxParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </CheckboxParameter>
      <SwitchParameter
        checked={false}
        id="switch"
        nodeId="source"
        label="SwitchParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </SwitchParameter>
      <SelectParameter
        value="first"
        options={[{key: "first", value: "first", label: "Первый"}]}
        id="select"
        nodeId="source"
        label="SelectParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </SelectParameter>
      <CycleParameter
        value="first"
        options={[{key: "first", value: "first", label: "Первый"}]}
        id="cycle"
        nodeId="source"
        label="CycleParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </CycleParameter>
      <OptionGroupParameter
        value="first"
        options={[{key: "first", value: "first", label: "Первый"}]}
        id="option-group"
        nodeId="source"
        label="OptionGroupParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </OptionGroupParameter>
      <ColorParameter
        value={{r: .25, g: .55, b: .85, a: 1}}
        id="color"
        nodeId="source"
        label="ColorParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </ColorParameter>
      <VectorParameter
        value={[1, 2, 3]}
        id="vector"
        nodeId="source"
        label="VectorParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </VectorParameter>
      <MatrixParameter
        value={[[1, 0], [0, 1]]}
        id="matrix"
        nodeId="source"
        label="MatrixParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </MatrixParameter>
      <PathParameter
        value="/assets/example.png"
        id="path"
        nodeId="source"
        label="PathParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </PathParameter>
      <ReferenceParameter
        value={{id: "object-a", label: "Объект", kind: "object"}}
        id="reference"
        nodeId="source"
        label="ReferenceParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </ReferenceParameter>
      <CollectionParameter
        items={[{id: "first", label: "Первый"}]}
        selectedId="first"
        id="collection"
        nodeId="source"
        label="CollectionParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </CollectionParameter>
      <OutputParameter
        value={{message: "Готово"}}
        id="output"
        nodeId="source"
        label="OutputParameter"
        connected={props.connected}
      >
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </OutputParameter>
      <ParameterLayout
        id="custom"
        nodeId="source"
        label="Пользовательский параметр"
        kind="custom"
        connected={props.connected}
      >
        <TextField
          label="Пользовательский параметр"
          value="Содержимое"
        />
        <Socket
          slot="left"
          id="in"
          nodeId="source"
          kind="float"
          direction="input"
          side="left"
          label="Вход"
          connected={props.connected}
        />
      </ParameterLayout>
    </ParameterNode>
  )
  test("Общий протокол всех участников", () => {
    const parameters = [...element.querySelectorAll("[data-parameter-id]")]
    expect(parameters, "Пятнадцать полей и пользовательская композиция участвуют в одном сценарии").toHaveLength(16)
    expect(new Set(parameters.map(parameter => parameter.getAttribute("data-parameter-id"))).size, "Исходные адреса не смешиваются").toBe(16)
    expect(parameters.every(parameter => parameter.querySelector("[data-parameter-field]")?.hasAttribute("hidden") === false), "Поле каждого участника доступно одновременно с подключением").toBeTrue()
    const sockets = [...element.querySelectorAll("[data-socket-id]")]
    expect(sockets, "Каждый участник сохраняет свой сокет").toHaveLength(16)
    expect(sockets.every(socket => socket.getAttribute("data-node-id") === "source" && socket.ownerDocument === element.ownerDocument), "Общий адрес ноды и Document сохраняются").toBeTrue()
    expect(sockets.every(socket => socket.getAttribute("aria-pressed") === String(props.connected)),
      "Подключение отмечается на сокетах при постоянно видимых полях").toBeTrue()
  })
})

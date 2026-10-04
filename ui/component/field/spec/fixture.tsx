import {CheckboxField, CollectionField, ColorField, ColorPickerField, CycleField, FieldGroup, MatrixField, NumberField, PathField, ReferenceField, SelectField, SliderField, SwitchField, TextField, VectorField, type ImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field"

/** Реальные участники общего протокола, каждый со своими обязательными данными. */
export default function FieldExamples(props: ImmersiveUiComponentField.Input): ImmersiveUiComponentField.Output {
  return <div
    style={css`
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 640px;
    `}
  >
    <section data-field-example="checkbox-field">
      <CheckboxField
        label={props.label}
        title={props.title}
        checked={true}
      />
    </section>
    <section data-field-example="collection-field">
      <CollectionField
        label={props.label}
        title={props.title}
        items={[{id: "one", label: "Один"}]}
        selectedId="one"
      />
    </section>
    <section data-field-example="color-field">
      <ColorField
        label={props.label}
        title={props.title}
        value={{r: 1, g: 0.5, b: 0, a: 1}}
      />
    </section>
    <section data-field-example="color-picker-field">
      <ColorPickerField
        label={props.label}
        title={props.title}
        value={{r: 1, g: 0.5, b: 0, a: 1}}
      />
    </section>
    <section data-field-example="cycle-field">
      <CycleField
        label={props.label}
        title={props.title}
        value="one"
        options={[{key: "one", value: "one", label: "Один"}]}
      />
    </section>
    <section data-field-example="field-group">
      <FieldGroup
        label={props.label}
        title={props.title}
      >
        <NumberField
          value={1}
        />
      </FieldGroup>
    </section>
    <section data-field-example="matrix-field">
      <MatrixField
        label={props.label}
        title={props.title}
        value={[[1, 0], [0, 1]]}
      />
    </section>
    <section data-field-example="number-field">
      <NumberField
        label={props.label}
        title={props.title}
        value={1}
      />
    </section>
    <section data-field-example="path-field">
      <PathField
        label={props.label}
        title={props.title}
        value="file.txt"
      />
    </section>
    <section data-field-example="reference-field">
      <ReferenceField
        label={props.label}
        title={props.title}
        value={null}
      />
    </section>
    <section data-field-example="select-field">
      <SelectField
        label={props.label}
        title={props.title}
        value="one"
        options={[{key: "one", value: "one", label: "Один"}]}
      />
    </section>
    <section data-field-example="slider-field">
      <SliderField
        label={props.label}
        title={props.title}
        value={1}
        min={0}
        max={10}
      />
    </section>
    <section data-field-example="switch-field">
      <SwitchField
        label={props.label}
        title={props.title}
        checked={true}
      />
    </section>
    <section data-field-example="text-field">
      <TextField
        label={props.label}
        title={props.title}
        value="Текст"
      />
    </section>
    <section data-field-example="vector-field">
      <VectorField
        label={props.label}
        title={props.title}
        value={[1, 2, 3]}
      />
    </section>
  </div>
}

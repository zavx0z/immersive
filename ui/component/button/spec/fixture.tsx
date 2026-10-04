import {Button, IconButton, ToggleButtonGroup, type ImmersiveUiComponentButton} from "@zavx0z/immersive-ui-component-button"
import runIcon from "@zavx0z/immersive-ui-theme-icon-run"

/** Совместное представление реальных участников Cluster для одного Experience. */
export default function ButtonExamples(props: ImmersiveUiComponentButton.Input & {label: string}): ImmersiveUiComponentButton.Output {
  return <section>
      <Button
        label={props.label}
        disabled={props.disabled}
      />
      <IconButton
        label={props.label}
        disabled={props.disabled}
        iconSrc={runIcon}
      />
      <ToggleButtonGroup
        label={props.label}
        disabled={props.disabled}
        value="first"
        options={[
          {key: "first", value: "first", label: "Первый"},
          {key: "second", value: "second", label: "Второй"},
        ]}
      />
    </section>
}

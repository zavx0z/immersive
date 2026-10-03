import {Button, IconButton, ToggleButtonGroup, type UiButtons} from "@ui/buttons"
import runIcon from "@ui-themes-icons/run"

/** Совместное представление реальных участников Cluster для одного Experience. */
export default function ButtonExamples(props: UiButtons.Input & {label: string}): UiButtons.Output {
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

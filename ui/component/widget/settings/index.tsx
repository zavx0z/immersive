/**
Настройки с боковым выбором раздела и отдельной областью содержимого.
Группы разделов, компактные отступы и общая тема сохраняют одинаковый ритм
панелей. Приложение определяет содержимое, выбранный раздел и сохранение данных.

@packageDocumentation
*/
import {useId} from "@zavx0z/immersive-component"
import Button from "@zavx0z/immersive-ui-component-button-basic"
import type {ImmersiveUiComponentWidgetSettings as Contract} from "./contract"

export type {ImmersiveUiComponentWidgetSettings} from "./contract"

export default function Settings(props: Contract.Input): Contract.Output {
  const contentId = useId()
  const ids = props.sections.map(section => section.id)
  if (ids.some(id => !id.trim()) || new Set(ids).size !== ids.length) {
    throw new TypeError("Settings requires unique non-empty section ids")
  }
  if (!props.sections.some(section => section.id === props.selectedId && !section.disabled)) {
    throw new TypeError("Settings requires an enabled selected section")
  }
  const selectByKey = (event: KeyboardEvent, index: number) => {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const available = props.sections.filter(section => !section.disabled)
    const current = available.findIndex(section => section.id === props.sections[index]?.id)
    const next = event.key === "Home" ? 0 : event.key === "End" ? available.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + available.length) % available.length
    const section = available[next]!
    props.onSelect?.(section.id, event)
    const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>("button")
    buttons?.[props.sections.findIndex(item => item.id === section.id)]?.focus()
  }
  return <section
    data-widget="settings"
    aria-label={props.label ?? "Настройки"}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      gap: var(--widget-content-gap);
      padding: var(--widget-content-padding);
      border-radius: var(--widget-radius);
      background: var(--widget-surface-background);
      color: var(--widget-regular-content);
      font-size: var(--font-size-sm);
      --field-label-height: var(--control-height-medium);

      ${props.style}
    `}
  >
    <nav
      role="tablist"
      aria-label="Раздел настроек"
      aria-orientation="vertical"
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        width: 28%;
        min-width: 120px;
        max-width: 180px;
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: thin;
      `}
    >
      {props.sections.map((section, index) => <Button
        key={section.id}
        label={section.label}
        role="tab"
        selected={section.id === props.selectedId}
        aria-selected={section.id === props.selectedId}
        aria-controls={contentId}
        tabIndex={section.id === props.selectedId ? 0 : -1}
        disabled={section.disabled}
        onClick={event => props.onSelect?.(section.id, event)}
        onKeyDown={event => selectByKey(event, index)}
        style={css`
          width: 100%;
          flex-shrink: 0;
          justify-content: flex-start;
          min-height: var(--control-height-large);
          border-radius: 0;

          ${index > 0 && section.group !== props.sections[index - 1]?.group && css`
            margin-top: var(--widget-content-gap);
          `}
        `}
      />)}
    </nav>
    <div
      id={contentId}
      role="tabpanel"
      aria-label={props.sections.find(section => section.id === props.selectedId)?.label}
      style={css`
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        width: 0;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
      `}
    >
      <slot />
    </div>
  </section>
}

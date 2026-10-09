/** Раздел с устойчивой идентичностью; соседние разделы одной группы стоят вместе. */
export type SettingsSection = Readonly<{
  id: string
  label: string
  group?: string | undefined
  disabled?: boolean | undefined
}>

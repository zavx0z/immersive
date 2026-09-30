

/**
Входные данные MenuItem.
*/
export interface MenuItemProps {
  readonly label: string
  readonly disabled?: boolean | undefined
  readonly shortcut?: string | undefined
  readonly onSelect: () => void
}

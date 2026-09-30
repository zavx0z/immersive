import Button from "@ui-buttons/button"

/** Авторская композиция: за подпись можно перемещать Tab, кнопка принимает собственный ввод. */
export function TabContent(props: Readonly<{count: number; onIncrement(): void}>) {
  return <div
    style={css`
      display: flex;
      align-items: center;
      gap: 8px;
    `}
  >
    <span data-tab-grip="">Перетащить</span>
    <Button
      label={`Нажатий: ${props.count}`}
      onClick={props.onIncrement}
    />
  </div>
}

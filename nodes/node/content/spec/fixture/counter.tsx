import {useEffect, useState} from "@zavx0z/component"
import {Button} from "@zavx0z/ui/buttons/button"
import {Typography} from "@zavx0z/ui/typography"

/** Живое содержимое сохраняет счётчик при скрытии области ноды. */
export function Counter(props: {id: string}) {
  const [count, setCount] = useState(0)
  useEffect(() => setCount(0), [props.id])
  return <div style={css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 12px;
    background: #24557a;
  `}>
    <Typography text="Компонент внутри ноды" />
    <Button
      label={`Нажатий: ${count}`}
      onClick={() => setCount(value => value + 1)}
    />
  </div>
}

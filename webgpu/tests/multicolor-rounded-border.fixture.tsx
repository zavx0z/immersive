/** Реальный JSX проходит тот же compiler, что компонент приложения. */
function Box() {
  return (
    <div
      style={css`
        display: block;
        box-sizing: border-box;
        width: 96px;
        height: 80px;
        background: white;
        border: 8px solid red;
        border-right-color: lime;
        border-bottom-color: blue;
        border-left-color: yellow;
        border-radius: 24px;
      `}
    />
  )
}

export function Boxes(props: {count: number}) {
  const boxes = Array.from({length: props.count}, (_, index) => index)
  return (
    <section
      style={css`
        display: flex;
        gap: 8px;
        width: ${props.count * 104 - 8}px;
        height: 80px;
      `}
    >
      {boxes.map(index => (
        <Box key={index} />
      ))}
    </section>
  )
}

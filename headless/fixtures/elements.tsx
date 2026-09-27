/** Простые DOM-элементы для проверки Headless без прикладных компонентов. */
export function FillBox() {
  return <section
    style={css`
      width: 100%;
      height: 100%;
      background: #2468ac;
    `}
  />
}

export function TextBox(props: Readonly<{text: string}>) {
  return (
    <article
      style={css`
        position: absolute;
        box-sizing: border-box;
        left: 40px;
        top: 40px;
        width: 240px;
        height: 100px;
        padding: 12px;
        border: 1px solid #707070;
        background: #202020;
        color: #ffffff;
        font-size: 16px;
      `}
    >
      {props.text}
    </article>
  )
}

/** Дробные границы проверяют округление области снимка наружу. */
export function InlineText(props: Readonly<{text: string}>) {
  return (
    <span
      style={css`
        position: absolute;
        display: block;
        box-sizing: border-box;
        left: 21.25px;
        top: 11.5px;
        width: 137.5px;
        height: 24.25px;
        background: #202020;
        color: #ffffff;
        font-size: 12px;
      `}
    >
      {props.text}
    </span>
  )
}

/** Изображение занимает всю рабочую область для проверки реального GPU-кадра. */
export function ImageBox(props: Readonly<{src: string}>) {
  return <img
    src={props.src}
    alt="Цветовые образцы"
    style={css`
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    `}
  />
}

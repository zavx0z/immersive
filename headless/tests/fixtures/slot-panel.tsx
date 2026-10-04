import {useState} from "@immersive/component"

/** Текстовый компонент для проверки одного compiler и Headless transport. */
export function SlotText(props: Readonly<{text: string}>) {
  return (
    <span>
      {props.text}
    </span>
  )
}

/** Именованная и безымянная точки вставки с независимым fallback. */
export function SlotPanel() {
  return (
    <article>
      <header>
        <slot name="header">
          <SlotText text="Запасной заголовок" />
        </slot>
      </header>
      <section>
        <slot>
          <SlotText text="Запасное тело" />
        </slot>
      </section>
    </article>
  )
}

/** Единственная именованная область обнаруживает ошибочное назначение пустого child в default. */
export function SlotNamedPanel() {
  return (
    <article>
      <slot name="header">
        <SlotText text="Запасной заголовок" />
      </slot>
    </article>
  )
}

/** Состояние позволяет обнаружить remount при перестановке вложенного списка. */
export function SlotCounter(props: Readonly<{text: string}>) {
  const [count, setCount] = useState(0)
  return (
    <button
      data-item={props.text}
      onClick={() => setCount(previous => previous + 1)}
    >
      {props.text}:{count}
    </button>
  )
}

/** Получатель содержимого использует безымянный слот без author-facing props транспорта. */
export function ContentReceiver() {
  return (
    <main>
      <slot />
    </main>
  )
}

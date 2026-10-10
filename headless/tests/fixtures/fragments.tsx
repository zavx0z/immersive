import {useEffect, useState} from "@zavx0z/immersive-component/authoring"

export function FragmentCounter(props: {cleanup: () => void}) {
  const [count, setCount] = useState(0)
  useEffect(() => props.cleanup, [])
  return (
    <>
      <button
        onClick={() => setCount(value => value + 1)}
        style={css`
          width: 80px;
          height: 24px;
          background: red;
        `}
      >
        {count}
      </button>
      <span
        style={css`
          display: block;
          width: 80px;
          height: 24px;
          background: blue;
        `}
      >
        tail
      </span>
    </>
  )
}

export function TextFragment() {
  return <>Текст без элемента</>
}

export function EmptyFragment() {
  return <></>
}


export function SingleFragment() {
  return (
    <>
      <button data-single="">Один элемент</button>
    </>
  )
}

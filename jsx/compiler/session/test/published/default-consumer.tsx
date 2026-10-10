import Prepared from "./default-library/index.js"

function Header() { return <h1>Заголовок</h1> }

function Body(props: {value: string}) {
  return <button>{props.value}</button>
}

export function Consumer(props: {value: string}) {
  return <Prepared value={props.value}>
    <Header slot="header" />
    <Body value={props.value} />
  </Prepared>
}

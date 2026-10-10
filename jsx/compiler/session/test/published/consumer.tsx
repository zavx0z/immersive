import Prepared from "./library/index.js"

function Header() { return <h1>Заголовок</h1> }

export function Consumer(props: {value: string}) {
  return <Prepared value={props.value}>
    <Header slot="header" />
  </Prepared>
}

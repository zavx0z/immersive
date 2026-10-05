import Inspector from "@zavx0z/immersive-ui-component-widget-inspector"

function Header() {
  return <header data-custom-inspector-header="">Имя выбранного предмета</header>
}
function Content() {
  return <div data-custom-inspector-content="">Содержимое</div>
}

export default function NamedHeaderFixture(props: Readonly<{show: boolean}>) {
  return <Inspector categories={[]} selectedCategoryId="" query="">
    {props.show ? <Header slot="header" /> : null}
    <Content />
  </Inspector>
}

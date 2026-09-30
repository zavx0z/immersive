import Inspector from "@ui-widgets/inspector"
import Panel from "@ui-surfaces/panel"
import uiIcons from "@ui-themes-icons/collection"

export function InspectorFixture() {
  return <Inspector
    ariaLabel="Инспектор свойств"
    categoriesLabel="Категории"
    categories={[{id: "props", label: "P", iconSrc: uiIcons.settings, title: "Props", panelIds: ["props"]}]}
    selectedCategoryId="props"
    query=""
    searchLabel="Поиск"
    searchPlaceholder="Поиск"
    context={{label: "Button", iconSrc: uiIcons.resource}}
    onQueryChange={() => {}}
  >
    <Panel
      label="Свойства"
      title="Свойства"
      expanded={true}
      onToggle={() => {}}
    >
      <StaticContent />
    </Panel>
  </Inspector>
}

function StaticContent() {
  return <div>Поле</div>
}

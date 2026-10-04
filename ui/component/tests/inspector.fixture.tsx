import Inspector from "@immersive-ui-component-widget/inspector"
import Panel from "@immersive-ui-component-surface/panel"
import uiIcons from "@immersive-ui-theme/icon-set"

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

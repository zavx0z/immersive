# Ноды

## Компоненты

`@zavx0z/immersive-nodes-node` — Cluster трёх самостоятельных представлений. Именованный API
сохраняет их реализации; общий `Zavx0zImmersiveNodesNode.Input` задаёт адрес, выбор, видимость
и активацию, `Zavx0zImmersiveNodesNode.Output` — JSX в Document приложения.
Каждый участник также предоставляет default-реализацию и собственный namespace
по точному публичному адресу ниже.

| Компонент             | Назначение                                                 | Импорт                  |
|-----------------------|------------------------------------------------------------|-------------------------|
| DiagramNode           | Описание на всю ноду; прямоугольник, овал или круг         | `@zavx0z/immersive-nodes-node-diagram`   |
| ParameterNode         | Корпус, шапка, действия, параметры и сокеты           | `@zavx0z/immersive-nodes-node-parameter` |
| ContentNode           | ParameterNode плюс произвольный компонент содержимого      | `@zavx0z/immersive-nodes-node-content`   |

Варианты просмотра и проверки использования принадлежат каждому компоненту:
[формы DiagramNode](diagram/spec/scenario.spec.tsx),
[параметры и раскрытие ParameterNode](parameter/spec/scenario.spec.tsx),
[области и слот ContentNode](content/spec/scenario.spec.tsx).
Эти же сценарии открываются в Storybook. Публичный компонент объявляется JSX
непосредственно в единственном аргументе headless.render; варианты и проверки
находятся рядом в scenario.spec.tsx.

Каталоги компонентов находятся непосредственно в корне `@zavx0z/immersive-nodes-node`.
Протокол DiagramNode с описанием полей находится в
[diagram/contract/index.ts](diagram/contract/index.ts) и доступен как
`Zavx0zImmersiveNodesNodeDiagram.Input` / `Output` из `@zavx0z/immersive-nodes-node-diagram`.
Сам DiagramNode остаётся в `diagram/index.tsx`.
Каждый содержит `index.tsx` и `spec/deps.spec.ts`: тест сравнивает полный
статический граф компонентов и нативных JSX-тегов через общий
[dependency fixture](../../fixtures/dependency-graph.ts). Он включает все ветви
исходников и транзитивные зависимости UI, а не только ближайших соседей.
Проверка входных данных и группировка самостоятельных сокетов ParameterNode
находятся в [parameter/src/prepare.ts](parameter/src/prepare.ts). Разметка и обработчики
компонента остаются в [parameter/index.tsx](parameter/index.tsx).

Универсальной визуальной Node нет. DiagramNode подходит разным диаграммам,
его название и реализация не привязаны к Mermaid. ContentNode принимает вложенный
JSX через безымянный `<slot>` непосредственно в собственной области:
назначение содержимого определяет приложение. Пустой слот оставляет область пустой.

Ширина ParameterNode и ContentNode задаётся обычным CSS через `style`:
`width`, `min-width`, `max-width`, `max-content` и `fit-content`.
Без переопределения нода имеет ширину 180px и минимум 100px.
`rect` задаёт только положение. Высота следует из содержимого; квадрат
ContentNode задаётся `aspect-ratio: 1`. Обе ноды используют `--shadow-md` общей темы.
[Проверки CSS-размеров](parameter/spec/sizing.spec.tsx) и
[квадратной области](content/spec/sizing.spec.tsx).

`collapsed` скрывает параметры, `contentVisible` управляет содержимым независимо.
Все четыре сочетания допустимы. Сокеты сохраняют элементы, адреса и соединения.
Содержимое скрывается без размонтирования. Квадратная область имеет сторону,
равную ширине ноды, и входит в её полную высоту.

Нода получает данные и обработчики. Значения принадлежат `@zavx0z/immersive-nodes-model-parameter-store`, topology — `@zavx0z/immersive-nodes-tree`;
визуальные компоненты не создают вторую модель. ContentNode составляет два
компонента, но остаётся одной нодой графа.

`@zavx0z/immersive-nodes-geometry-node-project` планирует геометрию снимка ноды,
`@zavx0z/immersive-nodes-geometry-node-plan` — размеры строк и сокетов по числовым входам.
`@zavx0z/immersive-nodes-geometry-node-metrics` хранит общие числовые размеры; эти владельцы не импортируют TSX.
Для графа передайте вычисление в `GraphEditor.layout` либо обновляйте готовую
раскладку и состояния снаружи вместе.

Геометрия не является визуальным компонентом. Общий прямоугольник происходит
из результата `Zavx0zImmersiveNodesLayout.Output`, а формы отдельных представлений — из их
собственных протоколов. Числовой план и ParameterNode используют общие
`@zavx0z/immersive-nodes-geometry-node-spacing` и `@zavx0z/immersive-nodes-geometry-node-socket-side`.

Компоненты используют общую UI-тему текущего Experience. Подключение темы
принадлежит приложению; пакет не создаёт отдельные Document, Canvas или Renderer.

[Поведение в тестах](tests/composition.test.ts) и
[смешанный граф](../view/tests/composition.fixture.tsx) проверяют состояния,
размеры, сохранение полей и содержимого, обычные и самостоятельные сокеты.

# Ноды

## Компоненты

Каждый компонент и его авторская TSX-разметка находятся в `index.tsx` собственного
каталога. Публичные импорты ниже разрешаются непосредственно в эти файлы.

| Компонент             | Назначение                                                 | Импорт                  |
|-----------------------|------------------------------------------------------------|-------------------------|
| DiagramNode           | Описание на всю ноду; прямоугольник, овал или круг         | `@nodes/node/diagram`   |
| ParameterNode         | Корпус, шапка, действия, параметры и сокеты           | `@nodes/node/parameter` |
| ContentNode           | ParameterNode плюс произвольный компонент содержимого      | `@nodes/node/content`   |
| ContentSurface        | Произвольное содержимое или изображение квадратной области | `@nodes/node/surface`   |

Варианты просмотра и проверки использования принадлежат каждому компоненту:
[формы DiagramNode](diagram/spec/scenario.spec.tsx),
[параметры и раскрытие ParameterNode](parameter/spec/scenario.spec.tsx),
[области ContentNode](content/spec/scenario.spec.tsx) и
[выбор содержимого ContentSurface](surface/spec/scenario.spec.tsx).
Эти же сценарии открываются в Storybook. Публичный компонент объявляется JSX
непосредственно в единственном аргументе headless.render; варианты и проверки
находятся рядом в scenario.spec.tsx.

Каталоги компонентов находятся непосредственно в корне `@nodes/node`.
Входной тип DiagramNodeProps с описанием полей находится в
[diagram/contract/input.ts](diagram/contract/input.ts) и импортируется через
`@nodes/node/diagram/contract/input`. Сам DiagramNode остаётся в `diagram/index.tsx`.
Каждый содержит `index.tsx` и `spec/deps.spec.ts`: тест сравнивает полный
статический граф компонентов и нативных JSX-тегов через общий
[dependency fixture](../../fixtures/dependency-graph.ts). Он включает все ветви
исходников и транзитивные зависимости UI, а не только ближайших соседей.
Проверка входных данных и группировка самостоятельных сокетов ParameterNode
находятся в [parameter/src/prepare.ts](parameter/src/prepare.ts). Разметка и обработчики
компонента остаются в [parameter/index.tsx](parameter/index.tsx).

Универсальной визуальной Node нет. DiagramNode подходит разным диаграммам,
его название и реализация не привязаны к Mermaid. ContentNode принимает вложенный
JSX через безымянный `<slot>` и передаёт его ContentSurface:
назначение содержимого определяет приложение. Содержимое не ограничено картинкой.

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

Нода получает данные и обработчики. Значения и их Stores принадлежат `@nodes/tree`;
визуальные компоненты не создают вторую модель. ContentNode составляет два
компонента, но остаётся одной нодой графа.

`planProjectedNodeGeometry` из `@nodes/node/geometry` расширяет действующий
числовой расчёт с учётом обоих состояний. Низкоуровневый `@nodes/node/metrics`
не импортирует TSX. Для графа передайте вычисление в `GraphEditor.layout` либо
обновляйте готовую раскладку и состояния снаружи вместе.

Геометрия не является визуальным компонентом. Общий план находится в
[shared/geometry.ts](shared/geometry.ts), числовые метрики — в
[shared/metrics.ts](shared/metrics.ts). Публичные импорты `./geometry` и `./metrics`
сохранены. Общие `NodeRect`, `NodePreviewImage` и договоры props принадлежат
[shared/contracts.ts](shared/contracts.ts); прежний экспорт `NodePreviewImage`
из `@nodes/node/content` также сохранён. Числовой план и ParameterNode
используют одни [правила отступов и сторон сокетов](shared/parameter-presentation.ts).

Компоненты используют общую UI-тему текущего Experience. Подключение темы
принадлежит приложению; пакет не создаёт отдельные Document, Canvas или Renderer.

[Поведение в тестах](tests/composition.test.ts) и
[смешанный граф](../view/tests/composition.fixture.tsx) проверяют состояния,
размеры, сохранение полей и содержимого, обычные и самостоятельные сокеты.

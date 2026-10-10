# DOM

`@zavx0z/immersive-dom` — семантическая модель документа Immersive. Пакет хранит элементы,
текст, атрибуты, отношения дерева и состояние взаимодействия, с которыми
работают компоненты, Renderer и Browser.

## Ответственность

- Document создаёт узлы и определяет принадлежность элементов одному документу.
- Node и Element поддерживают изменение дерева, атрибуты и поиск элементов.
- EventTarget и классы событий обеспечивают обработчики и распространение событий.
- HTML-элементы хранят фокус, состояние полей и запрошенную прокрутку.
- Range и Selection описывают выделение через узлы и текстовые смещения.
- Реестры stylesheet и уведомления об изменениях связывают документ
  с компиляцией, компонентами и отрисовкой.

DOM не вычисляет CSS-раскладку и не рисует в GPU. Renderer получает документ
и вычисляет его представление; Browser организует Canvas, ввод и кадры
приложения. Дерево DOM остаётся общим для Display, HUD и пространственной сцены.

## Публичные точки входа

`createElement("video")` возвращает semantic `HTMLVideoElement` с `srcObject`,
`play()`/`pause()` и состоянием декодирования. Декодер принадлежит Browser:
[контракт видео](../browser/video.md).

`requestFullscreen()`, `fullscreenElement`, `exitFullscreen()` и события
полноэкранного режима связывают semantic элемент с native Browser host:
[контракт fullscreen](../browser/fullscreen.md).

`DragEvent` наследует `MouseEvent`; `DataTransfer` обслуживает строки clipboard
и файлы входящего drag-and-drop. Файлы доступны через readonly `files`
с `length`, индексами, `item()` и итерацией в lifecycle события.
[Полный договор Browser](../browser/drag-and-drop.md).

Основной импорт — `@zavx0z/immersive-dom`: Document, элементы, события и работа с деревом.
Отдельные публичные пути перечислены в `package.json#exports`, включая
`@zavx0z/immersive-dom/display`, `@zavx0z/immersive-dom/range` и `@zavx0z/immersive-dom/selection`.

Display является элементом этого документа. Его физические размеры задаются
атрибутами, разрешение — CSS, а вычисленные параметры публикуются платформой.
Подробное описание находится в TSDoc модуля `display/index.ts` и документации
его публичных объявлений.

## Размер и положение элемента

`element.getBoundingClientRect()` возвращает новый `DOMRect`: `x`, `y`,
`width`, `height`, `top`, `right`, `bottom`, `left`. Это рамка элемента в
CSS-пикселях относительно viewport; она включает padding и border, учитывает
прокрутку и поддерживаемые преобразования. Margin и тень в размер не входят.
Изменение полученного прямоугольника не меняет элемент.

```ts
const rect = element.getBoundingClientRect()
const width = rect.width
const height = rect.height
```

Метод определён на Element, поэтому доступен и у HTMLElement. Геометрию
вычисляет HTML Renderer; Browser переводит её в координаты viewport Canvas.
Чтение синхронно обновляет грязную раскладку, но не запускает GPU-рисование.
После изменения текста, CSS или переноса между HUD и Display следующий вызов
получает актуальную геометрию того же элемента. Отсоединённый элемент, элемент
без Renderer или без layout-бокса (`display:none`) возвращает нулевой прямоугольник.
`visibility:hidden` сохраняет геометрию. Clipping не обрезает возвращаемую рамку.

`DOMRect`, `DOMRectReadOnly` и `DOMRectInit` доступны из основного импорта.
`@zavx0z/immersive-dom/geometry` содержит также подключение поставщика геометрии для
Renderer: один активный поставщик на projection root, освобождаемый при dispose.
При вложенных регистрациях используется ближайший предок.

Контракт соответствует [алгоритму CSSOM View](https://drafts.csswg.org/cssom-view/#dom-element-getboundingclientrect)
в пределах поддерживаемой CSS-раскладки Renderer. Он не добавляет новые виды
CSS transforms, SVG-геометрию или методы `getClientRects`/`offsetWidth`/`clientWidth`.
Экранный размер после масштабирования нельзя напрямую считать исходным размером
ноды для раскладки графа.

Поведенческие примеры: [DOM](tests/geometry.test.ts),
[HTML Renderer](../renderer/html/tests/bounding-client-rect.test.ts),
[перенос HUD ↔ Display](../browser/tests/projection-input.test.ts).

## Измерение до показа

`Element.getLayoutRect(relativeTo?)` и `readElementLayoutRect` возвращают
дробный `DOMRectReadOnly | null` до CSS transforms и Browser projection.
`observeElementLayout` из `@zavx0z/immersive-dom/geometry` доставляет изменение рамки
перед кадром; подписку можно установить в первом `useLayoutEffect`, когда
provider ещё не готов. Browser завершает вызванные callback обновления
компонентов до GPU submission. `visibility:hidden` сохраняет измеряемый бокс.

Обычный авторский `HTMLElement` ref подходит напрямую. Расширение браузерного
`Element` и runtime-проверка semantic объекта принадлежат `geometry.ts`.
Компоненты не импортируют implementation classes и не приводят refs к ним.
Расширение относится к профилю Immersive; настоящий native DOM не изменяется.

[Полный договор, координаты, ограничения и evidence](layout-geometry.md).

## Имена native factories и Custom Elements

Document сохраняет встроенные элементы и явно переданные elementFactories.
Автономный Custom Element не подменяет эти фабрики. Registry.define отклоняет
имя, занятое native factory любого связанного Document, с NotSupportedError.
Подключение заранее заполненного registry к Document с такой коллизией также
отклоняется. Таким образом registry.get(name) не обещает constructor, который
Document.createElement(name) молча обходит. Имена пространственных примитивов
не переименовываются; пользовательские x-pane/x-button остаются автономными.

## HTML fragment и innerHTML

Строковое HTML-авторство и Template используют один принадлежащий DOM parser.
`parseFragment(document, source, contextElement?)` синхронно возвращает
отсоединённый DocumentFragment того же Document. По умолчанию используется HTML
body context; явный contextElement должен принадлежать этому Document. Parser
сохраняет HTML-атрибуты, текст, комментарии, декодирует named/numeric entities
и учитывает HTML void/raw-text/RCDATA и контекст таблицы или select.
HTML nonvoid теги, включая spatial/custom элементы, закрываются явно;
`<viewpoint/>` не является XML/JSX self-closing формой. Whitespace остаётся
Text nodes; допустимость такого ребёнка проверяет его semantic владелец.

`Element.innerHTML` читает только HTML-сериализацию детей. Присваивание строки
(или null как пустой строки) выполняет parse и replaceChildren одной существующей
Document.transaction. Тот же Document.createElement создаёт базовые и custom
элементы; атрибуты, connect/disconnect и реакции следуют обычному DOM lifecycle.
Пространственные и прочие ограничения детей сохраняются: строковая форма
не обходит проверки дерева. Scripts и строковые event attributes остаются данными;
DOM не выполняет JavaScript из HTML.

`parseFragmentSource(source, contextTagName?)` возвращает readonly синтаксическую
форму element `{type, name, attrs, children}`, text/comment `{type, value}`.
Значения атрибутов и текста уже entity-decoded. Template кэширует эту форму для
своих bindings, не создавая дополнительный semantic Document и не вызывая
custom constructors ради blueprint. Parser не зависит от Template, Component
или JSX и не вызывается структурными createElement/append операциями.

Этот профиль не реализует HTMLTemplateElement.content, SVG/MathML namespaces,
Shadow DOM, загрузку ресурсов или исполнение scripts. Namespace/element,
которые нельзя честно представить поддержанными DOM nodes, отклоняются до
изменения целевого Element. Синтаксическое восстановление некорректного HTML
принадлежит общему parser; ограничения semantic DOM проверяет владелец дерева.

## Документация и проверки

Этот README описывает пакет целиком. Модульный контракт Display находится
в TSDoc `display/index.ts`.

Проверки общего DOM находятся в `tests`, проверки Display — в `display/tests`.
Команда `bun run check` из директории пакета выполняет проверку типов и тесты.
Состояние прохождения тестов относится к конкретному запуску и версии кода.

Общее устройство приложения описано в [требованиях Immersive](../PROJECT.md).

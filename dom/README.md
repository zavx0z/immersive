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

## Сгенерированные DOM-компоненты

Целевой договор авторства и единого состояния принадлежит
[PROJECT.md](../PROJECT.md#авторство-и-подключение-приложения). Ниже описаны
реализованные операции этого DOM-владельца.

DOMGroup — отдельное insertion value, не Node и не подмена DocumentFragment.
Его фактический диапазон ограничен двумя Comment. parent.childNodes содержит
только настоящие Nodes; group.nodes читает узлы между границами, insertionNodes —
весь диапазон вместе с Comments. nextSibling/previousSibling читают внешних соседей
диапазона. append,
insertBefore и replaceChildren принимают группу целиком; moveTo переносит её,
remove отсоединяет, сохраняя содержимое для повторной вставки. Граничные Comments
не являются wrapper Elements, layout или event-bubbling parent. Удаление
отдельной границы вручную нарушает диапазон и не восстанавливается скрытым деревом.
`replaceDomRangeContent(start,end,content)` меняет только содержимое между реальными
границами после единого native preflight; окружающие siblings и границы сохраняются.
Он принимает Nodes/Groups/строки, не construction descriptors и не component state.

observeConnection(Node|DOMGroup, callbacks) возвращает disposable connection scope.
При завершении внешней Document.transaction он сравнивает окончательные Document
и connectedness. Same-Document reparent не вызывает disconnect/connect; настоящее
отсоединение вызывает disconnected, повторная вставка connected. При adoption
порядок — disconnected старого подключения, adopted(oldDoc,newDoc), connected нового.
Регистрация на уже подключённом объекте доставляется на следующем commit.
Scope.dispose прекращает наблюдение и завершает действующее подключение один раз.
Scopes обходят только отмеченные ветви; отдельного mutation subscriber на компонент нет.
Custom Element reactions и scopes используют один индекс интересов дерева и одну
очередь lifecycle. Нативные CE callbacks сохраняют порядок DOM-операций; scopes
сравнивают итоговое подключение после этих callbacks. Перенос подключённого
поддерева внутри Document сохраняет scopes без обхода всех наблюдаемых потомков.
Тот же scope принимает точные списки `attributes` и `properties` для Node и
`changed()` callback. Он наблюдает native attribute writes и записываемые DOM
property changes, включая dirty input value/checked, без обхода потомков или
mutation subscriber. Изменения объединяются одной transaction и доставляются
до Document tasks; они наблюдаются и у отсоединённого Node. `suppressChanges(fn)`
исключает записи внутри fn только для этого scope, сохраняя внешние наблюдения
и уже ожидающее уведомление. DOMGroup не имеет native attributes/properties.
Нативные projections раскрываются у DOM-владельца: input value уведомляет
valueAsNumber/valueAsDate, selection — selectionStart/End/Direction. Select
уведомляет value/selectedIndex при собственных setters, изменении selectedness
и состава options. Reflected имена, scroll, media и текстовые descendants
используют те же индекс и очередь; только наблюдение textContent/innerHTML
требует проверки цепочки фактических ancestors. Отдельного дерева зависимостей нет.
Уведомление projection не добавляет отсутствующий native accessor: набор
реализованных полей по-прежнему задаёт сам класс Element.

`nativePropertyForBinding(element,bindingName)` возвращает имя native поля только
когда существующий `propertyOperation` действительно пишет именно это поле
или его отражаемый атрибут; иначе возвращает null. Наличие произвольного setter
не доказывает этот транспорт. Например, imperative input.valueAsNumber
наблюдается как native property, но обычный author binding этого имени пока
не является native valueAsNumber binding. Compiler использует этот договор
вместо собственной копии DOM reflection/channel maps.
Внешний native owner объявляет зависимости своих полей через
`defineDOMPropertyAttributes(ConstructorOrPrototype, declarations)`. Metadata
копируется immutably, наследуется по настоящему prototype chain и используется
при создании точного индекса scope. Она не создаёт поля или setters.
После неатрибутной записи owner вызывает `notifyDOMPropertyChange(node,name)`
внутри своей Document.transaction. Произвольный сторонний setter без metadata
или такого уведомления автоматически наблюдаемым не становится. Имена и
semantics полей расширения остаются у его владельца.

Document.enqueueTask(callback) объединяет callbacks по identity. cancelTask снимает
ожидающий callback; flushTasks синхронно завершает общую очередь. Внешняя transaction
завершает tasks и connection reactions до публикации stylesheet/mutation/state
снимков. Вне transaction используется одна microtask на Document. Повторные
callbacks обслуживаются до устойчивости с ограничением числа проходов; ошибка
одного callback не пропускает cleanup остальных. Это очередь DOM work, а не
component renderer. Browser использует её перед своим существующим кадром.
`flushTasks` внутри открытой transaction сохраняет её границу: reactions и
tasks завершаются при внешнем commit. Он не запускает layout до подключения
новых узлов и не пытается опустошить ещё открытый CE reaction stack.
Node.dispatchEvent объединяет DOM tasks и публикацию изменений до возврата из
dispatch, включая императивные beforeinput listeners. При этом отдельные
setAttribute и другие CEReactions доставляют нативные callbacks до следующей
инструкции listener. После общего connection drain tasks могут читать refs всех
подключённых потомков; отдельной lifecycle-фазы для layout в DOM нет.

`validateDomNodes(document,nodes,receivingNode?)` проверяет принадлежность,
повторы и цикл фактических узлов до размещения. `captureDomOrigins(document,values)`
запоминает родителей, соседей и фокус raw Nodes, Fragment и полных DOMGroup
диапазонов; restore возвращает их в исходное дерево, restoreFocus повторяет
восстановление фокуса после размещения прежнего диапазона. В construction data
обходится только content; props/context и constructors не исполняются.
Template и сгенерированный код используют эти же физические операции.
Неизменившийся диапазон не переподключается и не публикует childList mutation.

Существующие compiled stylesheet leases сохраняют одного владельца в Document
и immutable optional source `{kind:"authored-css",moduleId,componentName,cssText}`.
Один id обязан иметь одинаковые CSS и provenance во всех действующих leases.
Чтение stylesheet snapshot внутри transaction возвращает уже действующий набор:
layout effects не ждут публикации подписчикам. Snapshot immutable и сохраняет
identity между изменениями. Подписчики получают итоговый изменившийся набор
после commit; промежуточные reads не публикуют события. Revision отражает
прочитанные состояния, поэтому уведомления могут пропускать промежуточные revisions.
Nominal DOMComponentConstructor описывает только готовый constructor и generated
methods; marker не запускает lifecycle и не является runtime adapter. Group не
регистрируется как Custom Element; optional CE относится к самому фактическому
Element, без дополнительного host.

`createDomRoot(container)` допускает один живой root каждого Document, Element
или DocumentFragment; разные контейнеры одного Document независимы. unmount
снимает владение даже при ошибке cleanup. readonly `root.current` возвращает
сам фактический Element или DOMGroup, а не описание или снимок. Его можно
переносить обычными DOM-операциями. `root.moveTo(parent,before?)` переносит тот
же объект целиком внутри Document; новый render с другим constructor/key
заменяет его в фактическом текущем месте, сохраняя окружающих siblings.
Projection не становится новым root container. При staging необходимо
перенести весь Fragment или `root.current`: извлечение одного выбранного
Element из DOMGroup оставляет границы и соседей на прежнем месте.

### Custom Elements с фактическим HTML root

Один и тот же HTML subclass можно использовать императивно и зарегистрировать
`registry.define("x-counter", Counter, {extends:"button"})`. Тогда
`document.createElement("button", {is:"x-counter"})` и HTML
`<button is="x-counter"></button>` создают тот же класс и фактический button,
без автономного wrapper. `is` фиксируется при создании: изменение атрибута после
создания не превращает обычный button в custom element. Имя `x-counter` само
по себе не создаёт customized button. Registry сохраняет изоляцию Document. Creation option хранит внутренний is value,
не создаёт DOM-атрибут; HTML serialization отражает его при отсутствии атрибута,
согласно [DOM create element](https://dom.spec.whatwg.org/#concept-create-element)
и [HTML custom element](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-core-concepts).

Customized built-ins ограничены поддержанными HTML elements; Space, HUD,
примитивы внешней factory и DOMGroup не являются HTML built-ins. Constructor
получает Document; native HTMLElement использует текущий construction context.
Как и у автономных CE, constructor при createElement не добавляет attrs/children;
сгенерированный класс откладывает построение до явных props/content или connection.
Поздний upgrade сохраняет Node, native input/selection/option/media state, фокус
и дочерние Nodes. Новый пользовательский class state инициализируется один раз;
core не исполняет props, hooks или component bindings.

`retainDOMContent(document, content, allowedSlotNames?)` создаёт immutable snapshot
конкретного slot map. Fragment раскрывается в readonly Node array в момент
назначения; новый map с уже consumed Fragment получает пустой массив. Nodes и
DOMGroup не клонируются; nested fixed arrays и construction content получают
свои снимки. Проверяются Document, повторные Nodes, циклы и разрешённые имена
слотов. Construction сохраняется данными `{type,props,key,content,context}`;
helper не вызывает constructor, update, hooks или bindings. Props/context
остаются теми же значениями, без обхода пользовательских данных. Кэша Fragment
между назначениями или получателями нет; retained snapshot хранит сам получатель.

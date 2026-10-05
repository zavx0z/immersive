# Внешний drag-and-drop

Browser слушает `dragenter`, `dragover`, `dragleave` и `drop` на единственном
native Canvas Experience. Общий input router выбирает содержимое HUD или
world-space Display тем же `pickInput` и hit-testing, что остальные события.
Пустые области проекций пропускают ввод к следующей проекции. Незанятое
пространство сцены не становится искусственной файловой целью.

HTML Renderer удерживает одну drag-цель для всего Document. При смене Element
он доставляет bubbling `dragleave` и `dragenter` с `relatedTarget`, затем
`dragover` или `drop`. `dragenter`, `dragover` и `drop` допускают отмену;
`dragleave` неотменяем. Same-Document перенос того же Element между HUD и
Display сохраняет цель и обработчики. Удаление проекции, выход из Canvas и
dispose завершают lifecycle; dispose снимает native listeners.

Авторские обработчики используют стандартные типы `DragEvent` и `File` из
`lib.dom`. `event.dataTransfer.files` предоставляет readonly FileList-подобный
список: `length`, индексы, `item()` и итерацию. В `dragover` файлы защищены:
список пуст, но `types` содержит native marker `Files`. В `drop` доступны
исходные native File и строки. Входящий payload не допускает `setData` или
изменения `effectAllowed`; обработчик может выбрать `dropEffect`.

`preventDefault()` semantic события отменяет соответствующий native default.
Browser переносит выбранный `dropEffect` обратно в native DataTransfer.
Без отмены приложением Browser не поглощает drop.

После синхронной доставки каждого native события Browser очищает semantic
payload, включая ранее полученную ссылку на FileList. Для асинхронного
чтения обработчик намеренно сохраняет файлы внутри события, например через
`Array.from(event.dataTransfer.files)`, и далее владеет их обработкой.
Платформа не удерживает native DragEvent, DataTransfer или файлы между событиями.
Строковый clipboard продолжает использовать свой прежний контракт.

Этот договор покрывает входящий native drag-and-drop. Создание исходящего
native drag, `DataTransfer.items`, `setDragImage` и file clipboard не входят
в него.

Проверки: [DOM payload и событие](../dom/tests/drag-event.test.ts),
[Renderer lifecycle](../renderer/html/tests/drag.test.ts),
[native bridge, hit-routing и перенос HUD/Display](tests/projection-input.test.ts).
Последние проверки подменяют GPU submission, scheduling и native Canvas
transport, сохраняя реальный CPU layout, ray projection hit, semantic dispatch
и native File. Проверка файлового жеста в браузере выполняется отдельно.

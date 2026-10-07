# Полноэкранное HTML-содержимое

`element.requestFullscreen()` запрашивает полноэкранное представление
подключённого HTML-содержимого. `document.fullscreenElement` возвращает тот же
semantic Element, `document.fullscreenEnabled` отражает возможность native host,
а `document.exitFullscreen()` возвращает прежнее представление. Методы возвращают
Promise; отказ native браузера передаётся вызывающему коду и через
`fullscreenerror`. Для запроса обычно требуется действие пользователя.

Browser переводит существующий native Canvas в fullscreen. В Space выбранное
содержимое получает экранную проекцию того же Document и Engine Renderer.
Дерево не переносится и не монтируется заново: сохраняются Element, listeners,
component state, MediaStream и decoder. Ввод направляется в полноэкранную
проекцию; содержимое позади неё не получает pointer и wheel. Геометрия элемента
и существующий handle его Display/HUD следуют активной экранной проекции.

HTML Renderer использует viewport как containing block полноэкранного корня,
освобождая его от clipping и transform прежних предков. Селектор `:fullscreen`
доступен в CSS, `matches` и `querySelector`. Автор управляет содержимым и
`object-fit` обычным CSS. Полноэкранный корень получает размер viewport и нулевые
внешние отступы. Смена размера Canvas пересчитывает ту же проекцию.

Esc, native выход, `exitFullscreen()`, удаление элемента и unmount освобождают
полноэкранное представление. `fullscreenchange` сообщает изменение semantic
Document. Незавершённый запрос удалённого элемента не может позднее вернуть
fullscreen. Same-Document reparent в одной transaction сохраняет режим.

В пространственном приложении запрос относится к HTML-содержимому внутри
Display/HUD, а не к переустройству самого пространственного Display. Отдельные
Canvas, Documents, копии элементов и потребительские циклы рисования не нужны.

Проверки: [DOM](../dom/tests/fullscreen.test.ts),
[layout](../renderer/html/tests/fullscreen.test.ts),
[проекции и ввод](tests/projection-input.test.ts).

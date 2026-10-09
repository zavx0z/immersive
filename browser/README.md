# Подключение приложения

Видео и MediaStream используют semantic `<video>` и общий цикл кадров:
[контракт и проверки](video.md).

Полноэкранное HTML-содержимое сохраняет тот же Document, Canvas и медиасессию:
[контракт и проверки](fullscreen.md).

Входящий файловый drag-and-drop использует общий выбор цели и стандартные
`DragEvent.dataTransfer.files`: [контракт и проверки](drag-and-drop.md).

Публичный запуск следует React-shaped контракту createRoot/render/unmount.

```tsx
import {createRoot} from "@zavx0z/immersive-browser"
import {App} from "./app.tsx"

const root = createRoot(canvas)
root.render(<App />)
```

Повторный render обновляет существующее дерево и сохраняет состояние по template/key.
render(null) очищает содержимое; после unmount нужен новый createRoot.
Template compiler компилирует JSX в ComponentValue. Component монтирует App
в body одного semantic Document. App объявляет единственные Space и ViewPoint.

В компоненте свободное имя `document` привязано Template к тому же semantic
Document; window.document и код подключения страницы остаются native.

App может вернуть Fragment со stylesheet links и единственным Space:

```tsx
function App() {
  return (
    <>
      <link
        rel="stylesheet"
        href="/themes/dark.css"
      />
      <space frameloop="demand">
        <viewpoint />
        <hud>
          <Toolbar />
        </hud>
      </space>
    </>
  )
}
```

Явные links задают все author stylesheets. Только без них Browser загружает
`./theme.css`, предоставленный сборкой приложения. Подробности: [тема](theme.md).
Default font читается из `<meta name="engine-default-font">` native страницы.
CSS выбирает family/weight/style; готовые дополнительные font faces принадлежат
специальному API внешнего окружения `@zavx0z/immersive-browser/integration`.

createRoot резервирует native страницу/Canvas. render возвращает void и запускает
подготовку ресурсов; `onUncaughtError` получает ошибки запуска. Unmount отменяет
подготовку и освобождает ресурсы. Если GPU уже инициализируется, Canvas остаётся
занят до завершения cleanup этой операции; старый запуск не может повредить новый.
Для тестов и внешних инструментов `inspectRoot(root).whenReady()` из
`@zavx0z/immersive-browser/diagnostics` ожидает кадр последнего render и возвращает
диагностику существующего приложения. Обычному App ожидание не требуется.

Координаты сцены — мм в правой системе Z-up. Размеры CSS и viewport — CSS px;
Физические размеры `<display>` задаются атрибутами `width` и `height` в мм,
CSS `width` и `height` задают разрешение в пикселях. Плотность `dpi` вычисляется
по обеим осям. Пространственные преобразования задаются CSS.
Browser вычисляет масштаб проекции по [контракту Display](../dom/display/README.md).
Фиксированные соседние компоненты не требуют key; динамические списки требуют
стабильных ключей для перестановки без потери состояния.

`presentation.input` принимает координаты клиента browser window. Его pointer
и wheel операции проходят тот же выбор получателя, что native события Canvas.
Для диагностики `getProjection(owner).readFrame()` читает существующий кадр,
а `.projectPoint({x, y})` переводит logical point Display/HUD в client coordinates.
Эти операции не отправляют события напрямую в выбранную проекцию.

Semantic `setPointerCapture` имеет приоритет над ранее начатым default-жестом
выделения. Browser сохраняет native capture Canvas и проекцию, а Renderer
передаёт события захватившему Element того же Document. Перед каждым шагом
автоскролла общий frame loop проверяет актуальное владение выделением: capture,
установленный из `useFrame`, прекращает автоскролл уже в этом кадре без ожидания
следующего pointermove. Отпускание, отмена, удаление проекции и unmount очищают
состояние; прежний жест не восстанавливается после release capture.

Нативный курсор Canvas следует `cursor` элемента, выбранного тем же hit/projection
маршрутом, что и ввод. Поддержка ключевых слов и наследования принадлежит
[HTML Renderer](../renderer/html/cursor.md). Изменение CSS при неподвижном
указателе обновляет курсор в общем кадре. При semantic capture явный cursor
захватившего элемента имеет приоритет; его `auto` сохраняет cursor исходной
зоны жеста. Поэтому resize не теряет направление при capture родительской
оболочки, а `grab` может перейти в `grabbing` без движения мыши.
Touch не заменяет курсор мыши/пера. Уход без capture, отмена жеста, отсутствие
попадания и unmount возвращают исходный cursor нативного Canvas. `auto` также
делегирует выбор этому исходному оформлению host.

Presentation — диагностика существующего приложения. Root предоставляет render/unmount. В semantic-дереве нет отдельного
Root-компонента или второго Space. Правила владельцев заданы в
[PROJECT.md](../PROJECT.md).

`<display>` и `<hud>` работают без `id`: регистрация, ввод и `getProjection(element)`
используют сам Element. Атрибут `id` можно задать для своих CSS-селекторов или
поиска. Его изменение сохраняет Renderer, подписки и захват указателя.
Mesh, Group, Geometry, Material, Asset и Animation также удерживаются по Element;
авторские имена не становятся внутренними ключами сцены.

`useSpace(state => state.size)` получает размер Canvas в CSS px уже при первом
выполнении компонента. Селектор сравнивается через Object.is; изменения других
данных не выполняют компонент повторно. Размер публикуется до расчёта кадра.

`useFrame((state, delta) => …)` вызывается перед общим кадром; delta задаётся
в секундах. Подписка снимается при размонтировании. Режим задаётся prop Space.frameloop. В режиме demand кадры
запрашиваются по изменениям или через `state.invalidate()`; always используется
для непрерывной анимации. Все проекции обслуживает один планировщик.

Ошибка кадра останавливает автоматические повторные попытки и сообщает причину
один раз: поток данных и `invalidate()` не создают бесконечный цикл ошибок.
Осознанный новый pointer-down или изменение размера viewport разрешают новую
попытку. Начальная ошибка запуска передаётся в onUncaughtError и отклоняет diagnostic whenReady, а не
скрытым фоновым перезапуском.

Pinch трекпада (`ctrl` + wheel) меняет разрешённый ViewPoint даже над содержимым
Display/HUD. Общий input lifecycle сохраняет получателя и точку приближения
на время непрерывного жеста; пауза более 150 мс или обычное wheel завершают его.
Обычное wheel над декоративным содержимым Display панорамирует Space, включая
доступные через tabindex подписи и рамки. Контролы, editable-содержимое и
scrollports сохраняют собственный ввод; исчерпанная прокрутка не передаётся Space.
Semantic wheel с preventDefault также сохраняет владение UI. Жест панорамирования
удерживает один ViewPoint до паузы 150 мс, даже когда движущийся UI оказывается
под неподвижным указателем. Заморозка ViewPoint завершает владение жестом.
Мелкие pinch deltas сохраняют свой масштаб независимо от количества событий;
anchor вычисляется в double без инверсии Float32 near/far-матрицы.

Display/HUD запрашивают обновление проекции только при изменениях своего дерева,
его предков и связанного input state; общие stylesheet изменения обновляют все
проекции. Перемещение ViewPoint требует общей презентации без повторного layout
независимых проекций.

`<viewpoint navigation="fly" flySpeed={20} />` явно выбирает свободное движение
через уровни: pinch перемещает eye и target вдоль удерживаемого cursor ray, на
20 мм за единицу delta. Default `orbit` сохраняет приближение к target. Controls
по-прежнему разрешают жесты; HUD и interactive UI сохраняют собственный ввод.

Публичная проекция Space предоставляет `rayForPoint(nativeClientXY)`,
`frustumPlanes(overscanCssPx)` и `fly(distanceMm, anchor?)`. Они используют
единственный ViewPoint; запросы видимости не требуют создания Display или
доступа к приватной математике Renderer. Шесть world planes направлены внутрь:
`normal·point + constant >= 0`. Автор viewer выбирает применение позы и clips
через публичные Engine helpers fitPoseForBounds/depthRangeForBounds.

`ViewPoint.controls` декларативно разрешает жесты в свободной области сцены.
Камеру можно получить через `ref={camera}`, где `camera` создан обычным `useRef`.
`camera.current.saveState()` сохраняет обзор, `dollyTo(600, {x: 0, y: 0, z: 900})`
приближает к заданной цели на 600 мм, `reset()` возвращает сохранённый обзор.
Команды мгновенные; все они работают с тем же semantic Element. Browser сам
запрашивает кадр после изменения Document. Положение не нужно переносить в
состояние компонента или читать из Document во время render: прежние spatial
props сохраняют результат жестов и команд. Изменённые props применяются как новые
значения. Это правило распространяется и на другие пространственные Elements.
Ось вверх всегда Z, горизонт не переворачивается, наклон orbit ограничен у полюсов.
Параметров up и переключения системы координат нет. Импорт glTF меняет только
саму модель: её внутренний корень переводит Y-up/метры в Z-up/миллиметры.

Специальный `browser/integration` принимает заимствованные native links для
внешних инструментов. Они остаются у создавшего их окружения после unmount.

## Размеры элементов в viewport

`Element.getBoundingClientRect()` читает border-box из HTML Renderer.
Browser переводит его углы в CSS-пиксели нативного viewport: для HUD учитывает
положение и размер Canvas, для Display — ещё положение плоскости и камеру.
Метод возвращает охватывающий прямоугольник в этих координатах, без clipping.
Чтение не создаёт новый Document или Canvas и не требует GPU-кадра.

При same-Document переносе между HUD и Display сохраняется сам элемент;
следующее чтение использует геометрию нового projection root. После удаления
проекции её поставщик геометрии освобождается. Если плоскость невозможно
спроецировать (точка на плоскости камеры), прямоугольник отсутствует и DOM
возвращает нулевой результат.

[Общий контракт](../dom/README.md#размер-и-положение-элемента) и
[проверка переноса между проекциями](tests/projection-input.test.ts).


## Измерение перед первым показом

Первый `useLayoutEffect` получает подключённые refs, но geometry provider
ещё может отсутствовать. `observeElementLayout` из `@zavx0z/immersive-dom/geometry`
можно установить в этом эффекте: Browser подключает проекции и доставляет
измерение до первого GPU submission. Предварительный пустой кадр runtime
при запуске через Root не рисуется.

Перед GPU Browser завершает component updates из `useFrame` и layout observers,
повторяет чтение изменившейся геометрии до стабильности. Async расчёт не блокирует
общий frame loop: компонент держит свои элементы `visibility:hidden` до принятия
результата. Размеры доступны и во время скрытия. Бесконечная обратная связь
измерения останавливается ошибкой до показа после 32 изменяющих проходов.

[Координаты и полный договор DOM](../dom/layout-geometry.md),
[проверка первого и последующих кадров HUD/Display](tests/layout-measurement.test.ts).

Публичная проекция Display/HUD предоставляет `projectPoint(localCssXY)` и
`unprojectPoint(clientXY)`. Обратный метод пересекает текущий луч ViewPoint с
плоскостью Display и возвращает локальные CSS px даже вне прямоугольника;
при отсутствии пересечения возвращает `null`. Метод использует тот же владелец
проекции, Canvas, Space и кадр.

Пространственные объекты могут задать `hitTest` в мировых XYZ. Browser включает
ближайшее попадание в общее решение ввода: HUD перекрывает мировое содержимое,
Display и пространственный объект сравниваются по глубине. Semantic pointer
события, capture, bubbling click и cancellation используют тот же Document.
`readSpatialHit(event)` публичного Space API раскрывает адрес части объекта и
мировую точку, сохраняя обычный контракт события.

`root.getProjection(root.space).projectPoint(worldXYZ)` проецирует точку XYZ в мм
непосредственно в native client XY. Метод использует текущие матрицы ViewPoint и
границы Canvas, не требует существующего Display и не обходит его DOM. Точки за
камерой или вне near/far возвращают `null`; координаты вне экранных XY сохраняются,
чтобы приложение могло пересечь экранные bounds ещё не материализованного Repo.

Пространственная фабрика Material получает необязательный публичный
`XRMaterialProjectionContext`: разрешённый CSS color, opacity и запрошенные
через `Material.styleProperties` custom variables. Browser обновляет материалы
при изменении предков или stylesheet, сохраняя geometry и semantic identity.
Mesh, Group и Material принимают branded CssStyle обычным авторским способом.

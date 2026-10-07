# Видео в общем Experience

Обычный авторский `<video>` и `HTMLVideoElement` ref относятся к semantic
Document приложения. `srcObject` принимает браузерный MediaStream; `src`
подключает URL видео. `autoplay`, `defaultMuted`, `muted`, `playsInline`, `loop`,
`width` и `height` управляют тем же элементом. `play()` возвращает Promise
нативного запуска, `pause()` останавливает воспроизведение.

`paused`, `readyState`, `currentTime`, `videoWidth`, `videoHeight` и `error`
публикуются декодером Browser. Можно подписаться через `addEventListener` на
`loadedmetadata`, `loadeddata`, `canplay`, `playing`, `pause`, `waiting`,
`stalled`, `resize`, `timeupdate`, `ended`, `error` и `emptied`.

Browser удерживает один нативный video decoder на подключённый semantic
элемент. Этот decoder не вставляется в страницу. Его живой источник передаётся
WebGPU, который импортирует внешний texture в текущем GPU submission.
Browser сохраняет source lease до освобождения decoder, поэтому вытеснение
невидимого paint material из LRU не теряет источник потока.
`requestVideoFrameCallback` запрашивает общий кадр приложения; при отсутствии
этого API кадры запрашиваются по нативным media events, включая `timeupdate`.
Canvas, Document, проекции и frame loop остаются общими.

HTML Renderer вычисляет обычный CSS layout, clipping и `object-fit`. До
получения metadata intrinsic размер равен 300×150 px; после получения —
`videoWidth`×`videoHeight`. CSS и атрибуты размеров работают так же, как у img,
включая сохранение отношения сторон при одной заданной оси.

Смена источника, удаление элемента и unmount освобождают decoder, отменяют
frame callback и ожидающее `play()`, отзывают удержанные WebGPU источники.
Поток принадлежит вызывающему коду: Browser не вызывает `stop()` его tracks.
Перенос внутри того же Document в одной transaction сохраняет decoder.

Нативное разрешение воспроизведения и ошибки `play()` передаются вызывающему
коду. Video controls, poster, text tracks и audio-only элементы этим изменением
не реализованы. Headless проверяет semantic layout и paint contract; нативное
декодирование требует Browser.

Проверки: [DOM](../dom/tests/video.test.ts),
[Browser decoder lifecycle](tests/video-host.test.ts),
[HTML layout](../renderer/html/tests/video.test.ts),
[WebGPU source ownership](../webgpu/tests/texture-lifetime.test.ts).

# Полосы стекла, порядок Display и задержка Window

Исправления подготовлены после наблюдений в работающем Storybook. Старый sparse
Gaussian пропускал тонкие линии при уменьшении, а Window менял layout-координаты
и заново измерял всё содержимое при каждом pointer move.

## GPU: качество и стоимость фильтра

Compute area prefilter читает все покрытые pixels/MSAA samples, отдельно сохраняет
validity и использует workgroup reduction с 1/4/16/32 lanes. Gaussian H/V на
уменьшенной сетке больше не пропускает промежуточные texels. RGBA остаётся
premultiplied; более близкий World исключается до усреднения.

На старом shader σ16/period5 вертикальные линии давали диапазон 17–81, а новый
даёт 51–51; period8 горизонтальные линии раньше исчезали (0), теперь среднее32.
Расхождение при повороте на90°:44→1. ROI/full-frame difference0, утечка цвета
foreground0, ошибка premultiplied alpha0. Проверено155 quality frames.

| 2730×2176, σ16, холодный фильтр | До, median ms | После, median ms |
|---|---:|---:|
| HUD, 1 панель | 12.35 | 5.07 |
| HUD, 3 панели | 36.23 | 10.52 |
| World, 1 панель | 5.95 | 5.74 |
| World, 3 панели | 16.77 | 16.88 |

На1280×720 холодный World примерно на9% дороже; HUD примерно вдвое быстрее.
Это Filter.encode+queue completion, не время полной сцены и не FPS браузера.
8 warmup и16 samples; Intel HD630/Metal, MSAA4, ROI50%. Старый результат имеет
aliasing и не является эталоном качества. Промежуточный fragment area вариант
был существенно медленнее; в итог вошёл compute. Scratch30bytes/reducedpixel,
output cache по-прежнему ограничен32MiB. Готовый output пропускает compute и H/V.

Raw данные: [качество до](glass-sampling-quality-baseline.json),
[после](glass-sampling-quality-final.json),
[время до](glass-sampling-performance-final-baseline.json),
[после](glass-sampling-performance-final.json),
[параметры и p95](glass-sampling-summary.json).
Воспроизведение: `bun headless/fixtures/backdrop-sampling.ts benchmark`;
для базы — `BACKDROP_SAMPLING_BASELINE=1 BACKDROP_SAMPLING_REVISION=e0eb3cbc`.

## Перекрытие Display

Полные UI-группы поверхностей сортируются от дальней к ближней, с сохранением
внутреннего paint order. Raster и direct Display используют общий порядок.
Граница текущего composition root останавливает поиск владельца: внутренний
raster-проход сохраняет обычные World/optical Glass passes. Engine geometry
внутри Display не объявляется UI только из-за родителя; принудительный UI нужен
лишь rasterSurface, а HTML UI уже имеет собственный renderLayer.

Native fixture проверяет оба направления mixed raster/direct, обратный порядок
добавления, прозрачность, камеру сзади/возврат, UI z-index, foreground World,
backdrop и HUD. [До](display-order-before.json) дальний красный Display закрывал
ближний; [после](display-order-after.json) порядок соответствует глубине.
Пересекающиеся плоскости с циклическим перекрытием требуют отдельного per-pixel
compositor; сортировка центров эту задачу не решает.

## Перемещение Window

Window использует CSS transform вместо изменения left/top. Renderer допускает
быстрый путь custom properties только при доказанном отсутствии влияния на
layout/paint потомков; учитываются aliases, fallback, cycles и скрытые nodes.
Inherited environments обновляются без cascade и повторных измерений текста.
Неизвестные случаи возвращаются к обычному расчёту; имён Window в механизме нет.

| Строк в реальном compiled Window | До, median ms | После, median ms | Text measurements после |
|---|---:|---:|---:|
|10|5.29|1.18|0|
|100|24.39|2.36|0|
|500|124.01|9.94|0|

Это CPU-side elapsed реального pointer routing + component + layout, без GPU,
с детерминированным monospace measurer. 5 warmup/40 samples. При500 строках p95
после48.69ms: отсутствие редких пауз не утверждается. Прямой transform без Window
сохранён в raw как нижняя граница, а не как второй продуктовый вариант.
[Raw до](../../../../ui/component/surface/window/meta/research/2026-10-09/drag-before.json),
[после](../../../../ui/component/surface/window/meta/research/2026-10-09/drag-after.json).
Команда: `WINDOW_DRAG_OUTPUT=tmp/drag.json bun --preload ./headless/preload.ts ui/component/surface/window/test/drag-performance.fixture.tsx`.

Полные проверки: Renderer HTML355 pass; WebGPU261 pass; Window pointer/resize
38 pass. Остальные Window/activity/control scenarios42 pass,13 skip. Typecheck
Renderer HTML, Window, Headless и WebGPU прошли. Снимки и численные tests не
заменяют проверку после публикации в браузере; live-результат принадлежит
consumer-интеграции Storybook.

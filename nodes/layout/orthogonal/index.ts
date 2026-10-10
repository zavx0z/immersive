/**
Ортогональные связи между уже размещёнными карточками.

Быстрые gutter-кандидаты проверяются общим пространственным индексом. Сложные
связи используют общую ограниченную сетку видимости всех карточек. Для малых
полных наборов сохранён существующий routing solver без повторного placement.
Каждый принятый сегмент проверяется против всех карточек через индекс. Отказы
и исчерпание budget явны, небезопасный маршрут не публикуется. Связи могут
пересекаться между собой и разделять коридор. Frames не являются препятствиями.
DOM, layout, ViewPoint и перенос в мировые координаты остаются у потребителя.

@packageDocumentation
*/
export type {OrthogonalRoutingInput} from "./contract/input.ts"
export type {OrthogonalRoutingOutput} from "./contract/output.ts"
export {routeOrthogonal} from "./src/route.ts"

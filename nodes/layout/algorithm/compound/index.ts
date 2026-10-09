/**
Компактная числовая упаковка ограниченного рабочего набора внутри одного Display.

Использует общий LayoutNode: parentId задаёт контейнер, contentHeight резервирует
его собственную карточку или заголовок. Связи и viewport не влияют на упаковку.
Потребитель выбирает набор карточек и Frames до вызова; весь каталог не требуется.
Измерение, отображение и residency остаются у их владельцев.

@packageDocumentation
*/
export type {CompoundLayoutInput} from "./contract/input.ts"
export type {CompoundLayoutOutput} from "./contract/output.ts"
export {layoutCompound} from "./src/solve.ts"
export {CompoundLayoutError, type CompoundLayoutErrorCode} from "./src/error.ts"

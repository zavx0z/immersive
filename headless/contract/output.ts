import type {DOMConstruction, DOMComponentConstructor, Element} from "@zavx0z/immersive-dom"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {CapturedFrame} from "../native-canvas.ts"

/**
Результат {@link createHeadless}: один живой host с явным освобождением ресурсов.

Все GPU-операции host сериализуются. Методы принимают только элементы его
собственного `Document`; после `dispose` новые операции завершаются ошибкой.

@property render - Монтирует скомпилированный JSX и возвращает Element для чтения и снимка.
Для единственного Element это сам узел компонента, включая фрагмент вокруг него.
Для нескольких корней, отдельного текста или пустого
результата возвращается уже существующий host рабочей области; дополнительная
обёртка вокруг компонента не создаётся. Рабочая область имеет размеры Canvas. Отрисовка ожидает загрузку текстур;
ошибка загрузки отклоняет операцию, не выдавая прозрачную заглушку за готовый кадр.

@property renderComponent - Программно монтирует компонент с отдельно переданными props.
Сценарий компонента использует render с JSX непосредственно в месте вызова.

@property screenshot - Возвращает PNG по актуальному border-box элемента.
Без второго аргумента результатом служит `Buffer`; формат `image` возвращает `Bun.Image` того же снимка.

@property capture - Возвращает RGBA8 и PNG одного кадра по границам элемента.
Перед снимком применяет изменения компонента и ожидает ресурсы нового кадра.

@property dispose - Освобождает DOM root, layout, GPU-поверхность и устройство; повторный вызов безопасен.

@example
```tsx
import Typography from "@zavx0z/immersive-ui-component-typography"

const headless = createHeadless()
const element = await headless.render(
  <Typography
    text="Пример"
  />,
)
await headless.dispose()
```
*/
export interface Headless {
  render(value: JSX.Element | DOMConstruction<any>): Promise<Element>
  renderComponent<Props>(type: ((props: Props) => JSX.Element) | DOMComponentConstructor<Props>, props: Props): Promise<Element>
  screenshot(element: Element): Promise<Buffer>
  screenshot(element: Element, format: "image"): Promise<Bun.Image>
  capture(element: Element): Promise<CapturedFrame>
  dispose(): Promise<void>
}

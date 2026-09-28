import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {landscape, portrait} from "../../spec/fixture/image"
import {Typography} from "@zavx0z/ui/typography"
import {SurfaceFixture} from "./fixture"

describe.each([
  {name: "Горизонтальное изображение", props: {label: "Изображение в области", image: landscape}, images: 1, text: "", alt: "Прямоугольник и круг"},
  {name: "Вертикальное изображение", props: {label: "Вертикальный рисунок", image: portrait}, images: 1, text: "", alt: "Вертикальный рисунок"},
  {name: "Декоративное изображение", props: {label: "Декорация", image: {...landscape, alt: ""}}, images: 1, text: "", alt: ""},
  {name: "Авторский компонент", props: {label: "Авторское содержимое", image: landscape, children: <Typography text="Содержимое имеет приоритет" />}, images: 0, text: "Содержимое имеет приоритет", alt: null},
  {name: "Пустая область", props: {label: "Пустая область"}, images: 0, text: "", alt: null},
])("$name", async ({props, images, text, alt}) => {
  const headless = createHeadless({width: 320, height: 240})
  afterAll(() => headless.dispose())
  const result = await headless.render(SurfaceFixture, props)

  const surface = result

  test("Содержимое области", () => {
    expect({label: surface.getAttribute("aria-label"), images: [...surface.querySelectorAll("img")].filter(image => image.getBoundingClientRect().width > 0).length, text: surface.textContent},
      "Авторский компонент заменяет изображение; отсутствие обоих входов оставляет пустую область").toEqual({label: props.label, images, text})
  })
  test("Размер области", () => {
    const bounds = surface.getBoundingClientRect()
    expect({width: bounds.width, height: bounds.height}, "Поверхность занимает предоставленную родителем область").toEqual({width: 320, height: 240})
  })
  /** @remarks Изображение отсутствует в пустой области и при авторском children. */
  describe.skipIf(images === 0)("Свойства изображения", () => {
    test("Атрибуты и размеры", () => {
      const image = surface.querySelector("img")!
      const bounds = image.getBoundingClientRect()
      expect({src: image.getAttribute("src"), width: image.getAttribute("width"), height: image.getAttribute("height"), alt: image.getAttribute("alt"), area: [bounds.width, bounds.height]},
        "Обычный img сохраняет источник, исходные размеры и alt, занимая предоставленную область").toEqual({src: props.image!.src, width: String(props.image!.width), height: String(props.image!.height), alt, area: [320, 240]})
    })
  })
})

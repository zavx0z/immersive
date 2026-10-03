/** Каждый участник предоставляет пригодный для img.src SVG-документ. */
import {describe, expect, test} from "bun:test"
import {applyIcon, arrowDownIcon, arrowUpIcon, breakpointIcon, chevronDownIcon, chevronRightIcon, clearIcon, closeIcon, collapseAllIcon, iconSvg, databaseIcon, executionPointIcon, expandIcon, expandAllIcon, folderIcon, homeIcon, imageIcon, languageIcon, minusIcon, pickerIcon, pinIcon, plusIcon, resourceIcon, runIcon, searchIcon, selectOpenedItemIcon, settingsIcon, visibilityOnIcon} from "@ui-themes/icons"

describe.each([
  {name: "apply", props: {image: applyIcon}},
  {name: "arrow-down", props: {image: arrowDownIcon}},
  {name: "arrow-up", props: {image: arrowUpIcon}},
  {name: "breakpoint", props: {image: breakpointIcon}},
  {name: "chevron-down", props: {image: chevronDownIcon}},
  {name: "chevron-right", props: {image: chevronRightIcon}},
  {name: "clear", props: {image: clearIcon}},
  {name: "close", props: {image: closeIcon}},
  {name: "collapse-all", props: {image: collapseAllIcon}},
  {name: "compose", props: {image: iconSvg("<path d=\"M0 0L1 1\"/>")}},
  {name: "database", props: {image: databaseIcon}},
  {name: "execution-point", props: {image: executionPointIcon}},
  {name: "expand", props: {image: expandIcon}},
  {name: "expand-all", props: {image: expandAllIcon}},
  {name: "folder", props: {image: folderIcon}},
  {name: "home", props: {image: homeIcon}},
  {name: "image", props: {image: imageIcon}},
  {name: "language", props: {image: languageIcon}},
  {name: "minus", props: {image: minusIcon}},
  {name: "picker", props: {image: pickerIcon}},
  {name: "pin", props: {image: pinIcon}},
  {name: "plus", props: {image: plusIcon}},
  {name: "resource", props: {image: resourceIcon}},
  {name: "run", props: {image: runIcon}},
  {name: "search", props: {image: searchIcon}},
  {name: "select-opened-item", props: {image: selectOpenedItemIcon}},
  {name: "setting", props: {image: settingsIcon}},
  {name: "visibility-on", props: {image: visibilityOnIcon}},
])("$name", ({props}) => {
  test("Общий протокол изображения", () => {
    expect(props.image, "Ресурс предоставляет SVG data URL").toStartWith("data:image/svg+xml;charset=utf-8,")
    const svg = decodeURIComponent(props.image.slice(props.image.indexOf(",") + 1))
    expect(svg, "Декодированное содержимое является SVG-документом").toMatch(/^<svg\b[\s\S]*<\/svg>$/u)
  })
})

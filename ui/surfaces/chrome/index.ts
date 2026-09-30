/**
Область surfaces/chrome объединяет публичные возможности принадлежащих ей пакетов.
Именованный API сохраняет владельцев реализации и типов; область не запускает их жизненный цикл.

@packageDocumentation
*/
export {default as SurfaceBody} from "@ui-surfaces-chrome/body"
export type {SurfaceBodyProps} from "@ui-surfaces-chrome/body"
export {default as SurfaceButton} from "@ui-surfaces-chrome/button"
export type {SurfaceButtonProps} from "@ui-surfaces-chrome/button"
export {default as SurfaceHeader} from "@ui-surfaces-chrome/header"
export type {SurfaceHeaderProps} from "@ui-surfaces-chrome/header"
export {default as SurfaceNavigation} from "@ui-surfaces-chrome/navigation"
export type {SurfaceNavigationProps} from "@ui-surfaces-chrome/navigation"
export {default as SurfaceOwner} from "@ui-surfaces-chrome/owner"
export type {SurfaceOwnerProps} from "@ui-surfaces-chrome/owner"
export {default as SurfaceTitle} from "@ui-surfaces-chrome/title"
export type {SurfaceTitleProps} from "@ui-surfaces-chrome/title"
export {default as assertSurfaceActions} from "@ui-surfaces-chrome/assert-surface-actions"

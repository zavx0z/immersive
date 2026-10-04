/**
Именованный набор значков интерфейса.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiThemeIconSet as Contract} from "./contract"
export type {Zavx0zImmersiveUiThemeIconSet} from "./contract"
import {autoscrollSvg} from "./src/helpers.ts"
import {breakpointActiveSvg} from "./src/helpers.ts"
import {breakpointDisabledSvg} from "./src/helpers.ts"
import {breakpointMuteSvg} from "./src/helpers.ts"
import {chevronLeftSvg} from "./src/helpers.ts"
import {codexSvg} from "./src/helpers.ts"
import {collapseSvg} from "./src/helpers.ts"
import {copySvg} from "./src/helpers.ts"
import {debugExecutionPointSvg} from "./src/helpers.ts"
import {debugPauseSvg} from "./src/helpers.ts"
import {debugRestartSvg} from "./src/helpers.ts"
import {debugResumeSvg} from "./src/helpers.ts"
import {debugStepIntoSvg} from "./src/helpers.ts"
import {debugStepOutSvg} from "./src/helpers.ts"
import {debugStepOverSvg} from "./src/helpers.ts"
import {debugStopSvg} from "./src/helpers.ts"
import {deepseekSvg} from "./src/helpers.ts"
import {expertSvg} from "./src/helpers.ts"
import {fastSvg} from "./src/helpers.ts"
import {keyboardSvg} from "./src/helpers.ts"
import {logSvg} from "./src/helpers.ts"
import {manualSvg} from "./src/helpers.ts"
import {micSvg} from "./src/helpers.ts"
import {pauseSvg} from "./src/helpers.ts"
import {phoneSvg} from "./src/helpers.ts"
import {qwenSvg} from "./src/helpers.ts"
import {recognitionSvg} from "./src/helpers.ts"
import {restartSvg} from "./src/helpers.ts"
import {sendSvg} from "./src/helpers.ts"
import {stepIntoSvg} from "./src/helpers.ts"
import {stepOutSvg} from "./src/helpers.ts"
import {stepOverSvg} from "./src/helpers.ts"
import {stopSvg} from "./src/helpers.ts"
import {visibilityOffSvg} from "./src/helpers.ts"
import {zoomInSvg} from "./src/helpers.ts"
import {zoomOutSvg} from "./src/helpers.ts"
import applyIcon from "@zavx0z/immersive-ui-theme-icon-apply"
import arrowDownIcon from "@zavx0z/immersive-ui-theme-icon-arrow-down"
import arrowUpIcon from "@zavx0z/immersive-ui-theme-icon-arrow-up"
import chevronDownIcon from "@zavx0z/immersive-ui-theme-icon-chevron-down"
import chevronRightIcon from "@zavx0z/immersive-ui-theme-icon-chevron-right"
import clearIcon from "@zavx0z/immersive-ui-theme-icon-clear"
import closeIcon from "@zavx0z/immersive-ui-theme-icon-close"
import databaseIcon from "@zavx0z/immersive-ui-theme-icon-database"
import executionPointIcon from "@zavx0z/immersive-ui-theme-icon-execution-point"
import expandIcon from "@zavx0z/immersive-ui-theme-icon-expand"
import folderIcon from "@zavx0z/immersive-ui-theme-icon-folder"
import imageIcon from "@zavx0z/immersive-ui-theme-icon-image"
import languageIcon from "@zavx0z/immersive-ui-theme-icon-language"
import minusIcon from "@zavx0z/immersive-ui-theme-icon-minus"
import pickerIcon from "@zavx0z/immersive-ui-theme-icon-picker"
import pinIcon from "@zavx0z/immersive-ui-theme-icon-pin"
import plusIcon from "@zavx0z/immersive-ui-theme-icon-plus"
import resourceIcon from "@zavx0z/immersive-ui-theme-icon-resource"
import runIcon from "@zavx0z/immersive-ui-theme-icon-run"
import searchIcon from "@zavx0z/immersive-ui-theme-icon-search"
import settingsIcon from "@zavx0z/immersive-ui-theme-icon-setting"
import visibilityOnIcon from "@zavx0z/immersive-ui-theme-icon-visibility-on"
import breakpointIcon from "@zavx0z/immersive-ui-theme-icon-breakpoint"

const uiIcons: Contract.Output = {
  run: runIcon,
  resume: runIcon,
  restart: restartSvg,
  pause: pauseSvg,
  stop: stopSvg,
  debugResume: debugResumeSvg,
  debugPause: debugPauseSvg,
  debugStop: debugStopSvg,
  debugStepOver: debugStepOverSvg,
  debugStepInto: debugStepIntoSvg,
  debugStepOut: debugStepOutSvg,
  debugRestart: debugRestartSvg,
  debugExecutionPoint: debugExecutionPointSvg,
  close: closeIcon,
  stepOver: stepOverSvg,
  stepInto: stepIntoSvg,
  stepOut: stepOutSvg,
  log: logSvg,
  database: databaseIcon,
  codex: codexSvg,
  qwen: qwenSvg,
  deepseek: deepseekSvg,
  phone: phoneSvg,
  clear: clearIcon,
  autoscroll: autoscrollSvg,
  manual: manualSvg,
  settings: settingsIcon,
  apply: applyIcon,
  arrowDown: arrowDownIcon,
  arrowUp: arrowUpIcon,
  language: languageIcon,
  search: searchIcon,
  copy: copySvg,
  executionPoint: executionPointIcon,
  breakpoint: breakpointIcon,
  breakpointMute: breakpointMuteSvg,
  breakpointActive: breakpointActiveSvg,
  breakpointDisabled: breakpointDisabledSvg,
  expand: expandIcon,
  collapse: collapseSvg,
  plus: plusIcon,
  minus: minusIcon,
  chevronDown: chevronDownIcon,
  chevronLeft: chevronLeftSvg,
  chevronRight: chevronRightIcon,
  mic: micSvg,
  keyboard: keyboardSvg,
  send: sendSvg,
  image: imageIcon,
  fast: fastSvg,
  expert: expertSvg,
  recognition: recognitionSvg,
  eval: runIcon,
  zoomIn: zoomInSvg,
  zoomOut: zoomOutSvg,
  folder: folderIcon,
  resource: resourceIcon,
  picker: pickerIcon,
  pin: pinIcon,
  visibilityOn: visibilityOnIcon,
  visibilityOff: visibilityOffSvg,
} as const

export default uiIcons

/**
Именованный набор значков интерфейса.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiThemesIconsCollection as Contract} from "./contract"
export type {UiThemesIconsCollection} from "./contract"
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
import applyIcon from "@ui-themes-icons/apply"
import arrowDownIcon from "@ui-themes-icons/arrow-down"
import arrowUpIcon from "@ui-themes-icons/arrow-up"
import chevronDownIcon from "@ui-themes-icons/chevron-down"
import chevronRightIcon from "@ui-themes-icons/chevron-right"
import clearIcon from "@ui-themes-icons/clear"
import closeIcon from "@ui-themes-icons/close"
import databaseIcon from "@ui-themes-icons/database"
import executionPointIcon from "@ui-themes-icons/execution-point"
import expandIcon from "@ui-themes-icons/expand"
import folderIcon from "@ui-themes-icons/folder"
import imageIcon from "@ui-themes-icons/image"
import languageIcon from "@ui-themes-icons/language"
import minusIcon from "@ui-themes-icons/minus"
import pickerIcon from "@ui-themes-icons/picker"
import pinIcon from "@ui-themes-icons/pin"
import plusIcon from "@ui-themes-icons/plus"
import resourceIcon from "@ui-themes-icons/resource"
import runIcon from "@ui-themes-icons/run"
import searchIcon from "@ui-themes-icons/search"
import settingsIcon from "@ui-themes-icons/settings"
import visibilityOnIcon from "@ui-themes-icons/visibility-on"
import breakpointIcon from "@ui-themes-icons/breakpoint"

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

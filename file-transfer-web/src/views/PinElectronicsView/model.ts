export const selectFields = {
  timesetName: { label: 'TimeSet Name', options: ['time_func', 'time_init', 'time_test'] },
  timeset: { label: 'TimeSet', options: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  compareMode: { label: 'Compare Mode', options: ['edge', 'window'] },
  initialState: { label: 'Init State', options: ['HI', 'LO', 'HiZ'] },
  startState: { label: 'Start State', options: ['NONE', 'HI', 'LO'] },
  driveFormat: { label: 'Drive Format', options: ['NRZ', 'RZ', 'RO', 'SBC'] },
  driverMode: { label: 'Driver Mode', options: ['HiZ', 'Drive', 'PPMU'] },
  pinName: { label: 'Pin Name', options: ['portb', 'porta', 'portc', 'portd'] },
  forceMode: { label: 'Force mode', options: ['Voltage', 'Current'] },
  counterEdge: { label: 'Count edge', options: ['Rising', 'Falling', 'Both'] },
} as const

export const numberFields = {
  d0: { label: 'D0', unit: 'ps', min: 0, max: Infinity, default: 0 },
  d1: { label: 'D1', unit: 'ps', min: 0, max: Infinity, default: 50 },
  d2: { label: 'D2', unit: 'ps', min: 0, max: Infinity, default: 0 },
  d3: { label: 'D3', unit: 'ps', min: 0, max: Infinity, default: 250 },
  r0: { label: 'R0', unit: 'ns', min: 0, max: Infinity, default: 450.05 },
  r1: { label: 'R1', unit: 'ns', min: 0, max: Infinity, default: 0 },
  period: { label: 'Period', unit: 'ns', min: 0.001, max: Infinity, default: 500 },
  vt: { label: 'Vt', unit: 'V', min: -10, max: 10, default: 1.5 },
  vch: { label: 'Vch', unit: 'V', min: -10, max: 10, default: 6 },
  vih: { label: 'Vih', unit: 'V', min: -10, max: 10, default: 4.95 },
  vil: { label: 'Vil', unit: 'mV', min: -10000, max: 10000, default: 400 },
  vcl: { label: 'Vcl', unit: 'V', min: -10, max: 10, default: -1 },
  voh: { label: 'Voh', unit: 'V', min: -10, max: 10, default: 4 },
  vol: { label: 'Vol', unit: 'V', min: -10, max: 10, default: 1 },
  ioh: { label: 'Ioh', unit: 'µA', min: -1000, max: 1000, default: -100 },
  iol: { label: 'Iol', unit: 'µA', min: -1000, max: 1000, default: 100 },
  forceValue: { label: 'Force value', unit: 'V', min: -10, max: 10, default: 0 },
  compliance: { label: 'Compliance', unit: 'mA', min: 0.001, max: 100, default: 1 },
  gateTime: { label: 'Gate time', unit: 'ms', min: 1, max: 10000, default: 100 },
} as const

const booleanDefaults = {
  disableCompare: false, mainRelayClosed: false, ppmuRelayClosed: false,
  d0Disabled: true, d1Disabled: false, d2Disabled: true, d3Disabled: false,
  r0Disabled: false, r1Disabled: true,
} as const

export const edgeDisableKeys = {
  d0: 'd0Disabled', d1: 'd1Disabled', d2: 'd2Disabled', d3: 'd3Disabled',
  r0: 'r0Disabled', r1: 'r1Disabled',
} as const
export type EdgeKey = keyof typeof edgeDisableKeys

export type SelectKey = keyof typeof selectFields
export type NumberKey = keyof typeof numberFields
export type Settings = { [K in SelectKey]: (typeof selectFields)[K]['options'][number] }
  & Record<NumberKey, number> & Record<keyof typeof booleanDefaults, boolean>
export type FieldKey = SelectKey | NumberKey
export type SettingKey = keyof Settings
export type SettingValue = Settings[SettingKey]
export type DialogKind = 'ppmu' | 'counter'

export const channels: Record<Settings['pinName'], string> = {
  portb: '15.k302 (15.ch170)', porta: '15.k301 (15.ch169)',
  portc: '15.k303 (15.ch171)', portd: '15.k304 (15.ch172)',
}

export function createSettings(): Settings {
  return {
    timesetName: 'time_func', timeset: '3', compareMode: 'edge', initialState: 'HI',
    startState: 'NONE', driveFormat: 'NRZ', driverMode: 'HiZ', pinName: 'portb',
    forceMode: 'Voltage', counterEdge: 'Rising', ...booleanDefaults,
    ...Object.fromEntries(Object.entries(numberFields).map(([key, field]) => [key, field.default])),
  } as Settings
}

export function validSetting(key: SettingKey, value: unknown): value is SettingValue {
  if (key in booleanDefaults) return typeof value === 'boolean'
  if (key in selectFields) {
    const options: readonly string[] = selectFields[key as SelectKey].options
    return typeof value === 'string' && options.includes(value)
  }
  const field = numberFields[key as NumberKey]
  return typeof value === 'number' && Number.isFinite(value) && value >= field.min && value <= field.max
    && (key !== 'gateTime' || Number.isInteger(value))
}

export function isEdgeDisabled(settings: Readonly<Settings>, edge: EdgeKey): boolean {
  return settings[edgeDisableKeys[edge]] || ((edge === 'r0' || edge === 'r1') && settings.disableCompare)
}

// Read only known fields; malformed values and obsolete fields never enter the UI or export.
export function restoreSettings(saved: unknown): Settings {
  const result = createSettings()
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return result
  for (const key of Object.keys(result) as SettingKey[]) {
    const value = (saved as Record<string, unknown>)[key]
    if (validSetting(key, value)) Object.assign(result, { [key]: value })
  }
  return result
}

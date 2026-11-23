export const formats = ['NR', 'RH', 'RL', 'RC', 'SBC', 'DDR_NR', '2XCLK_POS', '2XCLK_NEG'] as const
export type Format = typeof formats[number]
export type CompareMode = 'Off' | 'Edge' | 'Window'
export type EdgeKey = 'd0' | 'd1' | 'd2' | 'd3' | 'r0' | 'r1'
export const edgeKeys: EdgeKey[] = ['d0', 'd1', 'd2', 'd3', 'r0', 'r1']
export interface Edges { d0: number; d1: number; d2: number; d3: number; r0: number; r1: number }
export interface Pin {
  id: string; format: Format; compare: CompareMode; operation: 'Drive' | 'Compare'
  pattern: string; initial: 'X' | '0' | '1'; a: Edges; b: Edges
  /** Preserve the independent DDR drive-on time while the clock format shares A.D0. */
  ddrBDriveOn?: number
}
export interface TimingConfig { version: 1; name: string; period: number; mux: boolean; pins: Pin[] }
export interface TimingEvent { time: number; value: 0 | 1; key: string }
export interface CompareMark { time: number; key: string; cycle: number; half: string }
export const descriptions: Record<Format, string> = {
  NR: 'D1 写入数据后保持，无返回沿。格式示意仅在首个 D1 交叉；数据波形按每周期 Pattern 更新。',
  RH: 'D1 写入数据，D2 固定返回高电平。数据为 1 时不会产生低脉冲。',
  RL: 'D1 写入数据，D2 固定返回低电平。数据为 0 时不会产生高脉冲。',
  RC: 'D1 写入数据，D2 返回该数据的反相值。',
  SBC: 'D0 写入反相数据，D1 写入数据，D2 再写入反相数据。MUX 模式不支持。',
  DDR_NR: 'A/B 半周期各有 D0、D1、R0；每半周期消费一个 Pattern 位，仅支持 Edge 比较。',
  '2XCLK_POS': '每个 tester cycle 读取一位 Pattern，A/B 共用。每半周期 D1 上升、D2 下降。Pattern=1 输出脉冲；Pattern=0 保持高电平（按本机定义）。',
  '2XCLK_NEG': '每个 tester cycle 读取一位 Pattern，A/B 共用。每半周期 D1 下降、D2 上升。Pattern=1 输出脉冲；Pattern=0 保持低电平（按本机定义）。',
}
export const isClock = (f: Format) => f === '2XCLK_POS' || f === '2XCLK_NEG'
export const isDDR = (f: Format) => f === 'DDR_NR' || isClock(f)
export function defaultEdges(period: number, half = false, b = false): Edges {
  const span = half ? period / 2 : period, start = b ? span : 0
  return { d0: start + span * .1, d1: start + span * .25, d2: start + span * .65,
    d3: start + span * .1, r0: start + span * .75, r1: start + span * .9 }
}
export function createConfig(): TimingConfig {
  return { version: 1, name: 'MIO16_TIMING_01', period: 100, mux: false,
    pins: Array.from({ length: 16 }, (_, i) => {
      const format = formats[i % 8]!
      return { id: `DIO${String(i).padStart(2, '0')}`, format, compare: isClock(format) ? 'Off' : 'Edge',
        operation: 'Drive', pattern: '1010', initial: 'X', a: defaultEdges(100, isDDR(format)),
        b: { ...defaultEdges(100, true, true), ...(isClock(format) ? { d0: 5 } : {}) } }
    }) }
}
export function changeFormat(pin: Pin, format: Format, period: number): Pin {
  const changed = isDDR(pin.format) !== isDDR(format)
  const a = changed ? defaultEdges(period, isDDR(format)) : { ...pin.a }
  const b = changed ? defaultEdges(period, true, true) : { ...pin.b }
  let ddrBDriveOn = changed ? undefined : pin.ddrBDriveOn
  if (isClock(format)) {
    if (!isClock(pin.format)) ddrBDriveOn = b.d0
    b.d0 = a.d0
  } else if (isClock(pin.format) && !changed) {
    b.d0 = ddrBDriveOn ?? defaultEdges(period, true, true).d0
    ddrBDriveOn = undefined
  }
  return { ...pin, format, a, b, ddrBDriveOn, operation: isClock(format) ? 'Drive' : pin.operation,
    compare: isClock(format) ? 'Off' : format === 'DDR_NR' && pin.compare === 'Window' ? 'Edge' : pin.compare }
}
export function activeEdge(pin: Pin, key: EdgeKey): boolean {
  if (key === 'r0') return !isClock(pin.format) && pin.compare !== 'Off'
  if (key === 'r1') return !isDDR(pin.format) && pin.compare === 'Window'
  if (key === 'd3') return pin.operation === 'Compare' && !isDDR(pin.format)
  if (pin.operation === 'Compare') return false
  if (key === 'd2') return pin.format !== 'NR' && pin.format !== 'DDR_NR'
  return true
}
export function validatePin(pin: Pin, period: number, mux: boolean): string[] {
  const errors: string[] = []
  if (mux && pin.format === 'SBC') errors.push('SBC 不支持 MUX 模式')
  if (!/^[01]{1,64}$/.test(pin.pattern)) errors.push('Pattern 必须为 1–64 位二进制序列')
  if (isClock(pin.format) && (pin.compare !== 'Off' || pin.operation !== 'Drive')) errors.push('2XCLK 仅支持 Drive / Off')
  if (pin.format === 'DDR_NR' && pin.compare === 'Window') errors.push('DDR_NR 仅支持 Edge / Off')
  if (pin.operation === 'Compare' && pin.compare === 'Off') errors.push('Compare 操作需要 Edge 或 Window')
  const halves = isDDR(pin.format) ? (['a', 'b'] as const) : (['a'] as const)
  for (const half of halves) {
    const e = pin[half], lo = half === 'b' ? period / 2 : 0, hi = isDDR(pin.format) && half === 'a' ? period / 2 : period
    const prefix = isDDR(pin.format) ? `${half.toUpperCase()}：` : ''
    for (const key of edgeKeys.filter(k => activeEdge(pin, k))) {
      const min = isClock(pin.format) && key === 'd0' ? 0 : lo
      if (!Number.isFinite(e[key]) || e[key] < min || e[key] > hi) errors.push(`${prefix}${key.toUpperCase()} 应在 ${min}–${hi} ns`)
    }
    if (pin.operation === 'Drive' && e.d0 > e.d1) errors.push(`${prefix}D0 ≤ D1`)
    if (activeEdge(pin, 'd2') && e.d1 > e.d2) errors.push(`${prefix}D1 ≤ D2`)
    if (activeEdge(pin, 'r1') && e.r0 > e.r1) errors.push(`${prefix}R0 ≤ R1`)
    if (activeEdge(pin, 'd3') && pin.compare !== 'Off' && e.d3 > e.r0) errors.push('D3 ≤ R0')
  }
  if (isClock(pin.format) && pin.a.d0 !== pin.b.d0) errors.push('2XCLK 的 A/B D0 必须相同')
  return errors
}
export function validateConfig(config: TimingConfig): string[] {
  if (!Number.isFinite(config.period) || config.period <= 0 || !Number.isFinite(config.period * 32)) return ['Period 必须是大于 0 的有限数值（ns）']
  if (!config.name.trim()) return ['请输入 Timeset 名称']
  return config.pins.flatMap(pin => validatePin(pin, config.period, config.mux).map(e => `${pin.id} · ${e}`))
}
export function driveEvents(pin: Pin, period: number, periods: number, invert = false): TimingEvent[] {
  if (pin.operation === 'Compare') return []
  const events: TimingEvent[] = []
  const count = isDDR(pin.format) ? 2 : 1
  for (let cycle = 0; cycle < periods; cycle++) for (let h = 0; h < count; h++) {
    const e = h ? pin.b : pin.a, offset = cycle * period
    const patternIndex = pin.format === 'DDR_NR' ? cycle * 2 + h : cycle
    const bit = (Number(pin.pattern[patternIndex % pin.pattern.length]) ^ Number(invert)) as 0 | 1
    const opposite = (1 - bit) as 0 | 1
    const suffix = count === 2 ? h ? ' B' : ' A' : ''
    const add = (time: number, value: 0 | 1, key: string) => events.push({ time: offset + time, value, key: key + suffix })
    if (pin.format === 'SBC') add(e.d0, opposite, 'D0')
    if (isClock(pin.format)) {
      const rest = pin.format === '2XCLK_POS' ? 0 : 1
      // A/B share drive enable; B starts at the half-period boundary.
      add(Math.max(e.d0, h * period / 2), (bit ? rest : 1 - rest) as 0 | 1, h ? 'B' : 'D0')
      if (bit) { add(e.d1, (1 - rest) as 0 | 1, 'D1'); add(e.d2, rest, 'D2') }
    } else {
      add(e.d1, bit, 'D1')
      if (pin.format === 'RL') add(e.d2, 0, 'D2')
      if (pin.format === 'RH') add(e.d2, 1, 'D2')
      if (pin.format === 'RC' || pin.format === 'SBC') add(e.d2, opposite, 'D2')
    }
  }
  return events.sort((a, b) => a.time - b.time)
}
// Edge annotations are independent of voltage transitions (D0 need not toggle data).
export function driveMarks(pin: Pin, period: number, periods: number): CompareMark[] {
  const marks: CompareMark[] = []
  for (let cycle = 0; cycle < periods; cycle++) {
    for (const half of isDDR(pin.format) ? ['a', 'b'] as const : ['a'] as const) {
      for (const key of ['d0', 'd1', 'd2'] as const) {
        if (!activeEdge(pin, key) || (isClock(pin.format) && half === 'b' && key === 'd0')) continue
        marks.push({ time: cycle * period + pin[half][key], key: key.toUpperCase(), cycle: cycle + 1,
          half: isClock(pin.format) && key === 'd0' ? '' : isDDR(pin.format) ? half.toUpperCase() : '' })
      }
    }
  }
  return marks
}
export function compareMarks(pin: Pin, period: number, periods: number): CompareMark[] {
  const marks: CompareMark[] = []
  for (let cycle = 0; cycle < periods; cycle++) for (const half of isDDR(pin.format) ? ['a', 'b'] as const : ['a'] as const) {
    for (const key of ['r0', 'r1'] as const) if (activeEdge(pin, key)) marks.push({
      time: cycle * period + pin[half][key], key: key.toUpperCase(), cycle: cycle + 1,
      half: isDDR(pin.format) ? half.toUpperCase() : '',
    })
  }
  return marks
}
// Imported files are untrusted. Rebuild a bounded schema before entering reactive state.
export function parseConfig(text: string): TimingConfig {
  const raw = JSON.parse(text)
  if (!raw || raw.version !== 1 || typeof raw.name !== 'string' || raw.name.length > 80 || typeof raw.period !== 'number' || typeof raw.mux !== 'boolean' || !Array.isArray(raw.pins) || raw.pins.length !== 16) throw new Error('不支持的配置文件：需要 version=1、16 个固定 PIN')
  const pins = raw.pins.map((p: any, i: number): Pin => {
    if (!p || p.id !== `DIO${String(i).padStart(2, '0')}` || !formats.includes(p.format) || !['Off', 'Edge', 'Window'].includes(p.compare) || !['Drive', 'Compare'].includes(p.operation) || !['X', '0', '1'].includes(p.initial) || typeof p.pattern !== 'string') throw new Error(`PIN ${i} 的配置结构无效`)
    const edges = (e: any): Edges => {
      if (!e || edgeKeys.some(k => typeof e[k] !== 'number' || !Number.isFinite(e[k]))) throw new Error(`${p.id} 边沿数据无效`)
      return Object.fromEntries(edgeKeys.map(k => [k, e[k]])) as unknown as Edges
    }
    if (p.ddrBDriveOn !== undefined && (typeof p.ddrBDriveOn !== 'number' || !Number.isFinite(p.ddrBDriveOn))) throw new Error(`${p.id} 的 DDR D0 备份无效`)
    return { ...(p.ddrBDriveOn === undefined ? {} : { ddrBDriveOn: p.ddrBDriveOn }), id: p.id, format: p.format, compare: p.compare, operation: p.operation, initial: p.initial, pattern: p.pattern, a: edges(p.a), b: edges(p.b) }
  })
  const config: TimingConfig = { version: 1, name: raw.name, period: raw.period, mux: raw.mux, pins }
  const errors = validateConfig(config)
  if (errors.length) throw new Error(errors[0])
  return config
}

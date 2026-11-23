import type { Pin } from './model'

type Scale = (time: number) => number
export interface FormatSchematic { lead: string; solid: string; alternative?: string; note?: string }
const top = 48, bottom = 72, center = 60

// This is a symbolic two-state envelope, not a simulation of Pattern data.
function crossedRails(times: number[], total: number, x: Scale): FormatSchematic {
  const points = [...new Set(times)].sort((a, b) => a - b).map(x)
  const start = x(0), end = x(total)
  const joints = points.map((mid, i) => ({ mid,
    half: Math.max(0, Math.min(6, (mid - (points[i - 1] ?? start)) / 3, ((points[i + 1] ?? end) - mid) / 3)),
  }))
  const first = joints[0]!
  const lead = [top, bottom].map(level => `M ${start} ${level} H ${first.mid - first.half} L ${first.mid} ${center}`).join(' ')
  const solid = joints.flatMap(({ mid, half }, i) => [top, bottom].map(level => {
    const next = joints[i + 1]
    return `M ${mid} ${center} L ${mid + half} ${level} H ${next ? next.mid - next.half : end}`
      + (next ? ` L ${next.mid} ${center}` : '')
  })).join(' ')
  return { lead, solid }
}

function returningRails(pin: Pin, period: number, periods: number, x: Scale): FormatSchematic {
  const rest = pin.format === 'RH' ? top : bottom
  const { d1, d2 } = pin.a
  const opening = (cycle: number) => {
    const mid = x(cycle * period + d1), end = x(cycle * period + d2)
    const previous = x(cycle === 0 ? 0 : (cycle - 1) * period + d2)
    return { mid, end, half: Math.max(0, Math.min(6, (mid - previous) / 2, (end - mid) / 3)) }
  }
  const first = opening(0)
  const lead = [top, bottom].map(level => `M ${x(0)} ${level} H ${first.mid - first.half} L ${first.mid} ${center}`).join(' ')
  const paths: string[] = []
  for (let cycle = 0; cycle < periods; cycle++) {
    const { mid, end, half } = opening(cycle)
    const next = cycle + 1 < periods ? opening(cycle + 1) : null
    if (cycle > 0) paths.push(`M ${mid - half} ${rest} L ${mid} ${center}`)
    if (d1 !== d2) {
      const closeHalf = Math.max(0, Math.min(6, (end - mid) / 3))
      for (const level of [top, bottom]) {
        paths.push(`M ${mid} ${center} L ${mid + half} ${level} H ${end - closeHalf} L ${end} ${center}`)
      }
    }
    const holdEnd = next ? next.mid - next.half : x(period * periods)
    const returnHalf = d1 === d2 ? 0 : Math.max(0, Math.min(6, (holdEnd - end) / 2))
    paths.push(`M ${end} ${center} L ${end + returnHalf} ${rest} H ${holdEnd}`)
  }
  return { lead, solid: paths.join(' ') }
}

function clockSchematic(pin: Pin, period: number, periods: number, x: Scale): FormatSchematic {
  const rest = pin.format === '2XCLK_POS' ? bottom : top
  const pulse = top + bottom - rest
  const start = x(pin.a.d0)
  let solid = `M ${start} ${rest}`
  for (let cycle = 0; cycle < periods; cycle++) {
    for (const edges of [pin.a, pin.b]) {
      solid += ` H ${x(cycle * period + edges.d1)} V ${pulse} H ${x(cycle * period + edges.d2)} V ${rest}`
    }
  }
  solid += ` H ${x(period * periods)}`
  return {
    lead: [top, bottom].map(level => `M ${x(0)} ${level} H ${start}`).join(' '), solid,
    alternative: `M ${start} ${pulse} H ${x(period * periods)}`,
    note: `1：双脉冲 · 0：保持${pin.format === '2XCLK_POS' ? '高' : '低'}`,
  }
}

export function formatSchematic(pin: Pin, period: number, periods: number, x: Scale): FormatSchematic {
  const cycles = Array.from({ length: periods }, (_, i) => i * period)
  switch (pin.format) {
    // NR keeps the original user-requested open rails across all later cycles.
    case 'NR': return crossedRails([pin.a.d1], period * periods, x)
    case 'RH': case 'RL': return returningRails(pin, period, periods, x)
    case 'RC': return crossedRails(cycles.flatMap(offset => [offset + pin.a.d1, offset + pin.a.d2]), period * periods, x)
    // D0 applies a new surround value; D1/D2 switch data and its complement.
    case 'SBC': return crossedRails(cycles.flatMap(offset => [offset + pin.a.d0, offset + pin.a.d1, offset + pin.a.d2]), period * periods, x)
    case 'DDR_NR': return crossedRails(cycles.flatMap(offset => [offset + pin.a.d1, offset + pin.b.d1]), period * periods, x)
    case '2XCLK_POS': case '2XCLK_NEG': return clockSchematic(pin, period, periods, x)
  }
}

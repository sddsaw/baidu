import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import ts from 'typescript'
const temp = await mkdtemp(join(tmpdir(), 'mio16-test-'))
try {
  const source = await readFile(new URL('../src/views/Mio16TimingView/model.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
  await writeFile(join(temp, 'model.mjs'), code)
  const m = await import(pathToFileURL(join(temp, 'model.mjs')))
  let count = 0
  const test = (name, fn) => { fn(); count++; console.log(`✓ ${name}`) }
  const config = m.createConfig()
  const pin = (format, pattern = '1') => ({ ...structuredClone(config.pins.find(p => p.format === format)), pattern })
  const values = p => m.driveEvents(p, 100, 1).map(e => e.value)
  test('16 PIN defaults are valid, including all eight formats', () => { assert.equal(config.pins.length, 16); assert.deepEqual(m.validateConfig(config), []) })
  test('NR holds until next cycle data, never returns at a period boundary', () => { const events = m.driveEvents(pin('NR', '10'), 100, 3); assert.deepEqual(events.map(e => [e.time, e.value]), [[25, 1], [125, 0], [225, 1]]) })
  test('RL returns low for both data values', () => { assert.deepEqual(values(pin('RL', '1')), [1, 0]); assert.deepEqual(values(pin('RL', '0')), [0, 0]) })
  test('RH returns high for both data values', () => { assert.deepEqual(values(pin('RH', '0')), [0, 1]); assert.deepEqual(values(pin('RH', '1')), [1, 1]) })
  test('RC returns complement for both data values', () => { assert.deepEqual(values(pin('RC', '1')), [1, 0]); assert.deepEqual(values(pin('RC', '0')), [0, 1]) })
  test('SBC surrounds both data values at D0/D2', () => { assert.deepEqual(values(pin('SBC', '1')), [0, 1, 0]); assert.deepEqual(values(pin('SBC', '0')), [1, 0, 1]) })
  test('DDR_NR consumes A/B bits at their absolute edge times', () => { assert.deepEqual(m.driveEvents(pin('DDR_NR', '10'), 100, 2).map(e => [e.time, e.value]), [[12.5, 1], [62.5, 0], [112.5, 1], [162.5, 0]]) })
  test('2XCLK_POS emits two positive pulses or holds high for 0', () => { assert.deepEqual(values(pin('2XCLK_POS', '1')), [0, 1, 0, 0, 1, 0]); assert.deepEqual(values(pin('2XCLK_POS', '0')), [1, 1]) })
  test('2XCLK_NEG emits two negative pulses or holds low for 0', () => { assert.deepEqual(values(pin('2XCLK_NEG', '1')), [1, 0, 1, 1, 0, 1]); assert.deepEqual(values(pin('2XCLK_NEG', '0')), [0, 0]) })
  test('Window repeats R0/R1 with period offsets', () => { const p = { ...pin('NR'), compare: 'Window' }; assert.deepEqual(m.compareMarks(p, 100, 2).map(e => [e.key, e.time]), [['R0', 75], ['R1', 90], ['R0', 175], ['R1', 190]]) })
  test('Edge uses R0 only, DDR repeats both half-cycle samples', () => { assert.equal(m.compareMarks(pin('NR'), 100, 3).length, 3); assert.deepEqual(m.compareMarks(pin('DDR_NR'), 100, 2).map(e => e.time), [37.5, 87.5, 137.5, 187.5]) })
  test('Unused NR D2/D3 do not constrain drive timing', () => { const p = pin('NR'); p.a.d2 = -100; p.a.d3 = 900; assert.deepEqual(m.validatePin(p, 100, false), []) })
  test('Compare cycle has no drive and validates D3 before R0', () => { const p = pin('NR'); p.operation = 'Compare'; p.a.d3 = 80; assert.deepEqual(m.driveEvents(p, 100, 1), []); assert.ok(m.validatePin(p, 100, false).includes('D3 ≤ R0')) })
  test('Ordering, finite input, A/B range, MUX and unsupported modes rejected', () => { let p = pin('SBC'); assert.ok(m.validatePin(p, 100, true).length); p.a.d0 = p.a.d1 + 1; assert.ok(m.validatePin(p, 100, false).length); p.a.d1 = NaN; assert.ok(m.validatePin(p, 100, false).length); p = pin('DDR_NR'); p.b.d1 = 1; assert.ok(m.validatePin(p, 100, false).length); p.compare = 'Window'; assert.ok(m.validatePin(p, 100, false).length); assert.ok(m.validateConfig({ ...config, period: 0 }).length) })
  test('Format switch makes DDR/clock constraints explicit and valid', () => { const p = m.changeFormat({ ...pin('NR'), compare: 'Window' }, '2XCLK_POS', 100); assert.equal(p.compare, 'Off'); assert.equal(p.a.d0, p.b.d0); assert.deepEqual(m.validatePin(p, 100, false), []); assert.deepEqual(m.validatePin(m.changeFormat(p, 'DDR_NR', 100), 100, false), []) })
  test('Versioned JSON round trip preserves config; invalid schema rejected', () => { assert.deepEqual(m.parseConfig(JSON.stringify(config)), config); assert.throws(() => m.parseConfig('{"version":2}')); const bad = structuredClone(config); bad.pins[1].id = bad.pins[0].id; assert.throws(() => m.parseConfig(JSON.stringify(bad))); const badTime = structuredClone(config); badTime.pins[0].a.d1 = 101; assert.throws(() => m.parseConfig(JSON.stringify(badTime))) })
  test('2XCLK mixed patterns enable both pulses per tester cycle', () => {
    for (const format of ['2XCLK_POS', '2XCLK_NEG']) for (const pattern of ['10', '01']) {
      const first = pattern === '10' ? 0 : 100
      const events = m.driveEvents(pin(format, pattern), 100, 2)
      assert.deepEqual(events.filter(e => e.key.startsWith('D1')).map(e => e.time), [first + 12.5, first + 62.5])
      const holdCycle = pattern === '10' ? 100 : 0
      const hold = format === '2XCLK_POS' ? 1 : 0
      assert.ok(events.filter(e => e.time >= holdCycle && e.time < holdCycle + 100).every(e => e.value === hold))
    }
  })
  test('DDR format round trips retain edited edges including independent B D0', () => {
    const original = pin('DDR_NR')
    original.b.d0 = 56; original.b.d1 = 70; original.b.r0 = 92
    const clock = m.changeFormat(original, '2XCLK_POS', 100)
    assert.equal(clock.b.d1, 70)
    assert.equal(clock.b.r0, 92)
    assert.equal(clock.b.d0, clock.a.d0)
    const roundTrip = m.changeFormat(clock, 'DDR_NR', 100)
    assert.deepEqual(roundTrip.b, original.b)
    assert.deepEqual(m.validatePin(roundTrip, 100, false), [])
    const persisted = structuredClone(config)
    persisted.pins[5] = clock
    const loaded = m.parseConfig(JSON.stringify(persisted))
    assert.equal(m.changeFormat(loaded.pins[5], 'DDR_NR', 100).b.d0, 56)
  })
  test('Drive-on annotations exist independently of voltage transitions', () => {
    for (const format of m.formats) {
      const p = pin(format)
      const marks = m.driveMarks(p, 100, 2).filter(e => e.key === 'D0')
      const expected = format === 'DDR_NR' ? [5, 55, 105, 155]
        : format.startsWith('2XCLK') ? [5, 105] : [10, 110]
      assert.deepEqual(marks.map(e => e.time), expected)
    }
    const p = pin('NR'); p.a.d0 = 20
    assert.deepEqual(m.driveMarks(p, 100, 2).filter(e => e.key === 'D0').map(e => e.time), [20, 120])
    p.operation = 'Compare'
    assert.deepEqual(m.driveMarks(p, 100, 2), [])
  })
  test('DDR common edges edited in clock mode survive switching back', () => {
    const p = pin('DDR_NR'); p.b.d0 = 56; p.b.d1 = 70
    const clock = m.changeFormat(p, '2XCLK_POS', 100)
    clock.b.d1 = 72; clock.b.d2 = 88
    const negative = m.changeFormat(clock, '2XCLK_NEG', 100)
    const restored = m.changeFormat(negative, 'DDR_NR', 100)
    assert.equal(restored.b.d0, 56)
    assert.equal(restored.b.d1, 72)
    assert.equal(restored.b.d2, 88)
    const legacy = pin('2XCLK_POS'); legacy.b.d1 = 71
    const migrated = m.changeFormat(legacy, 'DDR_NR', 100)
    assert.equal(migrated.b.d1, 71)
    assert.deepEqual(m.validatePin(migrated, 100, false), [])
  })
  console.log(`\n${count} MIO16 rule tests passed.`)
} finally { await rm(temp, { recursive: true, force: true }) }

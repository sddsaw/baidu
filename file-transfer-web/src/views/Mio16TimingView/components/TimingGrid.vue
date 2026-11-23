<script setup lang="ts">
import { computed, ref } from 'vue'
import { activeEdge, edgeKeys, formats, isClock, isDDR, validatePin, type EdgeKey, type Format, type Pin, type TimingConfig } from '../model'
const props = defineProps<{ config: TimingConfig; selected: string; mode: 'format' | 'data' }>()
const emit = defineEmits<{
  select: [id: string]; update: [id: string, patch: Partial<Pin>]; format: [id: string, format: Format]
  edge: [id: string, half: 'a' | 'b', key: EdgeKey, value: number]
}>()
const search = ref('')
const rows = computed(() => props.config.pins.filter(p => p.id.toLowerCase().includes(search.value.toLowerCase())).map(pin => ({
  pin, halves: isDDR(pin.format) ? ['a', 'b'] as const : ['a'] as const,
  errors: validatePin(pin, props.config.period, props.config.mux),
})))
const valueOf = (event: Event) => (event.target as HTMLInputElement).value
</script>
<template>
  <section class="mio-panel pin-panel">
    <header class="panel-heading"><div><span class="section-index">01</span><h2>PIN 时序配置</h2><span class="muted">16 channels</span></div><input v-model="search" aria-label="筛选 PIN" placeholder="筛选 PIN…" class="pin-search"></header>
    <div class="table-scroll">
      <table class="timing-table">
        <colgroup><col style="width:70px"><col style="width:126px"><col style="width:78px"><col style="width:100px"><col style="width:34px"><col v-for="key in edgeKeys" :key="key" style="width:60px"><template v-if="mode === 'data'"><col style="width:90px"><col style="width:68px"></template></colgroup>
        <thead><tr><th>PIN</th><th>FORMAT</th><th>操作</th><th>Compare mode</th><th>A/B</th><th v-for="key in edgeKeys" :key="key">{{ key.toUpperCase() }} <small>ns</small></th><template v-if="mode === 'data'"><th>Pattern</th><th>初态</th></template></tr></thead>
        <tbody>
          <template v-for="{ pin, halves, errors } in rows" :key="pin.id">
            <tr v-for="(half, index) in halves" :key="`${pin.id}-${half}`" :class="{ selected: selected === pin.id, invalid: errors.length }" @focusin="emit('select', pin.id)">
              <th v-if="index === 0" :rowspan="halves.length"><button class="pin-button" :aria-pressed="selected === pin.id" :title="errors.join('；') || '高亮对应波形（全部 PIN 始终显示）'" @click="emit('select', pin.id)"><i :class="{ bad: errors.length }"></i>{{ pin.id }}</button></th>
              <td v-if="index === 0" :rowspan="halves.length"><select :aria-label="`${pin.id} FORMAT`" :value="pin.format" @change="emit('format', pin.id, valueOf($event) as Format)"><option v-for="format in formats" :key="format">{{ format }}</option></select></td>
              <td v-if="index === 0" :rowspan="halves.length"><select :aria-label="`${pin.id} 操作`" :value="pin.operation" :disabled="isClock(pin.format)" @change="emit('update', pin.id, { operation: valueOf($event) as Pin['operation'] })"><option>Drive</option><option>Compare</option></select></td>
              <td v-if="index === 0" :rowspan="halves.length"><select :aria-label="`${pin.id} Compare mode`" :value="pin.compare" :disabled="isClock(pin.format)" @change="emit('update', pin.id, { compare: valueOf($event) as Pin['compare'] })"><option>Off</option><option>Edge</option><option :disabled="isDDR(pin.format)">Window</option></select></td>
              <td class="half-cell">{{ isDDR(pin.format) ? half.toUpperCase() : '—' }}</td>
              <td v-for="key in edgeKeys" :key="key"><input v-if="activeEdge(pin, key)" type="number" step="any" :aria-label="`${pin.id} ${half.toUpperCase()} ${key.toUpperCase()}`" :value="Number.isFinite(pin[half][key]) ? pin[half][key] : ''" :disabled="isClock(pin.format) && half === 'b' && key === 'd0'" :title="isClock(pin.format) && key === 'd0' ? 'A/B 共用 D0，在 A 行编辑' : ''" @input="emit('edge', pin.id, half, key, valueOf($event).trim() === '' ? NaN : Number(valueOf($event)))"><span v-else class="unused" title="此格式/操作不使用该边沿">—</span></td>

              <template v-if="mode === 'data' && index === 0">
                <td :rowspan="halves.length"><input :value="pin.pattern" :aria-label="`${pin.id} Pattern`" maxlength="64" @input="emit('update', pin.id, { pattern: valueOf($event) })"></td>
                <td :rowspan="halves.length"><select :value="pin.initial" :aria-label="`${pin.id} 初始电平`" @change="emit('update', pin.id, { initial: valueOf($event) as Pin['initial'] })"><option value="X">X</option><option value="0">0</option><option value="1">1</option></select></td>
              </template>
            </tr>
          </template>
          <tr v-if="!rows.length"><td :colspan="mode === 'data' ? 13 : 11" class="empty-state">没有匹配的 PIN</td></tr>
        </tbody>
      </table>
    </div>
    <footer class="table-note">PIN 固定 · 点击只高亮，不筛选右侧波形 · 灰色边沿不参与校验 · DDR 的 B 行使用相对整个 Period 起点的时间 · 2XCLK 共用 D0</footer>
  </section>
</template>

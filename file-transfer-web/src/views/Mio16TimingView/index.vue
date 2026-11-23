<script setup lang="ts">
import { computed, ref } from 'vue'
import TimingGrid from './components/TimingGrid.vue'
import TimingPreview from './components/TimingPreview.vue'
import { useTimingEditor } from './useTimingEditor'
import './mio16.css'
defineOptions({ name: 'Mio16Timing' })
const { config, selected, errors, notice, dirty, updatePin, setFormat, setEdge, save, load, importFile, exportFile } = useTimingEditor()
const fileInput = ref<HTMLInputElement>()
const previewMode = ref<'format' | 'data'>('format')
const rate = computed(() => Number.isFinite(config.value.period) && config.value.period > 0 ? `${Number((1000 / config.value.period).toPrecision(5))} MHz` : '—')
function updatePeriod(event: Event) {
  const value = (event.target as HTMLInputElement).value
  config.value.period = value.trim() ? Number(value) : NaN
}
function chooseFile(event: Event) { const input = event.target as HTMLInputElement; void importFile(input.files?.[0]); input.value = '' }
</script>
<template>
  <section class="mio-workspace" aria-labelledby="mio-title">
    <header class="mio-titlebar"><div><div class="eyebrow">DIGITAL INSTRUMENT / TIMING EDITOR</div><h1 id="mio-title">MIO16 <span>Timing Formats</span></h1><p>按引脚编辑时序，在周期之间检查驱动与采样位置。</p></div><div class="workspace-actions"><span class="offline-badge">离线编辑</span><button @click="load">载入本机</button><button @click="fileInput?.click()">导入 JSON</button><button :disabled="errors.length > 0" @click="exportFile">导出 JSON</button><button class="primary" :disabled="errors.length > 0" @click="save">保存到本机{{ dirty ? ' *' : '' }}</button><input ref="fileInput" hidden type="file" accept=".json,application/json" aria-label="导入时序 JSON" @change="chooseFile"></div></header>
    <div class="global-settings"><label>Timeset <input v-model="config.name" maxlength="80" aria-label="Timeset 名称"></label><label>Period <div class="unit-input"><input :value="Number.isFinite(config.period) ? config.period : ''" type="number" min="0" step="any" aria-label="Period ns" @input="updatePeriod"><span>ns</span></div></label><div class="rate-readout"><span>VECTOR RATE</span><strong>{{ rate }}</strong></div><label class="mux-control"><input v-model="config.mux" type="checkbox"> MUX 模式</label><span class="validation-state" :class="{ error: errors.length }">{{ errors.length ? `${errors.length} 项待修正` : '✓ 时序校验通过' }}</span></div>
    <div class="editor-split-scroll"><div class="editor-columns"><TimingGrid :config="config" :selected="selected" :mode="previewMode" @select="selected = $event" @update="updatePin" @format="setFormat" @edge="setEdge"/><TimingPreview :config="config" :selected="selected" v-model:mode="previewMode" @select="selected = $event"/></div></div>
    <details v-if="errors.length" class="validation-details" open><summary>校验结果 · 修正后可保存与导出</summary><ul><li v-for="error in errors" :key="error">{{ error }}</li></ul></details>
    <details class="rules-details"><summary>规则依据与使用说明</summary><div class="rules-grid"><div><h3>时序约定</h3><p>全部时间单位为 ns，相对于整个 Period 起点。DDR 的 A 位于前半周期、B 位于后半周期。边界允许相等；器件的最小脉宽与硬件时间分辨率尚未接入。</p><p>切换 SDR/DDR 会按当前 Period 初始化该 PIN 的边沿。修改 Period 不自动缩放已有边沿，超限参数会提示。</p></div><div><h3>本机定义优先</h3><p>依据提供的 11 张 MIO16 定义图。RL 固定返回低、RH 固定返回高；不采用图中文字中与此冲突的“反向脉冲”描述。D3 在 Drive 下不生效。</p><p>2XCLK 的 Pattern=0 保持电平按该文档实现；A/B 时间基准及实际硬件行为仍需设备联调确认。</p></div><div><h3>行业对照与边界</h3><p>NR、RL、RH、SBC 的基本含义与 <a href="https://nidigital.readthedocs.io/en/stable/enums.html#nidigital.DriveFormat" target="_blank" rel="noopener noreferrer">NI-Digital 公开定义</a>基本一致。八种格式命名和 D3 限制不是通用行业接口。</p><p>这是单 Timeset 离线配置工具。JSON 用于保存编辑状态，不直接下发测试机；比较模式跨 Timeset 共享应由后续项目级配置接管。</p></div></div></details>
    <footer class="mio-status" role="status"><span>{{ notice }}</span><span>16 PIN · 8 FORMATS · ns</span></footer>
  </section>
</template>

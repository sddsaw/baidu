import { computed, ref } from 'vue'
import { changeFormat, createConfig, isClock, parseConfig, validateConfig, type EdgeKey, type Format, type Pin } from './model'
const storageKey = 'mio16-timing-v1'
export function useTimingEditor() {
  const config = ref(createConfig())
  const selected = ref('DIO00')
  const notice = ref('配置仅保存在本机浏览器；未连接测试机。')
  const saved = ref('')
  const errors = computed(() => validateConfig(config.value))
  const current = computed(() => config.value.pins.find(p => p.id === selected.value)!)
  // Invalid active values block writes; normalize only unused blank edges on disk.
  const serialized = computed(() => JSON.stringify(config.value, (_key, value) =>
    typeof value === 'number' && !Number.isFinite(value) ? 0 : value))
  const dirty = computed(() => serialized.value !== saved.value)
  function updatePin(id: string, patch: Partial<Pin>) {
    config.value.pins = config.value.pins.map(pin => pin.id === id ? { ...pin, ...patch } : pin)
  }
  function setFormat(id: string, format: Format) {
    config.value.pins = config.value.pins.map(pin => pin.id === id ? changeFormat(pin, format, config.value.period) : pin)
  }
  function setEdge(id: string, half: 'a' | 'b', key: EdgeKey, value: number) {
    const pin = config.value.pins.find(p => p.id === id)!
    const patch: Partial<Pin> = { [half]: { ...pin[half], [key]: value } }
    if (isClock(pin.format) && key === 'd0') { patch.a = { ...pin.a, d0: value }; patch.b = { ...pin.b, d0: value } }
    updatePin(id, patch)
  }
  function save() {
    if (errors.value.length) { notice.value = '请先修正校验错误，再保存。'; return }
    try { saved.value = serialized.value; localStorage.setItem(storageKey, saved.value); notice.value = '已保存到本机浏览器。' }
    catch { saved.value = ''; notice.value = '浏览器存储不可用，请导出 JSON 备份。' }
  }
  function load() {
    try {
      const data = localStorage.getItem(storageKey)
      if (!data) { notice.value = '本机尚无已保存的配置。'; return }
      config.value = parseConfig(data); saved.value = JSON.stringify(config.value); notice.value = '已载入本机配置。'
    } catch (e) { notice.value = `载入失败：${(e as Error).message}` }
  }
  async function importFile(file?: File) {
    if (!file) return
    try {
      if (file.size > 100_000) throw new Error('文件不能超过 100 KB')
      config.value = parseConfig(await file.text()); notice.value = `已导入 ${file.name}，可检查后保存。`
    } catch (e) { notice.value = `导入失败：${(e as Error).message}` }
  }
  function exportFile() {
    if (errors.value.length) { notice.value = '请先修正校验错误，再导出。'; return }
    const url = URL.createObjectURL(new Blob([JSON.stringify(JSON.parse(serialized.value), null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url
    link.download = `${config.value.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'mio16'}.json`
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    notice.value = '已导出 JSON；此文件不是测试机可执行的 .def 文件。'
  }
  return { config, selected, current, errors, notice, dirty, updatePin, setFormat, setEdge, save, load, importFile, exportFile }
}

import { computed, readonly, shallowRef } from 'vue'
import { channels, createSettings, restoreSettings, validSetting, type Settings, type SettingKey, type SettingValue } from './model'

const storageKey = 'file-transfer-pin-electronics-v1'

export function usePinSettings() {
  const settings = shallowRef(createSettings())
  const status = shallowRef('Ready · settings stored on this device')
  const storageError = shallowRef(false)
  try {
    settings.value = restoreSettings(JSON.parse(localStorage.getItem(storageKey) || 'null'))
  } catch {
    status.value = 'Saved settings unavailable · using defaults'
    storageError.value = true
  }

  function save(message = 'Changes saved locally') {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings.value))
      status.value = message
      storageError.value = false
    } catch {
      status.value = 'Updated for this session · browser storage unavailable'
      storageError.value = true
    }
  }

  function update(key: SettingKey, value: SettingValue) {
    if (!validSetting(key, value)) return
    settings.value = { ...settings.value, [key]: value }
    save()
  }

  function apply(patch: Partial<Settings>) {
    settings.value = restoreSettings({ ...settings.value, ...patch })
    save('Settings saved locally')
  }

  function reset() {
    settings.value = createSettings()
    save('Default values restored')
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify({ version: 1, pin: settings.value.pinName, settings: settings.value }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pin-${settings.value.pinName}-settings.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    if (!storageError.value) status.value = 'Configuration exported'
  }

  return { settings: readonly(settings), status, storageError, channel: computed(() => channels[settings.value.pinName]), update, apply, reset, exportSettings }
}

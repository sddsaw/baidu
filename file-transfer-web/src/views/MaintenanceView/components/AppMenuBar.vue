<template>
  <div class="app-menubar" @click.stop>
    <div
      v-for="menu in menuList"
      :key="menu.id"
      class="menu-root"
      :class="{ 'is-open': activeMenuId === menu.id }"
    >
      <button
        class="menu-btn"
        :class="{ 'is-active': activeMenuId === menu.id }"
        @click="toggleMenu(menu.id)"
        @mouseenter="hoverMenu(menu.id)"
      >
        <span>{{ menu.label }}</span>
        <el-icon class="menu-arrow"><ArrowDown /></el-icon>
      </button>

      <!-- 下拉子菜单 -->
      <div
        v-show="activeMenuId === menu.id"
        class="menu-dropdown"
        :class="{ 'align-right': menu.alignRight }"
      >
        <template v-for="(item, idx) in menu.items" :key="item.id || ('div_' + idx)">
          <!-- 分割线 (Element Plus) -->
          <el-divider v-if="item.isDivider" class="menu-divider" />

          <!-- 菜单项 -->
          <div
            v-else
            class="menu-item"
            :class="{
              'text-danger': item.danger,
              'text-success': item.success,
              'text-amber': item.amber,
              'font-bold': item.bold,
              'font-semibold': item.semibold
            }"
            @click="handleItemClick(item)"
          >
            <!-- 复选框形式 (Checkbox) -->
            <span v-if="item.type === 'checkbox'" class="item-label">
              <span class="check-box-holder">
                <el-icon v-if="isChecked(item)" class="check-mark"><Check /></el-icon>
              </span>
              <span>{{ item.label }}</span>
            </span>

            <!-- 单选框形式 (Radio) -->
            <span v-else-if="item.type === 'radio'" class="item-label">
              <span class="radio-box-holder">
                <span v-if="isRadioSelected(item)" class="radio-dot">●</span>
              </span>
              <span>{{ item.label }}</span>
            </span>

            <!-- 普通文字项 -->
            <span v-else>{{ item.label }}</span>

            <!-- 右侧修饰：快捷键 / 状态Badge / 子级箭头 -->
            <span v-if="item.shortcut" class="shortcut">{{ item.shortcut }}</span>
            <el-tag v-else-if="item.badge" size="small" type="success" effect="plain" class="menu-el-tag">{{ item.badge }}</el-tag>
            <el-icon v-else-if="item.subArrow" class="sub-arrow"><ArrowRight /></el-icon>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowDown, ArrowRight, Check } from '@element-plus/icons-vue'
import { menuList, type MenuItemConfig, type MenuGroupConfig } from '../config/menuConfig'

export type { MenuItemConfig, MenuGroupConfig }

const props = defineProps<{
  viewConfig: {
    showTree: boolean
    showTable: boolean
    showConsole: boolean
  }
  execMode: 'single' | 'loop' | 'halt'
  autoSaveLogs: boolean
}>()

const emit = defineEmits<{
  (e: 'menu-action', item: MenuItemConfig): void
  (e: 'toggle-view', key: 'showTree' | 'showTable' | 'showConsole'): void
  (e: 'set-mode', mode: 'single' | 'loop' | 'halt'): void
  (e: 'toggle-autosave'): void
}>()

const activeMenuId = ref<string | null>(null)
const isMenuInteracting = ref(false)

function isChecked(item: MenuItemConfig): boolean {
  if (item.bindKey === 'autoSaveLogs') {
    return props.autoSaveLogs
  }
  if (item.bindKey && item.bindKey in props.viewConfig) {
    return !!props.viewConfig[item.bindKey as 'showTree' | 'showTable' | 'showConsole']
  }
  return false
}

function isRadioSelected(item: MenuItemConfig): boolean {
  if (item.group === 'execMode') {
    return props.execMode === item.value
  }
  return false
}

function toggleMenu(menuId: string) {
  if (activeMenuId.value === menuId) {
    closeAllMenus()
  } else {
    openMenu(menuId)
  }
}

function hoverMenu(menuId: string) {
  if (isMenuInteracting.value && activeMenuId.value && activeMenuId.value !== menuId) {
    openMenu(menuId)
  }
}

function openMenu(menuId: string) {
  activeMenuId.value = menuId
  isMenuInteracting.value = true
}

function closeAllMenus() {
  activeMenuId.value = null
  isMenuInteracting.value = false
}

function handleItemClick(item: MenuItemConfig) {
  closeAllMenus()

  if (item.type === 'checkbox') {
    if (item.bindKey === 'autoSaveLogs') {
      emit('toggle-autosave')
    } else if (item.bindKey) {
      emit('toggle-view', item.bindKey as 'showTree' | 'showTable' | 'showConsole')
    }
    return
  }

  if (item.type === 'radio' && item.group === 'execMode' && item.value) {
    emit('set-mode', item.value as 'single' | 'loop' | 'halt')
    return
  }

  emit('menu-action', item)
}

function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.menu-root')) {
    closeAllMenus()
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
})

defineExpose({
  closeAllMenus
})
</script>

<style scoped>
.app-menubar {
  background-color: #f8fafc;
  border-bottom: 1px solid #cbd5e1;
  padding: 2px 6px;
  display: flex;
  align-items: center;
  gap: 2px;
  position: relative;
  z-index: 50;
  flex-shrink: 0;
  user-select: none;
}

.menu-root {
  position: relative;
}

.menu-btn {
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.menu-btn:hover,
.menu-btn.is-active {
  background-color: #e2e8f0;
  color: #0f172a;
}

.menu-arrow {
  font-size: 10px;
  opacity: 0.6;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  min-width: 270px;
  padding: 5px 0;
  z-index: 100;
}

.menu-dropdown.align-right {
  left: auto;
  right: 0;
}

.menu-item {
  padding: 6px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: #334155;
  font-size: 13px;
}

.menu-item:hover {
  background-color: #2563eb;
  color: #ffffff !important;
}

.menu-item.text-danger:hover {
  background-color: #dc2626;
  color: #ffffff !important;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.check-box-holder,
.radio-box-holder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: 2px;
}

.check-mark {
  color: #2563eb;
  font-size: 13px;
  font-weight: bold;
}

.menu-item:hover .check-mark {
  color: #ffffff;
}

.radio-dot {
  font-size: 10px;
  color: #2563eb;
  line-height: 1;
}

.menu-item:hover .radio-dot {
  color: #ffffff;
}

.shortcut {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  color: #94a3b8;
  margin-left: 16px;
}

.menu-item:hover .shortcut {
  color: #e2e8f0;
}

.sub-arrow {
  font-size: 10px;
  color: #94a3b8;
}

.menu-item:hover .sub-arrow {
  color: #ffffff;
}

.menu-divider.el-divider--horizontal {
  margin: 4px 0 !important;
  border-color: #e2e8f0;
}

.menu-el-tag {
  height: 20px;
  line-height: 18px;
  padding: 0 6px;
  font-size: 11px;
}

.text-danger { color: #ef4444; }
.text-success { color: #10b981; }
.text-amber { color: #f59e0b; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
</style>

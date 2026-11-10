<template>
  <div class="unity-inspector-panel">
    
    <!-- 顶部极简标题条 (Unity Inspector 风格) -->
    <div class="unity-title-bar">
      <div class="title-left">
        <iconify-icon icon="mdi:tune-vertical" class="title-icon"></iconify-icon>
        <span class="title-text">Inspector</span>
      </div>
      <div class="title-right">
        <button class="icon-btn" :class="{ active: isLocked }" title="Lock" @click="isLocked = !isLocked">
          <iconify-icon :icon="isLocked ? 'mdi:pin' : 'mdi:pin-outline'"></iconify-icon>
        </button>
        <button class="icon-btn" title="Options">
          <iconify-icon icon="mdi:dots-vertical"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 目标对象标签 -->
    <div class="object-banner">
      <span class="object-type">ATE Config</span>
      <span class="object-name">PINMAP TABLE (SOC_V1)</span>
    </div>

    <!-- 核心：1:1 复刻 Unity 纯正 Foldout 嵌套树形折叠区域 -->
    <div class="foldout-tree-container">

      <!-- 一级项 1: StyleSheet -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('styleSheet')">
          <span class="foldout-arrow" :class="{ expanded: openStates.styleSheet }"></span>
          <span class="foldout-label font-bold">StyleSheet</span>
        </div>
        <div class="foldout-content" :class="{ show: openStates.styleSheet }">
          <div class="prop-detail">
            <span class="prop-k">Source:</span>
            <span class="prop-v font-mono text-cyan">PinmapDefault.uss</span>
          </div>
        </div>
      </div>

      <!-- 一级项 2: Matching Selectors -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('matchingSelectors')">
          <span class="foldout-arrow" :class="{ expanded: openStates.matchingSelectors }"></span>
          <span class="foldout-label font-bold">Matching Selectors</span>
        </div>
        <div class="foldout-content" :class="{ show: openStates.matchingSelectors }">
          <div class="prop-detail">
            <span class="prop-k">Class:</span>
            <span class="prop-v">.pin-table-row</span>
          </div>
        </div>
      </div>

      <!-- 一级项 3: Inlined Styles (图中的重点：展开且带有二级缩进项) -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('inlinedStyles')">
          <span class="foldout-arrow" :class="{ expanded: openStates.inlinedStyles }"></span>
          <span class="foldout-label font-bold">Inlined Styles</span>
        </div>

        <!-- 二级嵌套列表 (完全贴合截图缩进与紧凑单行) -->
        <div class="foldout-content" :class="{ show: openStates.inlinedStyles }">
          
          <!-- 二级子项: Display -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('display')">
              <span class="foldout-arrow" :class="{ expanded: openStates.display }"></span>
              <span class="foldout-label">Display</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.display }">
              <div class="inner-form-row">
                <span class="lbl">Opacity</span>
                <input class="u-input" type="number" value="100" />
              </div>
            </div>
          </div>

          <!-- 二级子项: Position -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('position')">
              <span class="foldout-arrow" :class="{ expanded: openStates.position }"></span>
              <span class="foldout-label">Position</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.position }">
              <div class="inner-form-row">
                <span class="lbl">Mode</span>
                <input class="u-input" type="text" value="Relative" />
              </div>
            </div>
          </div>

          <!-- 二级子项: Flex -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('flex')">
              <span class="foldout-arrow" :class="{ expanded: openStates.flex }"></span>
              <span class="foldout-label">Flex</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.flex }">
              <div class="inner-form-row">
                <span class="lbl">Direction</span>
                <input class="u-input" type="text" value="Row" />
              </div>
            </div>
          </div>

          <!-- 二级子项: Align -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('align')">
              <span class="foldout-arrow" :class="{ expanded: openStates.align }"></span>
              <span class="foldout-label">Align</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.align }">
              <div class="inner-form-row">
                <span class="lbl">Justify</span>
                <input class="u-input" type="text" value="Flex-Start" />
              </div>
            </div>
          </div>

          <!-- 二级子项: Size -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('size')">
              <span class="foldout-arrow" :class="{ expanded: openStates.size }"></span>
              <span class="foldout-label">Size</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.size }">
              <div class="inner-form-row">
                <span class="lbl">Width</span>
                <input class="u-input" type="text" value="100%" />
              </div>
            </div>
          </div>

          <!-- 二级子项: Text -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('text')">
              <span class="foldout-arrow" :class="{ expanded: openStates.text }"></span>
              <span class="foldout-label">Text</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.text }">
              <div class="inner-form-row">
                <span class="lbl">Font Size</span>
                <input class="u-input" type="number" value="11" />
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 一级项 4: ATE Pin Statistics (业务扩展) -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('pinStats')">
          <span class="foldout-arrow" :class="{ expanded: openStates.pinStats }"></span>
          <span class="foldout-label font-bold">ATE Pin Channels</span>
        </div>
        <div class="foldout-content" :class="{ show: openStates.pinStats }">
          <div class="prop-detail">
            <span class="prop-k">Total Channels:</span>
            <span class="prop-v font-mono text-cyan">128 / 128 Mapped</span>
          </div>
          <div class="prop-detail">
            <span class="prop-k">Validation:</span>
            <span class="prop-v text-green">PASSED (0 errors)</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 底部状态条 -->
    <div class="unity-footer">
      <span>Ready</span>
      <span>UTF-8</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

const isLocked = ref(false);

const openStates = reactive({
  styleSheet: false,
  matchingSelectors: false,
  inlinedStyles: true,
  display: false,
  position: false,
  flex: false,
  align: false,
  size: false,
  text: false,
  pinStats: false
});

const toggle = (key: keyof typeof openStates) => {
  openStates[key] = !openStates[key];
};
</script>

<style scoped>
/* 1:1 复刻 Unity 经典灰暗色系与像素级紧凑排版 */
.unity-inspector-panel {
  width: 320px;
  background-color: #282828;
  border: 1px solid #1f1f1f;
  color: #c4c4c4;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  font-size: 11px;
  line-height: 1.2;
  user-select: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部标题条 */
.unity-title-bar {
  height: 24px;
  background-color: #1f1f1f;
  border-bottom: 1px solid #151515;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}
.title-left {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e0e0e0;
  font-weight: 600;
}
.title-icon {
  font-size: 13px;
  color: #3884ff;
}
.title-right {
  display: flex;
  gap: 2px;
}
.icon-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  display: flex;
  align-items: center;
}
.icon-btn:hover {
  background: #333;
  color: #fff;
}
.icon-btn.active {
  color: #3884ff;
}

/* 目标标签 */
.object-banner {
  padding: 5px 8px;
  background: #242424;
  border-bottom: 1px solid #1e1e1e;
  display: flex;
  align-items: center;
  gap: 6px;
}
.object-type {
  font-size: 9px;
  color: #3884ff;
  font-weight: bold;
}
.object-name {
  color: #ffffff;
  font-weight: 600;
}

/* 树容器 */
.foldout-tree-container {
  flex: 1;
  background-color: #282828;
}

/* 折叠项 */
.unity-foldout-item {
  width: 100%;
}

/* 一级单行样式 (StyleSheet, Matching Selectors, Inlined Styles) */
.unity-foldout-item.level-1 > .foldout-header {
  height: 22px;
  background-color: #333333;
  border-top: 1px solid #3c3c3c;
  border-bottom: 1px solid #202020;
  padding-left: 6px;
}
.unity-foldout-item.level-1 > .foldout-header:hover {
  background-color: #3c3c3c;
}

/* 二级单行样式 (Display, Position, Flex, Align, Size, Text) */
.unity-foldout-item.level-2 > .foldout-header {
  height: 21px;
  background-color: #282828;
  border-bottom: 1px solid #202020;
  padding-left: 20px; /* 纯正截图中的二级向右缩进 */
}
.unity-foldout-item.level-2 > .foldout-header:hover {
  background-color: #313131;
}

/* Header 公共交互区 */
.foldout-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-right: 8px;
  transition: background-color 0.1s ease;
}

/* 核心：截图同款实心纯 CSS 三角形箭头 (▶ / ▼) */
.foldout-arrow {
  display: inline-block;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 6px solid #8e8e8e; /* 未展开：实心向右 ▶ */
  margin-right: 7px;
  flex-shrink: 0;
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), border-left-color 0.15s;
}

/* 展开态：旋转为向下三角 ▼，并提升亮度 */
.foldout-arrow.expanded {
  transform: rotate(90deg);
  border-left-color: #d6d6d6;
}

.foldout-label {
  color: #d6d6d6;
  font-size: 11px;
}
.font-bold {
  font-weight: 700;
  color: #eeeeee;
}

/* 折叠展开内容区 */
.foldout-content {
  display: none;
  background-color: #252525;
}
.foldout-content.show {
  display: block;
}

/* 展开后的紧凑表单项 */
.prop-detail {
  padding: 4px 12px 4px 28px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #1f1f1f;
}
.inner-form-row {
  padding: 3px 12px 3px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lbl {
  color: #888;
  font-size: 10px;
}
.u-input {
  width: 100px;
  height: 18px;
  background: #191919;
  border: 1px solid #383838;
  border-radius: 2px;
  color: #fff;
  font-size: 10px;
  padding: 0 4px;
  outline: none;
}
.u-input:focus {
  border-color: #3884ff;
}

.text-cyan { color: #4fc3f7; }
.text-green { color: #81c784; }
.font-mono { font-family: monospace; }

/* 底部状态 */
.unity-footer {
  height: 18px;
  background: #1c1c1c;
  border-top: 1px solid #161616;
  padding: 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
  color: #666;
}
</style>

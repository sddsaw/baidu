<template>
  <div class="unity-inspector-panel">
    
    <!-- 1. 顶部标题栏 (大气现代 Unity 风格，高度 40px) -->
    <div class="unity-title-bar">
      <div class="title-left">
        <iconify-icon icon="mdi:tune-vertical" class="title-icon"></iconify-icon>
        <span class="title-text">Inspector</span>
      </div>
      <div class="title-right">
        <button class="icon-btn" :class="{ active: isLocked }" title="Lock" @click="isLocked = !isLocked">
          <iconify-icon :icon="isLocked ? 'mdi:pin' : 'mdi:pin-outline'"></iconify-icon>
        </button>
        <button class="icon-btn" title="More Options">
          <iconify-icon icon="mdi:dots-vertical"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 2. 对象信息栏 -->
    <div class="object-banner">
      <div class="object-badge">ATE Object</div>
      <div class="object-name">PINMAP CONFIG TABLE</div>
    </div>

    <!-- 3. 核心折叠面板区 (高度舒展、透气舒适，告别局促紧凑) -->
    <div class="foldout-tree-container">

      <!-- 一级项 1: Common Properties (常用属性) -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('common')">
          <span class="foldout-arrow" :class="{ expanded: openStates.common }"></span>
          <span class="foldout-label">Common Properties</span>
        </div>
        
        <div class="foldout-content" :class="{ show: openStates.common }">
          <div class="prop-form-group">
            <div class="prop-row">
              <span class="prop-key">Table Name</span>
              <div class="prop-val">
                <el-input v-model="formData.tableName" size="default" />
              </div>
            </div>
            <div class="prop-row">
              <span class="prop-key">DUT Socket</span>
              <div class="prop-val">
                <el-input v-model="formData.socketName" size="default" />
              </div>
            </div>
            <div class="prop-row">
              <span class="prop-key">Routing Mode</span>
              <div class="prop-val">
                <el-input v-model="formData.routing" size="default" disabled />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 一级项 2: Pin Statistics (芯片引脚统计 - 支持二级展开) -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('pinStats')">
          <span class="foldout-arrow" :class="{ expanded: openStates.pinStats }"></span>
          <span class="foldout-label">Pin Statistics</span>
          <span class="header-extra font-mono">128 Total</span>
        </div>

        <div class="foldout-content" :class="{ show: openStates.pinStats }">
          <!-- 二级嵌套项: Digital I/O -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('digital')">
              <span class="foldout-arrow" :class="{ expanded: openStates.digital }"></span>
              <span class="foldout-label">Digital I/O Channels</span>
              <span class="count-tag text-blue">64</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.digital }">
              <div class="sub-detail-box">
                <div class="detail-line"><span>Drive Voltage:</span><span class="text-white">1.8V ~ 3.3V</span></div>
                <div class="detail-line"><span>Frequency Cap:</span><span class="text-white">400 MHz</span></div>
              </div>
            </div>
          </div>

          <!-- 二级嵌套项: Power Supplies -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('power')">
              <span class="foldout-arrow" :class="{ expanded: openStates.power }"></span>
              <span class="foldout-label">Power & GND Supplies</span>
              <span class="count-tag text-amber">56</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.power }">
              <div class="sub-detail-box">
                <div class="detail-line"><span>DPS Channels:</span><span class="text-white">24</span></div>
                <div class="detail-line"><span>GND Pins:</span><span class="text-white">32</span></div>
              </div>
            </div>
          </div>

          <!-- 二级嵌套项: Analog / RF -->
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('analog')">
              <span class="foldout-arrow" :class="{ expanded: openStates.analog }"></span>
              <span class="foldout-label">Analog / RF Pins</span>
              <span class="count-tag text-purple">8</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.analog }">
              <div class="sub-detail-box">
                <div class="detail-line"><span>Impedance:</span><span class="text-white">50 Ω Differential</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 一级项 3: Inlined Styles / Rules (截图样式复刻项，舒展大气) -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('inlinedStyles')">
          <span class="foldout-arrow" :class="{ expanded: openStates.inlinedStyles }"></span>
          <span class="foldout-label">Inlined Styles & Layout</span>
        </div>

        <div class="foldout-content" :class="{ show: openStates.inlinedStyles }">
          
          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('display')">
              <span class="foldout-arrow" :class="{ expanded: openStates.display }"></span>
              <span class="foldout-label">Display & Opacity</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.display }">
              <div class="sub-detail-box">
                <div class="detail-line"><span>Opacity:</span><span class="text-white">100%</span></div>
                <div class="detail-line"><span>Overflow:</span><span class="text-white">Hidden</span></div>
              </div>
            </div>
          </div>

          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('position')">
              <span class="foldout-arrow" :class="{ expanded: openStates.position }"></span>
              <span class="foldout-label">Position & Geometry</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.position }">
              <div class="sub-detail-box">
                <div class="detail-line"><span>Position Mode:</span><span class="text-white">Relative</span></div>
              </div>
            </div>
          </div>

          <div class="unity-foldout-item level-2">
            <div class="foldout-header" @click.stop="toggle('flex')">
              <span class="foldout-arrow" :class="{ expanded: openStates.flex }"></span>
              <span class="foldout-label">Flex & Alignment</span>
            </div>
            <div class="foldout-content" :class="{ show: openStates.flex }">
              <div class="sub-detail-box">
                <div class="detail-line"><span>Direction:</span><span class="text-white">Row</span></div>
                <div class="detail-line"><span>Justify:</span><span class="text-white">Space-Between</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 一级项 4: Validation Results (规则校验) -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('validation')">
          <span class="foldout-arrow" :class="{ expanded: openStates.validation }"></span>
          <span class="foldout-label">Validation Results</span>
          <el-tag size="small" type="success" effect="dark" class="header-tag">PASSED</el-tag>
        </div>

        <div class="foldout-content" :class="{ show: openStates.validation }">
          <div class="validation-box">
            <div class="val-row">
              <iconify-icon icon="mdi:check-circle" class="val-icon text-green"></iconify-icon>
              <span>All 128 tester channels valid & routed correctly</span>
            </div>
            <div class="val-row">
              <iconify-icon icon="mdi:check-circle" class="val-icon text-green"></iconify-icon>
              <span>No floating / unassigned pins in current map</span>
            </div>
            <div class="val-row">
              <iconify-icon icon="mdi:alert-circle" class="val-icon text-amber"></iconify-icon>
              <span>Pin 'CLK_EXT_01' skew threshold warning</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 一级项 5: Related Entities (优雅的空状态与微动效) -->
      <div class="unity-foldout-item level-1">
        <div class="foldout-header" @click="toggle('related')">
          <span class="foldout-arrow" :class="{ expanded: openStates.related }"></span>
          <span class="foldout-label">Related Entities</span>
        </div>

        <div class="foldout-content" :class="{ show: openStates.related }">
          <div class="empty-state-card" @click="handleLink">
            <iconify-icon icon="mdi:link-variant-off" class="empty-icon"></iconify-icon>
            <div class="empty-title">No related entities attached</div>
            <div class="empty-desc">Click here to associate Timing or Pattern sets</div>
            <button class="empty-btn">+ Link External Asset</button>
          </div>
        </div>
      </div>

    </div>

    <!-- 4. 底部状态与操作栏 (高度 42px，开阔实用) -->
    <div class="unity-footer">
      <div class="footer-status">
        <span class="status-pulse"></span>
        <span>Ready</span>
      </div>
      <el-button type="primary" size="small" class="apply-btn" @click="applyChanges">
        Apply Changes
      </el-button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const isLocked = ref(false);

const formData = reactive({
  tableName: 'SOC_TOP_PINMAP_V1',
  socketName: 'Socket_Site_01',
  routing: 'Direct 1:1 Tester Channel'
});

// 各项展开状态
const openStates = reactive({
  common: true,
  pinStats: true,
  digital: false,
  power: false,
  analog: false,
  inlinedStyles: true,
  display: false,
  position: false,
  flex: false,
  validation: true,
  related: true
});

const toggle = (key: keyof typeof openStates) => {
  openStates[key] = !openStates[key];
};

const applyChanges = () => {
  ElMessage.success('Pinmap properties applied successfully.');
};

const handleLink = () => {
  ElMessageBox.prompt('Enter entity name to link:', 'Link Entity', {
    confirmButtonText: 'Link',
    cancelButtonText: 'Cancel'
  }).then(({ value }) => {
    if (value) ElMessage.success(`Linked ${value}`);
  }).catch(() => {});
};
</script>

<style scoped>
/* 整个面板：舒展大气、宽 380px，不再矮小局促 */
.unity-inspector-panel {
  width: 380px;
  background-color: #242424;
  border: 1px solid #333333;
  border-radius: 6px;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  user-select: none;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 1. 顶部标题栏：高度提升到 38px */
.unity-title-bar {
  height: 38px;
  background-color: #1a1a1a;
  border-bottom: 1px solid #2f2f2f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}
.title-left {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}
.title-icon {
  font-size: 16px;
  color: #3884ff;
}
.title-right {
  display: flex;
  gap: 4px;
}
.icon-btn {
  background: transparent;
  border: none;
  color: #888888;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}
.icon-btn:hover {
  background: #333333;
  color: #ffffff;
}
.icon-btn.active {
  color: #3884ff;
  background: rgba(56, 132, 255, 0.15);
}

/* 2. 对象信息栏：高度舒展 */
.object-banner {
  padding: 8px 12px;
  background: linear-gradient(180deg, #2a2a2a 0%, #242424 100%);
  border-bottom: 1px solid #303030;
  display: flex;
  align-items: center;
  gap: 8px;
}
.object-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #3884ff;
  background: rgba(56, 132, 255, 0.12);
  padding: 2px 6px;
  border-radius: 3px;
}
.object-name {
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

/* 3. 树容器 */
.foldout-tree-container {
  flex: 1;
  background-color: #242424;
  overflow-y: auto;
  max-height: 720px;
}
.foldout-tree-container::-webkit-scrollbar {
  width: 5px;
}
.foldout-tree-container::-webkit-scrollbar-thumb {
  background: #3c3c3c;
  border-radius: 3px;
}

/* 折叠项公共 */
.unity-foldout-item {
  width: 100%;
}

/* 一级折叠栏 Header：高度提升至舒适大气的 36px (告别 22px 的矮小) */
.unity-foldout-item.level-1 > .foldout-header {
  height: 36px;
  background-color: #2e2e2e;
  border-top: 1px solid #383838;
  border-bottom: 1px solid #1c1c1c;
  padding: 0 12px;
}
.unity-foldout-item.level-1 > .foldout-header:hover {
  background-color: #353535;
}

/* 二级折叠栏 Header：高度 30px，缩进 24px */
.unity-foldout-item.level-2 > .foldout-header {
  height: 30px;
  background-color: #272727;
  border-bottom: 1px solid #202020;
  padding-left: 24px;
  padding-right: 12px;
}
.unity-foldout-item.level-2 > .foldout-header:hover {
  background-color: #303030;
}

.foldout-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

/* 核心：放大、舒展、精细的实心三角形 (▶ / ▼) */
.foldout-arrow {
  display: inline-block;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid #999999; /* 未展开：实心向右 ▶ */
  margin-right: 10px;
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-left-color 0.15s;
}

/* 展开态：旋转 90 度变成向下箭头 ▼ */
.foldout-arrow.expanded {
  transform: rotate(90deg);
  border-left-color: #ffffff;
}

/* 折叠标题文本 */
.unity-foldout-item.level-1 > .foldout-header .foldout-label {
  font-size: 13px;
  font-weight: 600;
  color: #eeeeee;
  flex: 1;
}
.unity-foldout-item.level-2 > .foldout-header .foldout-label {
  font-size: 12px;
  font-weight: 500;
  color: #cccccc;
  flex: 1;
}

.header-extra {
  font-size: 11px;
  color: #888888;
}
.header-tag {
  height: 20px !important;
  padding: 0 6px !important;
  font-size: 10px !important;
  font-weight: 700 !important;
}
.count-tag {
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
}

/* 折叠内容区 */
.foldout-content {
  display: none;
  background-color: #212121;
}
.foldout-content.show {
  display: block;
}

/* 表单组排版：呼吸感留白 */
.prop-form-group {
  padding: 10px 14px 12px;
}
.prop-row {
  display: flex;
  align-items: center;
  margin-bottom: 9px;
}
.prop-row:last-child {
  margin-bottom: 0;
}
.prop-key {
  width: 38%;
  font-size: 12px;
  color: #999999;
}
.prop-val {
  width: 62%;
}

/* 二级展开细节框 */
.sub-detail-box {
  padding: 8px 14px 10px 42px;
  background: #1d1d1d;
  border-bottom: 1px solid #171717;
}
.detail-line {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #888888;
  margin-bottom: 5px;
}
.detail-line:last-child {
  margin-bottom: 0;
}

/* 校验结果盒子 */
.validation-box {
  padding: 10px 14px;
}
.val-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #d0d0d0;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.val-row:last-child {
  border-bottom: none;
}
.val-icon {
  font-size: 15px;
  flex-shrink: 0;
}

/* 关联实体空状态卡片 */
.empty-state-card {
  margin: 10px 14px;
  padding: 16px 12px;
  background: rgba(26, 26, 26, 0.7);
  border: 1px dashed #3a3a3a;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.empty-state-card:hover {
  border-color: #3884ff;
  background: rgba(56, 132, 255, 0.04);
}
.empty-icon {
  font-size: 26px;
  color: #666666;
  margin-bottom: 6px;
  transition: transform 0.2s, color 0.2s;
}
.empty-state-card:hover .empty-icon {
  color: #3884ff;
  transform: scale(1.1);
}
.empty-title {
  font-size: 12px;
  font-weight: 500;
  color: #dddddd;
}
.empty-desc {
  font-size: 10px;
  color: #777777;
  margin-top: 2px;
}
.empty-btn {
  margin-top: 8px;
  background: transparent;
  border: none;
  color: #3884ff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

/* 4. 底部栏：高度 40px */
.unity-footer {
  height: 40px;
  background: #1a1a1a;
  border-top: 1px solid #2e2e2e;
  padding: 0 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #888888;
}
.footer-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50;
  box-shadow: 0 0 6px #4caf50;
}
.apply-btn {
  background: #2c5d88 !important;
  border-color: #2c5d88 !important;
  font-weight: 600 !important;
}
.apply-btn:hover {
  background: #356f9e !important;
}

/* 颜色工具 */
.text-blue { color: #64b5f6; }
.text-amber { color: #ffb74d; }
.text-purple { color: #ba68c8; }
.text-green { color: #81c784; }
.text-white { color: #ffffff; }
.font-mono { font-family: monospace; }
</style>

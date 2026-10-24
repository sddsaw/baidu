<template>
  <div
    id="vaporview-top"
    ref="rootRef"
    :style="{ gridTemplateColumns: `${col1Width}px ${col2Width}px 1fr` }"
    @contextmenu.prevent
  >
    <!-- 顶部原版 VaporView Control Bar -->
    <div id="control-bar">
      <svg xmlns="http://www.w3.org/2000/svg" style="display: none">
        <defs>
          <symbol id="binary-edge" viewBox="0 0 16 16">
            <path d="M 2 14 L 2 14 L 8 14 L 8 3 C 8 1 8 1 10 1 L 14 1 L 14 2 L 9 2 L 9 13 C 9 15 9 15 7 15 L 2 15 L 2 14" />
          </symbol>
          <symbol id="bus-edge" viewBox="0 0 16 16">
            <path d="M 2 1 L 6 1 L 8 6 L 10 1 L 14 1 L 14 2 L 10.663 2 L 8.562 7.5 L 10.663 14 L 14 14 L 14 15 L 10 15 L 8 9 L 6 15 L 2 15 L 2 14 L 5.337 14 L 7.437 7.5 L 5.337 2 L 2 2 L 2 1" />
          </symbol>
          <symbol id="arrow" viewBox="0 0 16 16">
            <path d="M 1 7 L 1 8 L 6 8 L 4 10 L 4.707 10.707 L 7.914 7.5 L 4.707 4.293 L 4 5 L 6 7 L 6 7 L 1 7" />
          </symbol>
          <symbol id="back-arrow" viewBox="0 0 16 16">
            <use href="#arrow" transform="scale(-1, 1) translate(-16, 0)" />
          </symbol>
          <symbol id="next-posedge" viewBox="0 0 16 16">
            <use href="#arrow" />
            <use href="#binary-edge" transform="translate(3, 0)" />
          </symbol>
          <symbol id="next-negedge" viewBox="0 0 16 16">
            <use href="#arrow" />
            <use href="#binary-edge" transform="translate(3, 16) scale(1, -1)" />
          </symbol>
          <symbol id="next-edge" viewBox="0 0 16 16">
            <use href="#arrow" />
            <use href="#bus-edge" transform="translate(3, 0)" />
          </symbol>
          <symbol id="previous-posedge" viewBox="0 0 16 16">
            <use href="#back-arrow" />
            <use href="#binary-edge" transform="translate(-3, 0)" />
          </symbol>
          <symbol id="previous-negedge" viewBox="0 0 16 16">
            <use href="#back-arrow" />
            <use href="#binary-edge" transform="translate(-3, 16) scale(1, -1)" />
          </symbol>
          <symbol id="previous-edge" viewBox="0 0 16 16">
            <use href="#back-arrow" />
            <use href="#bus-edge" transform="translate(-3, 0)" />
          </symbol>
          <symbol id="time-equals" viewBox="0 0 16 16">
            <text x="8" y="8" class="icon-text">t=</text>
          </symbol>
          <symbol id="search-hex" viewBox="0 0 16 16">
            <text x="8" y="8" class="icon-text">{{ currentSearchSymbol }}</text>
          </symbol>
          <symbol id="zoom-fit" viewBox="0 0 16 16">
            <path d="M 12.027 6.149 a 5.52 5.52 0 0 1 -1.27 3.908 l 4.26 4.26 l -0.7 0.71 l -4.26 -4.27 a 5.52 5.52 0 1 1 1.97 -4.608 z m -5.45 4.888 a 4.51 4.51 0 0 0 3.18 -1.32 l -0.04 0.02 a 4.51 4.51 0 0 0 1.36 -3.2 a 4.5 4.5 0 1 0 -4.5 4.5 z M 4 6 L 9 6 L 8 5 L 8.707 4.293 L 10.707 6.5 L 8.707 8.707 L 8 8 L 9 7 L 4 7 L 5 8 L 4.203 8.707 L 2.293 6.5 L 4.293 4.293 L 5 5 L 4 6" />
          </symbol>
          <symbol id="zoom-in-icon" viewBox="0 0 16 16">
            <path d="M 12.027 6.149 a 5.52 5.52 0 0 1 -1.27 3.908 l 4.26 4.26 l -0.7 0.71 l -4.26 -4.27 a 5.52 5.52 0 1 1 1.97 -4.608 z m -5.45 4.888 a 4.51 4.51 0 0 0 3.18 -1.32 l -0.04 0.02 a 4.51 4.51 0 0 0 1.36 -3.2 a 4.5 4.5 0 1 0 -4.5 4.5 z M 6 4 L 7 4 L 7 6 L 9 6 L 9 7 L 7 7 L 7 9 L 6 9 L 6 7 L 4 7 L 4 6 L 6 6 Z" />
          </symbol>
          <symbol id="zoom-out-icon" viewBox="0 0 16 16">
            <path d="M 12.027 6.149 a 5.52 5.52 0 0 1 -1.27 3.908 l 4.26 4.26 l -0.7 0.71 l -4.26 -4.27 a 5.52 5.52 0 1 1 1.97 -4.608 z m -5.45 4.888 a 4.51 4.51 0 0 0 3.18 -1.32 l -0.04 0.02 a 4.51 4.51 0 0 0 1.36 -3.2 a 4.5 4.5 0 1 0 -4.5 4.5 z M 4 6 L 9 6 L 9 7 L 4 7 Z" />
          </symbol>
          <symbol id="touchpad" viewBox="0 0 16 16">
            <path d="M 1 2 L 1 10 C 1 11 2 11 2 11 L 3 11 L 3 10 L 2 10 L 2 2 L 14 2 L 14 10 L 12 10 L 12 11 L 14 11 C 14 11 15 11 15 10 L 15 2 C 15 2 15 1 14 1 L 2 1 C 1 1 1 2 1 2 M 4 14 L 5 14 L 5 11 C 5 10 5 9 6 9 C 7 9 7 10 7 11 L 7 14 L 8 14 L 8 9 C 8 8 8 7 9 7 C 10 7 10 8 10 9 L 10 14 L 11 14 L 11 9 C 11 7 10.5 6 9 6 C 7.5 6 7 7 7 8 L 7 8.5 C 6.917 8.261 6.671 8.006 6 8 C 4.5 8 4 9 4 11 L 4 14" />
          </symbol>
          <symbol id="mouse" viewBox="0 0 16 16">
            <path d="M 3 14 L 3 8 Q 3 2 8 2 Q 13 2 13 8 L 13 14 L 12 14 L 12 8 Q 12 3 8.5 3 L 8.5 5 Q 9 5 9 6 L 9 7 Q 9 8 8.5 8 L 8.5 9 L 7.5 9 L 7.5 8 Q 7 8 7 7 L 7 6 Q 7 5 7.5 5 L 7.5 3 Q 4 3 4 8 L 4 14 L 3 14" />
          </symbol>
          <symbol id="auto" viewBox="0 0 16 16">
            <text x="8" y="8" class="icon-text">auto</text>
          </symbol>
          <symbol id="more-dots" viewBox="0 0 16 16">
            <circle cx="3" cy="8" r="1.4" />
            <circle cx="8" cy="8" r="1.4" />
            <circle cx="13" cy="8" r="1.4" />
          </symbol>
        </defs>
      </svg>

      <!-- 1. 缩放控制组 -->
      <div class="control-bar-group">
        <div
          class="control-bar-button"
          id="zoom-fit-button"
          title="Zoom to Fit (Ctrl/Command + 0)"
          @click="animateZoomRange(0, timeStop)"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#zoom-fit" /></svg>
        </div>
        <div
          class="control-bar-button"
          id="zoom-out-button"
          title="Zoom Out (Ctrl/Command + scroll down)"
          @click="handleZoom(1, (pseudoScrollLeft + halfViewerWidth) / zoomRatio, halfViewerWidth)"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#zoom-out-icon" /></svg>
        </div>
        <div
          class="control-bar-button"
          id="zoom-in-button"
          title="Zoom In (Ctrl/Command + scroll up)"
          @click="handleZoom(-1, (pseudoScrollLeft + halfViewerWidth) / zoomRatio, halfViewerWidth)"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#zoom-in-icon" /></svg>
        </div>
      </div>

      <!-- 2. 跳变沿跳转组 (上升沿 / 下降沿 / 任意边沿) -->
      <div class="control-bar-group">
        <div
          class="control-bar-button"
          :class="{ 'disabled-button': !binaryEdgeEnabled }"
          id="previous-negedge-button"
          title="Go To Previous Negative Edge Transition"
          @click="binaryEdgeEnabled && goToNextTransition(0, -1, ['0'])"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#previous-negedge" /></svg>
        </div>
        <div
          class="control-bar-button"
          :class="{ 'disabled-button': !binaryEdgeEnabled }"
          id="previous-posedge-button"
          title="Go To Previous Positive Edge Transition"
          @click="binaryEdgeEnabled && goToNextTransition(0, -1, ['1'])"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#previous-posedge" /></svg>
        </div>
        <div
          class="control-bar-button"
          :class="{ 'disabled-button': !busEdgeEnabled }"
          id="previous-edge-button"
          title="Go To Previous Transition (Left Arrow / Shift+N)"
          @click="busEdgeEnabled && goToNextTransition(0, -1, [])"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#previous-edge" /></svg>
        </div>
        <div
          class="control-bar-button"
          :class="{ 'disabled-button': !busEdgeEnabled }"
          id="next-edge-button"
          title="Go To Next Transition (Right Arrow / N)"
          @click="busEdgeEnabled && goToNextTransition(0, 1, [])"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#next-edge" /></svg>
        </div>
        <div
          class="control-bar-button"
          :class="{ 'disabled-button': !binaryEdgeEnabled }"
          id="next-posedge-button"
          title="Go To Next Positive Edge Transition"
          @click="binaryEdgeEnabled && goToNextTransition(0, 1, ['1'])"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#next-posedge" /></svg>
        </div>
        <div
          class="control-bar-button"
          :class="{ 'disabled-button': !binaryEdgeEnabled }"
          id="next-negedge-button"
          title="Go To Next Negative Edge Transition"
          @click="binaryEdgeEnabled && goToNextTransition(0, 1, ['0'])"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#next-negedge" /></svg>
        </div>
      </div>

      <!-- 3. 时间 / 数值搜索组 -->
      <div class="control-bar-group">
        <div
          id="search-container"
          :class="{ 'is-focused': searchInFocus, 'is-invalid': !searchValid && searchInput !== '' }"
        >
          <input
            id="search-bar"
            v-model="searchInput"
            class="search-input"
            autocomplete="off"
            spellcheck="false"
            placeholder="Search"
            @focus="searchInFocus = true"
            @blur="searchInFocus = false"
            @keydown.enter.prevent="handleSearchGoTo(1)"
            @keydown.stop
          />
          <div
            class="search-button"
            :class="{ 'selected-button': searchMode === 'time' }"
            title="Go to Time specified (t=)"
            @click="setSearchMode('time')"
          >
            <svg class="custom-icon" viewBox="0 0 16 16"><use href="#time-equals" /></svg>
          </div>
          <div
            class="search-button"
            :class="{ 'selected-button': searchMode === 'value' }"
            title="Search by Signal Value"
            @click="setSearchMode('value')"
          >
            <svg class="custom-icon" viewBox="0 0 16 16"><use href="#search-hex" /></svg>
          </div>
        </div>
        <div
          class="control-bar-button"
          :class="{ 'disabled-button': !canSearchPrev }"
          title="Previous Match"
          @click="canSearchPrev && handleSearchGoTo(-1)"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#back-arrow" /></svg>
        </div>
        <div
          class="control-bar-button"
          :class="{ 'disabled-button': !canSearchNext }"
          title="Next Match"
          @click="canSearchNext && handleSearchGoTo(1)"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#arrow" /></svg>
        </div>
      </div>

      <!-- 4. 鼠标 / 触控板 / 自动滚动模式切换 -->
      <div class="control-bar-group">
        <div
          class="format-button"
          :class="{ 'selected-button': scrollMode === 'Mouse' }"
          title="Enable Mouse Scrolling (Wheel = Horizontal Scroll, Shift+Wheel = Vertical, Ctrl+Wheel = Zoom)"
          @click="scrollMode = 'Mouse'"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#mouse" /></svg>
        </div>
        <div
          class="format-button"
          :class="{ 'selected-button': scrollMode === 'Touchpad' }"
          title="Enable Touchpad Scrolling (2-Finger Pan & Pinch)"
          @click="scrollMode = 'Touchpad'"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#touchpad" /></svg>
        </div>
        <div
          class="format-button"
          :class="{ 'selected-button': scrollMode === 'Auto' }"
          title="Auto Detect Mouse/Touchpad"
          @click="scrollMode = 'Auto'"
        >
          <svg class="custom-icon" viewBox="0 0 16 16"><use href="#auto" /></svg>
        </div>
      </div>

      <!-- 5. 进制切换与状态读数 -->
      <div class="control-bar-group radix-bar-group">
        <span
          v-for="fmt in ['hex', 'dec', 'signed', 'oct', 'bin']"
          :key="fmt"
          class="radix-pill"
          :class="{ active: currentSelectedFormat === fmt }"
          @click="applyFormatToSelected(fmt as RadixType)"
          :title="`Set display format to ${fmt.toUpperCase()}`"
        >
          {{ fmt.toUpperCase() }}
        </span>
      </div>

      <!-- 6. 游标差值测量快速信息 + 右侧设置按钮 -->
      <div class="control-bar-group control-bar-right">
        <div class="marker-delta-info" v-if="markerTime !== null">
          <span class="m-item">
            <span class="m-dot main-dot"></span>
            T1: {{ scaleTime(markerTime) }} {{ displayTimeUnit }}
          </span>
          <template v-if="altMarkerTime !== null">
            <span class="m-item">
              <span class="m-dot alt-dot"></span>
              T2: {{ scaleTime(altMarkerTime) }} {{ displayTimeUnit }}
            </span>
            <span class="m-item delta-pill">
              Δt: {{ formatSignedDelta(altMarkerTime - markerTime) }}
            </span>
            <span class="m-item freq-pill" v-if="altMarkerTime !== markerTime">
              {{ formatFreq(Math.abs(altMarkerTime - markerTime)) }}
            </span>
            <span class="m-clear" title="Clear Alt Marker (Alt+Click to place)" @click="clearAltMarker">×</span>
          </template>
          <span v-else class="m-hint" title="Alt + Click or Middle Click on waveform to place second marker">
            (Alt+Click 放置副游标)
          </span>
        </div>

        <div class="settings-wrapper">
          <div
            class="control-bar-button"
            id="settings-menu"
            title="VaporView Settings"
            @click.stop="settingsMenuOpen = !settingsMenuOpen"
          >
            <svg class="custom-icon" viewBox="0 0 16 16"><use href="#more-dots" /></svg>
          </div>

          <div v-if="settingsMenuOpen" class="vaporview-popup-menu settings-dropdown" @click.stop>
            <div class="menu-section-title">Display Settings</div>
            <label class="menu-check-item">
              <input type="checkbox" v-model="configRulerLines" @change="redrawViewport" />
              <span>Ruler Grid Lines</span>
            </label>
            <label class="menu-check-item">
              <input type="checkbox" v-model="configFillMultiBit" @change="redrawViewport" />
              <span>Fill Multi-Bit Bus</span>
            </label>
            <label class="menu-check-item">
              <input type="checkbox" v-model="configMultiBitFixedHeight" @change="redrawViewport" />
              <span>Fixed Height Multi-Bit</span>
            </label>
            <label class="menu-check-item">
              <input type="checkbox" v-model="configUseGlow" @change="redrawViewport" />
              <span>Waveform Glow Effect</span>
            </label>
            <label class="menu-check-item">
              <input type="checkbox" v-model="showFullPath" @change="redrawViewport" />
              <span>Show Full Scope Path</span>
            </label>
            <div class="menu-divider"></div>
            <div class="menu-section-title">Display Time Unit</div>
            <div class="unit-pills">
              <span
                v-for="u in ['fs', 'ps', 'ns', 'µs', 'ms', 's']"
                :key="u"
                class="unit-pill"
                :class="{ active: displayTimeUnit === u }"
                @click="updateUnits(u)"
              >
                {{ u }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可拖拽分隔条容器 (#viewer-container) -->
    <div id="viewer-container">
      <div
        id="resize-1"
        class="resize-bar"
        :class="resizingCol === 1 ? 'is-resizing' : 'is-idle'"
        :style="{ left: `${col1Width}px` }"
        @pointerdown="startColumnResize($event, 1)"
      ></div>
      <div
        id="resize-2"
        class="resize-bar"
        :class="resizingCol === 2 ? 'is-resizing' : 'is-idle'"
        :style="{ left: `${col1Width + col2Width}px` }"
        @pointerdown="startColumnResize($event, 2)"
      ></div>
    </div>

    <!-- 左侧第1列顶部空白表头 (#waveform-labels-spacer) -->
    <div id="waveform-labels-spacer" class="ruler-spacer">
      <span class="spacer-title">Signals ({{ activeSignals.length }})</span>
    </div>

    <!-- 左侧第1列：信号名列表 (#waveform-labels-container) -->
    <div
      id="waveform-labels-container"
      class="labels-container"
      @wheel.prevent="handleLabelsWheel"
      @click="handleContainerBlankClick"
    >
      <div id="waveform-labels" class="labels-group" :style="{ top: `${-pseudoScrollTop}px` }">
        <!-- 拖拽排序虚线指示器 -->
        <svg
          v-show="rowDragActive"
          id="drag-divider"
          :style="{ top: `${rowDragDividerY}px` }"
        >
          <line x1="0" y1="0" x2="100%" y2="0" />
        </svg>

        <div
          v-for="(sig, idx) in activeSignals"
          :key="sig.id"
          class="waveform-label is-idle"
          :class="{ 'is-draggable': rowDragActive && selectedSignalIds.includes(sig.id) }"
          :title="`Name: ${sig.fullName}\nType: ${sig.type}\nWidth: ${sig.size}`"
          @pointerdown="handleLabelPointerDown($event, sig, idx)"
          @click.stop="handleSignalRowClick($event, sig.id)"
          @contextmenu.prevent.stop="openSignalContextMenu($event, sig)"
        >
          <div
            class="waveform-row"
            :class="[
              getRowHeightCssClass(getSignalState(sig).rowHeight),
              {
                'is-selected': selectedSignalIds.includes(sig.id),
                'last-selected': lastSelectedSignalId === sig.id
              }
            ]"
          >
            <template v-if="showFullPath && getScopePrefix(sig)">
              <p class="scope-prefix">{{ getScopePrefix(sig) }}</p>
            </template>
            <p class="sig-leaf-name">{{ getLeafSignalName(sig) }}</p>
            <span
              class="row-del-btn"
              title="Remove Signal (Delete)"
              @click.stop="emit('remove-signal', sig.id)"
            >×</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 左侧第2列顶部空白表头 (#value-display-spacer) -->
    <div id="value-display-spacer" class="ruler-spacer">
      <span class="spacer-title">Value</span>
    </div>

    <!-- 左侧第2列：游标处信号值 (#value-display-container) -->
    <div
      id="value-display-container"
      class="labels-container"
      @wheel.prevent="handleLabelsWheel"
      @click="handleContainerBlankClick"
    >
      <div id="value-display" :style="{ top: `${-pseudoScrollTop}px` }">
        <div
          v-for="sig in activeSignals"
          :key="sig.id"
          class="value-display-item"
          :class="[
            getRowHeightCssClass(getSignalState(sig).rowHeight),
            {
              'is-selected': selectedSignalIds.includes(sig.id),
              'last-selected': lastSelectedSignalId === sig.id
            }
          ]"
          @click.stop="handleSignalRowClick($event, sig.id)"
          @contextmenu.prevent.stop="openSignalContextMenu($event, sig)"
        >
          <template v-for="(valPart, vIdx) in (formattedMarkerValuesMap[sig.id] || [])" :key="vIdx">
            <p v-if="vIdx > 0" class="transition-arrow">-&gt;</p>
            <p :style="{ color: valPart.color }">{{ valPart.text }}</p>
          </template>
        </div>
      </div>
    </div>

    <!-- 右侧第3列顶部：时间标尺与浮动游标时间标签 (#ruler) -->
    <div id="ruler" ref="rulerRef">
      <div
        id="main-marker-label"
        class="time-marker-label"
        v-show="markerTime !== null"
        :style="{ left: `${mainMarkerScreenX}px` }"
      >
        {{ markerTime !== null ? `${scaleTime(markerTime)} ${displayTimeUnit}` : '' }}
      </div>
      <div
        id="alt-marker-label"
        class="time-marker-label alt-label"
        v-show="altMarkerTime !== null"
        :style="{ left: `${altMarkerScreenX}px` }"
      >
        {{ altMarkerTime !== null ? `${scaleTime(altMarkerTime)} ${displayTimeUnit}` : '' }}
      </div>
      <canvas
        id="rulerCanvas"
        ref="rulerCanvasRef"
        @pointerdown="handleRulerPointerDown"
      ></canvas>
    </div>

    <!-- 右侧第3列主体：4层叠加视口 Canvas + 底部水平滚动条 + 右侧垂直滚动条 (#scrollArea) -->
    <div
      id="scrollArea"
      ref="scrollAreaRef"
      @wheel.prevent="handleScrollAreaWheel"
    >
      <div
        id="contentArea"
        ref="contentAreaRef"
        tabindex="0"
        @keydown="handleKeyDown"
      >
        <canvas id="viewport-selection" ref="selectionCanvasRef"></canvas>
        <canvas id="viewport-background" ref="backgroundCanvasRef"></canvas>
        <canvas id="viewport-waveforms" ref="waveformsCanvasRef"></canvas>
        <canvas
          id="viewport-overlay"
          ref="overlayCanvasRef"
          @pointerdown="handleScrollAreaPointerDown"
        ></canvas>
      </div>

      <!-- 原版 VaporView 底部水平滚动条 (#horizontal-scrollbar) -->
      <div
        id="horizontal-scrollbar"
        ref="scrollbarContainerHRef"
        @pointerdown="handleScrollbarTrackPointerDown($event, 'h')"
      >
        <canvas id="scrollbarAreaCanvas" ref="scrollbarCanvasRef"></canvas>
        <div
          id="horizontal-scrollbar-slider"
          class="scrollbar"
          :class="{ 'is-dragging': draggingScrollbar === 'h' }"
          :style="{
            width: `${scrollbarWidth}px`,
            left: `${scrollbarPositionX}px`,
            display: scrollbarHiddenX ? 'none' : 'block'
          }"
          @pointerdown.stop="handleScrollbarThumbPointerDown($event, 'h')"
        ></div>
      </div>

      <!-- 原版 VaporView 右侧垂直滚动条 (#vertical-scrollbar) -->
      <div
        id="vertical-scrollbar"
        ref="scrollbarContainerVRef"
        @pointerdown="handleScrollbarTrackPointerDown($event, 'v')"
      >
        <div
          id="vertical-scrollbar-slider"
          class="scrollbar"
          :class="{ 'is-dragging': draggingScrollbar === 'v' }"
          :style="{
            height: `${scrollbarHeight}px`,
            top: `${scrollbarPositionY}px`,
            display: scrollbarHiddenY ? 'none' : 'block'
          }"
          @pointerdown.stop="handleScrollbarThumbPointerDown($event, 'v')"
        ></div>
      </div>
    </div>

    <!-- 信号右键上下文菜单 (设置颜色、进制、行高、删除) -->
    <div
      v-if="contextMenu.visible && contextMenu.signal"
      class="vaporview-popup-menu signal-context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <div class="menu-section-title">{{ contextMenu.signal.name }}</div>
      <div class="menu-row-group">
        <span class="menu-label">Radix:</span>
        <div class="unit-pills">
          <span
            v-for="fmt in (contextMenu.signal.size > 1 ? ['hex', 'dec', 'signed', 'oct', 'bin', 'ascii'] : ['bin', 'hex'])"
            :key="fmt"
            class="unit-pill"
            :class="{ active: getSignalState(contextMenu.signal).format === fmt }"
            @click="setSignalFormat(contextMenu.signal, fmt as RadixType)"
          >
            {{ fmt.toUpperCase() }}
          </span>
        </div>
      </div>
      <div class="menu-row-group">
        <span class="menu-label">Color:</span>
        <div class="color-swatches">
          <span
            v-for="(c, cIdx) in colorPalette"
            :key="c"
            class="color-swatch"
            :class="{ active: getSignalState(contextMenu.signal).colorIndex === cIdx }"
            :style="{ backgroundColor: c }"
            @click="setSignalColor(contextMenu.signal, cIdx)"
          ></span>
        </div>
      </div>
      <div class="menu-row-group">
        <span class="menu-label">Height:</span>
        <div class="unit-pills">
          <span
            v-for="h in [1, 2, 4]"
            :key="h"
            class="unit-pill"
            :class="{ active: getSignalState(contextMenu.signal).rowHeight === h }"
            @click="setSignalRowHeight(contextMenu.signal, h)"
          >
            {{ h }}x
          </span>
        </div>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-action-item" @click="copyMarkerValue(contextMenu.signal)">
        Copy Value at Marker
      </div>
      <div class="menu-action-item danger" @click="removeSignalFromMenu(contextMenu.signal.id)">
        Remove Signal
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick, toRaw } from 'vue'
import type { VcdMetadata, VcdSignalData, VcdTransition } from '../types'

type RadixType = 'hex' | 'dec' | 'signed' | 'oct' | 'bin' | 'ascii'

interface SignalViewState {
  colorIndex: number
  color: string
  format: RadixType
  rowHeight: number // 1 | 2 | 4 | 8
}

const props = defineProps<{
  metadata: VcdMetadata
  activeSignals: VcdSignalData[]
  selectedSignalId?: string | null
}>()

const emit = defineEmits<{
  (e: 'remove-signal', id: string): void
  (e: 'update:selectedSignalId', id: string | null): void
  (e: 'reorder-signals', newOrderIds: string[]): void
}>()

// DOM 引用
const rootRef = ref<HTMLDivElement | null>(null)
const rulerRef = ref<HTMLDivElement | null>(null)
const rulerCanvasRef = ref<HTMLCanvasElement | null>(null)
const scrollAreaRef = ref<HTMLDivElement | null>(null)
const contentAreaRef = ref<HTMLDivElement | null>(null)
const selectionCanvasRef = ref<HTMLCanvasElement | null>(null)
const backgroundCanvasRef = ref<HTMLCanvasElement | null>(null)
const waveformsCanvasRef = ref<HTMLCanvasElement | null>(null)
const overlayCanvasRef = ref<HTMLCanvasElement | null>(null)
const scrollbarCanvasRef = ref<HTMLCanvasElement | null>(null)
const scrollbarContainerHRef = ref<HTMLDivElement | null>(null)
const scrollbarContainerVRef = ref<HTMLDivElement | null>(null)

// 原版 VaporView 尺寸常量 (来自 style.css / vscode_wrapper.ts)
const BASE_ROW_HEIGHT = 28
const ROW_PADDING = 4
const RULER_HEIGHT = 36
const SCROLLBAR_HEIGHT = 12
const SCROLLBAR_WIDTH = 14
const MIN_NUMBER_SPACING = 100
const MIN_TICK_SPACING = 20

// 原版 VaporView 暗色主题色板 (来自 ThemeColors)
const colorPalette = [
  '#b5cea8', // 0: VSCode debugTokenExpression-number (经典浅绿数字色)
  '#61afef', // 1: 经典信号亮蓝
  '#ce9178', // 2: VSCode debugTokenExpression-string (暖橙色)
  '#4ec9b0', // 3: VSCode debugTokenExpression-type (青绿色)
  '#dcdcaa', // 4: 金黄色
  '#c586c0', // 5: 亮紫罗兰
  '#9cdcfe', // 6: 天蓝色
  '#98c379'  // 7: 翠绿色
]

const themeStyles = {
  backgroundColor: '#1e1e1e',
  xzColor: '#f44747',
  textColor: '#d4d4d4',
  rulerTextColor: '#858585',
  rulerGuideColor: '#33363b',
  edgeGuideColor: '#d19a66',
  markerColor: '#e2e2e2',
  altMarkerColor: '#56b6c2',
  highlightColor: '#264f78',
  markerAnnotation: 'rgba(226, 226, 226, 0.85)',
  altMarkerAnnotation: 'rgba(86, 182, 194, 0.85)',
  selectionBackgroundColor: 'rgba(38, 79, 120, 0.45)',
  selectionContrastBorder: 'rgba(255, 255, 255, 0.35)',
  selectionBorderColor: '#007fd4',
  fontStyle: '12px "JetBrains Mono", Menlo, Monaco, Consolas, monospace'
}

let characterWidth = 7.25

// 列宽与拖拽调整状态
const col1Width = ref(215)
const col2Width = ref(95)
const resizingCol = ref<number | null>(null)

// 原版 VaporView 配置开关
const configRulerLines = ref(true)
const configFillMultiBit = ref(false)
const configMultiBitFixedHeight = ref(true)
const configUseGlow = ref(false)
const showFullPath = ref(true)
const settingsMenuOpen = ref(false)
const scrollMode = ref<'Mouse' | 'Touchpad' | 'Auto'>('Auto')

// 信号个性化显示状态缓存 (每个信号的进制、颜色、行高)
const signalStates = reactive<Record<string, SignalViewState>>({})

const getSignalState = (sig: VcdSignalData): SignalViewState => {
  if (!signalStates[sig.id]) {
    const defaultColorIdx = sig.size === 1 ? 0 : 1
    signalStates[sig.id] = {
      colorIndex: defaultColorIdx,
      color: colorPalette[defaultColorIdx],
      format: sig.size === 1 ? 'bin' : 'hex',
      rowHeight: 1
    }
  }
  return signalStates[sig.id]
}

// 选中信号状态
const selectedSignalIds = ref<string[]>(props.selectedSignalId ? [props.selectedSignalId] : [])
const lastSelectedSignalId = ref<string | null>(props.selectedSignalId || null)

watch(() => props.selectedSignalId, (newId) => {
  if (newId && !selectedSignalIds.value.includes(newId)) {
    selectedSignalIds.value = [newId]
    lastSelectedSignalId.value = newId
    revealSignal(newId)
    redrawViewport()
  }
})

// 视口与缩放滚动核心变量 (完全对齐原版 vaporview/src/webview/viewport.ts)
const pixelRatio = ref(window.devicePixelRatio || 1)
const viewerWidth = ref(800)
const viewerHeight = ref(500)
const rulerWidth = ref(814)
const halfViewerWidth = computed(() => viewerWidth.value / 2)

const timeScale = ref(1)
const timeUnit = ref('ns')
const displayTimeUnit = ref('ns')
const adjustedLogTimeScale = ref(0)
const timeStop = ref(2000)

const defaultPixelTime = ref(1)
const zoomRatio = ref(1) // 每单位时间的像素数 (px / timeUnit)
const pixelTime = ref(1) // 每像素代表的时间 (1 / zoomRatio)
const minZoomRatio = ref(0.01)
const maxZoomRatio = ref(256)
const minDrawWidth = ref(1)
const zoomOffset = ref(0)

const pseudoScrollLeft = ref(0)
const maxScrollLeft = ref(0)
const timeScrollLeft = ref(0)
const viewerWidthTime = ref(800)
const timeScrollRight = ref(800)

const pseudoScrollTop = ref(0)
const waveformsHeight = ref(0)
const maxScrollTop = ref(0)

// 底部水平滚动条与右侧垂直滚动条滑块参数
const scrollbarWidth = ref(17)
const maxScrollbarPositionX = ref(0)
const scrollbarPositionX = ref(0)
const scrollbarHiddenX = ref(false)

const scrollbarHeight = ref(17)
const maxScrollbarPositionY = ref(0)
const scrollbarPositionY = ref(0)
const scrollbarHiddenY = ref(true)
const draggingScrollbar = ref<'h' | 'v' | null>(null)

// 标尺间距参数
const rulerNumberSpacing = ref(100)
const rulerTickSpacing = ref(20)
const rulerNumberIncrement = ref(100)
let rulerLineX: [number, number][] = []

// 游标状态 (markerTime 主游标 + altMarkerTime 副游标)
const markerTime = ref<number | null>(null)
const altMarkerTime = ref<number | null>(null)

// 搜索栏状态
const searchInput = ref('')
const searchMode = ref<'time' | 'value'>('time')
const searchInFocus = ref(false)

// 行拖拽排序状态
const rowDragActive = ref(false)
const rowDragDividerY = ref(0)

// 右键菜单状态
const contextMenu = reactive<{
  visible: boolean
  x: number
  y: number
  signal: VcdSignalData | null
}>({
  visible: false,
  x: 0,
  y: 0,
  signal: null
})

// ---------------------------------------------------------------------------
// 单位换算与格式化工具 (对齐 vaporview/src/common/functions.ts & value_format.ts)
// ---------------------------------------------------------------------------
const logScaleFromUnits = (units: string): number => {
  switch (units) {
    case 'fs': return -15
    case 'ps': return -12
    case 'ns': return -9
    case 'us':
    case 'µs': return -6
    case 'ms': return -3
    case 's': return 0
    default: return -9
  }
}

const scaleTime = (time: number): number => {
  let result: number
  if (adjustedLogTimeScale.value >= 0) {
    const scale = 10 ** adjustedLogTimeScale.value
    result = time * timeScale.value * scale
  } else {
    const scale = 10 ** -adjustedLogTimeScale.value
    result = (time * timeScale.value) / scale
  }
  return Math.round(result * 1e6) / 1e6
}

const updateUnits = (units: string) => {
  const validUnits = ['fs', 'ps', 'ns', 'µs', 'us', 'ms', 's']
  if (!validUnits.includes(units)) return
  const normalized = units === 'us' ? 'µs' : units
  displayTimeUnit.value = normalized
  adjustedLogTimeScale.value = logScaleFromUnits(timeUnit.value) - logScaleFromUnits(normalized)
  settingsMenuOpen.value = false
  updateRuler()
}

const formatSignedDelta = (delta: number): string => {
  const scaled = scaleTime(delta)
  const sign = scaled > 0 ? '+' : ''
  return `${sign}${scaled} ${displayTimeUnit.value}`
}

const formatFreq = (delta: number): string => {
  if (!delta) return ''
  const unitScale = 10 ** logScaleFromUnits(timeUnit.value)
  const seconds = delta * timeScale.value * unitScale
  if (seconds <= 0) return ''
  const freq = 1 / seconds
  if (freq >= 1e9) return `${(freq / 1e9).toFixed(2)} GHz`
  if (freq >= 1e6) return `${(freq / 1e6).toFixed(2)} MHz`
  if (freq >= 1e3) return `${(freq / 1e3).toFixed(2)} kHz`
  return `${freq.toFixed(1)} Hz`
}

const valueIs9State = (val: string): boolean => {
  const len = val.length
  if (len === 1) {
    const c = val.charCodeAt(0)
    return c !== 48 && c !== 49 // '0' = 48, '1' = 49
  }
  for (let i = 0; i < len; i++) {
    const c = val.charCodeAt(i)
    if (c !== 48 && c !== 49) return true
  }
  return false
}

const padBinaryValue = (raw: string, width: number): string => {
  if (!raw) return '0'.repeat(Math.max(1, width))
  if (raw.length >= width) return raw
  const c0 = raw.charCodeAt(0)
  const isXZ = c0 === 120 || c0 === 88 || c0 === 122 || c0 === 90 // x, X, z, Z
  const padChar = isXZ ? raw[0].toLowerCase() : '0'
  return raw.padStart(width, padChar)
}

// 格式化字符串高速缓存：避免 100MB 大文件重绘时对相同总线值重复执行正则与进制转换
const formatValueCache = new Map<string, string>()
const MAX_FORMAT_CACHE_SIZE = 16384

const formatSignalValue = (rawVal: string, width: number, format: RadixType): string => {
  if (width <= 1 && format !== 'hex') {
    return rawVal || '0'
  }
  const cacheKey = `${format}:${width}:${rawVal}`
  const cached = formatValueCache.get(cacheKey)
  if (cached !== undefined) return cached

  const binStr = padBinaryValue(rawVal.toLowerCase(), width)
  const is2State = !valueIs9State(binStr)
  let result = binStr

  if (format === 'bin') {
    result = binStr.replace(/\B(?=(\w{4})+(?!\w))/g, '_')
  } else if (format === 'hex') {
    if (!is2State) {
      const chunks = binStr.replace(/\B(?=(.{4})+(?!.))/g, '_').split('_')
      result = chunks
        .map((chunk) => {
          if (chunk.includes('z')) return 'z'
          if (chunk.includes('x')) return 'x'
          if (chunk.includes('u')) return 'u'
          if (chunk.includes('w')) return 'w'
          return parseInt(chunk, 2).toString(16)
        })
        .join('')
        .replace(/\B(?=(.{4})+(?!.))/g, '_')
    } else {
      const chunks = binStr.replace(/\B(?=(\d{16})+(?!\d))/g, '_').split('_')
      result = chunks
        .map((chunk) => {
          const digits = Math.ceil(chunk.length / 4)
          return parseInt(chunk, 2).toString(16).padStart(digits, '0')
        })
        .join('_')
    }
  } else if (format === 'oct') {
    if (!is2State) {
      result = binStr.replace(/\B(?=(\w{3})+(?!\w))/g, '_')
    } else {
      try {
        result = BigInt(`0b${binStr}`).toString(8)
      } catch {
        result = binStr
      }
    }
  } else if (format === 'dec') {
    if (!is2State) {
      result = binStr.replace(/\B(?=(\w{4})+(?!\w))/g, '_')
    } else {
      try {
        result = BigInt(`0b${binStr}`).toString(10)
      } catch {
        result = binStr
      }
    }
  } else if (format === 'signed') {
    if (!is2State) {
      result = binStr.replace(/\B(?=(\w{4})+(?!\w))/g, '_')
    } else {
      try {
        const unsigned = BigInt(`0b${binStr}`)
        if (binStr.charCodeAt(0) === 49) {
          result = (unsigned - (1n << BigInt(binStr.length))).toString(10)
        } else {
          result = unsigned.toString(10)
        }
      } catch {
        result = binStr
      }
    }
  } else if (format === 'ascii') {
    if (is2State) {
      const bytes = binStr.replace(/\B(?=(\d{8})+(?!\d))/g, '_').split('_')
      result = bytes
        .map((b) => {
          const code = parseInt(b, 2)
          return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.'
        })
        .join('')
    }
  }

  if (formatValueCache.size >= MAX_FORMAT_CACHE_SIZE) {
    formatValueCache.clear()
  }
  formatValueCache.set(cacheKey, result)
  return result
}

// ---------------------------------------------------------------------------
// 信号名称展示与行高计算
// ---------------------------------------------------------------------------
const getRowHeightCssClass = (h: number): string => {
  switch (h) {
    case 2: return 'height2x'
    case 4: return 'height4x'
    case 8: return 'height8x'
    default: return 'height1x'
  }
}

const getScopePrefix = (sig: VcdSignalData): string => {
  if (!sig.scope || sig.scope === 'ROOT') return ''
  return `${sig.scope}.`
}

const getLeafSignalName = (sig: VcdSignalData): string => {
  const name = sig.name || sig.fullName
  if (sig.size > 1 && !name.includes('[')) {
    return `${name}[${sig.size - 1}:0]`
  }
  return name
}

// 计算每一行的 [topBounds, bottomBounds]
const rowBoundsMap = computed<Record<string, [number, number]>>(() => {
  const map: Record<string, [number, number]> = {}
  let y = 0
  for (const sig of props.activeSignals) {
    const st = getSignalState(sig)
    const h = st.rowHeight * BASE_ROW_HEIGHT
    map[sig.id] = [y, y + h]
    y += h
  }
  return map
})

const getRowBounds = (sigId: string): [number, number] | null => {
  return rowBoundsMap.value[sigId] || null
}

// ---------------------------------------------------------------------------
// 二分查找与跳变沿查询 (对齐 vaporview/src/webview/data_manager.ts)
// ---------------------------------------------------------------------------
const binarySearchTransitions = (transitions: VcdTransition[], targetTime: number): number => {
  let low = 0
  let high = transitions.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (transitions[mid].time < targetTime) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return low
}

// 子像素聚合步进跳跃：在 [low, high) 中利用指数探测 (Galloping Search) + 二分查找定位最后一个 time < maxTime 的索引
// 当 100MB 大文件处于宏观缩放 (每个像素内包含数百个跳变沿) 时，可将百万次线性遍历降为 O(viewerWidth) 次跳跃，且视觉 100% 无损
const findLastIndexBefore = (
  transitions: VcdTransition[],
  low: number,
  high: number,
  maxTime: number
): number => {
  if (low + 1 >= high || transitions[low + 1].time >= maxTime) {
    return low
  }
  let step = 4
  let l = low + 1
  let r = l + step
  while (r < high && transitions[r].time < maxTime) {
    l = r
    step <<= 1
    r = l + step
  }
  if (r > high) r = high
  while (l + 1 < r) {
    const mid = (l + r) >>> 1
    if (transitions[mid].time < maxTime) {
      l = mid
    } else {
      r = mid
    }
  }
  return l
}

// 确保 0 时刻有初始状态，并使用 WeakMap 缓存归一化数组，彻底杜绝每帧重绘时展开拷贝数十万元素的数组
const normalizedTransitionsCache = new WeakMap<object, VcdTransition[]>()

const getNormalizedTransitions = (sig: VcdSignalData): VcdTransition[] => {
  const rawSig = toRaw(sig)
  const cached = normalizedTransitionsCache.get(rawSig)
  if (cached) return cached

  const raw = rawSig.transitions ? toRaw(rawSig.transitions) : []
  let normalized: VcdTransition[]
  if (raw.length === 0) {
    normalized = [{ time: 0, value: 'x'.repeat(Math.max(1, rawSig.size)) }]
  } else if (raw[0].time > 0) {
    normalized = [{ time: 0, value: 'x'.repeat(Math.max(1, rawSig.size)) }, ...raw]
  } else {
    normalized = raw
  }
  normalizedTransitionsCache.set(rawSig, normalized)
  return normalized
}

// 获取指定时刻的信号值数组 (若恰好处于跳变沿，返回 [旧值, 新值] 以展示 0 -> 1)
const getValueAtTime = (sig: VcdSignalData, time: number | null): string[] => {
  if (time === null) return []
  const data = getNormalizedTransitions(sig)
  if (data.length === 0) return []

  let index = binarySearchTransitions(data, time)
  const result: string[] = []

  if (index < data.length && time === data[index].time) {
    if (index > 0) {
      result.push(data[index - 1].value)
    }
    while (index < data.length && data[index].time === time) {
      if (result[result.length - 1] !== data[index].value) {
        result.push(data[index].value)
      }
      index++
    }
  } else {
    const prevIdx = Math.max(0, index - 1)
    result.push(data[prevIdx].value)
  }
  return result
}

const getFormattedMarkerValues = (sig: VcdSignalData): { text: string; color: string }[] => {
  const vals = getValueAtTime(sig, markerTime.value)
  const st = getSignalState(sig)
  return vals.map((v) => {
    const is9 = valueIs9State(v)
    return {
      text: formatSignalValue(v, sig.size, st.format),
      color: is9 ? themeStyles.xzColor : st.color
    }
  })
}

// 缓存主游标处各信号的格式化显示结果：仅当 markerTime、激活信号或信号格式改变时才重算，水平滚动时 0 计算开销
const formattedMarkerValuesMap = computed<Record<string, { text: string; color: string }[]>>(() => {
  const map: Record<string, { text: string; color: string }[]> = {}
  for (const sig of props.activeSignals) {
    map[sig.id] = getFormattedMarkerValues(sig)
  }
  return map
})

const getNearestTransition = (sig: VcdSignalData, time: number | null): VcdTransition | null => {
  if (time === null) return null
  const data = getNormalizedTransitions(sig)
  if (data.length === 0) return null
  const index = binarySearchTransitions(data, time)
  if (index >= data.length) return data[data.length - 1]
  if (data[index].time === time || index === 0) return data[index]

  const timeBefore = time - data[index - 1].time
  const timeAfter = data[index].time - time
  return timeBefore < timeAfter ? data[index - 1] : data[index]
}

const getNextEdge = (sig: VcdSignalData, time: number, direction: number, edgeValues: string[]): number | null => {
  const data = getNormalizedTransitions(sig)
  if (data.length === 0) return null
  const index = binarySearchTransitions(data, time)
  const anyEdge = edgeValues.length === 0

  if (direction === 1) {
    for (let i = index; i < data.length; i++) {
      const match = anyEdge || edgeValues.includes(data[i].value)
      if (match && data[i].time > time) {
        return data[i].time
      }
    }
  } else {
    const startIdx = Math.min(Math.max(0, index), data.length - 1)
    for (let i = startIdx; i >= 0; i--) {
      const match = anyEdge || edgeValues.includes(data[i].value)
      if (match && data[i].time < time) {
        return data[i].time
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Control Bar 跳变沿按钮与搜索状态
// ---------------------------------------------------------------------------
const selectedSignalsList = computed<VcdSignalData[]>(() => {
  return props.activeSignals.filter((s) => selectedSignalIds.value.includes(s.id))
})

const busEdgeEnabled = computed(() => selectedSignalsList.value.length > 0)
const binaryEdgeEnabled = computed(() => {
  return selectedSignalsList.value.length > 0 && selectedSignalsList.value.every((s) => s.size === 1)
})

const currentSelectedFormat = computed<RadixType>(() => {
  const first = selectedSignalsList.value[0] || props.activeSignals[0]
  if (!first) return 'hex'
  return getSignalState(first).format
})

const currentSearchSymbol = computed(() => {
  const fmt = currentSelectedFormat.value
  return fmt === 'signed' ? 'int' : fmt
})

const applyFormatToSelected = (fmt: RadixType) => {
  const targets = selectedSignalsList.value.length > 0 ? selectedSignalsList.value : props.activeSignals
  for (const sig of targets) {
    if (sig.size === 1 && fmt !== 'bin' && fmt !== 'hex') continue
    getSignalState(sig).format = fmt
  }
  redrawViewport()
}

const goToNextTransition = (markerType: 0 | 1, direction: 1 | -1, edgeValues: string[]) => {
  const curTime = (markerType === 0 ? markerTime.value : altMarkerTime.value) ?? 0
  const targets = selectedSignalsList.value.length > 0 ? selectedSignalsList.value : props.activeSignals.slice(0, 1)
  if (targets.length === 0) return

  const candidates: number[] = []
  for (const sig of targets) {
    const nextT = getNextEdge(sig, curTime, direction, edgeValues)
    if (nextT !== null) candidates.push(nextT)
  }
  if (candidates.length === 0) return

  const targetTime = direction === 1 ? Math.min(...candidates) : Math.max(...candidates)
  setMarkerTime(targetTime, markerType, false)
}

const setSearchMode = (mode: 'time' | 'value') => {
  searchMode.value = mode
  searchInFocus.value = true
}

const searchValid = computed(() => {
  const txt = searchInput.value.trim()
  if (!txt) return true
  if (searchMode.value === 'time') {
    return /^[0-9,_]+$/.test(txt)
  }
  return /^[0-9a-fA-FxzXZ_]+$/.test(txt.replace(/^0x/i, ''))
})

const canSearchPrev = computed(() => {
  return searchValid.value && searchInput.value.trim() !== '' && searchMode.value === 'value'
})

const canSearchNext = computed(() => {
  return searchValid.value && searchInput.value.trim() !== ''
})

const handleSearchGoTo = (direction: 1 | -1) => {
  const txt = searchInput.value.trim()
  if (!txt || !searchValid.value) return

  if (searchMode.value === 'time') {
    const rawNum = parseInt(txt.replace(/[,_]/g, ''), 10)
    if (!isNaN(rawNum)) {
      const clamped = Math.max(0, Math.min(timeStop.value, rawNum))
      setMarkerTime(clamped, 0, false)
    }
    return
  }

  const targetSig = selectedSignalsList.value[0] || props.activeSignals[0]
  if (!targetSig) return
  const st = getSignalState(targetSig)
  const trans = getNormalizedTransitions(targetSig)
  const startT = markerTime.value ?? 0
  let idx = binarySearchTransitions(trans, startT)
  if (direction === -1) idx = Math.min(idx - 1, trans.length - 1)
  else if (idx < trans.length && trans[idx].time === startT) idx += 1

  const queryClean = txt.replace(/^0x/i, '').replace(/_/g, '').toLowerCase()

  for (let i = idx; i >= 0 && i < trans.length; i += direction) {
    const formatted = formatSignalValue(trans[i].value, targetSig.size, st.format).replace(/_/g, '').toLowerCase()
    const rawBin = trans[i].value.toLowerCase()
    if (formatted.includes(queryClean) || rawBin.includes(queryClean)) {
      setMarkerTime(trans[i].time, 0, false)
      break
    }
  }
}

// ---------------------------------------------------------------------------
// 视口坐标、滚动条、缩放核心实现 (100% 移植 vaporview/src/webview/viewport.ts)
// ---------------------------------------------------------------------------
const getViewportLeft = (time: number, clamp: number): number => {
  const x = time * zoomRatio.value - pseudoScrollLeft.value
  return Math.max(Math.min(x, viewerWidth.value + clamp), -clamp)
}

const mainMarkerScreenX = computed(() => {
  if (markerTime.value === null) return 0
  return getViewportLeft(markerTime.value, 100)
})

const altMarkerScreenX = computed(() => {
  if (altMarkerTime.value === null) return 0
  return getViewportLeft(altMarkerTime.value, 100)
})

const isInView = (time: number): boolean => {
  return time >= timeScrollLeft.value && time <= timeScrollRight.value
}

const moveViewToTime = (time: number): boolean => {
  if (!isInView(time)) {
    handleScrollEvent(time * zoomRatio.value - halfViewerWidth.value, pseudoScrollTop.value)
    return true
  }
  return false
}

const setMarkerTime = (time: number | null, markerType: 0 | 1, dragging: boolean) => {
  if (time !== null && (time < 0 || time > timeStop.value)) return
  if (markerType === 0) {
    markerTime.value = time
    if (time !== null && !dragging) {
      moveViewToTime(time)
      if (searchMode.value === 'time' && !searchInFocus.value) {
        searchInput.value = String(Math.round(time))
      }
    }
  } else {
    altMarkerTime.value = time
  }
  updateScrollContainer()
  updateOverlayCanvas()
}

const clearAltMarker = () => {
  altMarkerTime.value = null
  updateScrollContainer()
  updateOverlayCanvas()
}

const updateWaveformsHeight = () => {
  if (props.activeSignals.length === 0) {
    waveformsHeight.value = 0
  } else {
    const lastSig = props.activeSignals[props.activeSignals.length - 1]
    const bounds = getRowBounds(lastSig.id)
    waveformsHeight.value = bounds ? bounds[1] : 0
  }
  updateVerticalScrollbar()
}

// 原版水平滚动条计算与游标刻度绘制
const updateHorizontalScrollbar = () => {
  const totalTimeWidth = Math.max(timeStop.value * zoomRatio.value, viewerWidth.value)
  scrollbarWidth.value = Math.max(
    Math.min(Math.round((viewerWidth.value ** 2) / totalTimeWidth), viewerWidth.value),
    17
  )
  maxScrollbarPositionX.value = Math.max(viewerWidth.value - scrollbarWidth.value, 0)
  updateScrollbarPositionX()
  updateScrollContainer()
}

const updateScrollbarPositionX = () => {
  // 始终展示底部水平滚动条滑块：当放大时按比例定位，全览 (maxScrollLeft === 0) 时铺满轨道
  scrollbarHiddenX.value = false
  if (maxScrollLeft.value <= 0 || maxScrollbarPositionX.value <= 0) {
    scrollbarPositionX.value = 0
  } else {
    scrollbarPositionX.value = Math.round(
      (pseudoScrollLeft.value / maxScrollLeft.value) * maxScrollbarPositionX.value
    )
  }
}

const updateVerticalScrollbar = () => {
  maxScrollTop.value = Math.max(waveformsHeight.value - viewerHeight.value, 0)
  if (waveformsHeight.value <= 0) {
    scrollbarHeight.value = viewerHeight.value
  } else {
    scrollbarHeight.value = Math.max(
      Math.min(Math.round((viewerHeight.value ** 2) / waveformsHeight.value), viewerHeight.value),
      17
    )
  }
  maxScrollbarPositionY.value = Math.max(viewerHeight.value - scrollbarHeight.value, 0)
  updateScrollbarPositionY()
}

const updateScrollbarPositionY = () => {
  scrollbarHiddenY.value = maxScrollTop.value === 0
  if (maxScrollTop.value <= 0 || maxScrollbarPositionY.value <= 0) {
    scrollbarPositionY.value = 0
  } else {
    scrollbarPositionY.value = Math.round(
      (pseudoScrollTop.value / maxScrollTop.value) * maxScrollbarPositionY.value
    )
  }
}

// 在底部水平滚动条画布 (#scrollbarAreaCanvas) 上绘制游标位置标记
const updateScrollContainer = () => {
  const canvas = scrollbarCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, viewerWidth.value, SCROLLBAR_HEIGHT)
  annotateScrollContainer(ctx, themeStyles.markerAnnotation, markerTime.value)
  annotateScrollContainer(ctx, themeStyles.altMarkerAnnotation, altMarkerTime.value)
}

const annotateScrollContainer = (ctx: CanvasRenderingContext2D, color: string, time: number | null) => {
  if (time === null || timeStop.value <= 0) return
  const xOffset = (time / timeStop.value) * viewerWidth.value
  ctx.lineWidth = 2
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(xOffset, 0)
  ctx.lineTo(xOffset, SCROLLBAR_HEIGHT)
  ctx.stroke()
}

// 标尺间距对数自适应算法 (原版 viewport.ts updateRulerSpacing)
const updateRulerSpacing = () => {
  zoomOffset.value = Math.log2(zoomRatio.value * defaultPixelTime.value)
  const baseZoom = (2 ** Math.floor(zoomOffset.value)) / defaultPixelTime.value
  const spacingRatio = 2 ** (zoomOffset.value - Math.floor(zoomOffset.value))
  rulerTickSpacing.value = MIN_TICK_SPACING * spacingRatio
  rulerNumberSpacing.value = MIN_NUMBER_SPACING * spacingRatio
  rulerNumberIncrement.value = MIN_NUMBER_SPACING / baseZoom
}

const clampZoomRatio = (ratio: number): number => {
  return Math.max(minZoomRatio.value, Math.min(ratio, maxZoomRatio.value))
}

const applyZoom = (newScrollLeft: number, newZoomRatio: number) => {
  zoomRatio.value = newZoomRatio
  pixelTime.value = 1 / newZoomRatio
  minDrawWidth.value = pixelTime.value / pixelRatio.value
  maxScrollLeft.value = Math.round(Math.max(timeStop.value * newZoomRatio - viewerWidth.value, 0))
  pseudoScrollLeft.value = Math.max(Math.min(newScrollLeft, maxScrollLeft.value), 0)
  timeScrollLeft.value = pseudoScrollLeft.value * pixelTime.value
  viewerWidthTime.value = viewerWidth.value * pixelTime.value
  timeScrollRight.value = timeScrollLeft.value + viewerWidthTime.value

  updateRulerSpacing()
  updateHorizontalScrollbar()
  redrawViewport()
}

const setViewportRange = (startT: number, endT: number) => {
  const clampedStart = Math.max(0, startT)
  const clampedEnd = Math.min(timeStop.value, Math.max(clampedStart + 1, endT))
  const timeRange = Math.max(clampedEnd - clampedStart, 1)
  if (viewerWidth.value <= 0) return

  const newZoomRatio = clampZoomRatio(viewerWidth.value / timeRange)
  const newScrollLeft = clampedStart * newZoomRatio
  applyZoom(newScrollLeft, newZoomRatio)
}

const handleZoom = (amount: number, zoomOriginTime: number, screenPos: number) => {
  if (amount === 0) return
  const newZoomRatio = clampZoomRatio(zoomRatio.value * 2 ** (-1 * amount))
  if (newZoomRatio === zoomRatio.value) return
  const newScrollLeft = zoomOriginTime * newZoomRatio - screenPos
  applyZoom(newScrollLeft, newZoomRatio)
}

const animateZoomRange = (t1: number, t2: number) => {
  const startT = Math.max(0, Math.min(t1, t2))
  const endT = Math.min(timeStop.value, Math.max(t1, t2))
  if (endT <= startT) return
  setViewportRange(startT, endT)
}

let scrollRafId: number | null = null
let pendingVerticalRedraw = false

const flushScrollRedraw = () => {
  scrollRafId = null
  updateRuler()
  if (pendingVerticalRedraw) {
    updateSelectionCanvas()
    pendingVerticalRedraw = false
  }
  updateBackgroundCanvas()
  renderAllWaveforms()
  updateOverlayCanvas()
}

const handleScrollEvent = (newScrollLeft: number, newScrollTop: number) => {
  const clampedLeft = Math.max(Math.min(newScrollLeft, maxScrollLeft.value), 0)
  pseudoScrollLeft.value = clampedLeft
  timeScrollLeft.value = clampedLeft * pixelTime.value
  timeScrollRight.value = timeScrollLeft.value + viewerWidthTime.value
  // 立即同步更新水平滚动条滑块坐标，确保鼠标拖拽时滑块 0 延迟跟手
  updateScrollbarPositionX()

  const clampedTop = Math.max(Math.min(newScrollTop, maxScrollTop.value), 0)
  if (clampedTop !== pseudoScrollTop.value) {
    pseudoScrollTop.value = clampedTop
    updateScrollbarPositionY()
    pendingVerticalRedraw = true
  }

  // 使用 requestAnimationFrame 合帧渲染 Canvas，避免高回报率鼠标每秒触发上百次同步重绘阻塞主线程
  if (scrollRafId === null) {
    scrollRafId = requestAnimationFrame(flushScrollRedraw)
  }
}

// ---------------------------------------------------------------------------
// 4 层 Canvas + 标尺 Canvas 渲染实现 (100% 还原原版 VaporView 视觉效果)
// ---------------------------------------------------------------------------
const resizeCanvasElement = (canvas: HTMLCanvasElement | null, width: number, height: number) => {
  if (!canvas) return
  const dpr = pixelRatio.value
  canvas.width = Math.max(1, Math.floor(width * dpr))
  canvas.height = Math.max(1, Math.floor(height * dpr))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
}

// 1. 标尺绘制 (原版 viewport.ts updateRuler)
const updateRuler = () => {
  const canvas = rulerCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let tickX =
    rulerTickSpacing.value -
    (pseudoScrollLeft.value % rulerTickSpacing.value) -
    (rulerTickSpacing.value + 0.5)
  let tickXalt = tickX - rulerTickSpacing.value / 2
  let numberX = -1 * (pseudoScrollLeft.value % rulerNumberSpacing.value)
  const numberDirty = (pseudoScrollLeft.value + numberX) * pixelTime.value
  let number = Math.round(numberDirty / rulerNumberIncrement.value) * rulerNumberIncrement.value
  let setIndex = Math.round(number / rulerNumberIncrement.value)
  const alpha = Math.min((zoomOffset.value - Math.floor(zoomOffset.value)) * 4, 1)
  const twoPi = Math.PI * 2
  const textBaseline = 23

  ctx.imageSmoothingEnabled = false
  ctx.lineWidth = 1
  ctx.strokeStyle = themeStyles.rulerTextColor
  ctx.font = themeStyles.fontStyle
  ctx.fillStyle = themeStyles.rulerGuideColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.clearRect(0, 0, rulerWidth.value, RULER_HEIGHT)

  // 主刻度圆点
  ctx.beginPath()
  while (tickX <= rulerWidth.value) {
    ctx.arc(tickX, 30, 1, 0, twoPi)
    tickX += rulerTickSpacing.value
  }
  ctx.fill()

  // 次级刻度圆点 (随缩放平滑淡入)
  ctx.globalAlpha = alpha
  ctx.beginPath()
  while (tickXalt <= rulerWidth.value) {
    ctx.arc(tickXalt, 30, 1, 0, twoPi)
    tickXalt += rulerTickSpacing.value
  }
  ctx.fill()

  // 刻度数字
  const scale =
    adjustedLogTimeScale.value >= 0
      ? 10 ** adjustedLogTimeScale.value
      : 10 ** -adjustedLogTimeScale.value

  rulerLineX = []
  ctx.fillStyle = themeStyles.rulerTextColor
  while (numberX <= rulerWidth.value + 50) {
    const scaledVal =
      adjustedLogTimeScale.value >= 0
        ? Math.round(number * timeScale.value * scale * 1e6) / 1e6
        : Math.round((number * timeScale.value) / scale * 1e6) / 1e6
    const valueString = `${scaledVal} ${displayTimeUnit.value}`

    if (setIndex % 2 === 1) {
      ctx.globalAlpha = alpha
      rulerLineX.push([numberX, alpha])
    } else {
      ctx.globalAlpha = 1
      rulerLineX.push([numberX, 1])
    }

    ctx.fillText(valueString, numberX, textBaseline)
    numberX += rulerNumberSpacing.value
    number += rulerNumberIncrement.value
    setIndex += 1
  }

  ctx.globalAlpha = 1
}

// 2. 选中行高亮画布绘制 (原版 viewport.ts updateSelectionCanvas)
const updateSelectionCanvas = () => {
  const canvas = selectionCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, viewerWidth.value, viewerHeight.value)
  ctx.fillStyle = themeStyles.selectionBackgroundColor
  ctx.strokeStyle = themeStyles.selectionContrastBorder
  ctx.lineWidth = 1
  ctx.setLineDash([1, 1])

  const yOffset = pseudoScrollTop.value
  for (const sigId of selectedSignalIds.value) {
    const bounds = getRowBounds(sigId)
    if (!bounds) continue
    const screenTop = bounds[0] - yOffset
    const height = bounds[1] - bounds[0]
    ctx.fillRect(0, screenTop, viewerWidth.value, height)
  }

  ctx.setLineDash([])
  ctx.strokeStyle = themeStyles.selectionBorderColor
  if (!lastSelectedSignalId.value) return
  const lastBounds = getRowBounds(lastSelectedSignalId.value)
  if (!lastBounds) return
  ctx.beginPath()
  ctx.moveTo(0, lastBounds[0] + 0.5 - yOffset)
  ctx.lineTo(viewerWidth.value, lastBounds[0] + 0.5 - yOffset)
  ctx.moveTo(0, lastBounds[1] - 0.5 - yOffset)
  ctx.lineTo(viewerWidth.value, lastBounds[1] - 0.5 - yOffset)
  ctx.stroke()
}

// 3. 背景垂直网格线绘制 (原版 viewport.ts updateBackgroundCanvas)
const updateBackgroundCanvas = () => {
  const canvas = backgroundCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, viewerWidth.value, viewerHeight.value)
  if (!configRulerLines.value) return

  ctx.strokeStyle = themeStyles.rulerGuideColor
  ctx.lineWidth = 1
  const lineH = Math.max(waveformsHeight.value - pseudoScrollTop.value, viewerHeight.value)

  for (const [x, alpha] of rulerLineX) {
    if (x < 0 || x > viewerWidth.value) continue
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, lineH)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// 4. 波形主画布绘制 (100% 移植 vaporview/src/webview/renderer.ts BinaryWaveformRenderer & MultiBitWaveformRenderer)
const renderAllWaveforms = () => {
  const canvas = waveformsCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const scrollTop = pseudoScrollTop.value
  const windowBottom = scrollTop + viewerHeight.value

  ctx.clearRect(0, 0, viewerWidth.value, viewerHeight.value)

  for (const sig of props.activeSignals) {
    const bounds = getRowBounds(sig.id)
    if (!bounds) continue
    const [topBounds, bottomBounds] = bounds
    if (bottomBounds <= scrollTop || topBounds >= windowBottom) continue

    if (sig.size <= 1) {
      drawBinaryWaveform(ctx, sig, topBounds)
    } else {
      drawMultiBitWaveform(ctx, sig, topBounds)
    }
  }
}

// 原版 BinaryWaveformRenderer
const drawBinaryWaveform = (
  ctx: CanvasRenderingContext2D,
  sig: VcdSignalData,
  topBounds: number
) => {
  const transitionData = getNormalizedTransitions(sig)
  if (transitionData.length === 0) return

  const st = getSignalState(sig)
  const startIndex = Math.max(
    binarySearchTransitions(transitionData, timeScrollLeft.value - 2 * pixelTime.value),
    1
  )
  const endIndex = binarySearchTransitions(transitionData, timeScrollRight.value)
  const initialState = transitionData[startIndex - 1]
  const postState =
    endIndex < transitionData.length
      ? transitionData[endIndex]
      : { time: timeStop.value, value: initialState.value }

  let initialValue = initialState.value
  let initialValue2state = initialValue === '1' ? 1 : 0
  let initialTime = initialState.time
  let initialTimeOrStart = Math.max(initialState.time, -10)

  const xzPath: [number, number][] = []
  const minDraw = minDrawWidth.value
  const drawColor = st.color
  const xzColor = themeStyles.xzColor
  const tScrollLeft = timeScrollLeft.value
  const tScrollRight = timeScrollRight.value - tScrollLeft
  const rowHeight = st.rowHeight * BASE_ROW_HEIGHT
  const canvasHeight = rowHeight - ROW_PADDING * 2
  const glowBlur = configUseGlow.value ? 4 * pixelRatio.value : 0

  const startScreenX = -10 * pixelTime.value
  const accumulatedPath: [number, number][] = [
    [startScreenX, 0],
    [startScreenX, initialValue2state]
  ]
  let value2state = 0
  let lastDrawTime = 0
  let lastNoDrawTime = 0
  let noDrawFlag = false
  const noDrawPath: [number, number][] = []

  for (let i = startIndex; i < endIndex; i++) {
    let time = transitionData[i].time
    let value = transitionData[i].value

    if (time - initialTime < minDraw) {
      noDrawFlag = true
      // 子像素跳跃加速：直接跳过当前 [time, time + minDraw) 像素桶内的密集冗余跳变点
      const skipIdx = findLastIndexBefore(transitionData, i, endIndex, time + minDraw)
      if (skipIdx > i) {
        i = skipIdx
        time = transitionData[i].time
        value = transitionData[i].value
      }
      lastNoDrawTime = time
    } else {
      if (noDrawFlag) {
        initialValue2state = initialValue === '1' ? 1 : 0

        const adjustedLastDrawTime = lastDrawTime - tScrollLeft
        const adjustedLastNoDrawTime = lastNoDrawTime - tScrollLeft
        noDrawPath.push([adjustedLastDrawTime, adjustedLastNoDrawTime])
        accumulatedPath.push([adjustedLastDrawTime, 0])
        accumulatedPath.push([adjustedLastNoDrawTime, 0])
        accumulatedPath.push([adjustedLastNoDrawTime, initialValue2state])
        noDrawFlag = false
      }

      const timeLeft = time - tScrollLeft
      if (valueIs9State(initialValue)) {
        xzPath.push([initialTimeOrStart - tScrollLeft, timeLeft])
      }

      value2state = value === '1' ? 1 : 0

      accumulatedPath.push([timeLeft, initialValue2state])
      accumulatedPath.push([timeLeft, value2state])

      lastDrawTime = time
      initialValue2state = value2state
    }

    initialValue = value
    initialTimeOrStart = time
    initialTime = time
  }

  initialValue2state = initialValue === '1' ? 1 : 0

  if (postState.time - initialTime < minDraw) {
    const adjustedLastDrawTime = lastDrawTime - tScrollLeft
    noDrawPath.push([adjustedLastDrawTime, tScrollRight])
    accumulatedPath.push([adjustedLastDrawTime, 0])
    accumulatedPath.push([tScrollRight, 0])
  } else {
    if (noDrawFlag) {
      const adjustedLastDrawTime = lastDrawTime - tScrollLeft
      const adjustedLastNoDrawTime = lastNoDrawTime - tScrollLeft
      noDrawPath.push([adjustedLastDrawTime, adjustedLastNoDrawTime])
      accumulatedPath.push([adjustedLastDrawTime, 0])
      accumulatedPath.push([adjustedLastNoDrawTime, 0])
      accumulatedPath.push([adjustedLastNoDrawTime, initialValue2state])
    }
    if (valueIs9State(initialValue)) {
      xzPath.push([initialTimeOrStart - tScrollLeft, tScrollRight])
    }
  }

  accumulatedPath.push([tScrollRight + 15 * pixelTime.value, initialValue2state])
  accumulatedPath.push([tScrollRight + 15 * pixelTime.value, 1])
  accumulatedPath.push([tScrollRight + 15 * pixelTime.value, 0])

  const waveHeight = canvasHeight - ROW_PADDING
  const waveOffset = waveHeight + (canvasHeight - waveHeight) / 2
  const windowTop = topBounds + ROW_PADDING - pseudoScrollTop.value

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, windowTop, viewerWidth.value, canvasHeight)
  ctx.clip()
  ctx.translate(0, windowTop)
  ctx.clearRect(0, 0, viewerWidth.value, canvasHeight)

  // 主脉冲路径 + 0.1 半透明底部填充
  ctx.save()
  ctx.strokeStyle = drawColor
  ctx.fillStyle = drawColor
  ctx.translate(0.5, waveOffset + 0.5)
  ctx.transform(zoomRatio.value, 0, 0, -waveHeight, 0, 0)
  ctx.beginPath()
  for (const [x, y] of accumulatedPath) {
    ctx.lineTo(x, y)
  }
  ctx.globalAlpha = 0.1
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()

  ctx.lineWidth = 1
  ctx.strokeStyle = drawColor
  ctx.shadowColor = drawColor
  ctx.shadowBlur = glowBlur
  ctx.stroke()

  // 高密度跳变聚合色块 (noDrawPath)
  if (noDrawPath.length > 0) {
    ctx.save()
    ctx.translate(0.5, waveOffset + 0.5)
    ctx.transform(zoomRatio.value, 0, 0, -waveHeight, 0, 0)
    ctx.beginPath()
    for (const [sT, eT] of noDrawPath) {
      ctx.moveTo(sT, 0)
      ctx.lineTo(eT, 0)
      ctx.lineTo(eT, 1)
      ctx.lineTo(sT, 1)
      ctx.lineTo(sT, 0)
    }
    ctx.restore()
    ctx.strokeStyle = drawColor
    ctx.fillStyle = drawColor
    ctx.lineWidth = 1
    ctx.shadowColor = drawColor
    ctx.shadowBlur = glowBlur
    ctx.fill()
    ctx.stroke()
  }

  // 非二态 (X/Z) 高亮渲染
  if (xzPath.length > 0) {
    ctx.save()
    ctx.translate(0.5, waveOffset + 0.5)
    ctx.transform(zoomRatio.value, 0, 0, -waveHeight, 0, 0)
    ctx.beginPath()
    for (const [sT, eT] of xzPath) {
      ctx.moveTo(sT, 0)
      ctx.lineTo(eT, 0)
      ctx.lineTo(eT, 1)
      ctx.lineTo(sT, 1)
      ctx.lineTo(sT, 0)
    }
    ctx.fillStyle = xzColor
    ctx.globalAlpha = 0.1
    ctx.fill()
    ctx.restore()
    ctx.lineWidth = 1
    ctx.strokeStyle = xzColor
    ctx.shadowColor = xzColor
    ctx.shadowBlur = glowBlur
    ctx.stroke()
  }

  ctx.shadowBlur = 0
  ctx.restore()
  ctx.beginPath()
  ctx.moveTo(0, 0)
}

// 原版 MultiBitWaveformRenderer 总线文本布局与截断
const computeBusValueLayout = (
  time: number,
  deltaTime: number,
  displayValue: string,
  rightJustify: boolean
): [string, number, boolean] => {
  const textTime = displayValue.length * characterWidth * pixelTime.value
  const padding = 4 * pixelTime.value
  const adjustedTime = Math.max(time, timeScrollLeft.value)
  const adjustedDeltaTime = Math.min(time + deltaTime, timeScrollRight.value) - adjustedTime
  const characterWidthLimit = adjustedDeltaTime - 2 * padding
  const centerText = textTime <= characterWidthLimit
  let text = displayValue
  let xValue: number

  if (centerText) {
    xValue = adjustedTime + adjustedDeltaTime / 2
  } else {
    const charCount = Math.floor(characterWidthLimit / (characterWidth * pixelTime.value)) - 1
    if (charCount < 0) return ['', -100, false]
    if (rightJustify) {
      xValue = adjustedTime + adjustedDeltaTime - padding
      text = '…' + displayValue.slice(displayValue.length - charCount)
    } else {
      xValue = adjustedTime + padding
      text = displayValue.slice(0, charCount) + '…'
    }
  }

  const adjustedXValue = xValue * zoomRatio.value - pseudoScrollLeft.value
  return [text, adjustedXValue, centerText]
}

const outlineBusValue = (ctx: CanvasRenderingContext2D, drawColor: string, canvasHeight: number, glowBlur: number) => {
  ctx.restore()
  ctx.save()
  ctx.clip()
  ctx.clearRect(0, 0, viewerWidth.value, canvasHeight)
  ctx.globalAlpha = 0.1
  ctx.fillStyle = drawColor
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = drawColor
  ctx.lineWidth = 1
  ctx.shadowColor = drawColor
  ctx.shadowBlur = glowBlur
  ctx.stroke()
  ctx.save()
  ctx.clip()
  ctx.beginPath()
  ctx.moveTo(0, 0.5)
  ctx.lineTo(viewerWidth.value, 0.5)
  ctx.moveTo(0, canvasHeight - 0.5)
  ctx.lineTo(viewerWidth.value, canvasHeight - 0.5)
  ctx.shadowColor = drawColor
  ctx.shadowBlur = glowBlur
  ctx.stroke()
  ctx.restore()
  ctx.save()
  ctx.shadowBlur = 0
}

const drawMultiBitWaveform = (
  ctx: CanvasRenderingContext2D,
  sig: VcdSignalData,
  topBounds: number
) => {
  const transitionData = getNormalizedTransitions(sig)
  if (transitionData.length === 0) return

  const st = getSignalState(sig)
  const startIndex = Math.max(
    binarySearchTransitions(transitionData, timeScrollLeft.value - 2 * pixelTime.value),
    1
  )
  const endIndex = binarySearchTransitions(transitionData, timeScrollRight.value)
  const initialState = transitionData[startIndex - 1]
  const postState =
    endIndex < transitionData.length
      ? transitionData[endIndex]
      : { time: timeStop.value, value: initialState.value }

  const signalWidth = sig.size
  const rightJustify = st.format !== 'dec' && st.format !== 'signed' && st.format !== 'ascii'
  const justifyDirection = rightJustify ? 'right' : 'left'
  const rowHeight = st.rowHeight * BASE_ROW_HEIGHT
  const canvasHeight = rowHeight - ROW_PADDING * 2
  const halfCanvasHeight = canvasHeight / 2
  const glowBlur = configUseGlow.value ? 4 * pixelRatio.value : 0
  const textGlowBlur = configUseGlow.value ? 3 * pixelRatio.value : 0

  let value = initialState.value
  let time = initialState.time
  const adjustedStartTime = time - timeScrollLeft.value
  const points: [number, number][] = [[adjustedStartTime, 0]]
  const endPoints: [number, number][] = [[adjustedStartTime, 0]]
  const xzPoints: [number, number][][] = []
  const textElements: [string, number, boolean][] = []
  let moveCursor = false
  const minTextWidth = 12 * pixelTime.value
  const minDraw = minDrawWidth.value
  const drawColor = st.color
  const xzColor = themeStyles.xzColor
  const fillShape = configFillMultiBit.value
  const fixedHeight = configMultiBitFixedHeight.value
  const minYPosition = fixedHeight ? halfCanvasHeight / zoomRatio.value : 0
  const yMultiplier = 2 * st.rowHeight
  let lastDrawTime = 0
  const noDrawRanges: [number, number][] = []

  for (let i = startIndex; i < endIndex; i++) {
    let curTime = transitionData[i].time
    let curValue = transitionData[i].value
    const elementWidth = curTime - time
    if (elementWidth > minDraw) {
      const adjustedTime = time - timeScrollLeft.value
      const adjustedTimeEnd = adjustedTime + elementWidth

      if (moveCursor) {
        points.push([adjustedTime, 0])
        endPoints.push([adjustedTime, 0])
        moveCursor = false
        noDrawRanges.push([lastDrawTime, adjustedTime])
      }

      const is4State = valueIs9State(value)
      const xPos = elementWidth / 2 + adjustedTime
      const yPos = Math.max(elementWidth * yMultiplier, minYPosition)

      if (is4State) {
        xzPoints.push([
          [adjustedTime, 0],
          [xPos, yPos],
          [adjustedTimeEnd, 0],
          [xPos, -yPos]
        ])
      } else {
        points.push([xPos, yPos])
        endPoints.push([xPos, -yPos])
      }

      if (elementWidth > minTextWidth) {
        const parsedValue = formatSignalValue(value, signalWidth, st.format)
        textElements.push(computeBusValueLayout(time, elementWidth, parsedValue, rightJustify))
      }

      points.push([adjustedTimeEnd, 0])
      endPoints.push([adjustedTimeEnd, 0])
      lastDrawTime = adjustedTimeEnd
    } else {
      moveCursor = true
      // 子像素跳跃加速：直接跳过当前 [curTime, curTime + minDraw) 像素桶内的密集总线跳变点
      const skipIdx = findLastIndexBefore(transitionData, i, endIndex, curTime + minDraw)
      if (skipIdx > i) {
        i = skipIdx
        curTime = transitionData[i].time
        curValue = transitionData[i].value
      }
    }

    time = curTime
    value = curValue
  }

  const elementWidth = postState.time - time
  if (elementWidth > minDraw) {
    const adjustedTime = time - timeScrollLeft.value
    const adjustedTimeEnd = postState.time - timeScrollLeft.value

    if (moveCursor) {
      points.push([adjustedTime, 0])
      endPoints.push([adjustedTime, 0])
      moveCursor = false
      noDrawRanges.push([lastDrawTime, adjustedTime])
    }

    const xPos = elementWidth / 2 + adjustedTime
    const yPos = Math.max(elementWidth * yMultiplier, minYPosition)
    const is4State = valueIs9State(value)

    if (is4State) {
      xzPoints.push([
        [adjustedTime, 0],
        [xPos, yPos],
        [adjustedTimeEnd, 0],
        [xPos, -yPos]
      ])
    } else {
      points.push([xPos, yPos])
      points.push([adjustedTimeEnd, 0])
      endPoints.push([xPos, -yPos])
    }
  } else if (moveCursor) {
    const adjustedTimeEnd = timeScrollRight.value - timeScrollLeft.value
    noDrawRanges.push([lastDrawTime, adjustedTimeEnd])
  }

  if (elementWidth > minTextWidth) {
    const parsedValue = formatSignalValue(value, signalWidth, st.format)
    textElements.push(computeBusValueLayout(time, elementWidth, parsedValue, rightJustify))
  }

  const windowTop = topBounds + ROW_PADDING - pseudoScrollTop.value

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, windowTop, viewerWidth.value, canvasHeight)
  ctx.clip()
  ctx.translate(0, windowTop)
  ctx.clearRect(0, 0, viewerWidth.value, canvasHeight)

  ctx.save()
  ctx.translate(0.5, halfCanvasHeight)
  ctx.globalAlpha = 1
  ctx.transform(zoomRatio.value, 0, 0, zoomRatio.value, 0, 0)
  ctx.beginPath()
  ctx.moveTo(-pixelTime.value * 2, 0)
  for (const [x, y] of points) {
    ctx.lineTo(x, y)
  }
  for (let i = endPoints.length - 1; i >= 0; i--) {
    ctx.lineTo(endPoints[i][0], endPoints[i][1])
  }

  if (fillShape) {
    ctx.fillStyle = drawColor
    ctx.shadowColor = drawColor
    ctx.shadowBlur = glowBlur
    ctx.fill()
    ctx.restore()
    ctx.save()
    if (fixedHeight) {
      ctx.strokeStyle = drawColor
      ctx.lineWidth = 1
      ctx.shadowColor = drawColor
      ctx.shadowBlur = glowBlur
      ctx.stroke()
    }
  } else {
    outlineBusValue(ctx, drawColor, canvasHeight, glowBlur)
  }

  ctx.translate(0.5, halfCanvasHeight)
  ctx.transform(zoomRatio.value, 0, 0, zoomRatio.value, 0, 0)

  if (fixedHeight && noDrawRanges.length > 0) {
    ctx.fillStyle = drawColor
    ctx.shadowColor = drawColor
    ctx.shadowBlur = glowBlur
    ctx.beginPath()
    for (const [s, e] of noDrawRanges) {
      ctx.moveTo(s, minYPosition)
      ctx.lineTo(e, minYPosition)
      ctx.lineTo(e, -minYPosition)
      ctx.lineTo(s, -minYPosition)
    }
    ctx.fill()
  }

  if (xzPoints.length > 0) {
    ctx.beginPath()
    for (const set of xzPoints) {
      ctx.moveTo(set[0][0], set[0][1])
      ctx.lineTo(set[1][0], set[1][1])
      ctx.lineTo(set[2][0], set[2][1])
      ctx.lineTo(set[3][0], set[3][1])
      ctx.lineTo(set[0][0], set[0][1])
    }
    if (fillShape) {
      ctx.fillStyle = xzColor
      ctx.shadowColor = xzColor
      ctx.shadowBlur = glowBlur
      ctx.fill()
      ctx.restore()
      if (fixedHeight) {
        ctx.strokeStyle = xzColor
        ctx.lineWidth = 1
        ctx.shadowColor = xzColor
        ctx.shadowBlur = glowBlur
        ctx.stroke()
      }
    } else {
      outlineBusValue(ctx, xzColor, canvasHeight, glowBlur)
    }
  } else {
    ctx.restore()
  }

  // 绘制总线内部数值文本
  const textY = halfCanvasHeight + 1
  const fontWeight = fillShape ? 'bold ' : ''
  const textColor = fillShape ? themeStyles.backgroundColor : themeStyles.textColor
  ctx.save()
  ctx.translate(0.5, 0)
  ctx.font = fontWeight + themeStyles.fontStyle
  ctx.fillStyle = textColor
  ctx.shadowColor = fillShape ? drawColor : textColor
  ctx.shadowBlur = textGlowBlur
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const [text, xVal, center] of textElements) {
    if (center && text) {
      ctx.fillText(text, xVal, textY)
    }
  }

  ctx.textAlign = justifyDirection
  for (const [text, xVal, center] of textElements) {
    if (!center && text) {
      ctx.fillText(text, xVal, textY)
    }
  }

  ctx.restore()
  ctx.restore()
  ctx.shadowBlur = 0
}

// 5. 覆盖层游标与框选缩放绘制 (原版 viewport.ts updateOverlayCanvas)
const updateOverlayCanvas = () => {
  const canvas = overlayCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let drawAltMarker = true
  ctx.clearRect(0, 0, viewerWidth.value, viewerHeight.value)
  ctx.lineWidth = 1
  const lineH = Math.max(waveformsHeight.value - pseudoScrollTop.value, viewerHeight.value)

  if (markerTime.value !== null) {
    ctx.strokeStyle = themeStyles.markerColor
    ctx.setLineDash([2, 2])
    if (altMarkerTime.value === markerTime.value) {
      ctx.setLineDash([])
      drawAltMarker = false
    }
    const markerX = getViewportLeft(markerTime.value, 100)
    ctx.beginPath()
    ctx.moveTo(markerX, 0)
    ctx.lineTo(markerX, lineH)
    ctx.stroke()
  }

  if (altMarkerTime.value !== null && drawAltMarker) {
    ctx.strokeStyle = themeStyles.altMarkerColor
    ctx.setLineDash([6, 2, 2, 2])
    const altX = getViewportLeft(altMarkerTime.value, 100)
    ctx.beginPath()
    ctx.moveTo(altX, 0)
    ctx.lineTo(altX, lineH)
    ctx.stroke()
  }

  ctx.setLineDash([])
}

const redrawViewport = () => {
  updateRuler()
  updateSelectionCanvas()
  updateBackgroundCanvas()
  renderAllWaveforms()
  updateOverlayCanvas()
  updateScrollContainer()
}

// ---------------------------------------------------------------------------
// 视口尺寸自适应与初始化
// ---------------------------------------------------------------------------
const updateViewportDimensions = () => {
  const scrollArea = scrollAreaRef.value
  if (!scrollArea) return

  pixelRatio.value = window.devicePixelRatio || 1
  const rect = scrollArea.getBoundingClientRect()
  viewerWidth.value = Math.max(100, rect.width - SCROLLBAR_WIDTH)
  viewerHeight.value = Math.max(80, rect.height - SCROLLBAR_HEIGHT)
  rulerWidth.value = viewerWidth.value + SCROLLBAR_WIDTH

  minZoomRatio.value = viewerWidth.value / Math.max(timeStop.value, 1)
  maxScrollLeft.value = Math.round(Math.max(timeStop.value * zoomRatio.value - viewerWidth.value, 0))
  viewerWidthTime.value = viewerWidth.value * pixelTime.value
  timeScrollRight.value = timeScrollLeft.value + viewerWidthTime.value

  resizeCanvasElement(scrollbarCanvasRef.value, viewerWidth.value, SCROLLBAR_HEIGHT)
  resizeCanvasElement(rulerCanvasRef.value, rulerWidth.value, RULER_HEIGHT)
  resizeCanvasElement(selectionCanvasRef.value, viewerWidth.value, viewerHeight.value)
  resizeCanvasElement(backgroundCanvasRef.value, viewerWidth.value, viewerHeight.value)
  resizeCanvasElement(waveformsCanvasRef.value, viewerWidth.value, viewerHeight.value)
  resizeCanvasElement(overlayCanvasRef.value, viewerWidth.value, viewerHeight.value)

  // 测量字符宽度用于 Bus 文本截断
  const overlayCtx = overlayCanvasRef.value?.getContext('2d')
  if (overlayCtx) {
    overlayCtx.font = themeStyles.fontStyle
    const sample = '0'.repeat(100)
    characterWidth = overlayCtx.measureText(sample).width / sample.length
  }

  if (minZoomRatio.value > zoomRatio.value) {
    applyZoom(0, minZoomRatio.value)
  } else {
    updateWaveformsHeight()
    updateHorizontalScrollbar()
    handleScrollEvent(pseudoScrollLeft.value, pseudoScrollTop.value)
  }
}

const initViewportFromMetadata = () => {
  timeScale.value = props.metadata.timeScaleMultiplier || 1
  timeUnit.value = props.metadata.timeUnit || 'ns'
  displayTimeUnit.value = timeUnit.value === 'us' ? 'µs' : timeUnit.value
  adjustedLogTimeScale.value = 0
  timeStop.value = Math.max(props.metadata.maxTime || 2000, 100)

  const minStep = 1
  defaultPixelTime.value = 10 ** (Math.round(Math.log10(minStep)) | 0)
  zoomRatio.value = 1 / defaultPixelTime.value
  pixelTime.value = 1 / zoomRatio.value
  maxZoomRatio.value = zoomRatio.value * 256

  updateViewportDimensions()
  // 默认展示前半段 [0, timeStop * 0.55] 使波形疏密适中、底部水平滚动条滑块立即可见并可拖拽
  setViewportRange(0, Math.round(timeStop.value * 0.55))
  if (markerTime.value === null) {
    setMarkerTime(Math.round(timeStop.value * 0.15), 0, true)
  }
}

// ---------------------------------------------------------------------------
// 交互事件：滚轮、标尺拖拽、画布点击吸附/框选缩放、滚动条拖拽、分栏拖拽
// ---------------------------------------------------------------------------
let lastIsTouchpad = false
let touchpadCheckTimer = 0

const detectTouchpad = (e: WheelEvent): boolean => {
  if (performance.now() < touchpadCheckTimer) return lastIsTouchpad
  const wheelDeltaY = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY
  if (wheelDeltaY && wheelDeltaY === e.deltaY * -3) {
    lastIsTouchpad = true
    return true
  } else if (e.deltaMode === 0 && Math.abs(e.deltaY) < 40) {
    lastIsTouchpad = true
    return true
  }
  lastIsTouchpad = false
  return false
}

// 原版 VaporView 滚轮与触控板处理逻辑 (vaporview.ts scrollHandler)
const handleScrollAreaWheel = (e: WheelEvent) => {
  const deltaY = e.deltaY
  const deltaX = e.deltaX
  const touchpadPinchDivider = 18
  const mouseMode = scrollMode.value === 'Mouse'

  if (e.shiftKey) {
    const delta = deltaY || deltaX
    handleScrollEvent(pseudoScrollLeft.value, pseudoScrollTop.value + delta)
  } else if (e.ctrlKey || e.metaKey) {
    const rect = scrollAreaRef.value?.getBoundingClientRect()
    const pixelLeft = rect ? Math.round(e.clientX - rect.left) : halfViewerWidth.value
    const time = Math.round((pixelLeft + pseudoScrollLeft.value) * pixelTime.value)
    const zoomAmount = Math.min(touchpadPinchDivider, Math.max(-touchpadPinchDivider, deltaY))

    if (mouseMode && deltaY > 0) handleZoom(1, time, pixelLeft)
    else if (mouseMode && deltaY < 0) handleZoom(-1, time, pixelLeft)
    else handleZoom(zoomAmount / touchpadPinchDivider, time, pixelLeft)
  } else {
    const isTouch = scrollMode.value === 'Auto' ? detectTouchpad(e) : scrollMode.value === 'Touchpad'
    touchpadCheckTimer = performance.now() + 100

    if (deltaX !== 0 || isTouch) {
      handleScrollEvent(pseudoScrollLeft.value + deltaX, pseudoScrollTop.value + deltaY)
    } else {
      handleScrollEvent(pseudoScrollLeft.value + deltaY, pseudoScrollTop.value)
    }
  }
}

const handleLabelsWheel = (e: WheelEvent) => {
  handleScrollEvent(pseudoScrollLeft.value, pseudoScrollTop.value + e.deltaY)
}

const getTimeFromClientX = (clientX: number): number => {
  const rect = scrollAreaRef.value?.getBoundingClientRect()
  if (!rect) return 0
  const pixelLeft = Math.min(Math.max(0, Math.round(clientX - rect.left)), viewerWidth.value)
  return Math.round((pixelLeft + pseudoScrollLeft.value) * pixelTime.value)
}

const getSigFromClientY = (clientY: number): VcdSignalData | null => {
  const rect = scrollAreaRef.value?.getBoundingClientRect()
  if (!rect) return null
  const pageY = Math.round(clientY - rect.top) + pseudoScrollTop.value
  for (const sig of props.activeSignals) {
    const bounds = getRowBounds(sig.id)
    if (bounds && pageY >= bounds[0] && pageY < bounds[1]) {
      return sig
    }
  }
  return null
}

// 标尺点击与拖拽移动主游标
const handleRulerPointerDown = (e: PointerEvent) => {
  e.preventDefault()
  contentAreaRef.value?.focus()
  const initialT = getTimeFromClientX(e.clientX)
  setMarkerTime(initialT, 0, true)

  const onMove = (moveEv: PointerEvent) => {
    const t = getTimeFromClientX(moveEv.clientX)
    if (isInView(t)) {
      setMarkerTime(t, 0, true)
    }
  }
  const onUp = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

// 视口画布点击 (放置游标+吸附跳变沿) 与 拖拽框选缩放 (Highlight Zoom)
const handleScrollAreaPointerDown = (e: PointerEvent) => {
  contentAreaRef.value?.focus()
  closeMenus()

  // 中键或右键拖拽平移画布
  if (e.button === 1) {
    e.preventDefault()
    handleViewportClick(e, 1)
    return
  }
  if (e.button === 2) {
    e.preventDefault()
    const startX = e.clientX
    const startScrollLeft = pseudoScrollLeft.value
    const onPanMove = (mv: PointerEvent) => {
      const dx = mv.clientX - startX
      handleScrollEvent(startScrollLeft - dx, pseudoScrollTop.value)
    }
    const onPanUp = () => {
      document.removeEventListener('pointermove', onPanMove)
      document.removeEventListener('pointerup', onPanUp)
    }
    document.addEventListener('pointermove', onPanMove)
    document.addEventListener('pointerup', onPanUp)
    return
  }
  if (e.button !== 0) return

  const startClientX = e.clientX
  const clickedSig = getSigFromClientY(e.clientY)
  let highlightIsZoom = false
  let lastMoveClientX = startClientX

  const onMove = (moveEv: PointerEvent) => {
    if (!clickedSig) return
    lastMoveClientX = moveEv.clientX
    const width = Math.abs(lastMoveClientX - startClientX)
    if (width > 5) {
      highlightIsZoom = true
    }
    if (highlightIsZoom) {
      const canvas = overlayCanvasRef.value
      const rect = scrollAreaRef.value?.getBoundingClientRect()
      if (canvas && rect) {
        updateOverlayCanvas()
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const left = Math.min(startClientX, lastMoveClientX) - rect.left
          const drawH = Math.min(waveformsHeight.value - pseudoScrollTop.value, viewerHeight.value)
          ctx.fillStyle = themeStyles.highlightColor
          ctx.globalAlpha = 0.5
          ctx.beginPath()
          ctx.roundRect(left, 0, width, Math.max(drawH, 20), 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }
    }
  }

  const onUp = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)

    if (highlightIsZoom) {
      updateOverlayCanvas()
      const tStart = getTimeFromClientX(startClientX)
      const tEnd = getTimeFromClientX(lastMoveClientX)
      animateZoomRange(tStart, tEnd)
    } else {
      handleViewportClick(e, 0)
      updateOverlayCanvas()
    }
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

const handleViewportClick = (e: MouseEvent, eventButton: number) => {
  let button = eventButton
  if (eventButton === 0 && e.altKey) button = 1

  const snapToDistance = 3.5
  const clickTime = getTimeFromClientX(e.clientX)
  let snapToTime = clickTime

  const sig = getSigFromClientY(e.clientY)
  if (!sig) {
    selectedSignalIds.value = []
    lastSelectedSignalId.value = null
    updateSelectionCanvas()
    return
  }

  const nearest = getNearestTransition(sig, clickTime)
  if (nearest) {
    const pixelDist = Math.abs(nearest.time - clickTime) * zoomRatio.value
    if (pixelDist < snapToDistance) {
      snapToTime = nearest.time
    }
    if (!(e.ctrlKey || e.shiftKey || e.metaKey)) {
      setMarkerTime(snapToTime, button === 1 ? 1 : 0, true)
    }
  }

  if (button === 0) {
    handleSignalRowClick(e, sig.id)
  }
}

// 底部水平滚动条与右侧垂直滚动条交互 (原版 viewport.ts handleScrollbarContainerClick & handleScrollbarDrag)
const handleScrollbarTrackPointerDown = (e: PointerEvent, axis: 'h' | 'v') => {
  e.preventDefault()
  if (axis === 'h') {
    if (maxScrollLeft.value <= 0 || maxScrollbarPositionX.value <= 0) return
    const rect = scrollbarContainerHRef.value?.getBoundingClientRect()
    if (!rect) return
    const coord = e.clientX - rect.left
    const newPos = Math.min(Math.max(0, coord - scrollbarWidth.value / 2), maxScrollbarPositionX.value)
    const newScroll = Math.round((newPos / maxScrollbarPositionX.value) * maxScrollLeft.value)
    handleScrollEvent(newScroll, pseudoScrollTop.value)
    handleScrollbarThumbPointerDown(e, 'h')
  } else {
    if (scrollbarHiddenY.value || maxScrollTop.value <= 0 || maxScrollbarPositionY.value <= 0) return
    const rect = scrollbarContainerVRef.value?.getBoundingClientRect()
    if (!rect) return
    const coord = e.clientY - rect.top
    const newPos = Math.min(Math.max(0, coord - scrollbarHeight.value / 2), maxScrollbarPositionY.value)
    const newScroll = Math.round((newPos / maxScrollbarPositionY.value) * maxScrollTop.value)
    handleScrollEvent(pseudoScrollLeft.value, newScroll)
    handleScrollbarThumbPointerDown(e, 'v')
  }
}

const handleScrollbarThumbPointerDown = (e: PointerEvent, axis: 'h' | 'v') => {
  e.preventDefault()
  draggingScrollbar.value = axis
  const startSliderPos = axis === 'h' ? scrollbarPositionX.value : scrollbarPositionY.value
  const startPointer = axis === 'h' ? e.clientX : e.clientY

  const onMove = (mv: PointerEvent) => {
    const curPointer = axis === 'h' ? mv.clientX : mv.clientY
    const newPos = curPointer - startPointer + startSliderPos
    if (axis === 'h') {
      if (maxScrollbarPositionX.value <= 0) return
      const newScroll = Math.round((newPos / maxScrollbarPositionX.value) * maxScrollLeft.value)
      handleScrollEvent(newScroll, pseudoScrollTop.value)
    } else {
      if (maxScrollbarPositionY.value <= 0) return
      const newScroll = Math.round((newPos / maxScrollbarPositionY.value) * maxScrollTop.value)
      handleScrollEvent(pseudoScrollLeft.value, newScroll)
    }
  }

  const onUp = () => {
    draggingScrollbar.value = null
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

// 分栏宽度拖拽 (#resize-1 & #resize-2)
const startColumnResize = (e: PointerEvent, colIdx: 1 | 2) => {
  e.preventDefault()
  resizingCol.value = colIdx
  const rootRect = rootRef.value?.getBoundingClientRect()
  if (!rootRect) return

  const onMove = (mv: PointerEvent) => {
    const relX = Math.max(60, mv.clientX - rootRect.left)
    if (colIdx === 1) {
      col1Width.value = Math.min(Math.max(80, relX), 520)
    } else {
      const newW = Math.max(55, relX - col1Width.value)
      col2Width.value = Math.min(newW, 320)
    }
    updateViewportDimensions()
  }

  const onUp = () => {
    resizingCol.value = null
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

// ---------------------------------------------------------------------------
// 信号选择、拖拽排序、键盘快捷键与右键菜单
// ---------------------------------------------------------------------------
const revealSignal = (sigId: string) => {
  // 先同步更新总高度与 maxScrollTop，确保新增信号后 maxScrollTop 已包含最新行高
  updateWaveformsHeight()
  const bounds = getRowBounds(sigId)
  if (!bounds) return
  let newTop = pseudoScrollTop.value
  if (bounds[0] - newTop < 0) {
    newTop = Math.max(0, bounds[0])
  } else if (bounds[1] - newTop > viewerHeight.value) {
    newTop = Math.min(maxScrollTop.value, bounds[1] - viewerHeight.value)
  }
  if (newTop !== pseudoScrollTop.value) {
    handleScrollEvent(pseudoScrollLeft.value, newTop)
  } else {
    updateScrollbarPositionY()
  }
}

const handleSignalRowClick = (e: MouseEvent, sigId: string) => {
  closeMenus()
  contentAreaRef.value?.focus()
  const allIds = props.activeSignals.map((s) => s.id)

  if (e.shiftKey && lastSelectedSignalId.value) {
    const lastIdx = allIds.indexOf(lastSelectedSignalId.value)
    const curIdx = allIds.indexOf(sigId)
    if (lastIdx !== -1 && curIdx !== -1) {
      const s = Math.min(lastIdx, curIdx)
      const end = Math.max(lastIdx, curIdx)
      const rangeIds = allIds.slice(s, end + 1)
      selectedSignalIds.value = Array.from(new Set([...selectedSignalIds.value, ...rangeIds]))
    }
  } else if (e.ctrlKey || e.metaKey) {
    if (selectedSignalIds.value.includes(sigId)) {
      selectedSignalIds.value = selectedSignalIds.value.filter((id) => id !== sigId)
    } else {
      selectedSignalIds.value = [...selectedSignalIds.value, sigId]
    }
  } else {
    selectedSignalIds.value = [sigId]
  }

  lastSelectedSignalId.value = sigId
  emit('update:selectedSignalId', sigId)
  revealSignal(sigId)
  updateSelectionCanvas()
}

const handleContainerBlankClick = () => {
  closeMenus()
  selectedSignalIds.value = []
  lastSelectedSignalId.value = null
  updateSelectionCanvas()
}

// 拖拽调整信号顺序
const handleLabelPointerDown = (e: PointerEvent, sig: VcdSignalData, idx: number) => {
  if (e.button !== 0) return
  const startY = e.clientY
  let started = false
  let targetDropIdx = idx

  const onMove = (mv: PointerEvent) => {
    if (!started && Math.abs(mv.clientY - startY) > 5) {
      started = true
      rowDragActive.value = true
      if (!selectedSignalIds.value.includes(sig.id)) {
        selectedSignalIds.value = [sig.id]
        lastSelectedSignalId.value = sig.id
      }
    }
    if (started && scrollAreaRef.value) {
      const rect = scrollAreaRef.value.getBoundingClientRect()
      const relY = Math.max(0, mv.clientY - rect.top + pseudoScrollTop.value)
      let foundIdx = props.activeSignals.length
      let dividerY = waveformsHeight.value
      for (let i = 0; i < props.activeSignals.length; i++) {
        const b = getRowBounds(props.activeSignals[i].id)
        if (b && relY < (b[0] + b[1]) / 2) {
          foundIdx = i
          dividerY = b[0]
          break
        }
      }
      targetDropIdx = foundIdx
      rowDragDividerY.value = dividerY
    }
  }

  const onUp = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    if (started) {
      rowDragActive.value = false
      const movingIds = selectedSignalIds.value.includes(sig.id) ? selectedSignalIds.value : [sig.id]
      const currentIds = props.activeSignals.map((s) => s.id)
      const remaining = currentIds.filter((id) => !movingIds.includes(id))
      const insertAt = Math.min(targetDropIdx, remaining.length)
      remaining.splice(insertAt, 0, ...movingIds)
      emit('reorder-signals', remaining)
    }
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

// 键盘快捷键 (对齐原版 vaporview.ts keyDownHandler)
const handleKeyDown = (e: KeyboardEvent) => {
  if (searchInFocus.value) return
  const allIds = props.activeSignals.map((s) => s.id)
  const curIdx = lastSelectedSignalId.value ? allIds.indexOf(lastSelectedSignalId.value) : -1

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    if (e.metaKey) setMarkerTime(timeStop.value, 0, false)
    else if (e.altKey) goToNextTransition(1, 1, [])
    else goToNextTransition(0, 1, [])
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    if (e.metaKey) setMarkerTime(0, 0, false)
    else if (e.altKey) goToNextTransition(1, -1, [])
    else goToNextTransition(0, -1, [])
  } else if (e.key === 'ArrowUp' && curIdx > 0) {
    e.preventDefault()
    const nextId = allIds[curIdx - 1]
    selectedSignalIds.value = e.shiftKey ? Array.from(new Set([...selectedSignalIds.value, nextId])) : [nextId]
    lastSelectedSignalId.value = nextId
    emit('update:selectedSignalId', nextId)
    revealSignal(nextId)
    updateSelectionCanvas()
  } else if (e.key === 'ArrowDown' && curIdx >= 0 && curIdx < allIds.length - 1) {
    e.preventDefault()
    const nextId = allIds[curIdx + 1]
    selectedSignalIds.value = e.shiftKey ? Array.from(new Set([...selectedSignalIds.value, nextId])) : [nextId]
    lastSelectedSignalId.value = nextId
    emit('update:selectedSignalId', nextId)
    revealSignal(nextId)
    updateSelectionCanvas()
  } else if (e.key === 'Home') {
    e.preventDefault()
    setMarkerTime(0, 0, false)
  } else if (e.key === 'End') {
    e.preventDefault()
    setMarkerTime(timeStop.value, 0, false)
  } else if (e.key === 'n') {
    e.preventDefault()
    goToNextTransition(0, 1, [])
  } else if (e.key === 'N') {
    e.preventDefault()
    goToNextTransition(0, -1, [])
  } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    animateZoomRange(0, timeStop.value)
  } else if (e.key === 'Escape') {
    closeMenus()
    if (altMarkerTime.value !== null) {
      clearAltMarker()
    } else {
      selectedSignalIds.value = []
      lastSelectedSignalId.value = null
      updateSelectionCanvas()
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (lastSelectedSignalId.value) {
      emit('remove-signal', lastSelectedSignalId.value)
    }
  }
}

// 右键上下文菜单操作
const openSignalContextMenu = (e: MouseEvent, sig: VcdSignalData) => {
  if (!selectedSignalIds.value.includes(sig.id)) {
    selectedSignalIds.value = [sig.id]
    lastSelectedSignalId.value = sig.id
    emit('update:selectedSignalId', sig.id)
    updateSelectionCanvas()
  }
  const rootRect = rootRef.value?.getBoundingClientRect()
  const relX = rootRect ? e.clientX - rootRect.left : e.clientX
  const relY = rootRect ? e.clientY - rootRect.top : e.clientY
  contextMenu.signal = sig
  contextMenu.x = Math.min(relX, (rootRect?.width || 800) - 240)
  contextMenu.y = Math.min(relY, (rootRect?.height || 600) - 230)
  contextMenu.visible = true
  settingsMenuOpen.value = false
}

const setSignalFormat = (sig: VcdSignalData, fmt: RadixType) => {
  const targets = selectedSignalIds.value.includes(sig.id) ? selectedSignalsList.value : [sig]
  for (const s of targets) {
    getSignalState(s).format = fmt
  }
  contextMenu.visible = false
  redrawViewport()
}

const setSignalColor = (sig: VcdSignalData, colorIdx: number) => {
  const targets = selectedSignalIds.value.includes(sig.id) ? selectedSignalsList.value : [sig]
  for (const s of targets) {
    const st = getSignalState(s)
    st.colorIndex = colorIdx
    st.color = colorPalette[colorIdx]
  }
  contextMenu.visible = false
  redrawViewport()
}

const setSignalRowHeight = (sig: VcdSignalData, h: number) => {
  const targets = selectedSignalIds.value.includes(sig.id) ? selectedSignalsList.value : [sig]
  for (const s of targets) {
    getSignalState(s).rowHeight = h
  }
  contextMenu.visible = false
  updateWaveformsHeight()
  redrawViewport()
}

const copyMarkerValue = (sig: VcdSignalData) => {
  const parts = getFormattedMarkerValues(sig)
  const text = parts.map((p) => p.text).join(' -> ')
  if (text && navigator.clipboard) {
    navigator.clipboard.writeText(text)
  }
  contextMenu.visible = false
}

const removeSignalFromMenu = (sigId: string) => {
  contextMenu.visible = false
  emit('remove-signal', sigId)
}

const closeMenus = () => {
  contextMenu.visible = false
  settingsMenuOpen.value = false
}

// ---------------------------------------------------------------------------
// 生命周期与数据监听（移除 deep: true，避免 Vue 递归遍历 100MB 文件中数百万个跳变点对象）
// ---------------------------------------------------------------------------
watch(
  () => props.activeSignals,
  (newList, oldList) => {
    const isAdded = Boolean(oldList && newList.length > oldList.length)
    nextTick(() => {
      updateWaveformsHeight()
      if (isAdded && newList.length > 0) {
        const addedSig = newList[newList.length - 1]
        revealSignal(addedSig.id)
      }
      updateSelectionCanvas()
      handleScrollEvent(pseudoScrollLeft.value, pseudoScrollTop.value)
    })
  }
)

watch(
  () => props.metadata,
  () => {
    nextTick(() => {
      initViewportFromMetadata()
    })
  }
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  initViewportFromMetadata()
  window.addEventListener('resize', updateViewportDimensions)
  window.addEventListener('click', closeMenus)

  if (scrollAreaRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateViewportDimensions()
    })
    resizeObserver.observe(scrollAreaRef.value)
  }
})

onUnmounted(() => {
  if (scrollRafId !== null) {
    cancelAnimationFrame(scrollRafId)
    scrollRafId = null
  }
  window.removeEventListener('resize', updateViewportDimensions)
  window.removeEventListener('click', closeMenus)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
/* 100% 还原原版 VaporView CSS 变量与 Grid 布局 (来自 vaporview/media/style.css) */
#vaporview-top {
  --waveform-height: 28px;
  --waveform-padding: 4px;
  --ruler-height: 36px;
  --scrollbar-width: 14px;
  --scrollbar-height: 12px;
  --icon-size: 16px;
  --icon-padding: 3px;

  --vscode-editor-background: #1e1e1e;
  --vscode-editor-foreground: #d4d4d4;
  --vscode-editorWidget-background: #252526;
  --vscode-widget-border: #3c3c3c;
  --vscode-icon-foreground: #c5c5c5;
  --vscode-toolbar-hoverBackground: rgba(90, 93, 94, 0.31);
  --vscode-input-background: #3c3c3c;
  --vscode-input-foreground: #cccccc;
  --vscode-input-border: #3c3c3c;
  --vscode-focusBorder: #007fd4;
  --vscode-inputOption-activeBorder: #007acc;
  --vscode-inputOption-activeForeground: #ffffff;
  --vscode-inputOption-activeBackground: rgba(0, 122, 204, 0.4);
  --vscode-disabledForeground: rgba(204, 204, 204, 0.35);
  --vscode-editorIndentGuide-background1: #404040;
  --vscode-sash-hoverBorder: #007fd4;
  --vscode-textLink-foreground: #3794ff;
  --vscode-debugTokenExpression-number: #b5cea8;
  --vscode-list-activeSelectionBackground: rgba(4, 57, 94, 0.65);
  --vscode-list-activeSelectionForeground: #ffffff;
  --vscode-contrastActiveBorder: rgba(255, 255, 255, 0.35);
  --vscode-editorActiveLineNumber-foreground: #c6c6c6;
  --vscode-scrollbarSlider-background: rgba(121, 121, 121, 0.4);
  --vscode-scrollbarSlider-hoverBackground: rgba(100, 100, 100, 0.7);
  --vscode-scrollbarSlider-activeBackground: rgba(191, 191, 191, 0.4);

  display: grid;
  width: 100%;
  height: 100%;
  flex: 1;
  grid-template-rows: 32px var(--ruler-height) 1fr;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  overflow: hidden;
  position: relative;
  user-select: none;
  font-family: "JetBrains Mono", Menlo, Monaco, Consolas, monospace;
}

.height1x {
  min-height: var(--waveform-height);
  max-height: var(--waveform-height);
}
.height2x {
  min-height: calc(2 * var(--waveform-height));
  max-height: calc(2 * var(--waveform-height));
}
.height4x {
  min-height: calc(4 * var(--waveform-height));
  max-height: calc(4 * var(--waveform-height));
}
.height8x {
  min-height: calc(8 * var(--waveform-height));
  max-height: calc(8 * var(--waveform-height));
}

/* Control Bar 样式 */
#control-bar {
  display: flex;
  align-items: center;
  grid-column: 1 / 4;
  grid-row: 1 / 2;
  border-bottom: 1px solid var(--vscode-widget-border);
  background-color: var(--vscode-editorWidget-background);
  padding: 0 4px;
  z-index: 40;
}

.control-bar-group {
  user-select: none;
  white-space: nowrap;
  align-items: center;
  display: flex;
  padding: 0 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  height: 100%;
}

.control-bar-right {
  margin-left: auto;
  border-right: none;
  gap: 10px;
}

.control-bar-button,
.format-button {
  padding: var(--icon-padding);
  margin-right: 3px;
  height: var(--icon-size);
  width: var(--icon-size);
  box-sizing: content-box;
  fill: var(--vscode-icon-foreground);
  color: var(--vscode-icon-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.control-bar-button:hover,
.format-button:hover {
  background-color: var(--vscode-toolbar-hoverBackground);
  cursor: pointer;
}

.custom-icon {
  fill: inherit;
  height: var(--icon-size);
  width: var(--icon-size);
}

.icon-text {
  text-anchor: middle;
  dominant-baseline: central;
  font-family: "Segoe UI", sans-serif;
  font-size: 9.5px;
  font-weight: 600;
  fill: inherit;
}

#search-container {
  outline: 1px solid var(--vscode-input-border);
  display: flex;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
  border-radius: 4px;
  background-color: var(--vscode-input-background);
  height: 23px;
  width: 170px;
  margin-right: 4px;
}

#search-container.is-focused {
  outline: 1px solid var(--vscode-focusBorder);
}

#search-container.is-invalid {
  outline: 1px solid #f44747;
}

.search-input {
  width: calc(100% - 42px);
  height: 20px;
  font-size: 12px;
  background-color: transparent;
  color: var(--vscode-input-foreground);
  border: none;
  padding: 2px 6px;
  outline: none;
  font-family: inherit;
}

.search-button {
  height: var(--icon-size);
  width: var(--icon-size);
  padding: 1px;
  fill: var(--vscode-icon-foreground);
  border-radius: 3px;
  margin-right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover {
  background-color: var(--vscode-toolbar-hoverBackground);
  cursor: pointer;
}

.selected-button {
  outline: 1px solid var(--vscode-inputOption-activeBorder);
  border-radius: 4px;
  color: var(--vscode-inputOption-activeForeground);
  fill: var(--vscode-inputOption-activeForeground);
  background-color: var(--vscode-inputOption-activeBackground);
}

.disabled-button {
  color: var(--vscode-disabledForeground) !important;
  fill: var(--vscode-disabledForeground) !important;
  cursor: default !important;
  pointer-events: none;
}

.radix-bar-group {
  gap: 3px;
}

.radix-pill {
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 3px;
  color: #9da5b4;
  cursor: pointer;
  transition: all 0.15s;
}

.radix-pill:hover {
  background-color: var(--vscode-toolbar-hoverBackground);
  color: #ffffff;
}

.radix-pill.active {
  background-color: var(--vscode-inputOption-activeBackground);
  color: #ffffff;
  outline: 1px solid var(--vscode-inputOption-activeBorder);
}

.marker-delta-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #cccccc;
}

.m-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.m-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.main-dot {
  background-color: #e2e2e2;
}

.alt-dot {
  background-color: #56b6c2;
}

.delta-pill {
  color: #61afef;
  font-weight: 600;
}

.freq-pill {
  color: #98c379;
}

.m-clear {
  cursor: pointer;
  padding: 0 4px;
  color: #858585;
  font-size: 13px;
}

.m-clear:hover {
  color: #f44747;
}

.m-hint {
  color: #6e7681;
  font-size: 10px;
}

.settings-wrapper {
  position: relative;
}

/* Labels & Value Display 面板样式 */
#viewer-container {
  display: flex;
  position: relative;
  grid-column: 1 / 3;
  grid-row: 2 / 4;
  pointer-events: none;
}

.resize-bar {
  border-left: 1px solid var(--vscode-editorIndentGuide-background1);
  position: absolute;
  top: 0;
  height: 100%;
  z-index: 35;
  width: 5px;
  pointer-events: auto;
}

.resize-bar.is-idle:hover,
.resize-bar.is-resizing {
  cursor: col-resize;
  border-left: 3px solid var(--vscode-sash-hoverBorder);
}

.ruler-spacer {
  background-color: #252526;
  border-bottom: 1px solid #33363b;
  z-index: 9;
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.spacer-title {
  font-size: 11px;
  color: #858585;
  font-weight: 600;
}

#waveform-labels-spacer {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  justify-content: flex-end;
}

#value-display-spacer {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  justify-content: flex-end;
}

#waveform-labels-container {
  position: relative;
  grid-column: 1 / 2;
  grid-row: 3 / 4;
  margin-bottom: var(--scrollbar-height);
  overflow: hidden;
  background-color: var(--vscode-editor-background);
}

#value-display-container {
  position: relative;
  grid-column: 2 / 3;
  grid-row: 3 / 4;
  margin-bottom: var(--scrollbar-height);
  color: var(--vscode-debugTokenExpression-number);
  overflow: hidden;
  background-color: var(--vscode-editor-background);
}

#waveform-labels {
  color: var(--vscode-textLink-foreground);
  position: relative;
}

#value-display {
  position: relative;
}

#drag-divider {
  position: absolute;
  left: 0;
  height: 2px;
  z-index: 100;
  width: 100%;
  stroke: #d4d4d4;
  stroke-width: 2px;
  stroke-dasharray: 2 2;
  pointer-events: none;
}

.waveform-label {
  box-sizing: border-box;
  user-select: none;
}

.waveform-label.is-draggable {
  opacity: 0.35;
}

.waveform-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  padding-left: 6px;
  box-sizing: border-box;
  font-size: 12px;
  position: relative;
  user-select: none;
  overflow: hidden;
  cursor: pointer;
}

.waveform-row p {
  margin: 0;
  white-space: nowrap;
}

.scope-prefix {
  opacity: 0.5;
  color: #9cdcfe;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sig-leaf-name {
  color: var(--vscode-textLink-foreground);
  font-weight: 500;
}

.row-del-btn {
  display: none;
  margin-left: 6px;
  color: #858585;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}

.waveform-row:hover .row-del-btn {
  display: inline-block;
}

.row-del-btn:hover {
  color: #f44747;
}

.value-display-item {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  box-sizing: border-box;
  font-size: 12px;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
}

.value-display-item p {
  margin: 0;
}

.transition-arrow {
  color: var(--vscode-editor-foreground);
  margin: 0 2px !important;
}

/* 选中态边框与背景 (完全对应 VaporView style.css) */
.last-selected {
  border-top: 1px solid var(--vscode-focusBorder) !important;
  border-bottom: 1px solid var(--vscode-focusBorder) !important;
}

.is-selected {
  border-top: 1px dotted var(--vscode-contrastActiveBorder);
  border-bottom: 1px dotted var(--vscode-contrastActiveBorder);
  background-color: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
}

/* 顶部标尺与浮动时间标签 (#ruler) */
#ruler {
  height: var(--ruler-height);
  max-height: var(--ruler-height);
  z-index: 30;
  position: relative;
  overflow: hidden;
  grid-column: 3 / 4;
  grid-row: 2 / 3;
  background-color: #252526;
  border-bottom: 1px solid #33363b;
  cursor: pointer;
}

.time-marker-label {
  position: absolute;
  top: 23px;
  z-index: 91;
  width: max-content;
  font-size: 12px;
  color: var(--vscode-editorActiveLineNumber-foreground);
  background-color: #252526;
  padding: 0 8px;
  transform: translate(-50%, -100%);
  box-shadow: 0 0 8px 8px #252526;
  clip-path: polygon(-100% 0, 200% 0, 200% 100%, -100% 100%);
  user-select: none;
  pointer-events: none;
}

.time-marker-label.alt-label {
  color: #56b6c2;
  z-index: 90;
}

/* 主视口与滚动条区域 (#scrollArea) */
#scrollArea {
  position: relative;
  overflow: hidden;
  grid-column: 3 / 4;
  grid-row: 3 / 4;
  margin-left: 1px;
  display: grid;
  grid-template-rows: 1fr var(--scrollbar-height);
  grid-template-columns: 1fr var(--scrollbar-width);
  background-color: var(--vscode-editor-background);
}

#contentArea {
  position: relative;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  overflow: hidden;
  outline: none;
}

#viewport-selection,
#viewport-background,
#viewport-waveforms,
#viewport-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

#viewport-selection {
  z-index: 1;
  pointer-events: none;
}
#viewport-background {
  z-index: 2;
  pointer-events: none;
}
#viewport-waveforms {
  z-index: 3;
  pointer-events: none;
}
#viewport-overlay {
  z-index: 5;
  cursor: crosshair;
}

/* 底部水平滚动条 (#horizontal-scrollbar) */
#horizontal-scrollbar {
  position: relative;
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  height: var(--scrollbar-height);
  background-color: #181818;
  border-top: 1px solid #2b2b2b;
  z-index: 100;
  cursor: pointer;
}

#scrollbarAreaCanvas {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

#horizontal-scrollbar-slider {
  position: absolute;
  bottom: 0;
  left: 0;
  height: var(--scrollbar-height);
  min-width: 17px;
  border-radius: 4px;
}

/* 右侧垂直滚动条 (#vertical-scrollbar) */
#vertical-scrollbar {
  position: relative;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  width: var(--scrollbar-width);
  background-color: #181818;
  border-left: 1px solid #2b2b2b;
  z-index: 100;
  cursor: pointer;
}

#vertical-scrollbar-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--scrollbar-width);
  min-height: 17px;
  border-radius: 4px;
}

.scrollbar {
  background-color: var(--vscode-scrollbarSlider-background);
  transition: background-color 0.1s;
}

.scrollbar:hover {
  background-color: var(--vscode-scrollbarSlider-hoverBackground);
}

.scrollbar.is-dragging {
  background-color: var(--vscode-scrollbarSlider-activeBackground);
}

/* 弹出设置与右键菜单 */
.vaporview-popup-menu {
  position: absolute;
  background-color: #252526;
  border: 1px solid #454545;
  border-radius: 5px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  padding: 8px 10px;
  z-index: 200;
  min-width: 210px;
  font-size: 12px;
  color: #cccccc;
}

.settings-dropdown {
  top: 28px;
  right: 0;
}

.menu-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #858585;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.menu-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  cursor: pointer;
}

.menu-check-item:hover {
  color: #ffffff;
}

.menu-divider {
  height: 1px;
  background-color: #3c3c3c;
  margin: 6px 0;
}

.menu-row-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0;
  gap: 8px;
}

.menu-label {
  font-size: 11px;
  color: #9da5b4;
}

.unit-pills {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.unit-pill {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: #333333;
  color: #cccccc;
  cursor: pointer;
}

.unit-pill:hover {
  background-color: #454545;
}

.unit-pill.active {
  background-color: #007acc;
  color: #ffffff;
}

.color-swatches {
  display: flex;
  gap: 5px;
}

.color-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid transparent;
}

.color-swatch.active {
  border-color: #ffffff;
  transform: scale(1.15);
}

.menu-action-item {
  padding: 5px 6px;
  border-radius: 3px;
  cursor: pointer;
}

.menu-action-item:hover {
  background-color: #094771;
  color: #ffffff;
}

.menu-action-item.danger:hover {
  background-color: rgba(244, 71, 71, 0.25);
  color: #f44747;
}
</style>

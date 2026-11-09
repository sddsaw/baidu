<template>
  <div class="proxima-home-container" :class="{ 'is-maximized': isMaximized }">
    <!-- 顶部原生工控风格标题栏 -->
    <header class="proxima-titlebar">
      <div class="titlebar-left">
        <!-- 迷你 Proxima Logo -->
        <div class="titlebar-logo-squircle">
          <svg viewBox="0 0 64 64" class="titlebar-logo-svg">
            <rect width="64" height="64" rx="14" fill="#ffffff" />
            <rect x="16" y="16" width="10" height="32" rx="5" fill="#00D29E" />
            <path
              d="M23 16 H36 C43 16 48 21 48 27 C48 33 43 38 36 38 H23"
              fill="none"
              stroke="#FF2B85"
              stroke-width="10"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <span class="titlebar-title">Proxima</span>
        <span class="titlebar-badge">v0.1.0</span>
      </div>

      <div class="titlebar-right">
        <!-- 最小化 -->
        <button class="win-btn win-minimize" title="最小化" @click="handleMinimize">
          <svg viewBox="0 0 12 12" width="10" height="10">
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </button>
        <!-- 最大化 / 还原 -->
        <button
          class="win-btn win-maximize"
          :title="isMaximized ? '还原窗口' : '最大化窗口'"
          @click="toggleMaximize"
        >
          <svg v-if="!isMaximized" viewBox="0 0 12 12" width="10" height="10">
            <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.4" />
          </svg>
          <svg v-else viewBox="0 0 12 12" width="10" height="10">
            <rect x="1.5" y="3.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.2" />
            <path d="M3.5 3.5 V1.5 H10.5 V8.5 H8.5" fill="none" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </button>
        <!-- 关闭 / 退出 -->
        <button class="win-btn win-close" title="退出应用" @click="handleClose">
          <svg viewBox="0 0 12 12" width="10" height="10">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </header>

    <!-- 主展示区 -->
    <main class="proxima-main-body">
      <!-- 1. Hero 品牌与标志区域 -->
      <div class="hero-brand-section">
        <div class="hero-logo-box">
          <svg viewBox="0 0 88 88" class="hero-logo-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="proxima-stem-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#00E5A3" />
                <stop offset="100%" stop-color="#00B4D8" />
              </linearGradient>
              <linearGradient id="proxima-loop-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#FF3388" />
                <stop offset="100%" stop-color="#E5005C" />
              </linearGradient>
              <filter id="logo-drop-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="rgba(0,0,0,0.35)" />
              </filter>
            </defs>
            <!-- 白色圆角外框底图 -->
            <rect width="88" height="88" rx="20" fill="#FFFFFF" filter="url(#logo-drop-shadow)" />

            <!-- 左侧绿色垂直圆柱杆 -->
            <rect x="23" y="21" width="12" height="46" rx="6" fill="url(#proxima-stem-grad)" />

            <!-- 右上方粉色环形环扣 (形成 P 字母) -->
            <path
              d="M32 21 H47 C57 21 65 29 65 37.5 C65 46 57 54 47 54 H32"
              fill="none"
              stroke="url(#proxima-loop-grad)"
              stroke-width="12"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div class="hero-text-box">
          <h1 class="brand-title">Proxima</h1>
          <p class="brand-subtitle">SEMICONDUCTOR TEST PLATFORM</p>
        </div>
      </div>

      <!-- 2. 四大核心操作入口卡片 (New Project, Open Project, Maintenance, Cluster Master) -->
      <div class="action-cards-row">
        <!-- New Project 新建工程 -->
        <button class="action-card card-new-project card-anim-0" @click="openNewProjectDialog">
          <div class="card-icon-wrapper">
            <svg viewBox="0 0 32 32" class="card-svg" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="20" height="24" rx="3" />
              <line x1="16" y1="11" x2="16" y2="21" />
              <line x1="11" y1="16" x2="21" y2="16" />
            </svg>
          </div>
          <span class="card-label">New Project</span>
        </button>

        <!-- Open Project 打开工程 -->
        <button class="action-card card-secondary card-anim-1" @click="openExistingProjectDialog">
          <div class="card-icon-wrapper">
            <svg viewBox="0 0 32 32" class="card-svg" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 8 C4 6.9 4.9 6 6 6 H12 L15 9 H26 C27.1 9 28 9.9 28 11 V23 C28 24.1 27.1 25 26 25 H6 C4.9 25 4 24.1 4 23 Z" />
              <line x1="4" y1="13" x2="28" y2="13" />
            </svg>
          </div>
          <span class="card-label">Open Project</span>
        </button>

        <!-- Maintenance 维护校准入口 -->
        <button class="action-card card-secondary card-anim-2" @click="navigateToMaintenance">
          <div class="card-icon-wrapper">
            <svg viewBox="0 0 32 32" class="card-svg wrench-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23.5 4.5 C21 2 17 2.5 14.5 5 L9.5 10 L5.5 14 C4.5 15 4.5 16.5 5.5 17.5 L12.5 24.5 C13.5 25.5 15 25.5 16 24.5 L20 20.5 L25 15.5 C27.5 13 28 9 25.5 6.5 L22.5 9.5 L19.5 6.5 L22.5 3.5 Z" />
            </svg>
          </div>
          <span class="card-label">Maintenance</span>
        </button>

        <!-- Cluster Master 芯片检测集群中控 (1对多远程管控) -->
        <button class="action-card card-secondary card-anim-3" @click="navigateToCluster" title="打开机台测控抽屉面板 (支持单机/多机切换)">
          <div class="card-icon-wrapper">
            <svg viewBox="0 0 32 32" class="card-svg" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <!-- 中心总控节点 (Master Hub) -->
              <circle cx="16" cy="8.5" r="3.5" />
              <!-- 1对多总线分发拓扑 (1-to-Many Distribution Tree) -->
              <path d="M16 12 V17" />
              <path d="M7 17 H25" />
              <path d="M7 17 V22" />
              <path d="M16 17 V22" />
              <path d="M25 17 V22" />
              <!-- 分布式受控机台 (Distributed ATE Stations) -->
              <rect x="4.5" y="22" width="5" height="4.5" rx="1" />
              <rect x="13.5" y="22" width="5" height="4.5" rx="1" />
              <rect x="22.5" y="22" width="5" height="4.5" rx="1" />
            </svg>
          </div>
          <span class="card-label">Cluster Master</span>
        </button>
      </div>

      <!-- 3. 最近工程列表面板 (RECENT PROJECTS) -->
      <section class="recent-projects-panel">
        <div class="panel-header">
          <span class="panel-title">RECENT PROJECTS</span>
          <div class="panel-header-actions">
            <span class="project-count-badge">{{ recentProjects.length }} 项</span>
          </div>
        </div>

        <div class="project-list-container">
          <div
            v-for="(project, index) in recentProjects"
            :key="project.id"
            class="project-item-row history-item-anim"
            :style="{ animationDelay: `${0.35 + index * 0.08}s` }"
            @click="handleSelectProject(project)"
          >
            <!-- 左侧文件图标 -->
            <div class="project-icon-box">
              <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 2.5 H12 L16 6.5 V17 C16 17.55 15.55 18 15 18 H5 C4.45 18 4 17.55 4 17 V2.5 Z" />
                <polyline points="12 2.5 12 7 16 7" />
              </svg>
            </div>

            <!-- 中间项目名与路径 -->
            <div class="project-info-box">
              <div class="project-name">{{ project.name }}</div>
              <div class="project-path" :title="project.path">{{ project.path }}</div>
            </div>

            <!-- 右侧时间戳与操作快捷项 -->
            <div class="project-meta-box">
              <span class="project-date">{{ project.date }}</span>
              <div class="project-hover-tools" @click.stop>
                <el-tooltip content="复制工程路径" placement="top">
                  <button class="tool-mini-btn" @click="copyPath(project.path)">
                    <el-icon :size="13"><CopyDocument /></el-icon>
                  </button>
                </el-tooltip>
                <el-tooltip content="从最近记录移除" placement="top">
                  <button class="tool-mini-btn delete-btn" @click="removeProject(project.id)">
                    <el-icon :size="13"><Close /></el-icon>
                  </button>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. 右下角版本号标识 -->
      <footer class="proxima-version-footer">
        <span>v0.1.0</span>
      </footer>
    </main>

    <!-- 新建工程模态弹窗 -->
    <el-dialog
      v-model="newProjectDialogVisible"
      title="新建 Proxima 半导体测试工程"
      width="560px"
      append-to-body
      destroy-on-close
      class="proxima-custom-dialog"
    >
      <el-form label-position="top" :model="newProjectForm">
        <el-form-item label="工程名称 (Project Name)" required>
          <el-input v-model="newProjectForm.name" placeholder="例如: TP_MVS_Checker_V2" />
        </el-form-item>
        <el-form-item label="存储路径 (Directory Path)" required>
          <el-input v-model="newProjectForm.path" placeholder="C:\Proxima\Projects\...">
            <template #append>
              <el-button @click="browseDirectory">浏览...</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="芯片测试模板类型">
          <el-select v-model="newProjectForm.template" style="width: 100%">
            <el-option label="ATE Digital Logic Checker (数字逻辑验证)" value="ATE_Digital" />
            <el-option label="MIO Mixed Signal Calibration (数模混合校准)" value="MIO_Cal" />
            <el-option label="PMIC Multi-Site Voltage Profile (多通道供电分析)" value="PMIC_Multi" />
            <el-option label="Offline Pattern Visualizer (离线波形可视化)" value="Offline_Visualizer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newProjectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateProject">创建并载入</el-button>
      </template>
    </el-dialog>

    <!-- 打开已有工程弹窗 -->
    <el-dialog
      v-model="openProjectDialogVisible"
      title="打开已有 Proxima 工程"
      width="560px"
      append-to-body
      destroy-on-close
      class="proxima-custom-dialog"
    >
      <div style="margin-bottom: 16px; color: #64748b; font-size: 13px;">
        选择本地半导体测试配置文件 (.mvs / .dio / .pcfg) 或直接输入工程根目录:
      </div>
      <el-input v-model="openProjectPath" placeholder="C:\Users\ArcUser\Downloads\..." style="margin-bottom: 16px;">
        <template #append>
          <el-button @click="browseExistingProject">选择路径</el-button>
        </template>
      </el-input>

      <div class="preset-paths-section">
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">推荐工作区目录:</div>
        <div
          v-for="preset in presetDirectories"
          :key="preset.path"
          class="preset-item"
          @click="openProjectPath = preset.path"
        >
          <el-icon style="margin-right: 6px;"><Folder /></el-icon>
          <span>{{ preset.label }} ({{ preset.path }})</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="openProjectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmOpenProject">确认打开</el-button>
      </template>
    </el-dialog>

    <!-- 工程详情与模块分流弹窗 -->
    <el-dialog
      v-model="projectDetailsVisible"
      :title="`工程详情: ${selectedProject?.name || ''}`"
      width="600px"
      append-to-body
      class="proxima-custom-dialog"
    >
      <div v-if="selectedProject" class="project-details-content">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="工程名称">{{ selectedProject.name }}</el-descriptions-item>
          <el-descriptions-item label="绝对路径">
            <span style="font-family: monospace; font-size: 12px; word-break: break-all;">
              {{ selectedProject.path }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="最近操作时间">{{ selectedProject.date }}</el-descriptions-item>
          <el-descriptions-item label="工程状态">
            <el-tag type="success" size="small">Verified (Ready for Test)</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="module-launch-actions">
          <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 10px;">
            请选择载入的系统模块:
          </div>
          <div class="launch-buttons-grid">
            <el-button
              type="primary"
              plain
              @click="launchModule('/waveform', selectedProject)"
            >
              <el-icon style="margin-right: 4px"><Monitor /></el-icon>
              载入波形仿真引擎
            </el-button>
            <el-button
              type="success"
              plain
              @click="launchModule('/instrument', selectedProject)"
            >
              <el-icon style="margin-right: 4px"><Odometer /></el-icon>
              连接 ATE 机台测试
            </el-button>
            <el-button
              type="warning"
              plain
              @click="launchModule('/maintenance', selectedProject)"
            >
              <el-icon style="margin-right: 4px"><SetUp /></el-icon>
              进入 Proxima 维护校准
            </el-button>
            <el-button
              type="info"
              plain
              @click="launchModule('/cluster', selectedProject)"
            >
              <el-icon style="margin-right: 4px"><Connection /></el-icon>
              派发至集群总控 (1:N)
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="projectDetailsVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 最近工程加载与执行进度弹窗 (Mock) ==================== -->
    <el-dialog
      v-model="projectLoadDialogVisible"
      :show-close="true"
      width="650px"
      append-to-body
      :close-on-click-modal="!isLoading"
      :close-on-press-escape="!isLoading"
      class="proxima-custom-dialog proxima-loading-dialog"
      @closed="handleLoadDialogClosed"
    >
      <!-- 自定义标题栏 -->
      <template #header>
        <div class="loading-dialog-header">
          <div class="dialog-header-left">
            <div
              class="dialog-header-icon"
              :class="{
                'is-loading': isLoading,
                'is-success': isCompleted,
                'is-cancelled': isCancelled
              }"
            >
              <el-icon v-if="isLoading" class="rotating-icon"><Loading /></el-icon>
              <el-icon v-else-if="isCompleted" class="success-icon"><CircleCheckFilled /></el-icon>
              <el-icon v-else class="warn-icon"><Warning /></el-icon>
            </div>
            <div class="dialog-header-text">
              <div class="dialog-title-row">
                <span class="dialog-main-title">工程加载与执行初始化</span>
                <span class="dialog-proj-badge">{{ selectedProject?.name }}</span>
              </div>
              <div class="dialog-sub-title">
                <span class="path-text" :title="selectedProject?.path">{{ selectedProject?.path }}</span>
              </div>
            </div>
          </div>
          <div class="dialog-header-status">
            <span v-if="isLoading" class="header-timer">
              <span class="pulse-dot"></span>
              耗时 {{ elapsedSeconds.toFixed(1) }}s · 预估剩余 ~{{ estimatedRemainingSeconds }}s
            </span>
            <el-tag v-else-if="isCompleted" type="success" effect="dark" size="small" class="status-tag">
              已就绪 100%
            </el-tag>
            <el-tag v-else-if="isCancelled" type="warning" effect="dark" size="small" class="status-tag">
              已中止
            </el-tag>
          </div>
        </div>
      </template>

      <div v-if="selectedProject" class="loading-dialog-body">
        <!-- 1. 轻量化水平步骤轨道 (Horizontal Pipeline Rail) -->
        <div class="horizontal-step-rail">
          <div
            v-for="(step, idx) in mockSteps"
            :key="idx"
            class="rail-step-item"
            :class="{
              'is-completed': idx < currentStepIndex || (isCompleted && idx === currentStepIndex),
              'is-active': idx === currentStepIndex && !isCompleted && !isCancelled,
              'is-pending': idx > currentStepIndex,
              'is-interrupted': isCancelled && idx === currentStepIndex
            }"
          >
            <div class="rail-step-node">
              <el-icon v-if="idx < currentStepIndex || (isCompleted && idx === currentStepIndex)"><Check /></el-icon>
              <el-icon v-else-if="idx === currentStepIndex && !isCancelled" class="rotating-icon"><Loading /></el-icon>
              <el-icon v-else-if="idx === currentStepIndex && isCancelled"><Warning /></el-icon>
              <span v-else>0{{ idx + 1 }}</span>
            </div>
            <div class="rail-step-info">
              <span class="rail-step-label">{{ step.shortName }}</span>
              <span class="rail-step-percent">{{ step.targetProgress }}%</span>
            </div>
            <div v-if="idx < mockSteps.length - 1" class="rail-step-line">
              <div
                class="rail-step-line-fill"
                :style="{
                  width: idx < currentStepIndex || isCompleted ? '100%' : (idx === currentStepIndex ? '50%' : '0%')
                }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 2. 核心大字进度与主状态看板 -->
        <div class="progress-hero-board">
          <div class="hero-board-header">
            <div class="hero-stage-badge">
              <span class="stage-num-pill">阶段 0{{ currentStepIndex + 1 }} / 04</span>
              <span class="stage-name-text">{{ isCompleted ? '全流程验证通过 · ATE 环境装配完毕' : mockSteps[currentStepIndex]?.title }}</span>
            </div>
            <div class="hero-percentage-box">
              <span class="number-val">{{ Math.round(currentProgress) }}</span>
              <span class="percent-symbol">%</span>
            </div>
          </div>

          <!-- 丝滑流体进度条 -->
          <div class="progress-bar-container">
            <el-progress
              :percentage="Math.min(100, Math.max(0, Math.round(currentProgress)))"
              :stroke-width="10"
              :show-text="false"
              :striped="isLoading"
              :striped-flow="isLoading"
              :duration="14"
              class="proxima-smooth-progress-bar"
            />
            <div
              class="progress-laser-glow"
              :style="{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }"
            ></div>
          </div>
        </div>

        <!-- 3. 具体执行动作实时监控 (Live Action Monitor - 具体执行到哪一步) -->
        <div class="live-action-monitor">
          <div class="monitor-header">
            <div class="monitor-title-left">
              <span class="radar-ping"></span>
              <span class="radar-dot"></span>
              <span class="monitor-tag">具体执行动作 (CURRENT ACTION)</span>
            </div>
            <span class="throughput-chip">{{ currentThroughput }}</span>
          </div>
          <div class="monitor-body">
            <transition name="fade-fast" mode="out-in">
              <div :key="currentMicroAction" class="micro-action-line">
                <el-icon class="pulse-caret"><CaretRight /></el-icon>
                <span class="micro-text code-font">{{ currentMicroAction }}</span>
              </div>
            </transition>
          </div>
        </div>

        <!-- 4. ATE 机台与芯片测试遥测微仪表条 (ATE Telemetry Strip) -->
        <div class="ate-telemetry-strip">
          <div class="telemetry-item">
            <span class="telemetry-label">测试芯片工艺</span>
            <span class="telemetry-val highlight-cyan">TSMC 7nm FinFET</span>
          </div>
          <div class="telemetry-sep"></div>
          <div class="telemetry-item">
            <span class="telemetry-label">测试向量装配</span>
            <span class="telemetry-val highlight-blue">{{ currentVectorCount }}</span>
          </div>
          <div class="telemetry-sep"></div>
          <div class="telemetry-item">
            <span class="telemetry-label">虚拟 ATE 通道</span>
            <span class="telemetry-val highlight-green">{{ currentChannelStatus }}</span>
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <template #footer>
        <div class="loading-dialog-footer">
          <div class="footer-left-actions">
            <el-button
              v-if="!isLoading"
              size="small"
              class="replay-btn"
              @click="replayMockLoading"
            >
              <el-icon style="margin-right: 4px"><RefreshRight /></el-icon>
              重新模拟载入
            </el-button>
            <el-button
              size="small"
              class="details-btn"
              @click="openProjectDetailsFromLoading"
            >
              <el-icon style="margin-right: 4px"><Document /></el-icon>
              查看工程属性
            </el-button>
          </div>

          <div class="footer-right-actions">
            <!-- 运行中状态按钮 -->
            <template v-if="isLoading">
              <el-button @click="cancelMockLoading">中止载入</el-button>
              <el-button type="primary" plain @click="runInBackground">
                后台运行 (不阻塞操作)
              </el-button>
            </template>

            <!-- 中止状态按钮 -->
            <template v-else-if="isCancelled">
              <el-button @click="projectLoadDialogVisible = false">关闭</el-button>
              <el-button type="primary" @click="replayMockLoading">
                <el-icon style="margin-right: 4px"><RefreshRight /></el-icon>
                恢复载入
              </el-button>
            </template>

            <!-- 完成状态按钮 -->
            <template v-else-if="isCompleted">
              <el-button @click="projectLoadDialogVisible = false">关闭</el-button>
              <el-button
                type="primary"
                @click="launchModuleFromLoading('/waveform')"
              >
                <el-icon style="margin-right: 4px"><Monitor /></el-icon>
                进入波形仿真引擎
              </el-button>
              <el-button
                type="success"
                @click="launchModuleFromLoading('/instrument')"
              >
                <el-icon style="margin-right: 4px"><Odometer /></el-icon>
                连接 ATE 机台测试
              </el-button>
            </template>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== 芯片检测机台管控抽屉 (根据 flag 控制单机/多机展示) ==================== -->
    <el-drawer
      v-model="clusterDrawerVisible"
      size="720px"
      direction="rtl"
      :with-header="false"
      class="proxima-dark-drawer"
    >
      <div class="drawer-inner-container">
        <!-- 抽屉顶部头部 -->
        <div class="drawer-header">
          <div class="header-left-meta">
            <div class="drawer-title-row">
              <span class="drawer-title">ATE 机台测控终端</span>
              <!-- 显式标识根据 flag 切换的模式状态 -->
              <el-tag
                :type="isMultiMachineMode ? 'primary' : 'success'"
                effect="dark"
                size="small"
                class="mode-badge"
              >
                {{ isMultiMachineMode ? '多机台集群模式 (1:N)' : '单机台独立模式 (1:1)' }}
              </el-tag>
            </div>
            <div class="drawer-subtitle">
              {{ isMultiMachineMode ? '当前状态: 统一监控与机台集群管控' : '当前状态: 单机台精细遥测与闭环受控' }}
            </div>
          </div>

          <!-- 模式切换开关：可实时切换 flag 变量 (isMultiMachineMode) -->
          <div class="header-right-actions">
            <div class="flag-toggle-wrapper">
              <span class="flag-label">Flag 模式:</span>
              <el-radio-group v-model="isMultiMachineMode" size="small">
                <el-radio-button :value="false">单机 (1)</el-radio-button>
                <el-radio-button :value="true">集群 (N)</el-radio-button>
              </el-radio-group>
            </div>
            <button class="drawer-close-btn" @click="clusterDrawerVisible = false">
              <el-icon :size="16"><Close /></el-icon>
            </button>
          </div>
        </div>

        <!-- 抽屉滚动主体内容 (单机与集群统一以集群样式为基准) -->
        <div class="drawer-body-scroll">
          <div class="cluster-view-unified">
            <!-- 状态概览仪表盘条 -->
            <div class="cluster-overview-bar">
              <div class="overview-item">
                <span class="ov-num text-white">{{ currentMachines.length }}</span>
                <span class="ov-text">{{ isMultiMachineMode ? '受控机台' : '当前机台' }}</span>
              </div>
              <div class="overview-item">
                <span class="ov-num text-emerald">{{ runningCount }}</span>
                <span class="ov-text">运行中</span>
              </div>
              <div class="overview-item">
                <span class="ov-num text-sky">{{ idleCount }}</span>
                <span class="ov-text">待机中</span>
              </div>
              <div class="overview-item">
                <span class="ov-num text-rose">{{ errorCount }}</span>
                <span class="ov-text">异常告警</span>
              </div>
              <div class="overview-item">
                <span class="ov-num text-emerald">{{ isMultiMachineMode ? '98.86%' : '99.42%' }}</span>
                <span class="ov-text">综合良率</span>
              </div>
              <div class="overview-item">
                <span class="ov-num text-sky">{{ isMultiMachineMode ? '14,420' : '1,950' }}</span>
                <span class="ov-text">总 UPH</span>
              </div>
            </div>

            <!-- 批量操作控制条 (保留全选与3种布局切换) -->
            <div class="batch-control-bar">
              <div class="batch-bar-left">
                <el-checkbox
                  v-model="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="handleSelectAllChange"
                >
                  全选 (已选 {{ selectedCountInCurrentMode }} 台)
                </el-checkbox>
              </div>
              <div class="batch-bar-right">
                <div class="layout-segmented-control">
                  <button
                    type="button"
                    class="layout-seg-btn"
                    :class="{ 'is-active': clusterLayoutMode === 'cards' }"
                    @click="clusterLayoutMode = 'cards'"
                    title="单列卡片视图"
                  >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="3" width="12" height="4" rx="1" />
                      <rect x="2" y="9" width="12" height="4" rx="1" />
                    </svg>
                    <span>卡片</span>
                  </button>
                  <button
                    type="button"
                    class="layout-seg-btn"
                    :class="{ 'is-active': clusterLayoutMode === 'grid' }"
                    @click="clusterLayoutMode = 'grid'"
                    title="双列网格看板"
                  >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2.5" width="5" height="5" rx="1" />
                      <rect x="9" y="2.5" width="5" height="5" rx="1" />
                      <rect x="2" y="9.5" width="5" height="5" rx="1" />
                      <rect x="9" y="9.5" width="5" height="5" rx="1" />
                    </svg>
                    <span>网格</span>
                  </button>
                  <button
                    type="button"
                    class="layout-seg-btn"
                    :class="{ 'is-active': clusterLayoutMode === 'table' }"
                    @click="clusterLayoutMode = 'table'"
                    title="高密紧凑表格"
                  >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
                      <line x1="2" y1="6.5" x2="14" y2="6.5" />
                      <line x1="6.5" y1="6.5" x2="6.5" y2="13.5" />
                    </svg>
                    <span>表格</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 布局 1: 单列卡片视图 -->
            <div v-if="clusterLayoutMode === 'cards'" class="cluster-machine-cards-list">
              <div
                v-for="m in currentMachines"
                :key="m.id"
                class="cluster-machine-card"
                :class="{ 'is-selected': selectedMachineIds.includes(m.id), 'has-error': m.status === 'error' }"
                @click="toggleMachineSelect(m.id)"
              >
                <!-- 卡片顶行 -->
                <div class="m-card-top">
                  <div class="top-check-box" @click.stop>
                    <el-checkbox
                      :model-value="selectedMachineIds.includes(m.id)"
                      @change="toggleMachineSelect(m.id)"
                    />
                  </div>
                  <div class="m-id-pill">{{ m.id }}</div>
                  <div class="m-name-text">{{ m.name }}</div>
                  <div class="m-status-tag" :class="m.status">
                    {{ m.status === 'running' ? '运行中' : (m.status === 'error' ? '告警' : '待机') }}
                  </div>
                </div>

                <!-- 卡片详情行 (仅保留 IP 信息) -->
                <div class="m-card-mid">
                  <div class="m-detail-col">
                    <span class="detail-label">IP:</span>
                    <span class="detail-val font-mono">{{ m.ip }}</span>
                  </div>
                </div>

                <!-- 若存在告警则展示异常提示 -->
                <div v-if="m.error" class="m-card-error-banner">
                  <el-icon style="margin-right: 4px"><Warning /></el-icon>
                  <span>{{ m.error.title }}: {{ m.error.suggest }}</span>
                </div>
              </div>
            </div>

            <!-- 布局 2: 双列网格看板 -->
            <div v-else-if="clusterLayoutMode === 'grid'" class="cluster-grid-view">
              <div
                v-for="m in currentMachines"
                :key="m.id"
                class="grid-machine-card"
                :class="{ 'is-selected': selectedMachineIds.includes(m.id), 'has-error': m.status === 'error' }"
                @click="toggleMachineSelect(m.id)"
              >
                <div class="grid-card-header">
                  <div class="grid-check-wrapper" @click.stop>
                    <el-checkbox
                      :model-value="selectedMachineIds.includes(m.id)"
                      @change="toggleMachineSelect(m.id)"
                    />
                  </div>
                  <span class="m-id-pill">{{ m.id }}</span>
                  <span class="m-status-tag" :class="m.status">
                    {{ m.status === 'running' ? '运行中' : (m.status === 'error' ? '告警' : '待机') }}
                  </span>
                </div>

                <div class="grid-card-body">
                  <div class="grid-name-text" :title="m.name">{{ m.name }}</div>
                  <div class="grid-ip-text">
                    <span class="detail-label">IP:</span>
                    <span class="detail-val font-mono">{{ m.ip }}</span>
                  </div>
                </div>

                <div v-if="m.error" class="grid-card-error" :title="`${m.error.title}: ${m.error.suggest}`">
                  <el-icon style="margin-right: 4px"><Warning /></el-icon>
                  <span class="error-truncate">{{ m.error.title }}</span>
                </div>
              </div>
            </div>

            <!-- 布局 3: 高密紧凑表格 -->
            <div v-else-if="clusterLayoutMode === 'table'" class="cluster-table-view">
              <table class="compact-machine-table">
                <thead>
                  <tr>
                    <th style="width: 44px; text-align: center;">选择</th>
                    <th style="width: 76px;">编号</th>
                    <th>机台名称</th>
                    <th style="width: 130px;">IP 地址</th>
                    <th style="width: 76px; text-align: center;">状态</th>
                    <th style="width: 170px;">异常诊断</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="m in currentMachines"
                    :key="m.id"
                    class="table-row-item"
                    :class="{ 'is-selected': selectedMachineIds.includes(m.id), 'has-error': m.status === 'error' }"
                    @click="toggleMachineSelect(m.id)"
                  >
                    <td style="text-align: center;" @click.stop>
                      <el-checkbox
                        :model-value="selectedMachineIds.includes(m.id)"
                        @change="toggleMachineSelect(m.id)"
                      />
                    </td>
                    <td>
                      <span class="m-id-pill">{{ m.id }}</span>
                    </td>
                    <td class="table-name-cell">
                      {{ m.name }}
                    </td>
                    <td class="font-mono text-slate-300">
                      {{ m.ip }}
                    </td>
                    <td style="text-align: center;">
                      <span class="m-status-tag" :class="m.status">
                        {{ m.status === 'running' ? '运行中' : (m.status === 'error' ? '告警' : '待机') }}
                      </span>
                    </td>
                    <td>
                      <span v-if="m.error" class="table-error-pill" :title="m.error.suggest">
                        <el-icon style="margin-right: 2px"><Warning /></el-icon>
                        {{ m.error.title }}
                      </span>
                      <span v-else class="table-normal-pill">- 正常 -</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 抽屉底部动作栏 -->
        <div class="drawer-footer">
          <div class="footer-left-info">
            <span class="conn-dot"></span>
            <span>gRPC Gateway: 192.168.1.100 (Connected)</span>
          </div>
          <div class="footer-right-buttons">
            <el-button type="primary" style="min-width: 88px;" @click="handleConfirmCluster">确定</el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  CopyDocument,
  Close,
  Folder,
  Monitor,
  Odometer,
  SetUp,
  Connection,
  Warning,
  Check,
  CircleCheckFilled,
  Loading,
  RefreshRight,
  Document,
  CaretRight
} from '@element-plus/icons-vue'

interface RecentProject {
  id: string
  name: string
  path: string
  date: string
}

interface MockStep {
  shortName: string
  title: string
  targetProgress: number
  microActions: string[]
}

const router = useRouter()

// 是否最大化
const isMaximized = ref(false)

// 模态弹窗与抽屉控制
const newProjectDialogVisible = ref(false)
const openProjectDialogVisible = ref(false)
const projectDetailsVisible = ref(false)
const selectedProject = ref<RecentProject | null>(null)

// ==================== 最近工程执行进度与加载状态 (Mock) ====================
const projectLoadDialogVisible = ref(false)
const isLoading = ref(false)
const isCompleted = ref(false)
const isCancelled = ref(false)
const currentStepIndex = ref(0)
const currentProgress = ref(0)
const elapsedSeconds = ref(0)

// 实时微动作与 ATE 机台遥测指标
const currentMicroAction = ref('正在初始化 ATE 测试内核引擎...')
const currentThroughput = ref('128 MB/s')
const currentVectorCount = ref('0 / 24,000')
const currentChannelStatus = ref('64 通道准备中')

const estimatedRemainingSeconds = computed(() => {
  if (isCompleted.value) return 0
  const remaining = Math.max(0, Math.ceil((100 - currentProgress.value) / 28))
  return remaining
})

// 4 大半导体测试工程初始化阶段 Mock 步序定义
const mockSteps: MockStep[] = [
  {
    shortName: '拓扑解析',
    title: '解析芯片引脚与工程拓扑配置',
    targetProgress: 25,
    microActions: [
      '正在读取 TSMC 7nm 器件结构规格: config.mvs',
      '正在加载 Pin Map: 绑定 64 通道数字 IO 与 8 通道 VI 模拟引脚',
      '校验引脚阻抗与电气电平约束规范: 100% 通过'
    ]
  },
  {
    shortName: '向量装载',
    title: '编译并装载 ATE 高速数字测试向量',
    targetProgress: 58,
    microActions: [
      '正在流式解压数字测试向量: 12nm_logic_func.pat (4,800 Vecs)',
      '正在对齐时序波形基准约束: 200MHz 采样率已锁定 (16,200 Vecs)',
      '构建高速波形查找索引，预热内存二级缓存 (24,000 Cycles 就绪)'
    ]
  },
  {
    shortName: '机台握手',
    title: '建立 ATE 测试机台硬件握手链路',
    targetProgress: 85,
    microActions: [
      '发起 PXIe 虚拟测试机台链路通信请求: PXIe-ATE-Link #1',
      '时钟锁相环同步: Ref Clock 100MHz 锁定 (时钟抖动 < 1.2ps)',
      '正在校准基准电压偏置与通道引脚电平: CH00~CH63 校准完成 (+0.038mV)'
    ]
  },
  {
    shortName: '环境自检',
    title: '工程全流程语法与电气自检就绪',
    targetProgress: 100,
    microActions: [
      '执行测试运行前置依赖安全检查: [Pattern, PinMap, HardwareLink] 全部合格',
      '分配显存与波形渲染引擎缓冲区 (128MB 纹理内存锁定)',
      '工程环境装配完毕，ATE 半导体测试平台已准备就绪！'
    ]
  }
]

let progressAnimId: number | null = null
let stepTimeoutId: any = null
let elapsedIntervalId: any = null
let microActionIntervalId: any = null

// 清理所有动效与计时器
const stopAllTimers = () => {
  if (progressAnimId !== null) {
    cancelAnimationFrame(progressAnimId)
    progressAnimId = null
  }
  if (stepTimeoutId) {
    clearTimeout(stepTimeoutId)
    stepTimeoutId = null
  }
  if (elapsedIntervalId) {
    clearInterval(elapsedIntervalId)
    elapsedIntervalId = null
  }
  if (microActionIntervalId) {
    clearInterval(microActionIntervalId)
    microActionIntervalId = null
  }
}

// 丝滑执行单一步序动画 (带缓动插值)
const runStep = (stepIdx: number) => {
  if (!isLoading.value) return
  currentStepIndex.value = stepIdx
  const step = mockSteps[stepIdx]

  // 微执行文案轮播与机台指标更新
  let subIdx = 0
  currentMicroAction.value = step.microActions[0]
  if (microActionIntervalId) clearInterval(microActionIntervalId)
  microActionIntervalId = setInterval(() => {
    if (!isLoading.value) return
    subIdx++
    if (subIdx < step.microActions.length) {
      currentMicroAction.value = step.microActions[subIdx]
    }
  }, 240)

  // 遥测指标随阶段演进
  if (stepIdx === 0) {
    currentThroughput.value = '145 MB/s'
    currentVectorCount.value = '4,200 / 24,000'
    currentChannelStatus.value = '拓扑映射中'
  } else if (stepIdx === 1) {
    currentThroughput.value = '285 KVec/s'
    currentVectorCount.value = '16,800 / 24,000'
    currentChannelStatus.value = '内存预热中'
  } else if (stepIdx === 2) {
    currentThroughput.value = '0.18ms 延时'
    currentVectorCount.value = '24,000 / 24,000'
    currentChannelStatus.value = '64/64 锁相中'
  } else if (stepIdx === 3) {
    currentThroughput.value = '就绪 (Ready)'
    currentVectorCount.value = '24,000 / 24,000'
    currentChannelStatus.value = '64/64 锁定 (100MHz)'
  }

  const startProgress = currentProgress.value
  const targetProgress = step.targetProgress
  const duration = 750 // 单步动画时长 (ms)
  const startTime = performance.now()

  const tick = () => {
    if (!isLoading.value) return
    const now = performance.now()
    const elapsed = now - startTime
    const t = Math.min(1, elapsed / duration)
    // easeOutCubic 丝滑缓动曲线
    const ease = 1 - Math.pow(1 - t, 3)
    currentProgress.value = startProgress + (targetProgress - startProgress) * ease

    if (t < 1) {
      progressAnimId = requestAnimationFrame(tick)
    } else {
      currentProgress.value = targetProgress
      progressAnimId = null

      if (stepIdx < mockSteps.length - 1) {
        // 步骤间自然缓冲停留 180ms
        stepTimeoutId = setTimeout(() => {
          runStep(stepIdx + 1)
        }, 180)
      } else {
        // 完成全部步骤
        isLoading.value = false
        isCompleted.value = true
        currentMicroAction.value = '所有芯片引脚、测试向量拓扑与硬件链路校验合格，工程准备就绪'
        currentThroughput.value = 'Ready'
        currentVectorCount.value = '24,000 / 24,000 (100%)'
        currentChannelStatus.value = '64 通道已锁定 (Lock)'
        ElMessage.success(`工程 [${selectedProject.value?.name}] 载入完成`)
      }
    }
  }

  progressAnimId = requestAnimationFrame(tick)
}

// 启动 Mock 工程加载流程
const startMockProjectLoading = (project: RecentProject) => {
  stopAllTimers()
  selectedProject.value = project
  projectLoadDialogVisible.value = true
  isLoading.value = true
  isCompleted.value = false
  isCancelled.value = false
  currentStepIndex.value = 0
  currentProgress.value = 0
  elapsedSeconds.value = 0
  currentMicroAction.value = '正在建立 ATE 测试运行时环境与拓扑链接...'
  currentThroughput.value = '120 MB/s'
  currentVectorCount.value = '0 / 24,000'
  currentChannelStatus.value = '64 通道准备中'

  const startTime = performance.now()
  elapsedIntervalId = setInterval(() => {
    if (isLoading.value) {
      elapsedSeconds.value = Number(((performance.now() - startTime) / 1000).toFixed(1))
    }
  }, 100)

  // 启动第一阶段步序
  runStep(0)
}

// 重新模拟载入
const replayMockLoading = () => {
  if (selectedProject.value) {
    startMockProjectLoading(selectedProject.value)
  }
}

// 取消加载
const cancelMockLoading = () => {
  stopAllTimers()
  isLoading.value = false
  isCancelled.value = true
  ElMessage.warning('工程载入已中止')
}

// 后台运行
const runInBackground = () => {
  projectLoadDialogVisible.value = false
  ElMessage.info(`工程 [${selectedProject.value?.name}] 已转入后台持续载入...`)
}

// 从加载弹窗进入具体系统模块
const launchModuleFromLoading = (path: string) => {
  projectLoadDialogVisible.value = false
  launchModule(path, selectedProject.value)
}

// 从加载弹窗查看静态工程详情
const openProjectDetailsFromLoading = () => {
  projectDetailsVisible.value = true
}

// 弹窗关闭回调
const handleLoadDialogClosed = () => {
  if (!isLoading.value) {
    stopAllTimers()
  }
}

onBeforeUnmount(() => {
  stopAllTimers()
})

// 控制机台管控抽屉的显示
const clusterDrawerVisible = ref(false)

// 关键 flag 变量：根据 flag 决定展示【单机台模式 (false)】还是【多机台集群模式 (true)】
const isMultiMachineMode = ref(true)

// 打开机台管控抽屉
const openClusterDrawer = () => {
  clusterDrawerVisible.value = true
}

// 单机台模式数据 (flag = false 时展示，与集群保持统一数据格式)
const singleMachine = ref({
  id: 'ST-01',
  name: '晶圆外观AOI检测机 #1',
  type: 'AOI-Optics',
  ip: '192.168.1.101',
  status: 'running',
  error: null
})

// 多机台集群列表数据 (flag = true 时展示)
const clusterMachines = ref([
  {
    id: 'ST-01',
    name: '晶圆外观AOI检测机 #1',
    type: 'AOI-Optics',
    ip: '192.168.1.101',
    status: 'running',
    recipe: 'Wafer_12nm_Metal1_Rev4.rcp',
    validateStatus: 'VALIDATED_OK',
    yield: 99.42,
    uph: 1950,
    error: null
  },
  {
    id: 'ST-02',
    name: '晶圆探针台 (CP Prober #2)',
    type: 'CP-Prober',
    ip: '192.168.1.102',
    status: 'error',
    recipe: 'TSMC_7nm_Logic_v3.2.rcp',
    validateStatus: 'VALIDATE_FAIL',
    yield: 94.10,
    uph: 0,
    error: {
      title: '探针接触阻抗超标告警',
      suggest: '需自动清针打磨或重跑自检'
    }
  },
  {
    id: 'ST-03',
    name: '终测分选机 (FT Handler #3)',
    type: 'FT-Handler',
    ip: '192.168.1.103',
    status: 'running',
    recipe: 'BGA_Final_Test_2026.rcp',
    validateStatus: 'VALIDATED_OK',
    yield: 98.75,
    uph: 2400,
    error: null
  },
  {
    id: 'ST-04',
    name: '终测分选机 (FT Handler #4)',
    type: 'FT-Handler',
    ip: '192.168.1.104',
    status: 'running',
    recipe: 'BGA_Final_Test_2026.rcp',
    validateStatus: 'VALIDATED_OK',
    yield: 99.10,
    uph: 2380,
    error: null
  },
  {
    id: 'ST-05',
    name: '系统级SLT测试台 #5',
    type: 'SLT-Bench',
    ip: '192.168.1.105',
    status: 'idle',
    recipe: 'SLT_Stress_Firmware_v1.0.rcp',
    validateStatus: 'STANDBY',
    yield: 100.0,
    uph: 0,
    error: null
  },
  {
    id: 'ST-06',
    name: '晶圆探针台 (CP Prober #6)',
    type: 'CP-Prober',
    ip: '192.168.1.106',
    status: 'running',
    recipe: 'Auto_PMIC_Profile_Rev2.rcp',
    validateStatus: 'VALIDATED_OK',
    yield: 99.20,
    uph: 1820,
    error: null
  }
])

// 当前展示机台列表 (单机与集群统一以集群样式为基准)
const currentMachines = computed(() => {
  return isMultiMachineMode.value ? clusterMachines.value : [singleMachine.value]
})

// 视图布局模式: cards (单列卡片), grid (双列网格), table (高密表格)
const clusterLayoutMode = ref<'cards' | 'grid' | 'table'>('cards')

// 多选与统计计算 (支持单机与多机自适应)
const selectedMachineIds = ref<string[]>(['ST-01', 'ST-03', 'ST-04', 'ST-06'])

const runningCount = computed(() => currentMachines.value.filter(m => m.status === 'running').length)
const idleCount = computed(() => currentMachines.value.filter(m => m.status === 'idle').length)
const errorCount = computed(() => currentMachines.value.filter(m => m.status === 'error').length)

const selectedCountInCurrentMode = computed(() => {
  return currentMachines.value.filter(m => selectedMachineIds.value.includes(m.id)).length
})

const isAllSelected = computed({
  get: () => {
    return currentMachines.value.length > 0 && currentMachines.value.every(m => selectedMachineIds.value.includes(m.id))
  },
  set: (val: boolean) => {
    if (val) {
      const idsToAdd = currentMachines.value.map(m => m.id)
      selectedMachineIds.value = Array.from(new Set([...selectedMachineIds.value, ...idsToAdd]))
    } else {
      const idsToRemove = new Set(currentMachines.value.map(m => m.id))
      selectedMachineIds.value = selectedMachineIds.value.filter(id => !idsToRemove.has(id))
    }
  }
})

const isIndeterminate = computed(() => {
  const selectedCount = selectedCountInCurrentMode.value
  return selectedCount > 0 && selectedCount < currentMachines.value.length
})

const handleSelectAllChange = (val: any) => {
  isAllSelected.value = !!val
}

const toggleMachineSelect = (id: string) => {
  const idx = selectedMachineIds.value.indexOf(id)
  if (idx !== -1) {
    selectedMachineIds.value.splice(idx, 1)
  } else {
    selectedMachineIds.value.push(id)
  }
}

// 抽屉确认操作
const handleConfirmCluster = () => {
  clusterDrawerVisible.value = false
  const count = selectedCountInCurrentMode.value
  if (isMultiMachineMode.value) {
    ElMessage.success(`已确认选定 ${count} 台受控机台`)
  } else {
    ElMessage.success(`已确认选定单机 [${singleMachine.value.id}]`)
  }
}

// 新建工程表单
const newProjectForm = ref({
  name: '',
  path: 'C:\\Users\\ArcUser\\Downloads\\ProximaProjects\\',
  template: 'ATE_Digital'
})

// 打开工程路径
const openProjectPath = ref('')

// 推荐路径
const presetDirectories = [
  { label: 'Downloads 校验工程', path: 'C:\\Users\\ArcUser\\Downloads\\MVS1A_Checker_TP' },
  { label: 'Dll_realized 混模项目', path: 'C:\\Users\\ArcUser\\Downloads\\Dll_realized\\MIO_Checker' },
  { label: 'SVN AE 离线工程库', path: 'C:\\svn\\AE\\Case-vs-visualizer\\Offline' }
]

// 最近工程列表 (完全复刻用户实机图中的 5 项真实数据)
const recentProjects = ref<RecentProject[]>([
  {
    id: '1',
    name: 'TP_MVS_Checker',
    path: 'C:\\Users\\ArcUser\\Downloads\\MVS1A_Checker_TP\\MVS1A_Checker_TP\\TP_MVS_Checker',
    date: '2026/10/23 17:25'
  },
  {
    id: '2',
    name: 'MIO_Checker',
    path: 'C:\\Users\\ArcUser\\Downloads\\Dll_realized\\Dll_realized\\MIO_Checker',
    date: '2026/10/21 22:31'
  },
  {
    id: '3',
    name: 'MIO_Cal',
    path: 'C:\\Users\\ArcUser\\Downloads\\Dll_realized\\Dll_realized\\MIO_Cal',
    date: '2026/10/20 09:53'
  },
  {
    id: '4',
    name: 'Case-vs-visualizer',
    path: 'C:\\svn\\AE\\Case-vs-visualizer\\Offline',
    date: '2026/10/19 21:16'
  },
  {
    id: '5',
    name: 'case-vih-group',
    path: 'C:\\svn\\AE\\case-vih-group\\Offline',
    date: '2026/10/16 10:18'
  }
])

// 标题栏按钮动作
const handleMinimize = () => {
  ElMessage.info('已最小化 Proxima 平台到后台运行')
}

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value
  ElMessage.success(isMaximized.value ? '已最大化窗口' : '已还原窗口尺寸')
}

const handleClose = () => {
  ElMessage.info('返回系统控制台')
  router.push('/transfer')
}

// 导航到维护校准页面
const navigateToMaintenance = () => {
  router.push('/maintenance')
}

// 导航到 1对多集群总控终端 (打开抽屉)
const navigateToCluster = () => {
  openClusterDrawer()
}

// 打开新建弹窗
const openNewProjectDialog = () => {
  newProjectForm.value.name = `Proxima_DUT_Test_${new Date().getMonth() + 1}${new Date().getDate()}`
  newProjectDialogVisible.value = true
}

const browseDirectory = () => {
  newProjectForm.value.path = 'C:\\Users\\ArcUser\\Projects\\Proxima_' + Math.floor(Math.random() * 1000)
  ElMessage.success('已自动选取目标文件夹')
}

// 确认创建工程
const confirmCreateProject = () => {
  if (!newProjectForm.value.name.trim()) {
    ElMessage.warning('请输入工程名称')
    return
  }
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  const newProj: RecentProject = {
    id: Date.now().toString(),
    name: newProjectForm.value.name.trim(),
    path: `${newProjectForm.value.path.replace(/\\$/, '')}\\${newProjectForm.value.name.trim()}`,
    date: `${year}/${month}/${day} ${hours}:${minutes}`
  }

  recentProjects.value.unshift(newProj)
  newProjectDialogVisible.value = false
  ElMessage.success(`工程 [${newProj.name}] 创建成功`)

  // 触发工程加载与执行初始化进度弹窗
  startMockProjectLoading(newProj)
}

// 打开已有工程
const openExistingProjectDialog = () => {
  openProjectPath.value = ''
  openProjectDialogVisible.value = true
}

const browseExistingProject = () => {
  openProjectPath.value = 'C:\\Users\\ArcUser\\Downloads\\MVS1A_Checker_TP\\MVS1A_Checker_TP\\TP_MVS_Checker'
  ElMessage.success('已载入工程路径')
}

const confirmOpenProject = () => {
  if (!openProjectPath.value.trim()) {
    ElMessage.warning('请输入或选择工程路径')
    return
  }
  const segments = openProjectPath.value.trim().split('\\').filter(Boolean)
  const name = segments[segments.length - 1] || 'Imported_Project'

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  // 若存在则置顶，不存在则新增
  const existingIdx = recentProjects.value.findIndex(p => p.path === openProjectPath.value.trim())
  let targetProject: RecentProject
  if (existingIdx !== -1) {
    targetProject = recentProjects.value[existingIdx]
    targetProject.date = `${year}/${month}/${day} ${hours}:${minutes}`
    recentProjects.value.splice(existingIdx, 1)
    recentProjects.value.unshift(targetProject)
  } else {
    targetProject = {
      id: Date.now().toString(),
      name,
      path: openProjectPath.value.trim(),
      date: `${year}/${month}/${day} ${hours}:${minutes}`
    }
    recentProjects.value.unshift(targetProject)
  }

  openProjectDialogVisible.value = false
  ElMessage.success(`工程 [${targetProject.name}] 载入就绪`)
  // 触发工程加载与执行初始化进度弹窗
  startMockProjectLoading(targetProject)
}

// 选择最近工程并触发进度弹窗
const handleSelectProject = (project: RecentProject) => {
  startMockProjectLoading(project)
}

// 复制路径
const copyPath = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path)
    ElMessage.success('工程绝对路径已复制到剪贴板')
  } catch {
    ElMessage.info(`路径: ${path}`)
  }
}

// 移除工程
const removeProject = (id: string) => {
  recentProjects.value = recentProjects.value.filter(p => p.id !== id)
  ElMessage.info('已从最近列表中移除')
}

// 分流进入不同系统模块
const launchModule = (path: string, project?: RecentProject | null) => {
  projectDetailsVisible.value = false
  clusterDrawerVisible.value = false
  if (project) {
    ElMessage.success(`正在载入工程 [${project.name}]...`)
  }
  router.push(path)
}
</script>

<style scoped>
/* 全局暗色调工控容器 */
.proxima-home-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 50% 28%, #36373d 0%, #29292d 65%, #242427 100%);
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  user-select: none;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.proxima-home-container.is-maximized {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

/* 顶部窗口标题栏 */
.proxima-titlebar {
  height: 38px;
  background-color: #202024;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  flex-shrink: 0;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.titlebar-logo-squircle {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.titlebar-logo-svg {
  width: 20px;
  height: 20px;
}

.titlebar-title {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  letter-spacing: 0.3px;
}

.titlebar-badge {
  font-size: 11px;
  color: #71717a;
  margin-left: 4px;
}

.titlebar-right {
  display: flex;
  align-items: center;
}

.win-btn {
  width: 38px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.win-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.win-btn.win-close:hover {
  background-color: #e81123;
  color: #ffffff;
}

/* 主展示视口 */
.proxima-main-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px 40px 20px;
  position: relative;
  overflow-y: auto;
}

/* 1. Hero 品牌与标志 */
.hero-brand-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 38px;
  margin-top: -20px;
}

.hero-logo-box {
  width: 76px;
  height: 76px;
  flex-shrink: 0;
}

.hero-logo-svg {
  width: 76px;
  height: 76px;
  display: block;
}

.hero-text-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-title {
  margin: 0;
  font-size: 44px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.05;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  margin: 4px 0 0 0;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #9ca3af;
}

/* 2. 四大核心操作卡片 (入场动效来自 statistics-cards.vue) */
.action-cards-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 34px;
}

.action-card {
  width: 142px;
  height: 104px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  user-select: none;
}

@keyframes animation-translateY {
  0% {
    transform: translateY(40px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 4 张入口卡片依次入场动效 */
.card-anim-0 {
  opacity: 0;
  animation: animation-translateY 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0s;
}
.card-anim-1 {
  opacity: 0;
  animation: animation-translateY 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.1s;
}
.card-anim-2 {
  opacity: 0;
  animation: animation-translateY 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.2s;
}
.card-anim-3 {
  opacity: 0;
  animation: animation-translateY 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.3s;
}

/* 悬浮微升与投影过渡 (来自 statistics-cards.vue hover:shadow-lg) */
.action-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45) !important;
}

/* New Project 亮蓝高亮按钮 */
.card-new-project {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35);
}

.card-new-project:hover {
  filter: brightness(1.12);
  box-shadow: 0 14px 30px rgba(14, 165, 233, 0.5) !important;
}

.card-new-project:active {
  transform: translateY(0);
}

/* Open Project & Maintenance 暗色磨砂卡片 */
.card-secondary {
  background-color: #3b3c42;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f1f5f9;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}

.card-secondary:hover {
  background-color: #484a54;
  border-color: rgba(255, 255, 255, 0.32);
}

.card-secondary:active {
  transform: translateY(0);
}

.card-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-svg {
  width: 32px;
  height: 32px;
}

.wrench-icon {
  width: 30px;
  height: 30px;
  transform: rotate(-10deg);
}

.card-label {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

/* 3. 最近工程面板 */
.recent-projects-panel {
  width: 100%;
  max-width: 680px;
  background-color: #212126;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 6px;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.4px;
  color: #8b92a2;
}

.project-count-badge {
  font-size: 11px;
  color: #64748b;
}

.project-list-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 历史数据列表入场动效 (自 statistics-cards.vue 梯次瀑布入场) */
.history-item-anim {
  opacity: 0;
  animation: animation-translateY 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 最近工程行项 */
.project-item-row {
  display: flex;
  align-items: center;
  padding: 9px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-item-row:hover {
  background-color: rgba(255, 255, 255, 0.08);
  transform: translateX(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
}

.project-icon-box {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  margin-right: 8px;
  flex-shrink: 0;
}

.project-info-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.2;
}

.project-item-row:hover .project-name {
  color: #38bdf8;
}

.project-path {
  font-size: 11.5px;
  color: #787e8f;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: Consolas, "Courier New", monospace;
}

.project-meta-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 16px;
  flex-shrink: 0;
}

.project-date {
  font-size: 12px;
  color: #787e8f;
  font-variant-numeric: tabular-nums;
}

.project-hover-tools {
  display: none;
  align-items: center;
  gap: 4px;
}

.project-item-row:hover .project-hover-tools {
  display: flex;
}

.tool-mini-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #cbd5e1;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-mini-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.tool-mini-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* 4. 右下角版本号 */
.proxima-version-footer {
  position: absolute;
  bottom: 16px;
  right: 24px;
  font-size: 12px;
  color: #646a78;
  font-weight: 500;
  pointer-events: none;
}

/* 预设路径项 */
.preset-item {
  padding: 8px 10px;
  border-radius: 6px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #334155;
  cursor: pointer;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  transition: all 0.15s ease;
}

.preset-item:hover {
  background-color: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

/* 模块分流区 */
.module-launch-actions {
  margin-top: 20px;
}

.launch-buttons-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ================= 暗色工业风抽屉与机台列表样式 ================= */
:deep(.proxima-dark-drawer .el-drawer) {
  background-color: #1a1b1f !important;
  color: #f1f5f9;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
}

:deep(.proxima-dark-drawer .el-drawer__body) {
  padding: 0 !important;
  background-color: #1a1b1f !important;
  overflow: hidden;
}

/* 暗色抽屉内 Element Plus 单选组与复选框统一样式 */
:deep(.proxima-dark-drawer .el-radio-button__inner) {
  background-color: #17181c !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #94a3b8 !important;
  box-shadow: none !important;
  font-size: 12px;
}

:deep(.proxima-dark-drawer .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #007acc !important;
  border-color: #007acc !important;
  color: #ffffff !important;
  box-shadow: -1px 0 0 0 #007acc !important;
}

:deep(.proxima-dark-drawer .el-radio-button:hover .el-radio-button__inner) {
  color: #ffffff !important;
}

:deep(.proxima-dark-drawer .el-checkbox__label) {
  color: #cbd5e1 !important;
  font-size: 12px;
}

:deep(.proxima-dark-drawer .el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #ffffff !important;
}

:deep(.proxima-dark-drawer .el-checkbox__inner) {
  background-color: #17181c;
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.proxima-dark-drawer .el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.proxima-dark-drawer .el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #007acc;
  border-color: #007acc;
}

.drawer-inner-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1a1b1f;
  color: #f1f5f9;
}

/* 抽屉顶部头部 */
.drawer-header {
  padding: 16px 20px;
  background-color: #212228;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drawer-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.drawer-subtitle {
  font-size: 12px;
  color: #8b92a2;
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.flag-toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.25);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.flag-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
  font-family: monospace;
}

.drawer-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.drawer-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* 滚动主体内容区 */
.drawer-body-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 颜色工具 */
.text-emerald { color: #10b981 !important; }
.text-sky { color: #38bdf8 !important; }
.text-amber { color: #f59e0b !important; }
.text-rose { color: #f43f5e !important; }
.text-white { color: #ffffff !important; }

/* ================= 机台管控抽屉统一视图样式 (单机与集群统一采用集群工业样式) ================= */
.cluster-view-unified {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cluster-overview-bar {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  background: #212228;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.ov-num {
  font-size: 17px;
  font-weight: 700;
  font-family: monospace;
}

.ov-text {
  font-size: 11px;
  color: #8b92a2;
}

.batch-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #212228;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
}

.batch-bar-left {
  display: flex;
  align-items: center;
}

.batch-bar-right {
  display: flex;
  align-items: center;
}

/* 布局分段切换器 (Segmented Control) 暗色精修 */
.layout-segmented-control {
  display: inline-flex;
  align-items: center;
  background-color: #17181c;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 2.5px;
  gap: 2px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
}

.layout-seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 500;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
  transition: all 0.15s ease;
  user-select: none;
}

.layout-seg-btn:hover {
  color: #f1f5f9;
  background-color: rgba(255, 255, 255, 0.06);
}

.layout-seg-btn.is-active {
  color: #ffffff;
  background-color: #007acc;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.layout-seg-btn svg {
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.layout-seg-btn:hover svg {
  transform: scale(1.06);
}

.cluster-machine-cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cluster-machine-card {
  background-color: #212228;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.cluster-machine-card:hover {
  background-color: #282a32;
  border-color: rgba(255, 255, 255, 0.2);
}

.cluster-machine-card.is-selected {
  border-color: #0284c7;
  background-color: rgba(2, 132, 199, 0.08);
}

.cluster-machine-card.has-error {
  border-color: rgba(244, 63, 94, 0.4);
}

.m-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.m-id-pill {
  font-family: monospace;
  font-weight: 700;
  font-size: 12px;
  background: #334155;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
}

.m-name-text {
  flex: 1;
  font-size: 13.5px;
  font-weight: 600;
  color: #f1f5f9;
}

.m-status-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.m-status-tag.running {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.m-status-tag.idle {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.m-status-tag.error {
  background: rgba(244, 63, 94, 0.2);
  color: #f43f5e;
}

.m-card-mid {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.15);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.m-detail-col {
  display: flex;
  gap: 4px;
}

.detail-label {
  color: #8b92a2;
}

.detail-val {
  font-weight: 500;
  color: #e2e8f0;
}

.m-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
}

.recipe-text {
  color: #94a3b8;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 75%;
}

.validate-badge {
  font-family: monospace;
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 3px;
}

.validate-badge.ok {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.validate-badge.fail {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}

.m-card-error-banner {
  display: flex;
  align-items: center;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.25);
  color: #fda4af;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11.5px;
}

/* ==================== 布局 2: 双列网格样式 ==================== */
.cluster-grid-view {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.grid-machine-card {
  background-color: #212228;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.grid-machine-card:hover {
  background-color: #282932;
  border-color: rgba(255, 255, 255, 0.16);
}

.grid-machine-card.is-selected {
  border-color: #007acc;
  box-shadow: 0 0 0 1px #007acc;
  background-color: rgba(0, 122, 204, 0.08);
}

.grid-machine-card.has-error {
  border-color: rgba(244, 63, 94, 0.4);
}

.grid-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-check-wrapper {
  display: flex;
  align-items: center;
}

.grid-card-header .m-status-tag {
  margin-left: auto;
}

.grid-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0, 0, 0, 0.15);
  padding: 6px 8px;
  border-radius: 6px;
}

.grid-name-text {
  font-size: 12.5px;
  font-weight: 600;
  color: #f1f5f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-ip-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.grid-card-error {
  display: flex;
  align-items: center;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.25);
  color: #fda4af;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.error-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 布局 3: 高密紧凑表格样式 ==================== */
.cluster-table-view {
  background-color: #212228;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.compact-machine-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.compact-machine-table thead th {
  background-color: #1a1b20;
  color: #8b92a2;
  font-weight: 600;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
}

.table-row-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.table-row-item:hover {
  background-color: #282932;
}

.table-row-item.is-selected {
  background-color: rgba(0, 122, 204, 0.1);
}

.table-row-item.has-error {
  background-color: rgba(244, 63, 94, 0.05);
}

.table-row-item td {
  padding: 8px 10px;
  color: #e2e8f0;
  vertical-align: middle;
}

.table-name-cell {
  font-weight: 500;
  color: #f1f5f9;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-error-pill {
  display: inline-flex;
  align-items: center;
  color: #f43f5e;
  font-size: 11px;
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-normal-pill {
  color: #64748b;
  font-size: 11px;
}

/* 抽屉底部工具栏 */
.drawer-footer {
  padding: 14px 20px;
  background-color: #212228;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.footer-left-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: #94a3b8;
  font-family: monospace;
}

.conn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10b981;
}

.footer-right-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .hero-brand-section {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  .action-cards-row {
    flex-wrap: wrap;
  }
  .recent-projects-panel {
    max-width: 100%;
  }
}
</style>

<style>
/* ========================================================
   Proxima 最近工程加载与执行进度弹窗 (全局深色工业风)
   ======================================================== */
.proxima-loading-dialog.el-dialog {
  background: #18191e !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 14px !important;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
  overflow: hidden;
  padding: 0 !important;
  backdrop-filter: blur(16px);
}

.proxima-loading-dialog .el-dialog__header {
  height: auto !important;
  min-height: 68px !important;
  margin: 0 !important;
  padding: 16px 20px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: linear-gradient(180deg, #22242b 0%, #1c1e24 100%) !important;
}

.proxima-loading-dialog .el-dialog__headerbtn {
  top: 22px !important;
  right: 18px !important;
}

.proxima-loading-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #94a3b8;
  font-size: 16px;
  transition: all 0.2s;
}

.proxima-loading-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #ffffff;
  transform: rotate(90deg);
}

.proxima-loading-dialog .el-dialog__body {
  padding: 20px 22px !important;
  background-color: #18191e;
  color: #e2e8f0;
}

.proxima-loading-dialog .el-dialog__footer {
  margin: 0 !important;
  padding: 14px 22px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background-color: #1e2026;
}

/* 顶部标题区 */
.loading-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 28px;
}

.dialog-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-header-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.dialog-header-icon.is-loading {
  background: rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.35);
  color: #38bdf8;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.25);
}

.dialog-header-icon.is-success {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.35);
  color: #34d399;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.25);
}

.dialog-header-icon.is-cancelled {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fbbf24;
}

.dialog-header-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dialog-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-main-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.3px;
}

.dialog-proj-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
  font-family: monospace;
}

.dialog-sub-title .path-text {
  font-size: 11.5px;
  color: #71717a;
  font-family: Consolas, "Courier New", monospace;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.pulse-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #38bdf8;
  animation: pulse-ring 1.5s infinite;
}

.header-timer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #94a3b8;
  font-family: Consolas, monospace;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 9px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* 1. 轻量级水平步骤轨道 */
.horizontal-step-rail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.rail-step-item {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
}

.rail-step-item:last-child {
  flex: none;
}

.rail-step-node {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  margin-right: 8px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}

.is-completed .rail-step-node {
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.45);
}

.is-active .rail-step-node {
  background: #0284c7;
  color: #ffffff;
  box-shadow: 0 0 12px rgba(14, 165, 233, 0.6);
  animation: pulse-ring 1.8s infinite;
}

.is-interrupted .rail-step-node {
  background: #d97706;
  color: #ffffff;
}

.is-pending .rail-step-node {
  background: rgba(255, 255, 255, 0.06);
  color: #64748b;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.rail-step-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rail-step-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  transition: color 0.3s;
  white-space: nowrap;
}

.is-active .rail-step-label {
  color: #38bdf8;
}

.is-completed .rail-step-label {
  color: #cbd5e1;
}

.rail-step-percent {
  font-size: 10px;
  color: #475569;
  font-family: monospace;
}

.rail-step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 10px;
  border-radius: 1px;
  overflow: hidden;
  position: relative;
}

.rail-step-line-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #06b6d4);
  transition: width 0.35s ease;
}

/* 2. 主状态大字看板与进度条 */
.progress-hero-board {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 12px;
}

.hero-board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.hero-stage-badge {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stage-num-pill {
  font-size: 10.5px;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(14, 165, 233, 0.15);
  padding: 2px 7px;
  border-radius: 3px;
  letter-spacing: 0.5px;
  align-self: flex-start;
}

.stage-name-text {
  font-size: 14.5px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2px;
}

.hero-percentage-box {
  display: flex;
  align-items: baseline;
  line-height: 1;
}

.number-val {
  font-size: 36px;
  font-weight: 800;
  font-family: Consolas, -apple-system, monospace;
  background: linear-gradient(135deg, #38bdf8 0%, #00e5a3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.45));
}

.percent-symbol {
  font-size: 18px;
  font-weight: 700;
  color: #00e5a3;
  margin-left: 2px;
}

.progress-bar-container {
  position: relative;
  width: 100%;
}

.proxima-smooth-progress-bar .el-progress-bar__outer {
  background-color: rgba(255, 255, 255, 0.08) !important;
  border-radius: 6px !important;
  overflow: hidden;
}

.proxima-smooth-progress-bar .el-progress-bar__inner {
  background: linear-gradient(90deg, #00e5a3 0%, #06b6d4 40%, #3b82f6 75%, #10b981 100%) !important;
  border-radius: 6px !important;
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1) !important;
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.55);
}

.progress-laser-glow {
  position: absolute;
  top: 0;
  left: 0;
  height: 10px;
  border-radius: 6px;
  background: radial-gradient(circle at 100% 50%, rgba(56, 189, 248, 0.45) 0%, transparent 60%);
  pointer-events: none;
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

/* 3. 具体执行动作实时监控卡片 */
.live-action-monitor {
  background: #111319;
  border: 1px solid rgba(56, 189, 248, 0.22);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.monitor-title-left {
  display: flex;
  align-items: center;
  gap: 7px;
  position: relative;
}

.radar-ping {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #38bdf8;
  position: relative;
}

.radar-ping::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1.5px solid #38bdf8;
  animation: radar-wave 1.6s infinite ease-out;
}

.monitor-tag {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.4px;
  font-family: Consolas, monospace;
}

.throughput-chip {
  font-size: 11px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px 7px;
  border-radius: 3px;
  font-family: monospace;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.monitor-body {
  min-height: 24px;
  display: flex;
  align-items: center;
}

.micro-action-line {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.pulse-caret {
  color: #38bdf8;
  font-size: 13px;
  flex-shrink: 0;
}

.micro-text {
  font-size: 12px;
  color: #e2e8f0;
  font-family: Consolas, "JetBrains Mono", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 4. ATE 机台与芯片测试遥测微仪表条 */
.ate-telemetry-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 9px 16px;
  margin-bottom: 2px;
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.telemetry-label {
  font-size: 10.5px;
  color: #64748b;
}

.telemetry-val {
  font-size: 12px;
  font-weight: 600;
  font-family: Consolas, monospace;
}

.highlight-cyan { color: #38bdf8; }
.highlight-blue { color: #818cf8; }
.highlight-green { color: #34d399; }

.telemetry-sep {
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.08);
}

@keyframes radar-wave {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: all 0.2s ease;
}

.fade-fast-enter-from {
  opacity: 0;
  transform: translateX(4px);
}

.fade-fast-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

/* 底部操作区 */
.loading-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-left-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.replay-btn, .details-btn {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #cbd5e1 !important;
}

.replay-btn:hover, .details-btn:hover {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

/* 动效与动画关键帧 */
@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rotating-icon {
  animation: rotating 1.4s linear infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.55); }
  70% { box-shadow: 0 0 0 8px rgba(56, 189, 248, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 步骤切换平滑动效 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 自定义滚动条 */
.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>

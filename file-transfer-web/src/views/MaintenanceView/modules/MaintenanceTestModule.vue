<template>
  <div class="tab-placeholder-card">
    <svg class="placeholder-svg" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="132" rx="76" ry="12" fill="#e2e8f0" />
      <ellipse cx="100" cy="132" rx="58" ry="8" fill="#cbd5e1" opacity="0.7" />
      <rect x="52" y="38" width="96" height="84" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />
      <rect x="60" y="46" width="80" height="68" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
      <path d="M78 64 L122 104" stroke="#64748b" stroke-width="3" stroke-linecap="round" />
      <path d="M122 64 L78 104" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" />
      <circle cx="100" cy="84" r="8" fill="#ffffff" stroke="#2563eb" stroke-width="2" />
      <circle cx="100" cy="84" r="3" fill="#2563eb" />
      <path d="M70 54 L80 54 L85 48 L90 60 L95 54 L130 54" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M148 36 L148 44 M144 40 L152 40" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="54" cy="34" r="3" fill="#93c5fd" opacity="0.8" />
      <circle cx="154" cy="112" r="2" fill="#cbd5e1" />
    </svg>
    <div class="ph-title">MaintenanceTest 模块预留</div>
    <div class="ph-desc">通用硬件维护测试程序 · 当前阶段校准维护内容请在 Calibration 模块中查看</div>
  </div>
</template>

<style scoped>
.tab-placeholder-card {
  flex: 1;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}
.placeholder-svg {
  width: 190px;
  height: 140px;
  margin-bottom: 12px;
}
.ph-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}
.ph-desc {
  font-size: 13px;
  color: #94a3b8;
}
</style>

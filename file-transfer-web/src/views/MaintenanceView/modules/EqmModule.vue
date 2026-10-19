<template>
  <div class="tab-placeholder-card">
    <svg class="placeholder-svg" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="132" rx="76" ry="12" fill="#e2e8f0" />
      <ellipse cx="100" cy="132" rx="58" ry="8" fill="#cbd5e1" opacity="0.7" />
      <rect x="50" y="36" width="100" height="88" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />
      <rect x="58" y="46" width="84" height="20" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
      <circle cx="68" cy="56" r="3" fill="#10b981" />
      <circle cx="78" cy="56" r="3" fill="#cbd5e1" />
      <line x1="92" y1="56" x2="132" y2="56" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
      <rect x="58" y="72" width="84" height="20" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
      <circle cx="68" cy="82" r="3" fill="#f59e0b" />
      <circle cx="78" cy="82" r="3" fill="#cbd5e1" />
      <line x1="92" y1="82" x2="124" y2="82" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
      <rect x="58" y="98" width="84" height="18" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
      <circle cx="68" cy="107" r="3" fill="#cbd5e1" />
      <circle cx="78" cy="107" r="3" fill="#cbd5e1" />
      <line x1="92" y1="107" x2="116" y2="107" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
      <path d="M42 42 L42 50 M38 46 L46 46" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
      <circle cx="158" cy="42" r="3.5" fill="#93c5fd" opacity="0.7" />
      <circle cx="44" cy="116" r="2" fill="#cbd5e1" />
    </svg>
    <div class="ph-title">EQM 模块预留</div>
    <div class="ph-desc">原 SMC 模块重命名 · 设备健康监控规划于全版本迭代接入</div>
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

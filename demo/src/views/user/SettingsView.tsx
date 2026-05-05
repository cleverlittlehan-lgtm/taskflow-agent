export function SettingsView() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">工作区</h3>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          演示环境：无真实租户配置。生产形态下可在此管理默认外部目标、确认策略与通知（占位）。
        </p>
        <label className="mt-4 block text-xs font-medium text-zinc-600">
          显示语言
          <select
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            disabled
            defaultValue="zh"
          >
            <option value="zh">中文（演示）</option>
          </select>
        </label>
      </div>
    </div>
  )
}

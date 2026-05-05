import { mockSyncTargets } from '../../data/mock'

export function SyncResultsView() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <p className="text-sm text-zinc-600">外部目标连接状态（演示）。</p>
      <ul className="mt-4 space-y-3">
        {mockSyncTargets.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{t.detail}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                t.status === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                  : t.status === 'degraded'
                    ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                    : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80'
              }`}
            >
              {t.status === 'connected'
                ? '已连接'
                : t.status === 'degraded'
                  ? '降级'
                  : '只读'}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-zinc-400">
        待办写入飞书任务；项目更新写入 Linear / 飞书项目；另有 Notion、飞书文档等（演示）。
      </p>
    </div>
  )
}

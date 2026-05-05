import { dispatchLabelZh } from '../../data/mock'
import type { SyncedProjectRow, SyncedTodo } from '../../layout/UserMainContent'

interface ExecutionCenterViewProps {
  syncedTodos: SyncedTodo[]
  syncedProjects: SyncedProjectRow[]
}

export function ExecutionCenterView({
  syncedTodos,
  syncedProjects,
}: ExecutionCenterViewProps) {
  const empty = syncedTodos.length === 0 && syncedProjects.length === 0

  return (
    <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-5">
      <section>
        <h3 className="text-xs font-semibold text-zinc-400">最近写入</h3>
        <p className="mt-1 text-sm text-zinc-600">
          确认执行后写入外部的条目摘要。
        </p>
        {empty ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white/60 px-4 py-10 text-center text-sm text-zinc-500">
            暂无。请在「收件箱」解析后在右侧「确认并执行」。
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {syncedTodos.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-zinc-700">待办</p>
                <ul className="mt-2 space-y-2">
                  {syncedTodos.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <p className="text-sm font-medium text-zinc-900">{t.title}</p>
                      <p className="mt-1 text-[11px] text-zinc-600">
                        {dispatchLabelZh(t.tool)}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        批次 {t.batchId}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {syncedProjects.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-zinc-700">项目与风险</p>
                <ul className="mt-2 space-y-2">
                  {syncedProjects.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                            p.kind === 'risk'
                              ? 'border-red-200 bg-red-50 text-red-800'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          {p.kind === 'risk' ? '风险' : '项目更新'}
                        </span>
                        <p className="text-sm font-medium text-zinc-900">{p.title}</p>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-600">
                        {dispatchLabelZh(p.tool)}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        批次 {p.batchId}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}

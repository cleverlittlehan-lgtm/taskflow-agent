import { useState } from 'react'
import type { AdminNavId } from '../../data/mock'
import {
  dispatchLabelZh,
  mockAdminNavItems,
  mockErrorReview,
  mockEvaluationSummary,
  mockExecutionLogs,
  mockGoldVsPrediction,
  mockRunHistorySeed,
  mockSyncTargets,
  mockToolAnalytics,
} from '../../data/mock'

const shellCard =
  'rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
const tableWrap = 'overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
const theadRow =
  'border-b border-zinc-200 bg-zinc-50/90 text-left text-[11px] font-semibold text-zinc-600'

export function AdminConsoleView() {
  const [active, setActive] = useState<AdminNavId>('evaluation')

  return (
    <div className="flex min-h-0 flex-1 bg-zinc-50">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-zinc-800/60 bg-[#18181b] text-zinc-100">
        <div className="border-b border-zinc-800/80 px-4 py-4">
          <p className="text-xs font-semibold tracking-tight text-zinc-100">管理后台</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
            治理 · 评测 · 可观测性
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="管理后台导航">
          {mockAdminNavItems.map((item) => {
            const on = item.id === active
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
                  on
                    ? 'bg-zinc-800 font-medium text-white shadow-sm ring-1 ring-white/[0.08]'
                    : 'text-zinc-400 hover:bg-zinc-800/55 hover:text-zinc-100'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {active === 'evaluation' ? <EvaluationSection /> : null}
        {active === 'run_history' ? <RunHistorySection /> : null}
        {active === 'execution_logs' ? <LogsSection /> : null}
        {active === 'tool_analytics' ? <ToolAnalyticsSection /> : null}
        {active === 'error_review' ? <ErrorReviewSection /> : null}
        {active === 'system_config' ? <SystemConfigSection /> : null}
      </div>
    </div>
  )
}

function EvaluationSection() {
  const p = mockEvaluationSummary.plain
  const t = mockEvaluationSummary.technical
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">评测总览</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          任务执行质量总览：业务指标 + 技术评测（演示样本，可展开查看技术口径）。
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="意图—工具路由准确率" plain={p.routingOk} />
        <MetricCard title="零编辑采纳率（运营）" plain={p.zeroEdit} />
        <MetricCard title="生产误执行率（安全）" plain={p.wrongExec} />
      </div>
      <details className={`group ${shellCard} open:ring-1 open:ring-zinc-200/60`}>
        <summary className="cursor-pointer list-none text-sm font-medium text-zinc-800 [&::-webkit-details-marker]:hidden">
          展开技术口径
        </summary>
        <dl className="mt-5 grid gap-4 border-t border-zinc-100 pt-5 font-mono text-xs text-zinc-700 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium text-zinc-500">工具路由准确率</dt>
            <dd className="mt-1">{t.toolRoutingAccuracy}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-zinc-500">零编辑采纳率</dt>
            <dd className="mt-1">{t.zeroEditApprovalRate}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-zinc-500">误执行率</dt>
            <dd className="mt-1">{t.wrongExecutionRate}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-zinc-500">精确率 / 召回率</dt>
            <dd className="mt-1">
              {t.precision} / {t.recall}
            </dd>
          </div>
        </dl>
      </details>
      <section className={shellCard}>
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
          标准答案对比（节选）
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          标注结果与模型预测对照，用于离线评测与回归。
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className={theadRow}>
                <th className="px-3 py-2.5 font-semibold">工具</th>
                <th className="px-3 py-2.5 font-semibold">标准结果</th>
                <th className="px-3 py-2.5 font-semibold">实际结果</th>
                <th className="px-3 py-2.5 font-semibold">匹配情况</th>
              </tr>
            </thead>
            <tbody>
              {mockGoldVsPrediction.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-2.5 align-top">
                    <span className="text-sm text-zinc-800">{dispatchLabelZh(r.tool)}</span>
                    <p className="mt-0.5 font-mono text-[10px] text-zinc-400">{r.tool}</p>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-700">{r.goldTitle}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{r.predictionTitle}</td>
                  <td className="px-3 py-2.5">
                    {r.match ? (
                      <span className="text-emerald-600" title="一致">
                        一致
                      </span>
                    ) : (
                      <span className="text-amber-700" title="存在偏差">
                        偏差
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ title, plain }: { title: string; plain: string }) {
  return (
    <div className={shellCard}>
      <p className="text-xs font-semibold leading-snug text-zinc-600">{title}</p>
      <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-900">{plain}</p>
    </div>
  )
}

function RunHistorySection() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">运行历史</h2>
        <p className="mt-2 text-sm text-zinc-500">
          近期评测与调度批次的摘要记录（演示数据）。
        </p>
      </header>
      <ul className="space-y-3">
        {mockRunHistorySeed.map((r) => (
          <li key={r.id} className={shellCard}>
            <p className="font-mono text-xs text-zinc-600">{r.batchId}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-800">{r.summary}</p>
            <p className="mt-2 text-[11px] text-zinc-400">
              {r.at} · {r.items} 条
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function logLevelLabel(level: string): string {
  switch (level) {
    case 'info':
      return '信息'
    case 'warn':
      return '警告'
    case 'error':
      return '错误'
    default:
      return level
  }
}

function LogsSection() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">执行日志</h2>
        <p className="mt-2 text-sm text-zinc-500">
          按时间聚合的执行与路由事件，便于排障与审计（演示）。
        </p>
      </header>
      <div
        className={`${tableWrap} bg-zinc-950 font-mono text-[11px] text-zinc-200`}
      >
        <ul className="max-h-[420px] divide-y divide-zinc-800/90 overflow-y-auto">
          {mockExecutionLogs.map((l) => (
            <li key={l.id} className="flex flex-wrap gap-x-3 px-4 py-2.5">
              <span className="shrink-0 text-zinc-500">{l.at}</span>
              <span
                className={
                  l.level === 'error'
                    ? 'shrink-0 text-red-400'
                    : l.level === 'warn'
                      ? 'shrink-0 text-amber-400'
                      : 'shrink-0 text-emerald-400/90'
                }
              >
                [{logLevelLabel(l.level)}]
              </span>
              <span className="shrink-0 text-zinc-500">{l.batchId ?? '—'}</span>
              <span className="min-w-0 flex-1 leading-relaxed text-zinc-300">
                {l.message}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ToolAnalyticsSection() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">工具分析</h2>
        <p className="mt-2 text-sm text-zinc-500">
          各工具调用量、成功率与延迟分布，支撑容量与稳定性治理（演示）。
        </p>
      </header>
      <div className={tableWrap}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className={theadRow}>
              <th className="px-4 py-3">工具</th>
              <th className="px-4 py-3">调用次数</th>
              <th className="px-4 py-3">成功率</th>
              <th className="px-4 py-3">平均耗时（ms）</th>
            </tr>
          </thead>
          <tbody>
            {mockToolAnalytics.map((row) => (
              <tr key={row.tool} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 align-top">
                  <span className="text-zinc-800">{dispatchLabelZh(row.tool)}</span>
                  <p className="mt-0.5 font-mono text-[10px] text-zinc-400">{row.tool}</p>
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-700">{row.calls}</td>
                <td className="px-4 py-3 tabular-nums text-zinc-700">
                  {(row.successRate * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-700">{row.avgLatencyMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ErrorReviewSection() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">错误复盘</h2>
        <p className="mt-2 text-sm text-zinc-500">
          已分类的错误样本与处理策略，用于产品与工程闭环（演示）。
        </p>
      </header>
      {mockErrorReview.length === 0 ? (
        <p className="text-sm text-zinc-500">暂无错误样本。</p>
      ) : (
        <ul className="space-y-3">
          {mockErrorReview.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-red-200/70 bg-red-50/50 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <p className="font-mono text-xs text-zinc-600">{e.batchId}</p>
              <p className="mt-2 text-sm font-medium text-zinc-900">{e.summary}</p>
              <p className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-600">
                <span>
                  错误码{' '}
                  <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-zinc-800 ring-1 ring-zinc-200/80">
                    {e.errorCode}
                  </code>
                </span>
                <span>
                  处理分类{' '}
                  <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-zinc-800 ring-1 ring-zinc-200/80">
                    {e.handlingClass}
                  </code>
                </span>
                <span className="text-zinc-500">
                  工具 {dispatchLabelZh(e.tool)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SystemConfigSection() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">系统配置</h2>
        <p className="mt-2 text-sm text-zinc-500">
          演示环境无持久化配置。以下为同步目标镜像，与用户端「同步结果」同源。
        </p>
      </header>
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {mockSyncTargets.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-baseline gap-x-3 px-5 py-3.5 text-sm"
          >
            <span className="font-semibold text-zinc-900">{t.name}</span>
            <span className="text-xs leading-relaxed text-zinc-500">{t.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

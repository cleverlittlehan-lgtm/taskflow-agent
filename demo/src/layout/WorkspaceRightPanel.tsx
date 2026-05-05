import type { CandidateTemplate, ExecutionStep } from '../data/mock'
import { dispatchLabelZh } from '../data/mock'
import type { FlowStage } from '../flow/deriveExecutionSteps'
import { flowBanner } from '../flow/deriveExecutionSteps'

interface WorkspaceRightPanelProps {
  stage: FlowStage
  steps: ExecutionStep[]
  executionBatchId: string | null
  executionReceipt: string | null
  toExecute: CandidateTemplate[]
  titleOverrides: Record<string, string>
  batchSize: number
  canConfirmExecute: boolean
  hasExecuted: boolean
  isExecuting: boolean
  onConfirmExecute: () => void
}

function StepIcon({ status }: { status: ExecutionStep['status'] }) {
  const base =
    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold'
  if (status === 'done')
    return (
      <span className={`${base} bg-emerald-100 text-emerald-700`}>✓</span>
    )
  if (status === 'running')
    return (
      <span
        className={`${base} border border-amber-200 bg-amber-50 text-amber-700`}
        aria-hidden
      >
        ···
      </span>
    )
  if (status === 'error')
    return <span className={`${base} bg-red-100 text-red-700`}>!</span>
  return (
    <span className={`${base} border border-zinc-200 bg-white text-zinc-400`} />
  )
}

function gateLabel(
  stage: FlowStage,
  hasParsed: boolean,
): { line: string; tone: string } {
  if (!hasParsed)
    return { line: '待解析', tone: 'text-zinc-500' }
  if (stage === 'executing')
    return { line: '执行中', tone: 'text-amber-700' }
  if (stage === 'completed')
    return { line: '已完成', tone: 'text-emerald-700' }
  return { line: '待确认', tone: 'text-zinc-800' }
}

export function WorkspaceRightPanel({
  stage,
  steps,
  executionBatchId,
  executionReceipt,
  toExecute,
  titleOverrides,
  batchSize,
  canConfirmExecute,
  hasExecuted,
  isExecuting,
  onConfirmExecute,
}: WorkspaceRightPanelProps) {
  const banner = flowBanner(stage)
  const hasParsed = stage !== 'await_input'
  const gate = gateLabel(stage, hasParsed)

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-zinc-200/80 bg-white">
      <div className="shrink-0 border-b border-zinc-100 px-4 py-3">
        <p className="text-[10px] font-semibold text-zinc-400">执行侧栏</p>
        <h3 className="mt-1 text-sm font-semibold text-zinc-900">确认与进度</h3>
        <p className="mt-2 rounded-md border border-zinc-100 bg-zinc-50 px-2.5 py-2 text-[11px] leading-relaxed text-zinc-600">
          {banner}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <section className="border-b border-zinc-100 pb-4">
          <h4 className="text-xs font-semibold text-zinc-800">确认</h4>
          <p className="mt-1 text-[11px] text-zinc-500">
            状态：<span className={`font-medium ${gate.tone}`}>{gate.line}</span>
          </p>
          {!hasParsed ? (
            <p className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-3 text-xs text-zinc-500">
              解析完成后，在此确认并执行。
            </p>
          ) : toExecute.length === 0 ? (
            <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3 text-xs text-zinc-600">
              当前没有待执行条目。
            </p>
          ) : (
            <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto">
              {toExecute.map((c) => {
                const title = titleOverrides[c.id] ?? c.title
                return (
                  <li
                    key={c.id}
                    className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs shadow-sm"
                  >
                    <p className="font-medium leading-snug text-zinc-900">
                      {title}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {dispatchLabelZh(c.toolSuggestion)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={onConfirmExecute}
            disabled={!canConfirmExecute || hasExecuted || isExecuting}
            className="mt-3 w-full rounded-lg bg-zinc-900 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {hasExecuted
              ? '本批次已完成'
              : isExecuting
                ? '执行中…'
                : '确认并执行'}
          </button>
          {hasParsed && batchSize > 0 ? (
            <p className="mt-2 text-[10px] text-zinc-400">
              共 {batchSize} 条 · 将写入外部系统（演示）
            </p>
          ) : null}
        </section>

        <section className="border-b border-zinc-100 py-4">
          <h4 className="text-xs font-semibold text-zinc-800">写入方式</h4>
          {toExecute.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {toExecute.map((c) => (
                <li
                  key={c.id}
                  className="rounded-md border border-zinc-100 bg-zinc-50/80 px-2 py-1.5 text-[11px] text-zinc-700"
                >
                  {dispatchLabelZh(c.toolSuggestion)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[11px] text-zinc-400">—</p>
          )}
        </section>

        {(stage === 'executing' || stage === 'completed') && executionBatchId ? (
          <section className="border-b border-zinc-100 py-4">
            <h4 className="text-xs font-semibold text-zinc-800">批次与回执</h4>
            <div className="mt-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
              <p className="text-[10px] font-semibold text-zinc-400">批次号</p>
              <p className="mt-1 break-all font-mono text-[11px] text-zinc-800">
                {executionBatchId}
              </p>
              {executionReceipt ? (
                <>
                  <p className="mt-3 text-[10px] font-semibold text-zinc-400">
                    回执
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-700">
                    {executionReceipt}
                  </p>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="pt-4">
          <h4 className="text-xs font-semibold text-zinc-800">执行进度</h4>
          <ol className="mt-3 space-y-3">
            {steps.map((step) => (
              <li key={step.id} className="flex gap-2">
                <StepIcon status={step.status} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800">
                    {step.label}
                  </p>
                  {step.detail ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                      {step.detail}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  )
}

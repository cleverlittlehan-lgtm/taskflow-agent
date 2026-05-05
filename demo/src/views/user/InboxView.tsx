import { Fragment, useMemo, useRef, useState } from 'react'
import { ConfidenceBadge } from '../../components/ConfidenceBadge'
import { HighlightedTextarea } from '../../components/HighlightedTextarea'
import type { CandidateTemplate, SourceTag } from '../../data/mock'
import {
  dispatchLabelZh,
  mockNonTaskFilterNoteByTag,
} from '../../data/mock'

const SOURCE_OPTIONS: SourceTag[] = ['群聊', '会议纪要', '文档']

function typeLabel(kind: CandidateTemplate['kind']): { text: string; tone: string } {
  switch (kind) {
    case 'candidate_todo':
      return { text: '待办', tone: 'border-zinc-200 bg-zinc-50 text-zinc-800' }
    case 'project_update':
      return {
        text: '项目更新',
        tone: 'border-blue-200 bg-blue-50 text-blue-900',
      }
    case 'risk':
      return { text: '风险', tone: 'border-red-200 bg-red-50 text-red-900' }
    default:
      return { text: kind, tone: 'border-zinc-200 bg-zinc-50 text-zinc-800' }
  }
}

export interface InboxViewProps {
  inputText: string
  sourceTag: SourceTag
  onInputChange: (v: string) => void
  onSourceTagChange: (v: SourceTag) => void
  hasParsed: boolean
  onLoadFixture: () => void
  onParse: () => void
  highlightPhrase: string | null
  onHighlightPhrase: (phrase: string | null) => void
  candidates: CandidateTemplate[]
  titleOverrides: Record<string, string>
  discardedIds: Set<string>
  onDiscard: (id: string) => void
  onEditSave: (id: string, title: string) => void
  hasExecuted: boolean
}

export function InboxView({
  inputText,
  sourceTag,
  onInputChange,
  onSourceTagChange,
  hasParsed,
  onLoadFixture,
  onParse,
  highlightPhrase,
  onHighlightPhrase,
  candidates,
  titleOverrides,
  discardedIds,
  onDiscard,
  onEditSave,
  hasExecuted,
}: InboxViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editFor, setEditFor] = useState<CandidateTemplate | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [upperPanePx, setUpperPanePx] = useState(260)
  const splitRootRef = useRef<HTMLDivElement>(null)

  const visible = useMemo(
    () => candidates.filter((c) => !discardedIds.has(c.id)),
    [candidates, discardedIds],
  )

  const beforeSnippet = useMemo(() => {
    const t = inputText.trim()
    if (!t) return '—'
    const line = t.split('\n').find((l) => l.trim().length > 0) ?? t
    return line.length > 96 ? `${line.slice(0, 96)}…` : line
  }, [inputText])

  function toggleExpand(id: string) {
    setExpandedId((cur) => {
      const closing = cur === id
      const next = closing ? null : id
      if (closing) {
        onHighlightPhrase(null)
      } else {
        const row = visible.find((x) => x.id === id)
        onHighlightPhrase(row?.evidence.highlightPhrase ?? null)
      }
      return next
    })
  }

  function openEdit(c: CandidateTemplate) {
    setEditFor(c)
    setEditDraft(titleOverrides[c.id] ?? c.title)
  }

  function saveEdit() {
    if (!editFor) return
    onEditSave(editFor.id, editDraft.trim() || editFor.title)
    setEditFor(null)
  }

  function onSplitPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    const startY = e.clientY
    const startH = upperPanePx
    const handle = e.currentTarget

    const onMove = (ev: PointerEvent) => {
      const root = splitRootRef.current
      if (!root) return
      const total = root.getBoundingClientRect().height
      const handleH = handle.getBoundingClientRect().height
      const minBottom = 160
      const minTop = 140
      const maxTop = Math.max(minTop, total - handleH - minBottom)
      const next = Math.round(
        Math.min(Math.max(minTop, startH + ev.clientY - startY), maxTop),
      )
      setUpperPanePx(next)
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={splitRootRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {/* 上：原始输入 */}
        <div
          className="flex shrink-0 flex-col overflow-hidden bg-white"
          style={{ height: upperPanePx }}
        >
          <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-3">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">原始输入</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onLoadFixture}
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
                  >
                    加载示例
                  </button>
                  <button
                    type="button"
                    onClick={onParse}
                    disabled={!inputText.trim()}
                    className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    开始解析
                  </button>
                </div>
              </div>
              <div
                className="mt-2 flex flex-wrap gap-2"
                aria-label="来源标签"
              >
                {SOURCE_OPTIONS.map((tag) => {
                  const active = sourceTag === tag
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onSourceTagChange(tag)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        active
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                展开「详情」时，上方原文会高亮对应片段。
              </p>
              <label className="mt-2 flex min-h-0 flex-1 flex-col">
                <span className="sr-only">原始输入</span>
                <HighlightedTextarea
                  value={inputText}
                  onChange={onInputChange}
                  highlightPhrase={highlightPhrase}
                  placeholder="粘贴群聊、会议纪要或文档…"
                  disabled={hasExecuted}
                />
              </label>
            </div>
          </section>
        </div>

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="拖动调整输入区与候选表高度"
          onPointerDown={onSplitPointerDown}
          className="group flex h-2 shrink-0 cursor-ns-resize touch-none items-center justify-center border-y border-zinc-200 bg-zinc-100 hover:bg-zinc-200/90"
        >
          <div className="h-0.5 w-10 rounded-full bg-zinc-400 group-hover:bg-zinc-500" />
        </div>

        {/* 下：候选表 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-canvas)]">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-3">
            {!hasParsed ? (
              <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/50 px-4">
                <p className="max-w-md text-center text-sm text-zinc-500">
                  点「开始解析」后，这里会列出<strong className="text-zinc-800">可执行条目</strong>
                  ，右侧可<strong className="text-zinc-800">确认并执行</strong>。补充说明在「详情」里。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    候选执行项
                  </h3>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-amber-50/40 px-3 py-2 text-xs text-amber-950">
                  <span className="font-medium">非任务过滤：</span>
                  {mockNonTaskFilterNoteByTag[sourceTag]}
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-[720px] w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50/90 text-[11px] font-semibold text-zinc-500">
                          <th className="min-w-[180px] px-3 py-2.5">标题</th>
                          <th className="w-24 px-3 py-2.5">类型</th>
                          <th className="w-24 px-3 py-2.5">置信度</th>
                          <th className="min-w-[140px] px-3 py-2.5">来源摘要</th>
                          <th className="min-w-[120px] px-3 py-2.5">写入目标</th>
                          <th className="min-w-[140px] px-3 py-2.5">写入方式</th>
                          <th className="min-w-[100px] px-3 py-2.5">待补信息</th>
                          <th className="min-w-[140px] px-3 py-2.5">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((c) => {
                          const title = titleOverrides[c.id] ?? c.title
                          const open = expandedId === c.id
                          const tl = typeLabel(c.kind)
                          return (
                            <Fragment key={c.id}>
                              <tr
                                className={`border-b border-zinc-100 ${
                                  c.kind === 'risk' ? 'bg-red-50/25' : ''
                                }`}
                              >
                                <td className="px-3 py-2 align-top">
                                  <p
                                    className="font-medium text-zinc-900"
                                    title={c.whyTrustworthy}
                                  >
                                    {title}
                                  </p>
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <span
                                    className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tl.tone}`}
                                  >
                                    {tl.text}
                                  </span>
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <ConfidenceBadge value={c.confidence} />
                                </td>
                                <td className="px-3 py-2 align-top text-xs text-zinc-600">
                                  {c.evidence.excerpt}
                                </td>
                                <td className="px-3 py-2 align-top text-xs text-zinc-700">
                                  {c.targetPlatform}
                                </td>
                                <td className="px-3 py-2 align-top text-xs text-zinc-700">
                                  {dispatchLabelZh(c.toolSuggestion)}
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <div className="flex flex-wrap gap-1">
                                    {c.missingFields.map((m) => (
                                      <span
                                        key={m}
                                        className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900"
                                      >
                                        {m}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpand(c.id)}
                                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
                                    >
                                      {open ? '收起' : '详情'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEdit(c)}
                                      disabled={hasExecuted}
                                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                                    >
                                      编辑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDiscard(c.id)}
                                      disabled={hasExecuted}
                                      className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800 hover:bg-red-100 disabled:opacity-40"
                                    >
                                      丢弃
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {open ? (
                                <tr className="border-b border-zinc-100 bg-zinc-50/60">
                                  <td colSpan={8} className="px-4 py-4">
                                    <div className="grid gap-4 lg:grid-cols-2">
                                      <div>
                                        <p className="text-[10px] font-semibold text-zinc-400">
                                          完整证据
                                        </p>
                                        <p className="mt-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-800">
                                          {c.evidence.fullQuote}
                                        </p>
                                        <p className="mt-2 text-[11px] text-zinc-500">
                                          {c.evidence.sourceType} ·{' '}
                                          {c.detailExpand.fullAnchor}
                                        </p>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <p className="text-[10px] font-semibold text-zinc-400">
                                            待补说明
                                          </p>
                                          <p className="mt-1 text-sm text-zinc-700">
                                            {c.detailExpand.missingDetail}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-semibold text-zinc-400">
                                            调用参数
                                          </p>
                                          <pre className="mt-1 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900/95 p-3 font-mono text-[11px] leading-relaxed text-zinc-100">
                                            {c.detailExpand.toolArguments}
                                          </pre>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-semibold text-zinc-400">
                                            字段说明
                                          </p>
                                          <p className="mt-1 font-mono text-[11px] text-zinc-600">
                                            {c.detailExpand.schemaHint}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-zinc-200 bg-zinc-50/40 px-4 py-3 lg:grid lg:grid-cols-2 lg:gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-400">
                        解析前摘要
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                        {beforeSnippet}
                      </p>
                    </div>
                    <div className="mt-3 lg:mt-0">
                      <p className="text-[10px] font-semibold text-zinc-400">
                        解析后
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900">
                        {visible.length} 条 · 右侧「确认并执行」
                      </p>
                    </div>
                  </div>
                </div>

                {visible.length === 0 ? (
                  <p className="text-sm text-zinc-500">所有候选项已丢弃。</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {editFor ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
            <h4 className="text-sm font-semibold text-zinc-900">编辑标题</h4>
            <label className="mt-3 block text-xs font-medium text-zinc-500">
              对外展示标题
              <input
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditFor(null)}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

import { useCallback, useMemo, useState } from 'react'
import type { SourceTag, UserNavId } from '../data/mock'
import {
  defaultDemoSourceTag,
  demoFixtureTexts,
  mockCandidateTemplates,
  mockUserNavItems,
  shortTargetForTool,
} from '../data/mock'
import type { FlowStage } from '../flow/deriveExecutionSteps'
import { deriveExecutionSteps } from '../flow/deriveExecutionSteps'
import { AdminConsoleView } from '../views/admin/AdminConsoleView'
import { Header, type WorkspaceMode } from './Header'
import { Sidebar } from './Sidebar'
import {
  UserMainContent,
  type SyncedProjectRow,
  type SyncedTodo,
} from './UserMainContent'
import { WorkspaceRightPanel } from './WorkspaceRightPanel'

export function AppShell() {
  const [workspace, setWorkspace] = useState<WorkspaceMode>('user')
  const [userNav, setUserNav] = useState<UserNavId>('inbox')
  const [inputText, setInputText] = useState('')
  const [sourceTag, setSourceTag] = useState<SourceTag>(defaultDemoSourceTag)
  const [hasParsed, setHasParsed] = useState(false)
  const [highlightPhrase, setHighlightPhrase] = useState<string | null>(null)
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set())
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>(
    {},
  )
  const [isExecuting, setIsExecuting] = useState(false)
  const [hasExecuted, setHasExecuted] = useState(false)
  const [executionBatchId, setExecutionBatchId] = useState<string | null>(null)
  const [executionReceipt, setExecutionReceipt] = useState<string | null>(null)
  const [syncedTodos, setSyncedTodos] = useState<SyncedTodo[]>([])
  const [syncedProjects, setSyncedProjects] = useState<SyncedProjectRow[]>([])

  const candidates = useMemo(
    () =>
      mockCandidateTemplates.filter((c) => c.evidence.sourceType === sourceTag),
    [sourceTag],
  )

  const visibleCandidates = useMemo(
    () => candidates.filter((c) => !discardedIds.has(c.id)),
    [candidates, discardedIds],
  )

  const batchSize = visibleCandidates.length

  const flowStage: FlowStage = useMemo(() => {
    if (hasExecuted) return 'completed'
    if (isExecuting) return 'executing'
    if (!hasParsed) return 'await_input'
    if (batchSize > 0) return 'ready_to_confirm'
    return 'parsed'
  }, [hasExecuted, isExecuting, hasParsed, batchSize])

  const executionSteps = useMemo(
    () =>
      deriveExecutionSteps({
        stage: flowStage,
        batchSize,
        candidateCount: visibleCandidates.length,
        executionBatchId,
        executionReceipt,
      }),
    [
      flowStage,
      batchSize,
      visibleCandidates.length,
      executionBatchId,
      executionReceipt,
    ],
  )

  const userNavItems = useMemo(() => {
    const n = syncedTodos.length + syncedProjects.length
    return mockUserNavItems.map((item) => {
      if (item.id === 'execution_center')
        return { ...item, badge: n > 0 ? n : undefined }
      return item
    })
  }, [syncedProjects.length, syncedTodos.length])

  const onLoadFixture = useCallback(() => {
    setInputText(demoFixtureTexts[sourceTag])
    setHighlightPhrase(null)
  }, [sourceTag])

  const onSourceTagChange = useCallback((v: SourceTag) => {
    setSourceTag(v)
    setInputText('')
    setHasParsed(false)
    setDiscardedIds(new Set())
    setTitleOverrides({})
    setHighlightPhrase(null)
    setHasExecuted(false)
    setIsExecuting(false)
    setExecutionBatchId(null)
    setExecutionReceipt(null)
  }, [])

  const onParse = useCallback(() => {
    if (!inputText.trim()) return
    setHasParsed(true)
    setDiscardedIds(new Set())
    setTitleOverrides({})
    setHighlightPhrase(null)
    setHasExecuted(false)
    setIsExecuting(false)
    setExecutionBatchId(null)
    setExecutionReceipt(null)
  }, [inputText])

  const onDiscard = useCallback((id: string) => {
    setDiscardedIds((prev) => new Set(prev).add(id))
  }, [])

  const onEditSave = useCallback((id: string, title: string) => {
    setTitleOverrides((prev) => ({ ...prev, [id]: title }))
  }, [])

  const canConfirmExecute =
    hasParsed && !hasExecuted && !isExecuting && visibleCandidates.length > 0

  const onConfirmExecute = useCallback(() => {
    if (!canConfirmExecute) return
    setIsExecuting(true)
    const batchId = `batch_mock_${Date.now()}`
    setExecutionBatchId(batchId)

    window.setTimeout(() => {
      const n = visibleCandidates.length
      const receipt = `已完成 · 共 ${n} 条（演示）`
      setExecutionReceipt(receipt)

      const titleFor = (id: string) =>
        titleOverrides[id] ?? candidates.find((c) => c.id === id)?.title ?? id

      const newTodos: SyncedTodo[] = []
      const newProjects: SyncedProjectRow[] = []
      for (const c of visibleCandidates) {
        const title = titleFor(c.id)
        const destination = shortTargetForTool(c.toolSuggestion)
        const tool = c.toolSuggestion
        if (c.kind === 'candidate_todo') {
          newTodos.push({
            id: `todo_${c.id}_${batchId}`,
            title,
            batchId,
            destination,
            tool,
          })
        } else if (c.kind === 'project_update' || c.kind === 'risk') {
          newProjects.push({
            id: `proj_${c.id}_${batchId}`,
            title,
            kind: c.kind === 'risk' ? 'risk' : 'project_update',
            batchId,
            destination,
            tool,
          })
        }
      }
      setSyncedTodos((prev) => [...newTodos, ...prev])
      setSyncedProjects((prev) => [...newProjects, ...prev])

      window.setTimeout(() => {
        setHasExecuted(true)
        setIsExecuting(false)
      }, 450)
    }, 500)
  }, [canConfirmExecute, candidates, titleOverrides, visibleCandidates])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-canvas)]">
      <Header workspace={workspace} onWorkspaceChange={setWorkspace} />
      {workspace === 'user' ? (
        <div className="flex min-h-0 flex-1">
          <Sidebar
            items={userNavItems}
            activeId={userNav}
            onSelect={setUserNav}
          />
          <UserMainContent
            activeNav={userNav}
            syncedTodos={syncedTodos}
            syncedProjects={syncedProjects}
            inboxProps={{
              inputText,
              sourceTag,
              onInputChange: setInputText,
              onSourceTagChange,
              hasParsed,
              onLoadFixture,
              onParse,
              highlightPhrase,
              onHighlightPhrase: setHighlightPhrase,
              candidates,
              titleOverrides,
              discardedIds,
              onDiscard,
              onEditSave,
              hasExecuted,
            }}
          />
          <WorkspaceRightPanel
            stage={flowStage}
            steps={executionSteps}
            executionBatchId={executionBatchId}
            executionReceipt={executionReceipt}
            titleOverrides={titleOverrides}
            toExecute={visibleCandidates}
            batchSize={batchSize}
            canConfirmExecute={canConfirmExecute}
            hasExecuted={hasExecuted}
            isExecuting={isExecuting}
            onConfirmExecute={onConfirmExecute}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <AdminConsoleView />
        </div>
      )}
    </div>
  )
}

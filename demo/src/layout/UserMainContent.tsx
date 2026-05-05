import type { CandidateTemplate, SourceTag, UserNavId } from '../data/mock'
import { ExecutionCenterView } from '../views/user/ExecutionCenterView'
import { InboxView } from '../views/user/InboxView'
import { SettingsView } from '../views/user/SettingsView'
import { SyncResultsView } from '../views/user/SyncResultsView'

export interface SyncedTodo {
  id: string
  title: string
  batchId: string
  /** 外部系统落点 */
  destination: string
  tool: string
}

export interface SyncedProjectRow {
  id: string
  title: string
  kind: 'project_update' | 'risk'
  batchId: string
  destination: string
  tool: string
}

const userPageMeta: Record<
  Exclude<UserNavId, 'inbox'>,
  { title: string; subtitle: string }
> = {
  execution_center: {
    title: '执行中心',
    subtitle: '最近确认并写入外部的条目摘要。',
  },
  sync_results: {
    title: '同步结果',
    subtitle: '各外部目标的连接状态（演示）。',
  },
  settings: {
    title: '设置',
    subtitle: '工作区偏好（演示占位）。',
  },
}

interface UserMainContentProps {
  activeNav: UserNavId
  inboxProps: {
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
  syncedTodos: SyncedTodo[]
  syncedProjects: SyncedProjectRow[]
}

export function UserMainContent({
  activeNav,
  inboxProps,
  syncedTodos,
  syncedProjects,
}: UserMainContentProps) {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-canvas)]">
      {activeNav !== 'inbox' ? (
        <div className="shrink-0 border-b border-zinc-200/60 bg-white px-6 py-2.5">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            {userPageMeta[activeNav].title}
          </h2>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-zinc-500">
            {userPageMeta[activeNav].subtitle}
          </p>
        </div>
      ) : null}

      {activeNav === 'inbox' ? (
        <InboxView {...inboxProps} />
      ) : activeNav === 'execution_center' ? (
        <ExecutionCenterView
          syncedTodos={syncedTodos}
          syncedProjects={syncedProjects}
        />
      ) : activeNav === 'sync_results' ? (
        <SyncResultsView />
      ) : (
        <SettingsView />
      )}
    </main>
  )
}

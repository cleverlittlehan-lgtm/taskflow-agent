import { mockWorkspace } from '../data/mock'

export type WorkspaceMode = 'user' | 'admin'

interface HeaderProps {
  workspace: WorkspaceMode
  onWorkspaceChange: (mode: WorkspaceMode) => void
}

export function Header({ workspace, onWorkspaceChange }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-zinc-200/80 bg-white/90 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[11px] font-semibold tracking-tight text-white">
          TF
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-900">
              TaskFlow Agent
            </h1>
            <span className="hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline">
              演示
            </span>
          </div>
          <p className="truncate text-xs text-zinc-500">{mockWorkspace.name}</p>
        </div>
      </div>

      <div
        className="flex shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-50/80 p-0.5"
        role="tablist"
        aria-label="工作区模式"
      >
        <button
          type="button"
          role="tab"
          aria-selected={workspace === 'user'}
          onClick={() => onWorkspaceChange('user')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            workspace === 'user'
              ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          用户工作台
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={workspace === 'admin'}
          onClick={() => onWorkspaceChange('admin')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            workspace === 'admin'
              ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          管理后台
        </button>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <div
          className="h-7 w-7 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 ring-2 ring-white"
          title="用户（Mock）"
        />
      </div>
    </header>
  )
}

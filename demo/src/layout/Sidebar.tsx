import type { NavItem, UserNavId } from '../data/mock'

interface SidebarProps {
  items: NavItem<UserNavId>[]
  activeId: UserNavId
  onSelect: (id: UserNavId) => void
}

export function Sidebar({ items, activeId, onSelect }: SidebarProps) {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-zinc-200/80 bg-white">
      <nav className="flex-1 space-y-0.5 p-2" aria-label="用户工作台导航">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition ${
                active
                  ? 'bg-zinc-100 font-medium text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <span>{item.label}</span>
              {item.badge != null && item.badge > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                    active
                      ? 'bg-white text-zinc-700 ring-1 ring-zinc-200/80'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>
      <div className="border-t border-zinc-100 p-3">
        <p className="text-[11px] leading-relaxed text-zinc-400">
          演示数据 · 非真实租户
        </p>
      </div>
    </aside>
  )
}

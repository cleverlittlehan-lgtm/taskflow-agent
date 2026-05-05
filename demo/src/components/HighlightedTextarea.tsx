import { useLayoutEffect, useRef } from 'react'
import { SourceHighlight } from './SourceHighlight'

interface HighlightedTextareaProps {
  value: string
  onChange: (v: string) => void
  highlightPhrase: string | null
  placeholder?: string
  disabled?: boolean
}

/**
 * 有证据高亮时：底层渲染带 mark 的原文，textarea 透明字 + 可见光标，滚动用 translate 同步。
 */
export function HighlightedTextarea({
  value,
  onChange,
  highlightPhrase,
  placeholder,
  disabled,
}: HighlightedTextareaProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const mirrorInnerRef = useRef<HTMLDivElement>(null)

  const showMirror = Boolean(highlightPhrase && value.trim())

  const syncScroll = () => {
    const ta = taRef.current
    const inner = mirrorInnerRef.current
    if (!ta || !inner) return
    inner.style.transform = `translateY(-${ta.scrollTop}px)`
  }

  useLayoutEffect(() => {
    syncScroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only on content / mode change
  }, [value, highlightPhrase])

  return (
    <div className="relative flex min-h-[140px] flex-1 flex-col">
      {showMirror ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg border border-transparent px-3 py-2.5"
          aria-hidden
        >
          <div ref={mirrorInnerRef} className="will-change-transform">
            <SourceHighlight text={value} phrase={highlightPhrase} />
          </div>
        </div>
      ) : null}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        className={`relative z-10 min-h-[140px] flex-1 resize-none overflow-auto rounded-lg border border-zinc-200 bg-zinc-50/40 px-3 py-2.5 font-sans text-sm leading-relaxed placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200 ${
          showMirror
            ? 'text-transparent caret-zinc-900 selection:bg-amber-200/40'
            : 'text-zinc-800'
        }`}
      />
    </div>
  )
}

interface SourceHighlightProps {
  text: string
  phrase: string | null
  /** 与输入框 mirror 对齐时传入，避免默认段落边距错位 */
  className?: string
}

/**
 * 在原文中高亮证据片段（Demo：首处匹配）
 */
export function SourceHighlight({
  text,
  phrase,
  className = '',
}: SourceHighlightProps) {
  const base = `m-0 whitespace-pre-wrap text-sm leading-relaxed ${className}`
  if (!phrase || !text) {
    return <p className={`${base} text-zinc-600`}>{text || '—'}</p>
  }
  const idx = text.indexOf(phrase)
  if (idx === -1) {
    return <p className={`${base} text-zinc-600`}>{text}</p>
  }
  const before = text.slice(0, idx)
  const mid = text.slice(idx, idx + phrase.length)
  const after = text.slice(idx + phrase.length)
  return (
    <p className={`${base} text-zinc-700`}>
      {before}
      <mark className="rounded-sm bg-amber-100 px-0.5 text-zinc-900 ring-1 ring-amber-200/80">
        {mid}
      </mark>
      {after}
    </p>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { templateGroups } from '@/lib/templates'
import { useLanguage } from '@/lib/i18n'

interface Props {
  onInsert: (snippet: string) => void
}

export default function TemplateMenu({ onInsert }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { lang } = useLanguage()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 flex items-center gap-1"
        style={{ backgroundColor: 'var(--surface-card)', color: 'var(--body)', border: '1px solid var(--hairline)' }}
      >
        <span>{lang === 'zh' ? '插入模块' : 'Insert Block'}</span>
        <span style={{ color: 'var(--muted-soft)' }}>{open ? '▲' : '▾'}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 border rounded-xl shadow-lg py-2 min-w-[180px] overflow-y-auto"
          style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', maxHeight: '600px' }}>
          {templateGroups.map((group) => (
            <div key={group.group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-3 pt-2 pb-1" style={{ color: 'var(--muted-soft)' }}>
                {lang === 'zh' ? group.group : group.groupEn}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onInsert(item.snippet); setOpen(false) }}
                  className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--body)' }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--surface-card)')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="w-4 text-center text-xs" style={{ color: 'var(--muted-soft)' }}>{item.icon}</span>
                  {lang === 'zh' ? item.label : item.labelEn}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

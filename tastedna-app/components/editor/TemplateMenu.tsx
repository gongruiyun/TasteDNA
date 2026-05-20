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
        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors flex items-center gap-1"
      >
        <span>{lang === 'zh' ? '插入模块' : 'Insert Block'}</span>
        <span className="text-neutral-400">{open ? '▲' : '▾'}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 min-w-[180px]">
          {templateGroups.map((group) => (
            <div key={group.group}>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-3 pt-2 pb-1">
                {lang === 'zh' ? group.group : group.groupEn}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onInsert(item.snippet); setOpen(false) }}
                  className="w-full text-left px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <span className="text-neutral-400 w-4 text-center text-xs">{item.icon}</span>
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

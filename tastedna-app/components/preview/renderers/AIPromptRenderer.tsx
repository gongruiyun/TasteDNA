'use client'

import { useState } from 'react'
import { copyText } from '@/lib/utils/clipboard'

interface Props {
  rawText: string
}

export default function AIPromptRenderer({ rawText }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await copyText(rawText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-xl bg-neutral-900 border border-neutral-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-700">
        <span className="text-[11px] text-neutral-400 font-mono">AI Prompt</span>
        <button
          onClick={copy}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors"
          style={{
            backgroundColor: copied ? '#34C97B22' : '#4F6EF722',
            color: copied ? '#34C97B' : '#818cf8',
          }}
        >
          {copied ? '✓ 已复制' : '复制 Prompt'}
        </button>
      </div>
      <pre className="p-4 text-sm text-neutral-200 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
        {rawText}
      </pre>
    </div>
  )
}

'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
}

export default function ListRenderer({ tokens, onTokenClick }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {tokens.map((token) => (
        <button
          key={`${token.name}-${token.line}`}
          data-line={token.line}
          onClick={() => onTokenClick?.(token.line)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-indigo-50 hover:text-indigo-700 border border-neutral-200 hover:border-indigo-200 transition-colors text-sm font-medium text-neutral-700 cursor-pointer"
        >
          <span>{token.name}</span>
          {token.zh && <span className="text-neutral-400 font-normal text-xs">— {token.zh}</span>}
        </button>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { GroupNode, TokenNode } from '@/lib/parser/types'

interface Props {
  groups: GroupNode[]
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
}

const groupLabels: Record<string, string> = {
  entrance: '入场',
  exit: '离场',
  interaction: '交互反馈',
  'page-transition': '页面过渡',
}

function AnimationCard({ token, onTokenClick }: { token: TokenNode; onTokenClick?: (line: number) => void }) {
  const [playing, setPlaying] = useState(false)

  const play = () => {
    setPlaying(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPlaying(true))
    })
    setTimeout(() => setPlaying(false), 800)
  }

  return (
    <button
      data-line={token.line}
      onClick={() => { play(); onTokenClick?.(token.line) }}
      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-neutral-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-colors cursor-pointer w-28"
    >
      <div className="w-10 h-10 flex items-center justify-center">
        <div
          className={`w-8 h-8 bg-indigo-400 rounded-lg transition-none ${
            playing ? 'animate-bounce' : ''
          }`}
          style={playing ? { animation: 'fadeSlideUp 0.5s ease-out forwards' } : {}}
        />
      </div>
      <p className="text-[11px] font-medium text-neutral-600 text-center leading-tight">{token.name}</p>
      <p className="text-[9px] text-neutral-400 text-center leading-tight truncate w-full">{token.value.split(',')[0]}</p>
    </button>
  )
}

export default function AnimationRenderer({ groups, tokens, onTokenClick }: Props) {
  // If no groups, render flat tokens
  if (groups.length === 0) {
    return (
      <div className="flex flex-wrap gap-3">
        {tokens.map(token => (
          <AnimationCard key={token.name} token={token} onTokenClick={onTokenClick} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map(group => (
        <div key={group.id}>
          <p className="text-xs font-medium text-neutral-500 mb-3">
            {groupLabels[group.id] ?? group.title}
            {group.zh && <span className="text-neutral-400 font-normal ml-1">— {group.zh}</span>}
          </p>
          <div className="flex flex-wrap gap-3">
            {group.tokens.map(token => (
              <AnimationCard key={token.name} token={token} onTokenClick={onTokenClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

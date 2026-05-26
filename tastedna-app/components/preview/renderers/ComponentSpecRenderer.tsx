'use client'

import type { GroupNode, TokenNode } from '@/lib/parser/types'

// Behavioral fields that get special treatment
const BEHAVIORAL_KEYS = ['usage', 'prohibited']

// Render the usage / prohibited semantic blocks
function BehavioralBlock({ token, onTokenClick }: { token: TokenNode; onTokenClick?: (line: number) => void }) {
  const isProhibited = token.name === 'prohibited'
  // Split on Chinese or ASCII semicolons to turn into bullet points
  const items = token.value.split(/；|;\s*/).map(s => s.trim()).filter(Boolean)

  return (
    <div
      data-line={token.line}
      onClick={() => onTokenClick?.(token.line)}
      className={`rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
        isProhibited
          ? 'bg-red-50 border border-red-100 hover:bg-red-100/60'
          : 'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/60'
      }`}
    >
      <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${
        isProhibited ? 'text-red-400' : 'text-emerald-500'
      }`}>
        {isProhibited ? '⛔ 禁止使用' : '✅ 适用场景'}
      </div>
      {items.length > 1 ? (
        <ul className="space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className={`text-[11px] leading-relaxed flex gap-1.5 ${
              isProhibited ? 'text-red-700' : 'text-emerald-800'
            }`}>
              <span className="shrink-0 mt-0.5">{isProhibited ? '·' : '·'}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`text-[11px] leading-relaxed ${isProhibited ? 'text-red-700' : 'text-emerald-800'}`}>
          {token.value}
        </p>
      )}
    </div>
  )
}

// Mini value preview: color swatch, px bar, % opacity, or plain text
function ValuePreview({ value }: { value: string }) {
  const hex = value.match(/^#([0-9A-Fa-f]{3,8})$/)
  if (hex) {
    return (
      <span
        className="inline-block w-3.5 h-3.5 rounded-sm border border-neutral-200 shrink-0 align-middle mr-1"
        style={{ backgroundColor: value }}
      />
    )
  }
  const px = value.match(/^(\d+(?:\.\d+)?)px$/)
  if (px) {
    const w = Math.min(parseFloat(px[1]) * 0.6, 60)
    return (
      <span
        className="inline-block h-1.5 rounded-full bg-indigo-300 align-middle mr-1 shrink-0"
        style={{ width: `${Math.max(w, 4)}px` }}
      />
    )
  }
  const pct = value.match(/^(\d+(?:\.\d+)?)%$/)
  if (pct) {
    return (
      <span className="inline-block w-8 h-1.5 bg-neutral-100 rounded-full align-middle mr-1 shrink-0 overflow-hidden">
        <span
          className="block h-full bg-indigo-300 rounded-full"
          style={{ width: `${Math.min(parseFloat(pct[1]), 100)}%` }}
        />
      </span>
    )
  }
  const shadow = value.includes('box-shadow') || /\d+px \d+px/.test(value)
  if (shadow) {
    return (
      <span
        className="inline-block w-3.5 h-3.5 rounded-sm bg-white border border-neutral-200 align-middle mr-1 shrink-0"
        style={{ boxShadow: value }}
      />
    )
  }
  return null
}

interface TokenRowProps {
  token: TokenNode
  onTokenClick?: (line: number) => void
}

function TokenRow({ token, onTokenClick }: TokenRowProps) {
  return (
    <tr
      data-line={token.line}
      onClick={() => onTokenClick?.(token.line)}
      className="hover:bg-neutral-50 cursor-pointer transition-colors group"
    >
      <td className="py-1.5 pr-3 font-mono text-[11px] text-neutral-600 font-medium whitespace-nowrap w-28">
        {token.name}
      </td>
      <td className="py-1.5 pr-3 font-mono text-[11px] text-indigo-600 whitespace-nowrap">
        <span className="flex items-center gap-0.5">
          <ValuePreview value={token.value} />
          {token.value}
        </span>
      </td>
      <td className="py-1.5 text-[11px] text-neutral-400 leading-relaxed">
        {token.zh ?? '—'}
      </td>
    </tr>
  )
}

// Group card with label + token table
function GroupCard({ group, onTokenClick }: { group: GroupNode; onTokenClick?: (line: number) => void }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 overflow-hidden">
      <div className="px-3 py-2 bg-white border-b border-neutral-100 flex items-center gap-2">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
          {group.title}
        </span>
        <span className="text-[10px] text-neutral-300">{group.tokens.length} 项</span>
      </div>
      <div className="px-3 py-1">
        <table className="w-full">
          <tbody>
            {group.tokens.map(token => (
              <TokenRow key={`${token.name}-${token.line}`} token={token} onTokenClick={onTokenClick} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface Props {
  groups: GroupNode[]
  tokens: TokenNode[]
  rawText?: string
  onTokenClick?: (line: number) => void
}

export default function ComponentSpecRenderer({ groups, tokens, rawText, onTokenClick }: Props) {
  // Split behavioral tokens from visual tokens
  const behavioralTokens = tokens.filter(t => BEHAVIORAL_KEYS.includes(t.name))
  const visualTokens = tokens.filter(t => !BEHAVIORAL_KEYS.includes(t.name))

  // Shared behavioral header (usage + prohibited)
  const behavioralHeader = behavioralTokens.length > 0 ? (
    <div className="space-y-1.5">
      {behavioralTokens.map(t => (
        <BehavioralBlock key={t.name} token={t} onTokenClick={onTokenClick} />
      ))}
    </div>
  ) : null

  // If groups exist, render as group cards
  if (groups.length > 0) {
    return (
      <div className="space-y-3">
        {behavioralHeader}
        {rawText && (
          <p className="text-sm text-neutral-500 leading-relaxed">{rawText}</p>
        )}
        <div className="grid grid-cols-1 gap-2">
          {groups.map(group => (
            <GroupCard key={`${group.id}-${group.line}`} group={group} onTokenClick={onTokenClick} />
          ))}
        </div>
        {/* Loose visual tokens (outside any group) */}
        {visualTokens.length > 0 && (
          <table className="w-full">
            <tbody>
              {visualTokens.map(token => (
                <TokenRow key={`${token.name}-${token.line}`} token={token} onTokenClick={onTokenClick} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  // Fallback: plain token table or text
  if (visualTokens.length > 0 || behavioralHeader) {
    return (
      <div className="space-y-3">
        {behavioralHeader}
        {visualTokens.length > 0 && (
          <div className="rounded-xl border border-neutral-100 overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-neutral-50">
                {visualTokens.map(token => (
                  <TokenRow key={`${token.name}-${token.line}`} token={token} onTokenClick={onTokenClick} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (rawText) {
    return <p className="text-sm text-neutral-500 leading-relaxed whitespace-pre-wrap">{rawText}</p>
  }

  return null
}

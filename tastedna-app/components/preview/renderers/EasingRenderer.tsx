'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
}

function parseCubicBezier(value: string): string | null {
  const m = value.match(/cubic-bezier\(([^)]+)\)/)
  return m ? m[0] : null
}

function BezierPreview({ value }: { value: string }) {
  const m = value.match(/cubic-bezier\(([\d.-]+),\s*([\d.-]+),\s*([\d.-]+),\s*([\d.-]+)\)/)
  if (!m) return <div className="w-12 h-12 rounded bg-neutral-100" />

  const [, x1, y1, x2, y2] = m.map(Number)
  const size = 48
  const pad = 6
  const inner = size - pad * 2

  // Control points on the SVG canvas
  const p0 = { x: pad, y: size - pad }
  const p1 = { x: pad + x1 * inner, y: size - pad - y1 * inner }
  const p2 = { x: pad + x2 * inner, y: size - pad - y2 * inner }
  const p3 = { x: size - pad, y: pad }

  return (
    <svg width={size} height={size} className="shrink-0">
      {/* Grid */}
      <rect x={pad} y={pad} width={inner} height={inner} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      {/* Control arms */}
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#c7d2fe" strokeWidth="1" strokeDasharray="2" />
      <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} stroke="#c7d2fe" strokeWidth="1" strokeDasharray="2" />
      {/* Curve */}
      <path
        d={`M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
        fill="none"
        stroke="#4F6EF7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Control points */}
      <circle cx={p1.x} cy={p1.y} r="2.5" fill="#9B72FF" />
      <circle cx={p2.x} cy={p2.y} r="2.5" fill="#9B72FF" />
    </svg>
  )
}

export default function EasingRenderer({ tokens, onTokenClick }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      {tokens.map((token) => (
        <button
          key={`${token.name}-${token.line}`}
          data-line={token.line}
          onClick={() => onTokenClick?.(token.line)}
          className="flex items-start gap-3 p-3 rounded-xl border border-neutral-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors cursor-pointer text-left"
        >
          <BezierPreview value={token.value} />
          <div>
            <p className="text-xs font-medium text-neutral-700">{token.name}</p>
            <p className="text-[10px] font-mono text-neutral-400 mt-0.5 max-w-[160px] break-all">{token.value}</p>
            {token.zh && <p className="text-[10px] text-neutral-400 mt-1">{token.zh}</p>}
          </div>
        </button>
      ))}
    </div>
  )
}

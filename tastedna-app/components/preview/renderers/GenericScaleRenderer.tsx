'use client'

import type { TokenNode } from '@/lib/parser/types'

interface Props {
  tokens: TokenNode[]
  onTokenClick?: (line: number) => void
}

export default function GenericScaleRenderer({ tokens, onTokenClick }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left text-xs font-medium text-neutral-400 py-2 pr-4 w-24">名称</th>
            <th className="text-left text-xs font-medium text-neutral-400 py-2 pr-4">值</th>
            <th className="text-left text-xs font-medium text-neutral-400 py-2">说明</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {tokens.map((token) => (
            <tr
              key={`${token.name}-${token.line}`}
              data-line={token.line}
              onClick={() => onTokenClick?.(token.line)}
              className="hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <td className="py-2 pr-4 font-mono text-xs text-neutral-600 font-medium">{token.name}</td>
              <td className="py-2 pr-4 font-mono text-xs text-indigo-600">{token.value}</td>
              <td className="py-2 text-xs text-neutral-400">{token.zh ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

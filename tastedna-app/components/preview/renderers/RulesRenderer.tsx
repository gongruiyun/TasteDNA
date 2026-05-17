'use client'

interface Props {
  rawText: string
}

export default function RulesRenderer({ rawText }: Props) {
  const lines = rawText.split('\n').filter(l => l.trim())
  const doLines: string[] = []
  const dontLines: string[] = []
  let mode: 'do' | 'dont' | null = null

  for (const line of lines) {
    if (line.includes('✅') || line.toLowerCase().includes('do:')) { mode = 'do'; continue }
    if (line.includes('❌') || line.toLowerCase().includes("don't") || line.toLowerCase().includes('dont')) { mode = 'dont'; continue }
    if (mode === 'do' && line.trim().startsWith('-')) doLines.push(line.trim().slice(1).trim())
    if (mode === 'dont' && line.trim().startsWith('-')) dontLines.push(line.trim().slice(1).trim())
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
        <p className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-1.5">
          <span>✅</span> 应该这样做
        </p>
        <ul className="space-y-2">
          {doLines.map((line, i) => (
            <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
        <p className="text-xs font-semibold text-red-700 mb-3 flex items-center gap-1.5">
          <span>❌</span> 避免这样做
        </p>
        <ul className="space-y-2">
          {dontLines.map((line, i) => (
            <li key={i} className="text-xs text-red-800 flex items-start gap-1.5">
              <span className="text-red-400 mt-0.5">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

type Style = 'outline' | 'filled' | 'duotone'
type GridSize = 16 | 20 | 24 | 32
type StrokeWeight = 1 | 1.5 | 2 | 2.5
type Cap = 'round' | 'square'
type Corner = 'sharp' | 'subtle' | 'round'

interface IconSpec {
  style: Style
  gridSize: GridSize
  strokeWeight: StrokeWeight
  cap: Cap
  corner: Corner
}

interface IconItem {
  name: string
  svg: string | null
}

const DEFAULT_SPEC: IconSpec = {
  style: 'outline',
  gridSize: 24,
  strokeWeight: 1.5,
  cap: 'round',
  corner: 'subtle',
}

const DEFAULT_NAMES = 'search, home, settings, user, star, heart, bell, trash, edit, download'

const CHIP_ACTIVE: React.CSSProperties = {
  backgroundColor: 'var(--ink)',
  color: '#ffffff',
  border: '1px solid var(--ink)',
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const CHIP_INACTIVE: React.CSSProperties = {
  backgroundColor: 'var(--canvas)',
  color: 'var(--body)',
  border: '1px solid var(--hairline)',
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--muted-soft)',
  marginBottom: '6px',
  display: 'block',
}

function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <span style={SECTION_LABEL}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            style={value === opt.value ? CHIP_ACTIVE : CHIP_INACTIVE}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function parseIcons(text: string): Map<string, string> {
  const result = new Map<string, string>()
  const blockRegex = /===ICON:([^=\n]+)===\s*([\s\S]*?)\s*===END===/g
  let match
  while ((match = blockRegex.exec(text)) !== null) {
    const name = match[1].trim().toLowerCase()
    const svgContent = match[2].trim()
    // Extract just the svg element
    const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i)
    if (svgMatch) {
      result.set(name, svgMatch[0])
    }
  }
  return result
}

function buildSprite(icons: IconItem[], gridSize: GridSize): string {
  const symbols = icons
    .filter((i) => i.svg)
    .map((i) => {
      const inner = i.svg!
        .replace(/<svg[^>]*>/, '')
        .replace(/<\/svg>/, '')
        .trim()
      return `  <symbol id="${i.name}" viewBox="0 0 ${gridSize} ${gridSize}">\n    ${inner}\n  </symbol>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
${symbols}
</svg>`
}

export default function IconPage() {
  const [spec, setSpec] = useState<IconSpec>(DEFAULT_SPEC)
  const [namesInput, setNamesInput] = useState(DEFAULT_NAMES)
  const [icons, setIcons] = useState<IconItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const parsedNames = namesInput
    .split(/[\n,]+/)
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 16)

  const setSpecField = <K extends keyof IconSpec>(key: K, value: IconSpec[K]) => {
    setSpec((prev) => ({ ...prev, [key]: value }))
  }

  const handleGenerate = useCallback(async () => {
    if (generating) {
      abortRef.current?.abort()
      setGenerating(false)
      return
    }

    const names = parsedNames
    if (names.length === 0) return

    // Initialize icons as loading placeholders
    setIcons(names.map((name) => ({ name, svg: null })))
    setGenerating(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/generate-icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec, names }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Parse completed icon blocks from buffer
        const parsed = parseIcons(buffer)
        if (parsed.size > 0) {
          setIcons((prev) =>
            prev.map((item) => {
              const svg = parsed.get(item.name)
              return svg ? { ...item, svg } : item
            })
          )
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Icon generation error:', err)
      }
    } finally {
      setGenerating(false)
      abortRef.current = null
    }
  }, [generating, parsedNames, spec])

  const handleDownload = () => {
    const sprite = buildSprite(icons, spec.gridSize)
    const blob = new Blob([sprite], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tastedna-icons.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyIcon = (svg: string) => {
    navigator.clipboard.writeText(svg).catch(() => {})
  }

  const handleDownloadIcon = (name: string, svg: string) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasReadyIcons = icons.some((i) => i.svg)

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: 'var(--canvas)', color: 'var(--ink)' }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--canvas)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity"
            style={{ color: 'var(--ink)' }}
          >
            TasteDNA
          </Link>
          <span style={{ color: 'var(--hairline)' }}>|</span>
          <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            Icon 风格
          </span>
        </div>
        <button
          onClick={handleDownload}
          disabled={!hasReadyIcons}
          style={{
            backgroundColor: hasReadyIcons ? 'var(--surface-card)' : 'var(--surface-soft)',
            color: hasReadyIcons ? 'var(--body)' : 'var(--muted-soft)',
            border: '1px solid var(--hairline)',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: hasReadyIcons ? 'pointer' : 'not-allowed',
            opacity: hasReadyIcons ? 1 : 0.6,
            transition: 'all 0.15s',
          }}
        >
          ↓ 下载图标集
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside
          className="flex flex-col overflow-y-auto flex-shrink-0"
          style={{
            width: '288px',
            borderRight: '1px solid var(--hairline)',
            backgroundColor: 'var(--surface-soft)',
            padding: '20px 16px',
          }}
        >
          <ChipGroup
            label="风格类型"
            options={[
              { label: '线性描边', value: 'outline' as Style },
              { label: '实心填充', value: 'filled' as Style },
              { label: '双色调', value: 'duotone' as Style },
            ]}
            value={spec.style}
            onChange={(v) => setSpecField('style', v)}
          />

          <ChipGroup
            label="网格尺寸"
            options={[
              { label: '16px', value: 16 as GridSize },
              { label: '20px', value: 20 as GridSize },
              { label: '24px', value: 24 as GridSize },
              { label: '32px', value: 32 as GridSize },
            ]}
            value={spec.gridSize}
            onChange={(v) => setSpecField('gridSize', v)}
          />

          {spec.style !== 'filled' && (
            <ChipGroup
              label="描边粗细"
              options={[
                { label: '1px', value: 1 as StrokeWeight },
                { label: '1.5px', value: 1.5 as StrokeWeight },
                { label: '2px', value: 2 as StrokeWeight },
                { label: '2.5px', value: 2.5 as StrokeWeight },
              ]}
              value={spec.strokeWeight}
              onChange={(v) => setSpecField('strokeWeight', v)}
            />
          )}

          <ChipGroup
            label="端点样式"
            options={[
              { label: '圆角端点', value: 'round' as Cap },
              { label: '方形端点', value: 'square' as Cap },
            ]}
            value={spec.cap}
            onChange={(v) => setSpecField('cap', v)}
          />

          <ChipGroup
            label="转角风格"
            options={[
              { label: '锐利', value: 'sharp' as Corner },
              { label: '微圆', value: 'subtle' as Corner },
              { label: '圆润', value: 'round' as Corner },
            ]}
            value={spec.corner}
            onChange={(v) => setSpecField('corner', v)}
          />

          {/* Icon names textarea */}
          <div style={{ marginBottom: '20px' }}>
            <span style={SECTION_LABEL}>图标名称</span>
            <textarea
              value={namesInput}
              onChange={(e) => setNamesInput(e.target.value)}
              placeholder="search, home, settings, user, star, heart, bell, trash, edit, download, share, menu"
              rows={5}
              style={{
                width: '100%',
                backgroundColor: 'var(--canvas)',
                color: 'var(--body)',
                border: '1px solid var(--hairline)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '12px',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                fontSize: '10px',
                color: 'var(--muted-soft)',
                marginTop: '4px',
                textAlign: 'right',
              }}
            >
              {parsedNames.length}/16 个图标
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={parsedNames.length === 0}
            style={{
              width: '100%',
              backgroundColor: generating ? 'var(--surface-strong)' : 'var(--ink)',
              color: generating ? 'var(--muted)' : '#ffffff',
              border: `1px solid ${generating ? 'var(--hairline)' : 'var(--ink)'}`,
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: parsedNames.length === 0 ? 'not-allowed' : 'pointer',
              opacity: parsedNames.length === 0 ? 0.5 : 1,
              transition: 'all 0.15s',
              letterSpacing: '-0.01em',
            }}
          >
            {generating
              ? '⏹ 停止生成'
              : `✦ 生成 ${parsedNames.length > 0 ? `${parsedNames.length} 个 ` : ''}Icon`}
          </button>
        </aside>

        {/* Right panel */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '24px' }}
        >
          {icons.length === 0 ? (
            /* Empty state */
            <div
              className="flex flex-col items-center justify-center h-full"
              style={{ color: 'var(--muted-soft)' }}
            >
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  opacity: 0.4,
                }}
              >
                ◈
              </div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>
                配置风格，点击生成
              </p>
              <p style={{ fontSize: '12px', color: 'var(--muted-soft)' }}>
                AI 将根据你的风格规范生成一整套 SVG 图标
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
              }}
            >
              {icons.map((icon, idx) => (
                <div
                  key={icon.name}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    position: 'relative',
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: '88px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Icon area */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink)',
                    }}
                  >
                    {icon.svg ? (
                      <div
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        dangerouslySetInnerHTML={{ __html: icon.svg }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: 'var(--hairline)',
                          borderRadius: '6px',
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }}
                      />
                    )}
                  </div>

                  {/* Name */}
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: 'var(--muted)',
                      textAlign: 'center',
                      lineHeight: 1.3,
                    }}
                  >
                    {icon.name}
                  </span>

                  {/* Hover overlay */}
                  {hoveredIndex === idx && icon.svg && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(255,250,240,0.92)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <button
                        onClick={() => handleCopyIcon(icon.svg!)}
                        style={{
                          backgroundColor: 'var(--ink)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          width: '80px',
                        }}
                      >
                        复制
                      </button>
                      <button
                        onClick={() => handleDownloadIcon(icon.name, icon.svg!)}
                        style={{
                          backgroundColor: 'var(--canvas)',
                          color: 'var(--body)',
                          border: '1px solid var(--hairline)',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          width: '80px',
                        }}
                      >
                        ↓ SVG
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

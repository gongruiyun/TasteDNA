'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'

// ── SVG style extractor ──────────────────────────────────────────────────────

function extractStyleFromSVG(svgText: string): Partial<IconSpec> {
  if (typeof window === 'undefined') return {}
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg || doc.querySelector('parsererror')) return {}

  const result: Partial<IconSpec> = {}

  // Grid size from viewBox
  const vb = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/)
  if (vb && vb.length >= 4) {
    const w = parseFloat(vb[2]), h = parseFloat(vb[3])
    const size = Math.round((w + h) / 2)
    const snap = ([16, 20, 24, 32] as GridSize[]).reduce((a, b) =>
      Math.abs(b - size) < Math.abs(a - size) ? b : a)
    result.gridSize = snap
  }

  // Collect per-element attributes
  const els = Array.from(doc.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse,g'))
  const strokeWidths: number[] = []
  const linecaps: string[] = []
  let totalFilled = 0, totalStroked = 0

  const resolveAttr = (el: Element, attr: string): string => {
    let val = el.getAttribute(attr)
    if (!val) {
      let p: Element | null = el.parentElement
      while (p && p !== svg) { val = p.getAttribute(attr); if (val) break; p = p.parentElement }
    }
    return val || svg.getAttribute(attr) || ''
  }

  els.forEach(el => {
    const sw = parseFloat(el.getAttribute('stroke-width') || '')
    if (!isNaN(sw) && sw > 0) strokeWidths.push(sw)

    const slc = el.getAttribute('stroke-linecap')
    if (slc) linecaps.push(slc)

    const fill = resolveAttr(el, 'fill')
    const stroke = resolveAttr(el, 'stroke')
    const hasFill = fill && fill !== 'none'
    const hasStroke = stroke && stroke !== 'none'
    if (hasFill) totalFilled++
    if (hasStroke) totalStroked++
  })

  // Determine style
  if (totalStroked > 0 && totalFilled === 0) result.style = 'outline'
  else if (totalFilled > 0 && totalStroked === 0) result.style = 'filled'
  else if (totalFilled > 0 && totalStroked > 0) result.style = 'duotone'

  // Stroke weight → snap to nearest valid value
  if (strokeWidths.length > 0) {
    const avg = strokeWidths.reduce((a, b) => a + b, 0) / strokeWidths.length
    const snap = ([1, 1.5, 2, 2.5] as StrokeWeight[]).reduce((a, b) =>
      Math.abs(b - avg) < Math.abs(a - avg) ? b : a)
    result.strokeWeight = snap
  }

  // Linecap
  if (linecaps.length > 0) {
    result.cap = linecaps.includes('round') ? 'round' : 'square'
  }

  // Corner radius from rect rx
  const rxVals: number[] = []
  doc.querySelectorAll('rect').forEach(r => {
    const rx = parseFloat(r.getAttribute('rx') || '')
    if (!isNaN(rx)) rxVals.push(rx)
  })
  if (rxVals.length > 0) {
    const avgRx = rxVals.reduce((a, b) => a + b, 0) / rxVals.length
    const gs = result.gridSize ?? 24
    const ratio = avgRx / gs
    result.corner = ratio < 0.04 ? 'sharp' : ratio < 0.13 ? 'subtle' : 'round'
  }

  // Color mode — detect hardcoded hex/rgb colors (vs currentColor only)
  const hardcodedColors: string[] = []
  const allEls = Array.from(doc.querySelectorAll('*'))
  allEls.forEach(el => {
    ;['fill', 'stroke', 'stop-color'].forEach(attr => {
      const val = el.getAttribute(attr)
      if (val && val !== 'none' && val !== 'currentColor' && val !== 'inherit' && val !== 'transparent') {
        hardcodedColors.push(val)
      }
    })
    // Also check inline style
    const style = el.getAttribute('style') || ''
    if (/(fill|stroke)\s*:\s*(?!none|currentColor|inherit)[^;]+/i.test(style)) {
      hardcodedColors.push('from-style')
    }
  })
  result.colorMode = hardcodedColors.length > 0 ? 'multi' : 'single'

  return result
}

function extractColorsFromSVG(svgText: string): string[] {
  if (typeof window === 'undefined') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return []

  const colors = new Set<string>()
  Array.from(doc.querySelectorAll('*')).forEach(el => {
    ;['fill', 'stroke', 'stop-color'].forEach(attr => {
      const val = el.getAttribute(attr)
      if (val && val !== 'none' && val !== 'currentColor' && val !== 'inherit' && val !== 'transparent') {
        if (/^#[0-9a-fA-F]{3,8}$/.test(val)) colors.add(val.toLowerCase())
        else if (/^rgb/.test(val)) colors.add(val.replace(/\s/g, '').toLowerCase())
      }
    })
    const style = el.getAttribute('style') || ''
    const matches = style.matchAll(/(fill|stroke|stop-color)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/gi)
    for (const m of matches) colors.add(m[2].trim().toLowerCase())
  })
  return Array.from(colors)
}

function mergeExtracted(specs: Partial<IconSpec>[]): Partial<IconSpec> {
  if (specs.length === 0) return {}
  // Vote on each field — most common value wins
  const vote = <T,>(vals: T[]): T | undefined => {
    const map = new Map<string, number>()
    vals.forEach(v => { const k = String(v); map.set(k, (map.get(k) ?? 0) + 1) })
    let best: T | undefined, bestN = 0
    vals.forEach(v => { const n = map.get(String(v)) ?? 0; if (n > bestN) { bestN = n; best = v } })
    return best
  }
  return {
    style: vote(specs.map(s => s.style).filter(Boolean) as Style[]),
    gridSize: vote(specs.map(s => s.gridSize).filter(Boolean) as GridSize[]),
    strokeWeight: vote(specs.map(s => s.strokeWeight).filter(Boolean) as StrokeWeight[]),
    cap: vote(specs.map(s => s.cap).filter(Boolean) as Cap[]),
    corner: vote(specs.map(s => s.corner).filter(Boolean) as Corner[]),
    colorMode: vote(specs.map(s => s.colorMode).filter(Boolean) as ColorMode[]),
  }
}

type Style = 'outline' | 'filled' | 'duotone'
type GridSize = 16 | 20 | 24 | 32
type StrokeWeight = 1 | 1.5 | 2 | 2.5
type Cap = 'round' | 'square'
type Corner = 'sharp' | 'subtle' | 'round'
type ColorMode = 'single' | 'multi'

interface IconSpec {
  style: Style
  gridSize: GridSize
  strokeWeight: StrokeWeight
  cap: Cap
  corner: Corner
  colorMode: ColorMode
}

const VARIANT_COUNT = 3

interface IconVariants {
  name: string
  variants: (string | null)[]       // length = VARIANT_COUNT
  errors: (string | null)[]         // per-variant error message
  adopted: number | null            // which variant index the user picked
}

const DEFAULT_SPEC: IconSpec = {
  style: 'outline',
  gridSize: 24,
  strokeWeight: 1.5,
  cap: 'round',
  corner: 'subtle',
  colorMode: 'single',
}

const DEFAULT_NAMES = ''

// ── Spec → DESIGN.md converter ───────────────────────────────────────────────

function specToDesignMD(spec: IconSpec, colors: string[]): string {
  const styleLabel = {
    outline:  '线性描边（stroke-only，fill: none）',
    filled:   '实心填充（fill-only，no stroke）',
    duotone:  '双色调（fill + stroke 组合）',
  }[spec.style]

  const capLabel = spec.cap === 'round' ? 'round  // 端点圆润' : 'square  // 端点方形'

  const joinLabel = {
    round:  'round  // 转角圆润',
    subtle: 'round  // 转角微圆',
    sharp:  'miter  // 转角锐利',
  }[spec.corner]

  const usable = spec.gridSize - 2
  const colorVal = spec.colorMode === 'multi' && colors.length > 0
    ? colors.join(', ') + '  // 多色调色板'
    : 'currentColor  // 继承父元素颜色，单色'

  const maxStroke = Math.min(spec.strokeWeight + 0.5, 2.5)
  const prohibited = {
    outline: `不能使用实心填充（fill 非 none）；不能使用阴影或渐变；描边不得超过 ${maxStroke}px；16px 以下不使用复杂路径（超过 6 个锚点）；不能在图标内混用多种描边粗细`,
    filled:  '不能在图标内混用描边；不能使用阴影或外发光；16px 以下不使用复杂路径；不能使用渐变填充',
    duotone: '描边与填充色必须同色系；不能超过 2 种颜色；不能使用阴影；16px 以下不使用复杂路径',
  }[spec.style]

  const aiStyle = { outline: 'line', filled: 'solid', duotone: 'duotone' }[spec.style]
  const aiFill  = spec.style === 'outline' ? 'fill none' : spec.style === 'filled' ? 'filled' : 'fill + stroke'
  const aiAdj   = spec.cap === 'round' ? 'rounded, soft' : 'geometric, crisp'

  return `### icon-style
<!-- type: spec -->
- style:           ${styleLabel}
- grid:            ${spec.gridSize}×${spec.gridSize}px，1px 光学安全边距（可用 ${usable}×${usable}px）
- stroke-width:    ${spec.strokeWeight}px
- stroke-linecap:  ${capLabel}
- stroke-linejoin: ${joinLabel}
- color:           ${colorVal}
- usage: 功能性图标——导航、操作按钮、状态提示、表单前缀
- prohibited: ${prohibited}

### ai-prompt-template
<!-- type: ai-prompt -->
SVG ${aiStyle} icon for {subject}, ${spec.gridSize}×${spec.gridSize} viewBox, 1px padding, stroke-width ${spec.strokeWeight}, stroke-linecap ${spec.cap}, stroke-linejoin ${spec.corner === 'sharp' ? 'miter' : 'round'}, ${aiFill}, ${aiAdj} paths, balanced optical weight, no decorative details. Output only raw SVG <path> elements, no wrapper tags.`
}

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

function buildSprite(iconVariants: IconVariants[], gridSize: GridSize): string {
  const symbols = iconVariants
    .filter(i => i.adopted !== null && i.variants[i.adopted!])
    .map(i => {
      const svg = i.variants[i.adopted!]!
      const inner = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').trim()
      return `  <symbol id="${i.name}" viewBox="0 0 ${gridSize} ${gridSize}">\n    ${inner}\n  </symbol>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
${symbols}
</svg>`
}

/** Set explicit width/height on an SVG string, preserving its viewBox. */
function resizeSVG(svgString: string, targetSize: number): string {
  return svgString.replace(/<svg([^>]*)>/, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s+width="[^"]*"/, '')
      .replace(/\s+height="[^"]*"/, '')
    return `<svg${cleaned} width="${targetSize}" height="${targetSize}">`
  })
}

interface RefImage { name: string; base64: string; mime: string; preview: string }

function readFileAsBase64(file: File): Promise<RefImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      resolve({ name: file.name, base64: dataUrl.split(',')[1], mime: file.type, preview: dataUrl })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function IconPage() {
  const [spec, setSpec] = useState<IconSpec>(DEFAULT_SPEC)
  const [namesInput, setNamesInput] = useState(DEFAULT_NAMES)
  const [iconVariants, setIconVariants] = useState<IconVariants[]>([])
  const [diagResult, setDiagResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [genPhase, setGenPhase] = useState<'idle' | 'thinking' | 'writing'>('idle')
  const [generating, setGenerating] = useState(false)
  const [uploadedSVGs, setUploadedSVGs] = useState<string[]>([])
  const [refImages, setRefImages] = useState<RefImage[]>([])
  const [extracting, setExtracting] = useState(false)
  const [extractDone, setExtractDone] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [copiedName, setCopiedName] = useState<string | null>(null)
  const [copiedMD, setCopiedMD] = useState(false)
  const [customMD, setCustomMD] = useState<string | null>(null)
  const [identifying, setIdentifying] = useState(false)
  const [paletteColors, setPaletteColors] = useState<string[]>([])
  const [conceptImages, setConceptImages] = useState<RefImage[]>([])
  const [isDragOverConcept, setIsDragOverConcept] = useState(false)
  const [specTab, setSpecTab] = useState<'controls' | 'spec'>('controls')
  // Download size picker: stores the open popover key ('__header__' or icon.name), null = closed
  const [downloadPopover, setDownloadPopover] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const conceptInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const all = Array.from(files).slice(0, 100)
    const svgFiles = all.filter(f => f.name.toLowerCase().endsWith('.svg') || f.type === 'image/svg+xml')
    const imgFiles = all.filter(f => f.type.startsWith('image/') && !f.type.includes('svg'))

    // SVG → extract style
    if (svgFiles.length > 0) {
      setExtracting(true)
      setExtractDone(false)
      const texts = await Promise.all(svgFiles.map(f => f.text()))
      const merged = mergeExtracted(texts.map(extractStyleFromSVG))
      setSpec(prev => ({ ...prev, ...Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== undefined)
      )}))
      setUploadedSVGs(svgFiles.map(f => f.name))
      // Extract palette colors from all uploaded SVGs
      const allColors = Array.from(new Set(texts.flatMap(extractColorsFromSVG))).slice(0, 16)
      if (allColors.length > 0) {
        setPaletteColors(allColors)
      }
      setExtracting(false)
      setExtractDone(true)
      setTimeout(() => setExtractDone(false), 3000)
    }

    // Images → store as style reference (in the top upload zone context)
    if (imgFiles.length > 0) {
      const loaded = await Promise.all(imgFiles.slice(0, 6).map(readFileAsBase64))
      setRefImages(prev => [...prev, ...loaded].slice(0, 6))
    }
  }, [])

  // Concept images — uploaded near the names textarea, used for visual concept reference
  const handleConceptFiles = useCallback(async (files: FileList | File[]) => {
    const imgFiles = Array.from(files)
      .filter(f => f.type.startsWith('image/') && !f.type.includes('svg'))
      .slice(0, 12)
    if (imgFiles.length === 0) return

    const loaded = await Promise.all(imgFiles.map(readFileAsBase64))
    setConceptImages(prev => [...prev, ...loaded].slice(0, 12))

    // Auto-identify icon names from concept images
    setIdentifying(true)
    try {
      const res = await fetch('/api/identify-icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: loaded.map(img => ({ base64: img.base64, mime: img.mime })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.names) && data.names.length > 0) {
          setNamesInput(data.names.join(', '))
        }
      }
    } catch {
      // silently ignore
    } finally {
      setIdentifying(false)
    }
  }, [])

  // Global paste → concept images (only when pasting image files, not text)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageFiles = items
        .filter(item => item.kind === 'file' && item.type.startsWith('image/') && !item.type.includes('svg'))
        .map(item => item.getAsFile())
        .filter(Boolean) as File[]
      if (imageFiles.length > 0) {
        e.preventDefault()
        handleConceptFiles(imageFiles)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleConceptFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const handleConceptDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOverConcept(false)
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('image/') && !f.type.includes('svg')
    )
    if (files.length > 0) handleConceptFiles(files)
  }

  const parsedNames = namesInput
    .split(/[\n,]+/)
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 16)

  const setSpecField = <K extends keyof IconSpec>(key: K, value: IconSpec[K]) => {
    setSpec((prev) => ({ ...prev, [key]: value }))
  }

  const buildPayload = useCallback((names: string[]) => ({
    spec,
    names,
    paletteColors: spec.colorMode === 'multi' && paletteColors.length > 0 ? paletteColors : undefined,
    refImages: refImages.length > 0 ? refImages.map(i => ({ base64: i.base64, mime: i.mime })) : undefined,
    conceptImages: conceptImages.length > 0 ? conceptImages.map(i => ({ base64: i.base64, mime: i.mime })) : undefined,
  }), [spec, paletteColors, refImages, conceptImages])

  // Mark all icons with an error for the given variant index
  const setVariantError = useCallback((variantIndex: number, msg: string) => {
    console.error(`[variant ${variantIndex}] ${msg}`)
    setIconVariants(prev => prev.map(item => {
      const next = [...item.errors]
      next[variantIndex] = msg
      return { ...item, errors: next }
    }))
  }, [])

  // Read one variant stream and update the given variantIndex
  const readVariantStream = useCallback(async (res: Response, variantIndex: number) => {
    if (!res.body) {
      setVariantError(variantIndex, '无响应体')
      return
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      setVariantError(variantIndex, `请求失败 ${res.status}${errText ? ': ' + errText.slice(0, 80) : ''}`)
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let hasRealContent = false
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        // Null bytes = thinking heartbeat from server (reasoning model still thinking)
        if (chunk.includes('\x00')) {
          if (!hasRealContent) setGenPhase('thinking')
          // Strip null bytes before adding to buffer
          buffer += chunk.replace(/\x00/g, '')
        } else {
          buffer += chunk
          if (chunk.trim()) {
            hasRealContent = true
            setGenPhase('writing')
          }
        }

        // Detect API-level error tokens written into the stream
        if (buffer.includes('__ERROR_401__')) {
          setVariantError(variantIndex, 'API 鉴权失败，请检查 ARK_API_KEY')
          return
        }
        if (buffer.includes('__ERROR__:')) {
          const msg = buffer.match(/__ERROR__:\s*(.+)/)?.[1] ?? '未知错误'
          setVariantError(variantIndex, msg.slice(0, 100))
          return
        }

        const parsed = parseIcons(buffer)
        if (parsed.size > 0) {
          setIconVariants(prev => prev.map(item => {
            const svg = parsed.get(item.name)
            if (!svg) return item
            const next = [...item.variants]
            next[variantIndex] = svg
            return { ...item, variants: next }
          }))
        }
      }
      // Stream ended — if nothing was ever parsed, flag it
      if (!parseIcons(buffer).size) {
        const hint = buffer.replace(/\x00/g, '').trim().slice(0, 120) || '空响应'
        setVariantError(variantIndex, `未解析到图标内容：${hint}`)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setVariantError(variantIndex, (e as Error).message ?? '读取流失败')
      }
    }
  }, [setVariantError])

  const handleGenerate = useCallback(async () => {
    if (generating) {
      abortRef.current?.abort()
      setGenerating(false)
      return
    }

    const names = parsedNames
    if (names.length === 0) return

    // Init all icons with empty variant slots
    setIconVariants(names.map(name => ({
      name,
      variants: Array(VARIANT_COUNT).fill(null),
      errors: Array(VARIANT_COUNT).fill(null),
      adopted: null,
    })))
    setGenerating(true)
    setGenPhase('thinking')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      // Fire VARIANT_COUNT parallel requests — each generates the full set once
      // Natural LLM randomness produces distinct variants
      const responses = await Promise.all(
        Array.from({ length: VARIANT_COUNT }, () =>
          fetch('/api/generate-icons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPayload(names)),
            signal: controller.signal,
          })
        )
      )
      await Promise.all(responses.map((res, vi) => readVariantStream(res, vi)))
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Icon generation error:', err)
      }
    } finally {
      setGenerating(false)
      setGenPhase('idle')
      abortRef.current = null
    }
  }, [generating, parsedNames, buildPayload, readVariantStream])

  // Regenerate just one icon's 3 variants
  const handleRegenerateOne = useCallback(async (name: string) => {
    setIconVariants(prev => prev.map(item =>
      item.name === name
        ? { ...item, variants: Array(VARIANT_COUNT).fill(null), errors: Array(VARIANT_COUNT).fill(null), adopted: null }
        : item
    ))
    try {
      const responses = await Promise.all(
        Array.from({ length: VARIANT_COUNT }, () =>
          fetch('/api/generate-icons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPayload([name])),
          })
        )
      )
      await Promise.all(responses.map((res, vi) => readVariantStream(res, vi)))
    } catch (err) {
      console.error('Regen error:', err)
    }
  }, [buildPayload, readVariantStream])

  const handleDownload = () => {
    const sprite = buildSprite(iconVariants, spec.gridSize)
    const blob = new Blob([sprite], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tastedna-icons.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyIcon = (svg: string, name: string) => {
    navigator.clipboard.writeText(svg).then(() => {
      setCopiedName(name)
      setTimeout(() => setCopiedName(null), 2000)
    }).catch(() => {})
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

  /** Download a single icon SVG at a specific pixel size */
  const handleDownloadAtSize = useCallback((name: string, svg: string, size: number) => {
    const resized = resizeSVG(svg, size)
    const blob = new Blob([resized], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}-${size}.svg`
    a.click()
    URL.revokeObjectURL(url)
    setDownloadPopover(null)
  }, [])

  /** Download ALL adopted icons at a specific pixel size (one file per icon) */
  const handleDownloadAllAtSize = useCallback((size: number) => {
    const adopted = iconVariants.filter(i => i.adopted !== null && i.variants[i.adopted!])
    adopted.forEach((icon, idx) => {
      setTimeout(() => {
        const svg = icon.variants[icon.adopted!]!
        const resized = resizeSVG(svg, size)
        const blob = new Blob([resized], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${icon.name}-${size}.svg`
        a.click()
        URL.revokeObjectURL(url)
      }, idx * 80)
    })
    setDownloadPopover(null)
  }, [iconVariants])

  // Close download popover when clicking outside [data-dl-pop] elements
  useEffect(() => {
    if (!downloadPopover) return
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-dl-pop]')) setDownloadPopover(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [downloadPopover])

  // Auto-computed DESIGN.md block from current spec; user can override with customMD
  const computedMD = useMemo(() => specToDesignMD(spec, paletteColors), [spec, paletteColors])
  const displayMD = customMD ?? computedMD

  const adoptedCount = iconVariants.filter(i => i.adopted !== null).length
  const hasReadyIcons = adoptedCount > 0

  const handleTestConnection = async () => {
    setDiagLoading(true)
    setDiagResult(null)
    try {
      const res = await fetch('/api/test-connection')
      const data = await res.json()
      if (data.apiError) {
        setDiagResult({ ok: false, msg: `❌ ${data.apiError}（模型：${data.model}，耗时：${data.durationMs}ms）` })
      } else if (data.apiResult) {
        setDiagResult({ ok: true, msg: `✓ API 正常（模型：${data.model}，响应：「${data.apiResult.trim()}」，耗时：${data.durationMs}ms）` })
      } else {
        setDiagResult({ ok: false, msg: `⚠ 未知状态：${JSON.stringify(data)}` })
      }
    } catch (e) {
      setDiagResult({ ok: false, msg: `❌ 网络错误：${(e as Error).message}` })
    } finally {
      setDiagLoading(false)
    }
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Diagnostic button */}
          <button
            onClick={handleTestConnection}
            disabled={diagLoading}
            style={{
              backgroundColor: 'transparent',
              color: diagLoading ? 'var(--muted-soft)' : 'var(--muted)',
              border: '1px solid var(--hairline)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: diagLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {diagLoading ? '检测中…' : '🔌 测试连接'}
          </button>
          {/* Header download with size picker */}
          <div data-dl-pop style={{ position: 'relative' }}>
            <button
              onClick={() => hasReadyIcons && setDownloadPopover(p => p === '__header__' ? null : '__header__')}
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
              ↓ 下载图标集{adoptedCount > 0 ? `（${adoptedCount}）` : ''}
            </button>
            {downloadPopover === '__header__' && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline)',
                borderRadius: '10px', padding: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 50, minWidth: '120px',
              }}>
                <span style={{ fontSize: '10px', color: 'var(--muted-soft)', padding: '2px 6px', fontWeight: 600 }}>
                  选择尺寸下载
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {([16, 20, 24, 32] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => handleDownloadAllAtSize(size)}
                      style={{
                        flex: 1, padding: '5px 0', fontSize: '11px', fontFamily: 'monospace',
                        borderRadius: '6px', border: '1px solid var(--hairline)',
                        backgroundColor: size === spec.gridSize ? 'var(--ink)' : 'var(--canvas)',
                        color: size === spec.gridSize ? '#fff' : 'var(--body)',
                        cursor: 'pointer', fontWeight: size === spec.gridSize ? 600 : 400,
                        transition: 'all 0.1s',
                      }}
                    >{size}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Diagnostic result banner */}
      {diagResult && (
        <div style={{
          padding: '8px 24px',
          fontSize: '12px',
          backgroundColor: diagResult.ok ? 'color-mix(in srgb, var(--brand-mint) 12%, var(--canvas))' : 'color-mix(in srgb, #f87171 10%, var(--canvas))',
          borderBottom: `1px solid ${diagResult.ok ? 'var(--brand-mint)' : '#fca5a5'}`,
          color: diagResult.ok ? 'var(--ink)' : '#b91c1c',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{diagResult.msg}</span>
          <button onClick={() => setDiagResult(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'inherit', opacity: 0.6 }}>×</button>
        </div>
      )}

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
          {/* Upload zone */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ ...SECTION_LABEL, marginBottom: 0 }}>从参考图提取风格</span>
              {(uploadedSVGs.length > 0 || refImages.length > 0) && (
                <button onClick={() => { setUploadedSVGs([]); setRefImages([]); setExtractDone(false); setPaletteColors([]) }}
                  style={{ fontSize: '10px', color: 'var(--muted-soft)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  清除
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file"
              accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp,image/gif"
              multiple style={{ display: 'none' }} onChange={handleFileInput} />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              style={{
                border: `1.5px dashed ${isDragOver ? 'var(--ink)' : 'var(--hairline)'}`,
                borderRadius: '10px', padding: '12px', textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragOver ? 'var(--surface-card)' : 'var(--canvas)',
                transition: 'all 0.15s',
              }}
            >
              {extracting ? (
                <p style={{ fontSize: '11px', color: 'var(--muted)' }}>分析样式中…</p>
              ) : extractDone ? (
                <p style={{ fontSize: '11px', color: 'var(--ink)', fontWeight: 600 }}>✓ SVG 样式已提取</p>
              ) : (
                <>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>
                    上传参考图 / SVG
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--muted-soft)' }}>
                    PNG · JPG · SVG，最多 100 个
                  </p>
                </>
              )}
            </div>

            {/* Image thumbnails */}
            {refImages.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {refImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={img.name}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--hairline)' }} />
                    <button
                      onClick={e => { e.stopPropagation(); setRefImages(prev => prev.filter((_, j) => j !== i)) }}
                      style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        width: '14px', height: '14px', borderRadius: '50%',
                        backgroundColor: 'var(--ink)', color: '#fff',
                        border: 'none', cursor: 'pointer', fontSize: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}>×</button>
                  </div>
                ))}
                <div style={{ fontSize: '10px', color: 'var(--muted-soft)', alignSelf: 'center', marginLeft: '2px' }}>
                  {refImages.length} 张参考图
                </div>
              </div>
            )}

            {/* SVG file names */}
            {uploadedSVGs.length > 0 && !extracting && (
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {uploadedSVGs.slice(0, 4).map(name => (
                  <span key={name} style={{
                    fontSize: '10px', color: 'var(--muted)',
                    backgroundColor: 'var(--surface-card)', border: '1px solid var(--hairline)',
                    borderRadius: '4px', padding: '2px 6px',
                    maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{name}</span>
                ))}
                {uploadedSVGs.length > 4 && (
                  <span style={{ fontSize: '10px', color: 'var(--muted-soft)', alignSelf: 'center' }}>
                    +{uploadedSVGs.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Style card with tab toggle ── */}
          <div style={{
            marginBottom: '20px',
            border: '1px solid var(--hairline)',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'var(--canvas)',
          }}>
            {/* Tab bar */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--hairline)',
              backgroundColor: 'var(--surface-soft)',
              padding: '4px',
              gap: '2px',
            }}>
              {(['controls', 'spec'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSpecTab(tab)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    backgroundColor: specTab === tab ? 'var(--ink)' : 'transparent',
                    color: specTab === tab ? '#fff' : 'var(--muted)',
                  }}
                >
                  {tab === 'controls' ? '风格参数' : 'DESIGN.md'}
                </button>
              ))}
            </div>

            {/* Controls tab */}
            {specTab === 'controls' && (
              <div style={{ padding: '14px 14px 4px' }}>
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

              <ChipGroup
                label="色彩模式"
                options={[
                  { label: '单色', value: 'single' as ColorMode },
                  { label: '多色', value: 'multi' as ColorMode },
                ]}
                value={spec.colorMode}
                onChange={(v) => {
                  setSpecField('colorMode', v)
                  if (v === 'single') setPaletteColors([])
                }}
              />

              {/* Palette color editor — shown when multi-color mode */}
              {spec.colorMode === 'multi' && (
            <div style={{ marginBottom: '16px', marginTop: '-4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: 'var(--muted-soft)' }}>
                  {paletteColors.length > 0 ? `${paletteColors.length} 个色值` : '手动添加色值'}
                </span>
                {paletteColors.length > 0 && (
                  <button onClick={() => setPaletteColors([])}
                    style={{ fontSize: '10px', color: 'var(--muted-soft)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    清空
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                {paletteColors.map((color, i) => (
                  <div key={i} title={color} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px',
                    backgroundColor: 'var(--surface-card)', border: '1px solid var(--hairline)',
                    borderRadius: '6px', padding: '3px 6px 3px 4px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: color,
                      border: '1px solid var(--hairline)', flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--muted)', letterSpacing: '-0.01em' }}>
                      {color}
                    </span>
                    <button onClick={() => setPaletteColors(prev => prev.filter((_, j) => j !== i))}
                      style={{ marginLeft: '2px', fontSize: '10px', color: 'var(--muted-soft)', background: 'none',
                        border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 1px' }}>×</button>
                  </div>
                ))}
                {/* Add color button */}
                <div style={{ position: 'relative' }}>
                  <input ref={colorInputRef} type="color" defaultValue="#6366f1"
                    onChange={e => {
                      const hex = e.target.value.toLowerCase()
                      setPaletteColors(prev => prev.includes(hex) ? prev : [...prev, hex].slice(0, 16))
                    }}
                    style={{ position: 'absolute', opacity: 0, width: '28px', height: '28px', cursor: 'pointer', top: 0, left: 0 }} />
                  <button onClick={() => colorInputRef.current?.click()}
                    style={{ width: '28px', height: '28px', borderRadius: '6px',
                      backgroundColor: 'var(--canvas)', border: '1.5px dashed var(--hairline)',
                      cursor: 'pointer', fontSize: '14px', color: 'var(--muted-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1 }}>+</button>
                </div>
              </div>
              {paletteColors.length === 0 && (
                <p style={{ fontSize: '10px', color: 'var(--muted-soft)', marginTop: '6px', lineHeight: 1.5 }}>
                  上传含色彩的 SVG 会自动提取，或点击 + 手动添加
                </p>
              )}
            </div>
              )}
              </div>
            )}

            {/* DESIGN.md tab */}
            {specTab === 'spec' && (
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    icon-style
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {customMD !== null && (
                      <button
                        onClick={() => setCustomMD(null)}
                        title="重置为当前设置"
                        style={{ fontSize: '11px', color: 'var(--muted)', background: 'none', border: '1px solid var(--hairline)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}
                      >↻ 重置</button>
                    )}
                    <button
                      onClick={() => { navigator.clipboard.writeText(displayMD).then(() => { setCopiedMD(true); setTimeout(() => setCopiedMD(false), 2000) }).catch(() => {}) }}
                      style={{ fontSize: '11px', color: copiedMD ? 'var(--brand-mint)' : 'var(--body)', background: 'none', border: '1px solid var(--hairline)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontWeight: copiedMD ? 600 : 400, transition: 'color 0.15s' }}
                    >{copiedMD ? '✓ 已复制' : '复制'}</button>
                  </div>
                </div>
                <textarea
                  value={displayMD}
                  onChange={e => setCustomMD(e.target.value)}
                  spellCheck={false}
                  style={{ width: '100%', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '10px', lineHeight: 1.65, color: 'var(--body)', backgroundColor: 'var(--surface-soft)', border: `1px solid ${customMD !== null ? 'var(--muted-soft)' : 'var(--hairline)'}`, borderRadius: '8px', padding: '10px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', display: 'block', transition: 'border-color 0.2s', minHeight: '240px' }}
                />
                <p style={{ fontSize: '10px', color: 'var(--muted-soft)', marginTop: '5px', lineHeight: 1.5 }}>
                  随风格设置自动更新 · 可直接编辑后复制
                </p>
              </div>
            )}
          </div>{/* end style card */}

          {/* Icon names textarea */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ ...SECTION_LABEL, marginBottom: 0 }}>图标名称</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {identifying && (
                  <span style={{ fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic' }}>识别中…</span>
                )}
                {/* Concept image upload trigger */}
                <input ref={conceptInputRef} type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) handleConceptFiles(e.target.files); e.target.value = '' }} />
                <button
                  onClick={() => conceptInputRef.current?.click()}
                  title="上传图片帮助描述图标含义，AI 将参考图片内容生成"
                  style={{
                    fontSize: '10px', color: isDragOverConcept ? 'var(--ink)' : 'var(--muted)',
                    background: isDragOverConcept ? 'var(--surface-card)' : 'none',
                    border: `1px dashed ${isDragOverConcept ? 'var(--ink)' : 'var(--hairline)'}`,
                    borderRadius: '5px', padding: '2px 7px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '3px', transition: 'all 0.15s',
                  }}>
                  📎 概念图
                </button>
              </div>
            </div>

            {/* Drop zone wrapping the textarea */}
            <div
              onDrop={handleConceptDrop}
              onDragOver={e => { e.preventDefault(); setIsDragOverConcept(true) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOverConcept(false) }}
              style={{ position: 'relative' }}
            >
              <textarea
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                placeholder="search, home, settings, user, star, heart, bell, trash, edit, download, share, menu"
                rows={5}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--canvas)',
                  color: identifying ? 'var(--muted-soft)' : 'var(--body)',
                  border: `1px solid ${isDragOverConcept ? 'var(--ink)' : identifying ? 'var(--brand-mint)' : 'var(--hairline)'}`,
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, color 0.2s',
                  display: 'block',
                }}
              />
              {/* Drag overlay hint */}
              {isDragOverConcept && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '8px', pointerEvents: 'none',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px dashed var(--ink)',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>松开添加概念图</span>
                </div>
              )}
            </div>

            <div style={{ fontSize: '10px', color: 'var(--muted-soft)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontStyle: 'italic' }}>支持粘贴 / 拖入图片自动识别</span>
              <span>{parsedNames.length}/16 个图标</span>
            </div>

            {/* Concept image thumbnails */}
            {conceptImages.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted-soft)' }}>
                    概念参考图 · {conceptImages.length} 张
                  </span>
                  <button onClick={() => setConceptImages([])}
                    style={{ fontSize: '10px', color: 'var(--muted-soft)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    清除
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {conceptImages.map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.preview} alt={img.name}
                        style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '5px',
                          border: '1px solid var(--hairline)' }} />
                      <button
                        onClick={() => setConceptImages(prev => prev.filter((_, j) => j !== i))}
                        style={{
                          position: 'absolute', top: '-4px', right: '-4px',
                          width: '13px', height: '13px', borderRadius: '50%',
                          backgroundColor: 'var(--ink)', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => conceptInputRef.current?.click()}
                    style={{ width: '36px', height: '36px', borderRadius: '5px',
                      border: '1.5px dashed var(--hairline)', backgroundColor: 'transparent',
                      cursor: 'pointer', fontSize: '16px', color: 'var(--muted-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
            )}
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
              ? genPhase === 'thinking'
                ? '⏹ 模型思考中…'
                : '⏹ 生成中，停止'
              : `✦ 生成 ${parsedNames.length > 0 ? `${parsedNames.length} 个 ` : ''}Icon（每个出 ${VARIANT_COUNT} 稿）`}
          </button>
        </aside>

        {/* Right panel */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '24px' }}
        >
          {iconVariants.length === 0 ? (
            /* Empty state */
            <div
              className="flex flex-col items-center justify-center h-full"
              style={{ color: 'var(--muted-soft)' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>◈</div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>
                配置风格，点击生成
              </p>
              <p style={{ fontSize: '12px', color: 'var(--muted-soft)' }}>
                每个图标生成 3 个变体，点选最满意的采用
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Column header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 64px',
                gap: '8px', padding: '0 0 10px',
                borderBottom: '1px solid var(--hairline)', marginBottom: '4px',
              }}>
                <span style={{ fontSize: '10px', color: 'var(--muted-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>图标名称</span>
                {Array.from({ length: VARIANT_COUNT }, (_, i) => (
                  <span key={i} style={{ fontSize: '10px', color: 'var(--muted-soft)', fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    变体 {i + 1}
                  </span>
                ))}
                <span />
              </div>

              {/* Icon rows */}
              {iconVariants.map((icon) => {
                const adoptedSvg = icon.adopted !== null ? icon.variants[icon.adopted] : null
                return (
                  <div key={icon.name} style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 64px',
                    gap: '8px', alignItems: 'start',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--hairline)',
                  }}>
                    {/* Name */}
                    <span style={{
                      fontSize: '11px', fontFamily: 'monospace', color: 'var(--muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      paddingTop: '10px',
                    }}>{icon.name}</span>

                    {/* 3 variant cells */}
                    {icon.variants.map((svg, vi) => {
                      const isAdopted = icon.adopted === vi
                      const err = icon.errors[vi]
                      return (
                        <div
                          key={vi}
                          onClick={() => {
                            if (!svg) return
                            setIconVariants(prev => prev.map(item =>
                              item.name === icon.name
                                ? { ...item, adopted: item.adopted === vi ? null : vi }
                                : item
                            ))
                          }}
                          title={err ?? undefined}
                          style={{
                            width: '100%', aspectRatio: '1 / 1',
                            borderRadius: '10px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            border: `2px solid ${isAdopted ? 'var(--brand-mint)' : err ? '#f87171' : 'var(--hairline)'}`,
                            backgroundImage: err ? 'none' : `
                              linear-gradient(var(--hairline) 1px, transparent 1px),
                              linear-gradient(90deg, var(--hairline) 1px, transparent 1px)
                            `,
                            backgroundSize: '8px 8px',
                            backgroundColor: isAdopted
                              ? 'color-mix(in srgb, var(--brand-mint) 6%, var(--canvas))'
                              : err ? 'color-mix(in srgb, #f87171 6%, var(--canvas))' : 'var(--canvas)',
                            cursor: svg ? 'pointer' : 'default',
                            color: 'var(--ink)', position: 'relative',
                            transition: 'border-color 0.15s, background-color 0.15s',
                            overflow: 'hidden',
                          }}
                        >
                          {svg ? (
                            <>
                              <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                dangerouslySetInnerHTML={{ __html: svg }} />
                              {isAdopted && (
                                <div style={{
                                  position: 'absolute', top: '5px', right: '6px',
                                  fontSize: '9px', fontWeight: 700, color: 'var(--brand-mint)',
                                  lineHeight: 1,
                                }}>✓</div>
                              )}
                            </>
                          ) : err ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '4px' }}>
                              <span style={{ fontSize: '14px', lineHeight: 1 }}>⚠</span>
                              <span style={{ fontSize: '9px', color: '#ef4444', textAlign: 'center', lineHeight: 1.3, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {err.slice(0, 30)}
                              </span>
                            </div>
                          ) : (
                            <div style={{
                              width: '40px', height: '40px',
                              backgroundColor: 'var(--hairline)', borderRadius: '8px',
                              animation: 'pulse 1.5s ease-in-out infinite',
                            }} />
                          )}
                        </div>
                      )
                    })}

                    {/* Row actions */}
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', paddingTop: '10px' }}>
                      {/* Copy adopted */}
                      <button
                        onClick={() => adoptedSvg && handleCopyIcon(adoptedSvg, icon.name)}
                        disabled={!adoptedSvg}
                        title="复制已采用的变体 SVG"
                        style={{
                          width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--hairline)',
                          backgroundColor: copiedName === icon.name ? 'var(--brand-mint)' : 'var(--canvas)',
                          color: copiedName === icon.name ? 'var(--ink)' : 'var(--muted)',
                          cursor: adoptedSvg ? 'pointer' : 'not-allowed',
                          opacity: adoptedSvg ? 1 : 0.3, fontSize: '11px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s', flexShrink: 0,
                        }}
                      >{copiedName === icon.name ? '✓' : '⎘'}</button>
                      {/* Download adopted — with size picker */}
                      <div data-dl-pop style={{ position: 'relative' }}>
                        <button
                          onClick={() => adoptedSvg && setDownloadPopover(p => p === icon.name ? null : icon.name)}
                          disabled={!adoptedSvg}
                          title="选择尺寸下载"
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--hairline)',
                            backgroundColor: downloadPopover === icon.name ? 'var(--surface-card)' : 'var(--canvas)',
                            color: 'var(--muted)',
                            cursor: adoptedSvg ? 'pointer' : 'not-allowed',
                            opacity: adoptedSvg ? 1 : 0.3, fontSize: '11px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', flexShrink: 0,
                          }}
                        >↓</button>
                        {downloadPopover === icon.name && adoptedSvg && (
                          <div style={{
                            position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                            backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline)',
                            borderRadius: '10px', padding: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            display: 'flex', gap: '4px', zIndex: 50,
                          }}>
                            {([16, 20, 24, 32] as const).map(size => (
                              <button
                                key={size}
                                onClick={() => handleDownloadAtSize(icon.name, adoptedSvg, size)}
                                style={{
                                  width: '34px', padding: '5px 0', fontSize: '11px', fontFamily: 'monospace',
                                  borderRadius: '6px', border: '1px solid var(--hairline)',
                                  backgroundColor: size === spec.gridSize ? 'var(--ink)' : 'var(--canvas)',
                                  color: size === spec.gridSize ? '#fff' : 'var(--body)',
                                  cursor: 'pointer', fontWeight: size === spec.gridSize ? 600 : 400,
                                  transition: 'all 0.1s',
                                }}
                              >{size}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Regenerate this icon */}
                      <button
                        onClick={() => handleRegenerateOne(icon.name)}
                        title="重新生成此图标的 3 个变体"
                        style={{
                          width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--hairline)',
                          backgroundColor: 'var(--canvas)', color: 'var(--muted)',
                          cursor: 'pointer', fontSize: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s', flexShrink: 0,
                        }}
                      >↻</button>
                    </div>
                  </div>
                )
              })}

              {/* Footer hint */}
              {iconVariants.length > 0 && (
                <p style={{ fontSize: '11px', color: 'var(--muted-soft)', marginTop: '16px', textAlign: 'center' }}>
                  点击变体选中采用 · 已采用 {adoptedCount} / {iconVariants.length} 个
                </p>
              )}
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

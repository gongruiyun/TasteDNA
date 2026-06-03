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
  const vb = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/)
  if (vb && vb.length >= 4) {
    const size = Math.round((parseFloat(vb[2]) + parseFloat(vb[3])) / 2)
    result.gridSize = ([16, 20, 24, 32] as GridSize[]).reduce((a, b) => Math.abs(b - size) < Math.abs(a - size) ? b : a)
  }
  const els = Array.from(doc.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse,g'))
  const strokeWidths: number[] = [], linecaps: string[] = []
  let filled = 0, stroked = 0
  const resolveAttr = (el: Element, attr: string): string => {
    let v = el.getAttribute(attr)
    if (!v) { let p: Element | null = el.parentElement; while (p && p !== svg) { v = p.getAttribute(attr); if (v) break; p = p.parentElement } }
    return v || svg.getAttribute(attr) || ''
  }
  els.forEach(el => {
    const sw = parseFloat(el.getAttribute('stroke-width') || ''); if (!isNaN(sw) && sw > 0) strokeWidths.push(sw)
    const slc = el.getAttribute('stroke-linecap'); if (slc) linecaps.push(slc)
    const fill = resolveAttr(el, 'fill'), stroke = resolveAttr(el, 'stroke')
    if (fill && fill !== 'none') filled++
    if (stroke && stroke !== 'none') stroked++
  })
  if (stroked > 0 && filled === 0) result.style = 'outline'
  else if (filled > 0 && stroked === 0) result.style = 'filled'
  else if (filled > 0 && stroked > 0) result.style = 'duotone'
  if (strokeWidths.length > 0) {
    const avg = strokeWidths.reduce((a, b) => a + b, 0) / strokeWidths.length
    result.strokeWeight = ([1, 1.5, 2, 2.5] as StrokeWeight[]).reduce((a, b) => Math.abs(b - avg) < Math.abs(a - avg) ? b : a)
  }
  if (linecaps.length > 0) result.cap = linecaps.includes('round') ? 'round' : 'square'
  const rxVals: number[] = []; doc.querySelectorAll('rect').forEach(r => { const rx = parseFloat(r.getAttribute('rx') || ''); if (!isNaN(rx)) rxVals.push(rx) })
  if (rxVals.length > 0) { const ratio = (rxVals.reduce((a, b) => a + b, 0) / rxVals.length) / (result.gridSize ?? 24); result.corner = ratio < 0.04 ? 'sharp' : ratio < 0.13 ? 'subtle' : 'round' }
  return result
}

function mergeExtracted(specs: Partial<IconSpec>[]): Partial<IconSpec> {
  if (specs.length === 0) return {}
  const vote = <T,>(vals: T[]): T | undefined => {
    const map = new Map<string, number>(); vals.forEach(v => map.set(String(v), (map.get(String(v)) ?? 0) + 1))
    let best: T | undefined, bestN = 0; vals.forEach(v => { const n = map.get(String(v)) ?? 0; if (n > bestN) { bestN = n; best = v } }); return best
  }
  return {
    style: vote(specs.map(s => s.style).filter(Boolean) as Style[]),
    gridSize: vote(specs.map(s => s.gridSize).filter(Boolean) as GridSize[]),
    strokeWeight: vote(specs.map(s => s.strokeWeight).filter(Boolean) as StrokeWeight[]),
    cap: vote(specs.map(s => s.cap).filter(Boolean) as Cap[]),
    corner: vote(specs.map(s => s.corner).filter(Boolean) as Corner[]),
  }
}

type Style = 'outline' | 'filled' | 'duotone'
type GridSize = 16 | 20 | 24 | 32
type StrokeWeight = 1 | 1.5 | 2 | 2.5
type Cap = 'round' | 'square'
type Corner = 'sharp' | 'subtle' | 'round'
type ColorMode = 'single' | 'multi'
type OpticalPad = 1 | 2 | 3

interface IconSpec {
  style: Style
  gridSize: GridSize
  strokeWeight: StrokeWeight
  cap: Cap
  corner: Corner
  colorMode: ColorMode
  opticalPad: OpticalPad
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
  opticalPad: 1,
}


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

  const pad = spec.opticalPad ?? 1
  const usable = spec.gridSize - pad * 2
  const fillPct = Math.round((usable / spec.gridSize) * 100)
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
- grid:            ${spec.gridSize}×${spec.gridSize}px，${pad}px 光学边距（可用区域 ${usable}×${usable}px，占比 ${fillPct}%）
- stroke-width:    ${spec.strokeWeight}px
- stroke-linecap:  ${capLabel}
- stroke-linejoin: ${joinLabel}
- color:           ${colorVal}
- usage: 功能性图标——导航、操作按钮、状态提示、表单前缀
- prohibited: ${prohibited}

### ai-prompt-template
<!-- type: ai-prompt -->
SVG ${aiStyle} icon for {subject}, ${spec.gridSize}×${spec.gridSize} viewBox, ${pad}px optical padding (draw within ${pad}~${spec.gridSize - pad}), stroke-width ${spec.strokeWeight}, stroke-linecap ${spec.cap}, stroke-linejoin ${spec.corner === 'sharp' ? 'miter' : 'round'}, ${aiFill}, ${aiAdj} paths, balanced optical weight, no decorative details. Output only raw SVG <path> elements, no wrapper tags.`
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

/** Strip width/height from SVG and set to 100%/100% so it fills its container. */
function svgForDisplay(svgString: string): string {
  return svgString.replace(/<svg([^>]*)>/, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s+width="[^"]*"/, '')
      .replace(/\s+height="[^"]*"/, '')
      .replace(/\s+style="[^"]*"/, '')
    return `<svg${cleaned} width="100%" height="100%" style="display:block">`
  })
}

interface RefImage { name: string; base64: string; mime: string; preview: string }

function uid() { return Math.random().toString(36).slice(2, 8) }

// Each icon the user wants to generate
interface IconEntry {
  id: string
  name: string         // required
  description: string  // optional
  refImage: RefImage | null  // optional per-entry reference image
}

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

/** Fetch a Lucide icon SVG by name from unpkg CDN. Returns null if not found. */
async function fetchLucideIcon(name: string): Promise<string | null> {
  // Lucide uses kebab-case names
  const kebab = name.toLowerCase().replace(/[\s_]+/g, '-')
  try {
    const res = await fetch(`https://unpkg.com/lucide-static@latest/icons/${kebab}.svg`, { cache: 'force-cache' })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// ── Feature 4: SVG spec validation ──────────────────────────────────────────

function validateSVG(svgText: string, spec: IconSpec): { ok: boolean; issues: string[] } {
  const issues: string[] = []

  // 1. viewBox roughly matches gridSize
  const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/)
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/)
    if (parts.length >= 4) {
      const w = parseFloat(parts[2])
      const h = parseFloat(parts[3])
      const avg = (w + h) / 2
      if (Math.abs(avg - spec.gridSize) > 4) {
        issues.push(`viewBox (${w}×${h}) 与规格 ${spec.gridSize}×${spec.gridSize} 不符`)
      }
    }
  } else {
    issues.push('缺少 viewBox')
  }

  // 2. stroke-width presence and value for outline/duotone
  if (spec.style === 'outline' || spec.style === 'duotone') {
    const swMatch = svgText.match(/stroke-width=["']([^"']+)["']/)
    if (!swMatch) {
      issues.push('缺少 stroke-width')
    } else {
      const sw = parseFloat(swMatch[1])
      if (!isNaN(sw) && Math.abs(sw - spec.strokeWeight) > 0.6) {
        issues.push(`stroke-width=${sw} 与规格 ${spec.strokeWeight} 差异较大`)
      }
    }
  }

  // 3. fill="none" for outline style
  if (spec.style === 'outline') {
    if (!svgText.includes('fill="none"') && !svgText.includes("fill='none'")) {
      issues.push('outline 样式缺少 fill="none"')
    }
  }

  // 4. No <image> elements
  if (/<image[\s>]/i.test(svgText)) {
    issues.push('包含嵌入图片元素')
  }

  // 5. Has at least one path or shape element
  if (!/<(path|circle|rect|ellipse|line|polyline|polygon)[\s>]/i.test(svgText)) {
    issues.push('没有路径或形状元素')
  }

  return { ok: issues.length === 0, issues }
}

const newEntry = (): IconEntry => ({ id: uid(), name: '', description: '', refImage: null })

// ── Feature 3: JSX conversion ────────────────────────────────────────────────

function svgToJSX(svgText: string): string {
  return '() => ' + svgText
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/fill-opacity=/g, 'fillOpacity=')
    .replace(/clip-path=/g, 'clipPath=')
    .replace(/class=/g, 'className=')
}

function extractPaths(svgText: string): string {
  const dValues: string[] = []
  const dRegex = /\bd="([^"]*)"/g
  let m
  while ((m = dRegex.exec(svgText)) !== null) {
    dValues.push(m[1])
  }
  return dValues.join('\n')
}

export default function IconPage() {
  const [spec, setSpec] = useState<IconSpec>(DEFAULT_SPEC)
  const [iconEntries, setIconEntries] = useState<IconEntry[]>([newEntry()])
  const [iconVariants, setIconVariants] = useState<IconVariants[]>([])
  const [diagResult, setDiagResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [genPhase, setGenPhase] = useState<'idle' | 'thinking' | 'writing'>('idle')
  const [generating, setGenerating] = useState(false)
  const [copiedName, setCopiedName] = useState<string | null>(null)
  const [copiedMD, setCopiedMD] = useState(false)
  const [customMD, setCustomMD] = useState<string | null>(null)
  const [identifying, setIdentifying] = useState(false)
  const [isDragOverConcept, setIsDragOverConcept] = useState(false)
  // Download size picker: stores the open popover key ('__header__' or icon.name), null = closed
  const [downloadPopover, setDownloadPopover] = useState<string | null>(null)
  const [lucideBases, setLucideBases] = useState<Record<string, string>>({}) // name → Lucide SVG
  const [isDragOverSVG, setIsDragOverSVG] = useState(false)
  const [svgExtracting, setSvgExtracting] = useState(false)
  // Feature 2: multi-size preview
  const [previewIconName, setPreviewIconName] = useState<string | null>(null)
  // Feature 3: code panel
  const [codePanelIcon, setCodePanelIcon] = useState<string | null>(null)
  const [codePanelTab, setCodePanelTab] = useState<'svg' | 'jsx' | 'path'>('svg')
  const [codePanelCopied, setCodePanelCopied] = useState(false)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const svgInputRef = useRef<HTMLInputElement>(null)
  const entryImgInputRef = useRef<HTMLInputElement>(null)
  const entryImgTargetRef = useRef<string | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // SVG upload → extract style → auto-fill DESIGN.md
  const handleSVGFiles = useCallback(async (files: FileList | File[]) => {
    const svgFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.svg') || f.type === 'image/svg+xml').slice(0, 100)
    if (svgFiles.length === 0) return
    setSvgExtracting(true)
    const texts = await Promise.all(svgFiles.map(f => f.text()))
    const merged = mergeExtracted(texts.map(extractStyleFromSVG))
    const newSpec = { ...DEFAULT_SPEC, ...Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined)) } as IconSpec
    setSpec(newSpec)
    setCustomMD(specToDesignMD(newSpec, []))
    setSvgExtracting(false)
  }, [])

  // Upload a reference image for a specific entry
  const handleEntryRefImage = useCallback(async (entryId: string, files: FileList | File[]) => {
    const file = Array.from(files).find(f => f.type.startsWith('image/') && !f.type.includes('svg'))
    if (!file) return
    const loaded = await readFileAsBase64(file)
    setIconEntries(prev => prev.map(e => e.id === entryId ? { ...e, refImage: loaded } : e))
  }, [])

  // Drop/paste images globally → identify names → append new entries
  const handleAutoIdentify = useCallback(async (files: FileList | File[]) => {
    const imgFiles = Array.from(files)
      .filter(f => f.type.startsWith('image/') && !f.type.includes('svg'))
      .slice(0, 12)
    if (imgFiles.length === 0) return

    const loaded = await Promise.all(imgFiles.map(readFileAsBase64))
    setIdentifying(true)
    try {
      const res = await fetch('/api/identify-icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: loaded.map(img => ({ base64: img.base64, mime: img.mime })) }),
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.names) && data.names.length > 0) {
          setIconEntries(prev => {
            // Remove trailing empty entry, add identified names, re-add empty entry at end
            const nonEmpty = prev.filter(e => e.name.trim())
            const added: IconEntry[] = data.names.map((n: string) => ({ ...newEntry(), name: n }))
            const combined = [...nonEmpty, ...added].slice(0, 16)
            return combined.length < 16 ? [...combined, newEntry()] : combined
          })
        }
      }
    } catch { /* silently ignore */ }
    finally { setIdentifying(false) }
  }, [])

  // Global paste → auto-identify (only image files, not text)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageFiles = items
        .filter(item => item.kind === 'file' && item.type.startsWith('image/') && !item.type.includes('svg'))
        .map(item => item.getAsFile())
        .filter(Boolean) as File[]
      if (imageFiles.length > 0) {
        e.preventDefault()
        handleAutoIdentify(imageFiles)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleAutoIdentify])

  const handleConceptDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOverConcept(false)
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('image/') && !f.type.includes('svg')
    )
    if (files.length > 0) handleAutoIdentify(files)
  }

  const parsedNames = useMemo(
    () => iconEntries.map(e => e.name.trim().toLowerCase()).filter(Boolean),
    [iconEntries]
  )
  const descriptions = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    iconEntries.forEach(e => { if (e.name.trim() && e.description.trim()) map[e.name.trim().toLowerCase()] = e.description.trim() })
    return map
  }, [iconEntries])

  const buildPayload = useCallback((names: string[]) => {
    // Collect per-entry ref images for icons that have one
    const perEntryImages = iconEntries
      .filter(e => e.name.trim() && e.refImage)
      .map(e => ({ name: e.name.trim().toLowerCase(), base64: e.refImage!.base64, mime: e.refImage!.mime }))
    return {
      spec,
      names,
      designMd: customMD ?? undefined,
      conceptImages: perEntryImages.length > 0 ? perEntryImages : undefined,
      lucideBases: Object.keys(lucideBases).length > 0 ? lucideBases : undefined,
      descriptions: Object.keys(descriptions).length > 0 ? descriptions : undefined,
    }
  }, [spec, customMD, lucideBases, descriptions, iconEntries])

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
      // Stream ended — mark any icon that still has null for this variant as failed
      const finalParsed = parseIcons(buffer)
      if (!finalParsed.size) {
        const hint = buffer.replace(/\x00/g, '').trim().slice(0, 120) || '空响应'
        setVariantError(variantIndex, `未解析到图标内容：${hint}`)
      } else {
        // Some icons may have been missed in the response — mark them individually
        setIconVariants(prev => prev.map(item => {
          if (item.variants[variantIndex] !== null || item.errors[variantIndex] !== null) return item
          const next = [...item.errors]
          next[variantIndex] = '未生成（点 ↻ 重试）'
          return { ...item, errors: next }
        }))
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

    // Fetch Lucide bases in parallel — icons not in Lucide will get null and fall back to scratch generation
    const baseResults = await Promise.all(names.map(async name => [name, await fetchLucideIcon(name)] as const))
    const newBases: Record<string, string> = {}
    baseResults.forEach(([name, svg]) => { if (svg) newBases[name] = svg })
    setLucideBases(newBases)

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
  const computedMD = useMemo(() => specToDesignMD(spec, []), [spec])
  const displayMD = customMD ?? computedMD

  const adoptedCount = iconVariants.filter(i => i.adopted !== null).length
  const hasReadyIcons = adoptedCount > 0

  // Feature 2: get preview icon data
  const previewIcon = previewIconName ? iconVariants.find(i => i.name === previewIconName) : null
  const previewSvg = previewIcon && previewIcon.adopted !== null ? previewIcon.variants[previewIcon.adopted] : null

  // Feature 3: get code panel icon data
  const codePanelIconData = codePanelIcon ? iconVariants.find(i => i.name === codePanelIcon) : null
  const codePanelAdoptedSvg = codePanelIconData && codePanelIconData.adopted !== null
    ? codePanelIconData.variants[codePanelIconData.adopted]
    : null

  const getCodePanelContent = (svg: string | null): string => {
    if (!svg) return ''
    if (codePanelTab === 'svg') return svg
    if (codePanelTab === 'jsx') return svgToJSX(svg)
    if (codePanelTab === 'path') return extractPaths(svg)
    return svg
  }

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

  // suppress unused warning
  void handleDownload
  void handleDownloadIcon

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
        {/* Left panel — Style DNA */}
        <aside
          className="flex flex-col overflow-y-auto flex-shrink-0"
          style={{
            width: '400px',
            borderRight: '1px solid var(--hairline)',
            backgroundColor: 'var(--surface-soft)',
            padding: '20px 16px',
          }}
        >
          {/* SVG upload zone */}
          <div style={{ marginBottom: '16px' }}>
            <input ref={svgInputRef} type="file" accept=".svg,image/svg+xml" multiple style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.length) handleSVGFiles(e.target.files); e.target.value = '' }} />
            <div
              onClick={() => svgInputRef.current?.click()}
              onDrop={e => { e.preventDefault(); setIsDragOverSVG(false); handleSVGFiles(e.dataTransfer.files) }}
              onDragOver={e => { e.preventDefault(); setIsDragOverSVG(true) }}
              onDragLeave={() => setIsDragOverSVG(false)}
              style={{
                border: `1.5px dashed ${isDragOverSVG ? 'var(--ink)' : 'var(--hairline)'}`,
                borderRadius: '10px', padding: '14px 12px', textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragOverSVG ? 'var(--surface-card)' : 'var(--canvas)',
                transition: 'all 0.15s',
              }}
            >
              {svgExtracting ? (
                <p style={{ fontSize: '11px', color: 'var(--muted)' }}>分析样式中…</p>
              ) : (
                <>
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>上传参考 SVG</p>
                  <p style={{ fontSize: '10px', color: 'var(--muted-soft)' }}>自动提取风格 · 填入规范</p>
                </>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--hairline)', margin: '0 0 16px' }} />

          {/* DESIGN.md spec editor */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={SECTION_LABEL}>风格规范（DESIGN.md）</span>
              {customMD !== null && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setCustomMD(null)}
                    style={{ fontSize: '10px', color: 'var(--muted)', background: 'none', border: '1px solid var(--hairline)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}
                  >↻ 重置</button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(displayMD).then(() => { setCopiedMD(true); setTimeout(() => setCopiedMD(false), 2000) }).catch(() => {}) }}
                    style={{ fontSize: '10px', color: copiedMD ? 'var(--brand-mint)' : 'var(--muted)', background: 'none', border: '1px solid var(--hairline)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontWeight: copiedMD ? 600 : 400, transition: 'color 0.15s' }}
                  >{copiedMD ? '✓ 已复制' : '复制'}</button>
                </div>
              )}
            </div>

            {customMD !== null ? (
              <>
                {/* Dark spec card — preview of extracted params */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                    {([
                      ['描边色', spec.colorMode === 'multi' ? '多色' : 'currentColor'],
                      ['描边宽', `${spec.strokeWeight}px`],
                      ['视图框', `0 0 ${spec.gridSize} ${spec.gridSize}`],
                      ['端点', spec.cap === 'round' ? '圆头' : '方形'],
                      ['拐点', spec.corner === 'round' ? '圆角' : spec.corner === 'subtle' ? '微圆' : '锐利'],
                      ['填充', spec.style === 'outline' ? '无' : spec.style === 'filled' ? '实心' : '混合'],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label}>
                        <span style={{ fontSize: '9px', color: '#666', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                        <span style={{ fontSize: '11px', color: '#e8e8e8', fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <textarea
                  value={displayMD}
                  onChange={e => setCustomMD(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: '10px', lineHeight: 1.65, color: 'var(--body)',
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--muted-soft)',
                    borderRadius: '8px', padding: '10px', resize: 'vertical',
                    outline: 'none', display: 'block',
                    minHeight: '160px', maxHeight: '400px',
                  }}
                />
                <p style={{ fontSize: '10px', color: 'var(--muted-soft)', marginTop: '4px', fontStyle: 'italic' }}>
                  生成时以此为准 · ↻ 重置可恢复默认
                </p>
              </>
            ) : (
              /* Empty state */
              <div style={{
                border: '1.5px dashed var(--hairline)', borderRadius: '8px',
                padding: '20px 16px', textAlign: 'center',
                backgroundColor: 'var(--canvas)',
              }}>
                <p style={{ fontSize: '11px', color: 'var(--muted-soft)', marginBottom: '10px' }}>
                  尚未配置风格规范
                </p>
                <button
                  onClick={() => setCustomMD(computedMD)}
                  style={{
                    fontSize: '11px', fontWeight: 500,
                    color: 'var(--ink)', backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--hairline)', borderRadius: '6px',
                    padding: '5px 14px', cursor: 'pointer',
                  }}
                >填入默认模板</button>
              </div>
            )}
          </div>

        </aside>

        {/* Right panel */}
        <main className="flex-1 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ── Icon generation input (top of right panel) ── */}
          <div style={{
            flexShrink: 0,
            padding: '16px 24px',
            borderBottom: '1px solid var(--hairline)',
            backgroundColor: 'var(--surface-soft)',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
          }}>
            {/* Structured icon entry list */}
            <div
              ref={dropZoneRef}
              style={{ flex: 1 }}
              onDrop={handleConceptDrop}
              onDragOver={e => { e.preventDefault(); setIsDragOverConcept(true) }}
              onDragLeave={e => { if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setIsDragOverConcept(false) }}
            >
              {/* Hidden file input for per-entry reference images */}
              <input ref={entryImgInputRef} type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={async e => {
                  if (entryImgTargetRef.current && e.target.files?.length) {
                    await handleEntryRefImage(entryImgTargetRef.current, e.target.files)
                  }
                  e.target.value = ''
                  entryImgTargetRef.current = null
                }} />

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 52px 24px', gap: '6px', marginBottom: '5px', padding: '0 2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--muted-soft)' }}>图标名称</span>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--muted-soft)' }}>描述（可选）</span>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--muted-soft)' }}>参考图</span>
                <span />
              </div>

              {/* Entry rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {iconEntries.map((entry, idx) => (
                  <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 52px 24px', gap: '6px', alignItems: 'center' }}>
                    {/* Name */}
                    <input
                      type="text"
                      value={entry.name}
                      onChange={e => setIconEntries(prev => prev.map(en => en.id === entry.id ? { ...en, name: e.target.value } : en))}
                      placeholder={idx === 0 ? 'home' : idx === 1 ? 'settings' : '图标名称'}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        backgroundColor: 'var(--canvas)', color: 'var(--body)',
                        border: '1px solid var(--hairline)', borderRadius: '7px',
                        padding: '5px 8px', fontSize: '12px', fontFamily: 'monospace',
                        outline: 'none',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--ink)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--hairline)')}
                    />
                    {/* Description */}
                    <input
                      type="text"
                      value={entry.description}
                      onChange={e => setIconEntries(prev => prev.map(en => en.id === entry.id ? { ...en, description: e.target.value } : en))}
                      placeholder={idx === 0 ? '简洁的房屋图标' : idx === 1 ? '齿轮风格' : ''}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        backgroundColor: 'var(--canvas)', color: 'var(--body)',
                        border: '1px solid var(--hairline)', borderRadius: '7px',
                        padding: '5px 8px', fontSize: '12px', fontFamily: 'inherit',
                        outline: 'none',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--ink)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--hairline)')}
                    />
                    {/* Reference image */}
                    {entry.refImage ? (
                      <div style={{ position: 'relative', width: '52px', height: '28px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={entry.refImage.preview} alt="ref"
                          style={{ width: '52px', height: '28px', objectFit: 'cover', borderRadius: '5px', border: '1px solid var(--hairline)', cursor: 'pointer', display: 'block' }}
                          onClick={() => { entryImgTargetRef.current = entry.id; entryImgInputRef.current?.click() }} />
                        <button
                          onClick={() => setIconEntries(prev => prev.map(en => en.id === entry.id ? { ...en, refImage: null } : en))}
                          style={{ position: 'absolute', top: '-4px', right: '-4px', width: '13px', height: '13px', borderRadius: '50%', backgroundColor: 'var(--ink)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { entryImgTargetRef.current = entry.id; entryImgInputRef.current?.click() }}
                        title="上传参考图片"
                        style={{
                          width: '52px', height: '28px', borderRadius: '5px',
                          border: '1px dashed var(--hairline)', backgroundColor: 'transparent',
                          cursor: 'pointer', fontSize: '14px', color: 'var(--muted-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>📎</button>
                    )}
                    {/* Remove */}
                    <button
                      onClick={() => setIconEntries(prev => {
                        const next = prev.filter(en => en.id !== entry.id)
                        return next.length === 0 ? [newEntry()] : next
                      })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-soft)', fontSize: '14px', padding: '0', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>

              {/* Add row + hints */}
              <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setIconEntries(prev => prev.length < 16 ? [...prev, newEntry()] : prev)}
                  disabled={iconEntries.length >= 16}
                  style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '6px',
                    border: '1px dashed var(--hairline)', background: 'transparent',
                    color: 'var(--muted)', cursor: iconEntries.length >= 16 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                  <span style={{ fontSize: '13px' }}>+</span> 添加图标
                </button>
                <span style={{ fontSize: '10px', color: 'var(--muted-soft)', fontStyle: 'italic', flex: 1 }}>
                  {identifying ? '识别中…' : '拖入/粘贴图片自动识别名称'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--muted-soft)' }}>{parsedNames.length}/16</span>
              </div>

              {/* Drag-over overlay */}
              {isDragOverConcept && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '8px', pointerEvents: 'none',
                  backgroundColor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px dashed var(--ink)', zIndex: 10,
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>松开自动识别图标名称</span>
                </div>
              )}
            </div>

            {/* Generate button — vertical, right side */}
            <button
              onClick={handleGenerate}
              disabled={parsedNames.length === 0}
              style={{
                flexShrink: 0, alignSelf: 'stretch',
                width: '120px',
                backgroundColor: generating ? 'var(--surface-strong)' : 'var(--ink)',
                color: generating ? 'var(--muted)' : '#ffffff',
                border: `1px solid ${generating ? 'var(--hairline)' : 'var(--ink)'}`,
                borderRadius: '10px',
                padding: '10px 8px',
                fontSize: '12px', fontWeight: 600,
                cursor: parsedNames.length === 0 ? 'not-allowed' : 'pointer',
                opacity: parsedNames.length === 0 ? 0.5 : 1,
                transition: 'all 0.15s',
                letterSpacing: '-0.01em',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>✦</span>
              <span>{generating
                ? genPhase === 'thinking' ? '思考中…' : '生成中…'
                : `生成 ${parsedNames.length > 0 ? parsedNames.length + ' 个' : ''}`}
              </span>
              {!generating && <span style={{ fontSize: '10px', opacity: 0.7 }}>每个出 {VARIANT_COUNT} 稿</span>}
              {generating && <span style={{ fontSize: '10px', opacity: 0.7 }}>点击停止</span>}
            </button>
          </div>

          {/* Center content + optional right code panel (flex-row) */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>

            {/* Scrollable icon grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
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
                  display: 'grid', gridTemplateColumns: '80px 80px 120px 120px 120px 128px',
                  gap: '8px', padding: '0 0 10px',
                  borderBottom: '1px solid var(--hairline)', marginBottom: '4px',
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>图标名称</span>
                  <span style={{ fontSize: '10px', color: 'var(--muted-soft)', fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>原始</span>
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
                      display: 'grid', gridTemplateColumns: '80px 80px 120px 120px 120px 128px',
                      gap: '8px', alignItems: 'start',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--hairline)',
                    }}>
                      {/* Name */}
                      <div style={{ paddingTop: '10px' }}>
                        <span style={{
                          fontSize: '11px', fontFamily: 'monospace', color: 'var(--muted)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          display: 'block',
                        }}>{icon.name}</span>
                        {descriptions[icon.name] && (
                          <span style={{
                            fontSize: '9px', color: 'var(--muted-soft)', display: 'block',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginTop: '2px', fontStyle: 'italic',
                          }}>{descriptions[icon.name]}</span>
                        )}
                      </div>

                      {/* Lucide base column */}
                      <div style={{
                        width: '80px', height: '80px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '8px',
                        border: `1px solid ${lucideBases[icon.name] ? 'var(--hairline)' : 'transparent'}`,
                        backgroundColor: lucideBases[icon.name] ? 'var(--canvas)' : 'transparent',
                        alignSelf: 'center',
                      }}>
                        {lucideBases[icon.name] ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: svgForDisplay(lucideBases[icon.name]) }}
                            style={{ width: '48px', height: '48px', lineHeight: 0, opacity: 0.6 }}
                          />
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--muted-soft)' }}>—</span>
                        )}
                      </div>

                      {/* 3 variant cells */}
                      {icon.variants.map((svg, vi) => {
                        const isAdopted = icon.adopted === vi
                        const err = icon.errors[vi]
                        // Feature 4: validation badge
                        const validation = svg && !err ? validateSVG(svg, spec) : null
                        return (
                          <div
                            key={vi}
                            onClick={() => {
                              if (!svg) return
                              // Adopt/unadopt
                              setIconVariants(prev => prev.map(item =>
                                item.name === icon.name
                                  ? { ...item, adopted: item.adopted === vi ? null : vi }
                                  : item
                              ))
                              // Feature 3: open code panel and set preview
                              setCodePanelIcon(icon.name)
                              setPreviewIconName(icon.name)
                              // If clicking a different variant, adopt it
                              if (icon.adopted !== vi) {
                                setIconVariants(prev => prev.map(item =>
                                  item.name === icon.name
                                    ? { ...item, adopted: vi }
                                    : item
                                ))
                              }
                            }}
                            title={err ?? undefined}
                            style={{
                              width: '120px', height: '120px',
                              borderRadius: '10px',
                              border: `2px solid ${isAdopted ? 'var(--brand-mint)' : err ? '#f87171' : 'var(--hairline)'}`,
                              backgroundColor: isAdopted
                                ? 'color-mix(in srgb, var(--brand-mint) 6%, var(--canvas))'
                                : err ? 'color-mix(in srgb, #f87171 6%, var(--canvas))' : 'var(--canvas)',
                              cursor: svg ? 'pointer' : 'default',
                              position: 'relative',
                              transition: 'border-color 0.15s, background-color 0.15s',
                              overflow: 'hidden',
                            }}
                          >
                            {/* SVG coordinate-native grid — scales with viewBox automatically */}
                            {!err && (
                              <svg
                                viewBox={`0 0 ${spec.gridSize} ${spec.gridSize}`}
                                width="100%" height="100%"
                                style={{ position: 'absolute', inset: 0, display: 'block' }}
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <defs>
                                  <pattern
                                    id={`g-${icon.name}-${vi}`}
                                    x="0" y="0" width="1" height="1"
                                    patternUnits="userSpaceOnUse"
                                  >
                                    <path d="M 1 0 L 0 0 0 1" fill="none" stroke="currentColor" strokeWidth="0.05"/>
                                  </pattern>
                                </defs>
                                <rect width={spec.gridSize} height={spec.gridSize} fill={`url(#g-${icon.name}-${vi})`} opacity="0.18"/>
                              </svg>
                            )}

                            {svg ? (
                              <>
                                {/* Icon fills ~90% of card — SVG viewBox handles the rest */}
                                <div
                                  style={{ position: 'absolute', inset: '5%', lineHeight: 0 }}
                                  dangerouslySetInnerHTML={{ __html: svgForDisplay(svg) }}
                                />
                                {isAdopted && (
                                  <div style={{
                                    position: 'absolute', top: '5px', right: '6px',
                                    fontSize: '9px', fontWeight: 700, color: 'var(--brand-mint)',
                                    lineHeight: 1,
                                  }}>✓</div>
                                )}
                                {/* Feature 4: validation badge */}
                                {validation && (
                                  <div
                                    title={validation.ok ? '规格合规' : validation.issues.join('\n')}
                                    style={{
                                      position: 'absolute', bottom: '5px', right: '5px',
                                      width: '14px', height: '14px', borderRadius: '50%',
                                      backgroundColor: validation.ok ? '#22c55e' : '#f59e0b',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '8px', fontWeight: 700, color: '#fff',
                                      lineHeight: 1, cursor: 'help',
                                    }}
                                  >
                                    {validation.ok ? '✓' : '⚠'}
                                  </div>
                                )}
                              </>
                            ) : err ? (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '4px' }}>
                                <span style={{ fontSize: '14px', lineHeight: 1 }}>⚠</span>
                                <span style={{ fontSize: '9px', color: '#ef4444', textAlign: 'center', lineHeight: 1.3, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {err.slice(0, 30)}
                                </span>
                              </div>
                            ) : (
                              <div style={{
                                position: 'absolute', inset: '30%',
                                backgroundColor: 'var(--hairline)', borderRadius: '4px',
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
                        {/* Delete this icon row */}
                        <button
                          onClick={() => setIconVariants(prev => prev.filter(i => i.name !== icon.name))}
                          title="删除此图标"
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--hairline)',
                            backgroundColor: 'var(--canvas)', color: 'var(--muted-soft)',
                            cursor: 'pointer', fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', flexShrink: 0,
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'color-mix(in srgb, #f87171 10%, var(--canvas))'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#fca5a5' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--canvas)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-soft)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--hairline)' }}
                        >×</button>
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
            </div>{/* end scrollable icon grid */}

            {/* Feature 3: Right code panel */}
            {codePanelIcon && (
              <div style={{
                width: '320px',
                flexShrink: 0,
                borderLeft: '1px solid var(--hairline)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--canvas)',
                overflow: 'hidden',
              }}>
                {/* Panel header */}
                <div style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--hairline)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>SVG 代码</span>
                  <button
                    onClick={() => setCodePanelIcon(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--muted)', lineHeight: 1, padding: '0 2px' }}
                  >×</button>
                </div>

                {/* Tabs */}
                <div style={{
                  display: 'flex', gap: '0',
                  borderBottom: '1px solid var(--hairline)',
                  flexShrink: 0,
                }}>
                  {(['svg', 'jsx', 'path'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setCodePanelTab(tab)}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        fontSize: '11px', fontWeight: codePanelTab === tab ? 600 : 400,
                        border: 'none',
                        borderBottom: `2px solid ${codePanelTab === tab ? 'var(--ink)' : 'transparent'}`,
                        backgroundColor: 'transparent',
                        color: codePanelTab === tab ? 'var(--ink)' : 'var(--muted)',
                        cursor: 'pointer',
                        transition: 'all 0.1s',
                      }}
                    >
                      {tab === 'svg' ? 'SVG' : tab === 'jsx' ? 'JSX' : '路径'}
                    </button>
                  ))}
                </div>

                {/* Code content */}
                <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1a1a1a' }}>
                  {codePanelAdoptedSvg ? (
                    <pre style={{
                      margin: 0,
                      padding: '12px',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: '10px',
                      lineHeight: 1.6,
                      color: '#d4d4d4',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      minHeight: '100%',
                    }}>
                      {getCodePanelContent(codePanelAdoptedSvg)}
                    </pre>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: '100%', padding: '20px',
                    }}>
                      <span style={{ fontSize: '11px', color: '#555', textAlign: 'center' }}>
                        {codePanelIconData ? '请先采用一个变体' : '图标不存在'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom metadata + copy */}
                <div style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderTop: '1px solid var(--hairline)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: 'var(--surface-soft)',
                }}>
                  {codePanelAdoptedSvg ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--muted-soft)' }}>
                        {codePanelAdoptedSvg.length} B
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--muted-soft)' }}>
                        {(codePanelAdoptedSvg.match(/<path[\s>]/g) ?? []).length} 路径
                      </span>
                    </div>
                  ) : <span />}
                  <button
                    onClick={() => {
                      const content = getCodePanelContent(codePanelAdoptedSvg)
                      if (!content) return
                      navigator.clipboard.writeText(content).then(() => {
                        setCodePanelCopied(true)
                        setTimeout(() => setCodePanelCopied(false), 2000)
                      }).catch(() => {})
                    }}
                    disabled={!codePanelAdoptedSvg}
                    style={{
                      fontSize: '11px', fontWeight: 500,
                      color: codePanelCopied ? 'var(--brand-mint)' : 'var(--muted)',
                      backgroundColor: 'var(--canvas)',
                      border: '1px solid var(--hairline)',
                      borderRadius: '6px', padding: '3px 10px',
                      cursor: codePanelAdoptedSvg ? 'pointer' : 'not-allowed',
                      opacity: codePanelAdoptedSvg ? 1 : 0.4,
                      transition: 'color 0.15s',
                    }}
                  >{codePanelCopied ? '✓ 已复制' : '复制'}</button>
                </div>
              </div>
            )}
          </div>

          {/* Feature 2: Multi-size preview bar */}
          {previewIconName && previewSvg && (
            <div style={{
              flexShrink: 0,
              borderTop: '1px solid var(--hairline)',
              backgroundColor: 'var(--surface-soft)',
              padding: '10px 24px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
                    多尺寸验证 · {previewIconName}
                  </span>
                  <button
                    onClick={() => setPreviewIconName(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--muted)', lineHeight: 1, padding: '0 2px' }}
                  >×</button>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                  {([16, 20, 24, 32, 48] as const).map(size => (
                    <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{ width: `${size}px`, height: `${size}px`, lineHeight: 0 }}
                        dangerouslySetInnerHTML={{ __html: resizeSVG(previewSvg, size) }}
                      />
                      <span style={{ fontSize: '9px', color: 'var(--muted-soft)', fontFamily: 'monospace' }}>{size}</span>
                    </div>
                  ))}
                </div>
              </div>
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

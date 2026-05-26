import type { DesignAST, SubsectionNode, TokenNode } from './parser/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function findSection(ast: DesignAST, id: string) {
  return ast.sections.find(s => s.id === id)
}

function findSubsection(ast: DesignAST, sectionId: string, subId: string) {
  return findSection(ast, sectionId)?.subsections.find(s => s.id === subId)
}

function allTokens(sub: SubsectionNode | undefined): TokenNode[] {
  if (!sub) return []
  const flat = [...sub.tokens]
  for (const g of sub.groups) flat.push(...g.tokens)
  return flat
}

function tokenLines(sub: SubsectionNode | undefined): string {
  return allTokens(sub)
    .map(t => `- **${t.name}**: \`${t.value}\`${t.zh ? `  — ${t.zh}` : ''}`)
    .join('\n')
}

// Split a long prohibition string on Chinese/ASCII semicolons
function splitProhibitions(value: string): string[] {
  return value.split(/；|;\s*/).map(s => s.trim()).filter(Boolean)
}

// ─── main export ────────────────────────────────────────────────────────────

export function exportToSkill(ast: DesignAST): string {
  const project = ast.meta.project ?? 'My Design System'
  const version = ast.meta.version ?? '1.0.0'
  const today   = new Date().toISOString().slice(0, 10)

  const lines: string[] = []

  // ── front-matter ──
  lines.push(`---`)
  lines.push(`name: ${project.toLowerCase().replace(/\s+/g, '-')}-design-system`)
  lines.push(`description: 构建符合 ${project} 视觉规范的界面组件、页面或样式时使用`)
  lines.push(`version: ${version}`)
  lines.push(`generated: ${today}`)
  lines.push(`source: DESIGN.md`)
  lines.push(`---`)
  lines.push(``)

  // ── title ──
  lines.push(`# ${project} 设计规范 Skill`)
  lines.push(``)

  // ── 触发条件 ──
  lines.push(`## 触发条件`)
  lines.push(``)
  const aiSummary = findSubsection(ast, 'design-language', 'ai-prompt-summary')
  if (aiSummary?.rawText) {
    lines.push(aiSummary.rawText.trim())
  } else {
    lines.push(`当需要构建符合 ${project} 设计规范的界面组件或页面时，自动应用本规范中的所有约束。`)
  }
  lines.push(``)

  // ── 设计语言 ──
  const keywords = findSubsection(ast, 'design-language', 'keywords')
  const personality = findSubsection(ast, 'design-language', 'personality')
  if (keywords || personality) {
    lines.push(`## 设计语言`)
    lines.push(``)
    if (keywords) {
      const kws = allTokens(keywords).map(t => t.name).join(' · ')
      if (kws) lines.push(`**气质关键词：** ${kws}`)
    }
    if (personality?.rawText) {
      lines.push(``)
      lines.push(personality.rawText.trim())
    }
    lines.push(``)
  }

  // ── 色彩约束 ──
  const colorsSection = findSection(ast, 'colors')
  if (colorsSection) {
    lines.push(`## 色彩约束`)
    lines.push(``)
    lines.push(`> 禁止在代码中硬编码色值，必须引用 token 变量名。`)
    lines.push(``)
    for (const sub of colorsSection.subsections) {
      const tokens = allTokens(sub)
      if (!tokens.length) continue
      lines.push(`**${sub.title}**`)
      for (const t of tokens) {
        lines.push(`- \`${t.name}\`: ${t.value}${t.zh ? `  — ${t.zh}` : ''}`)
      }
      lines.push(``)
    }
  }

  // ── 排版约束 ──
  const typoScale = findSubsection(ast, 'typography', 'type-scale')
    ?? findSubsection(ast, 'typography', 'scale')
  const fontFamily = findSubsection(ast, 'typography', 'font-family')
    ?? findSubsection(ast, 'typography', 'fonts')
  if (typoScale || fontFamily) {
    lines.push(`## 排版约束`)
    lines.push(``)
    lines.push(`> 禁止使用纯黑 (#000000)，正文用深灰，标题用最深灰。`)
    lines.push(``)
    if (fontFamily) {
      lines.push(`**字体**`)
      lines.push(tokenLines(fontFamily))
      lines.push(``)
    }
    if (typoScale) {
      lines.push(`**字号比例**`)
      lines.push(tokenLines(typoScale))
      lines.push(``)
    }
  }

  // ── 间距约束 ──
  const spacingScale = findSubsection(ast, 'spacing', 'scale')
    ?? findSubsection(ast, 'spacing', 'spacing-scale')
  if (spacingScale) {
    lines.push(`## 间距约束`)
    lines.push(``)
    lines.push(`> 以 4px 为基础单位，禁止使用非标准间距值。`)
    lines.push(``)
    lines.push(tokenLines(spacingScale))
    lines.push(``)
  }

  // ── 圆角与阴影 ──
  const radiusSub = findSubsection(ast, 'borders', 'radius')
    ?? findSubsection(ast, 'radius', 'scale')
  const shadowSub = findSubsection(ast, 'shadows', 'elevation')
    ?? findSubsection(ast, 'shadows', 'scale')
    ?? findSubsection(ast, 'shadows', 'shadow-scale')
  if (radiusSub || shadowSub) {
    lines.push(`## 边框与阴影`)
    lines.push(``)
    if (radiusSub) {
      lines.push(`**圆角**`)
      lines.push(tokenLines(radiusSub))
      lines.push(``)
    }
    if (shadowSub) {
      lines.push(`**阴影层级**`)
      lines.push(tokenLines(shadowSub))
      lines.push(``)
    }
  }

  // ── 组件使用规则 ──
  const componentsSection = findSection(ast, 'components')
  const allProhibited: Array<{ component: string; rules: string[] }> = []

  if (componentsSection) {
    lines.push(`## 组件使用规则`)
    lines.push(``)

    for (const sub of componentsSection.subsections) {
      const usageToken     = sub.tokens.find(t => t.name === 'usage')
      const prohibitedToken = sub.tokens.find(t => t.name === 'prohibited')

      lines.push(`### ${sub.title}`)
      lines.push(``)

      if (usageToken) {
        lines.push(`**✅ 适用场景**`)
        splitProhibitions(usageToken.value).forEach(item => {
          lines.push(`- ${item}`)
        })
        lines.push(``)
      }

      if (prohibitedToken) {
        const rules = splitProhibitions(prohibitedToken.value)
        lines.push(`**⛔ 禁止使用**`)
        rules.forEach(rule => lines.push(`- ${rule}`))
        lines.push(``)
        allProhibited.push({ component: sub.title, rules })
      }

      // Variant/size/state groups (H4)
      if (sub.groups.length > 0) {
        lines.push(`**规格**`)
        for (const group of sub.groups) {
          lines.push(``)
          lines.push(`_${group.title}${group.zh ? `（${group.zh}）` : ''}_`)
          group.tokens.forEach(t => {
            lines.push(`- \`${t.name}\`: ${t.value}${t.zh ? `  — ${t.zh}` : ''}`)
          })
        }
        lines.push(``)
      }
    }
  }

  // ── 禁用总清单 ──
  if (allProhibited.length > 0) {
    lines.push(`## 禁用总清单`)
    lines.push(``)
    lines.push(`> 以下规则从各组件规范汇总，AI 编码时必须全程遵守。`)
    lines.push(``)
    for (const { component, rules } of allProhibited) {
      lines.push(`**${component}**`)
      rules.forEach(r => lines.push(`- ${r}`))
      lines.push(``)
    }
  }

  // ── Token 引用示例代码 ──
  const colorSection   = findSection(ast, 'colors')
  const spacingScale2  = findSubsection(ast, 'spacing', 'scale')
    ?? findSubsection(ast, 'spacing', 'spacing-scale')
  const radiusSub2     = findSubsection(ast, 'borders', 'radius')
    ?? findSubsection(ast, 'radius', 'scale')

  // Pick representative tokens for the example
  const primaryToken  = colorSection?.subsections
    .flatMap(s => allTokens(s))
    .find(t => t.name === 'primary')
  const bgToken       = colorSection?.subsections
    .flatMap(s => allTokens(s))
    .find(t => t.name === 'neutral-0' || t.name === 'neutral-50' || t.name === 'surface')
  const spaceToken    = allTokens(spacingScale2).find(t => t.name === '4' || t.name === 'md')
  const radiusToken   = allTokens(radiusSub2).find(t => t.name === 'md')

  const primaryVar  = primaryToken  ? `--color-${primaryToken.name}`  : '--color-primary'
  const bgVar       = bgToken       ? `--color-${bgToken.name}`       : '--color-neutral-0'
  const spaceVar    = spaceToken    ? `--space-${spaceToken.name}`    : '--space-4'
  const radiusVar   = radiusToken   ? `--radius-${radiusToken.name}`  : '--radius-md'

  lines.push(`## Token 引用示例`)
  lines.push(``)
  lines.push(`> 所有样式值必须引用 CSS 变量，禁止硬编码。将 \`tokens.css\` 引入项目后即可使用。`)
  lines.push(``)
  lines.push(`### ✅ 正确写法`)
  lines.push(``)
  lines.push('```css')
  lines.push(`.button-primary {`)
  lines.push(`  background-color: var(${primaryVar});`)
  lines.push(`  border-radius: var(${radiusVar});`)
  lines.push(`  padding: calc(var(${spaceVar}) * 0.5) var(${spaceVar});`)
  lines.push(`  color: var(--color-neutral-0, #ffffff);`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`.card {`)
  lines.push(`  background: var(${bgVar});`)
  lines.push(`  border-radius: var(${radiusVar});`)
  lines.push(`  padding: var(${spaceVar});`)
  lines.push(`}`)
  lines.push('```')
  lines.push(``)
  lines.push(`### ❌ 禁止写法`)
  lines.push(``)
  lines.push('```css')
  lines.push(`.button-primary {`)
  lines.push(`  background-color: ${primaryToken?.value ?? '#4F6EF7'};  /* ❌ 硬编码色值 */`)
  lines.push(`  border-radius: ${radiusToken?.value ?? '8px'};           /* ❌ 应引用 token */`)
  lines.push(`  color: #000000;                                          /* ❌ 纯黑禁止使用 */`)
  lines.push(`}`)
  lines.push('```')
  lines.push(``)
  lines.push(`### React / JSX 示例`)
  lines.push(``)
  lines.push('```tsx')
  lines.push(`// ✅ 引用 token 变量（推荐）`)
  lines.push(`const Button = ({ children }) => (`)
  lines.push(`  <button style={{`)
  lines.push(`    backgroundColor: 'var(${primaryVar})',`)
  lines.push(`    borderRadius: 'var(${radiusVar})',`)
  lines.push(`    padding: 'calc(var(${spaceVar}) * 0.5) var(${spaceVar})',`)
  lines.push(`    color: '#fff',`)
  lines.push(`  }}>`)
  lines.push(`    {children}`)
  lines.push(`  </button>`)
  lines.push(`)`)
  lines.push(``)
  lines.push(`// ✅ Tailwind — 映射 CSS 变量后可直接用 utility class`)
  lines.push(`// bg-primary  →  background-color: var(${primaryVar})`)
  lines.push(`// rounded-md  →  border-radius: var(${radiusVar})`)
  lines.push('```')
  lines.push(``)

  // ── 完整 AI 提示词 ──
  const aiContext = findSubsection(ast, 'ai-context', 'full-prompt')
  if (aiContext?.rawText) {
    lines.push(`## 完整 AI 提示词`)
    lines.push(``)
    lines.push(`> 可直接粘贴进 system prompt 或 CLAUDE.md。`)
    lines.push(``)
    lines.push(aiContext.rawText.trim())
    lines.push(``)
  }

  return lines.join('\n')
}

'use client'

import { useMemo } from 'react'
import type { SubsectionNode } from '@/lib/parser/types'
import { subsectionToCssVars, tokenToCssVars } from '@/lib/css-token-name'
import { componentSubsectionToCSS } from '@/lib/component-css-exporter'
import CssVarBlock from './CssVarBlock'
import ColorGroupRenderer from './renderers/ColorGroupRenderer'
import ColorScaleRenderer from './renderers/ColorScaleRenderer'
import GradientRenderer from './renderers/GradientRenderer'
import TypeScaleRenderer from './renderers/TypeScaleRenderer'
import SpacingScaleRenderer from './renderers/SpacingScaleRenderer'
import ShadowScaleRenderer from './renderers/ShadowScaleRenderer'
import BorderRadiusRenderer from './renderers/BorderRadiusRenderer'
import EasingRenderer from './renderers/EasingRenderer'
import AnimationRenderer from './renderers/AnimationRenderer'
import AIPromptRenderer from './renderers/AIPromptRenderer'
import ListRenderer from './renderers/ListRenderer'
import TextRenderer from './renderers/TextRenderer'
import RulesRenderer from './renderers/RulesRenderer'
import GenericScaleRenderer from './renderers/GenericScaleRenderer'
import ComponentSpecRenderer from './renderers/ComponentSpecRenderer'
import IconStyleSpecRenderer from './renderers/IconStyleSpecRenderer'

interface Props {
  subsection: SubsectionNode
  sectionId?: string
  onTokenClick?: (line: number) => void
  onTokenColorChange?: (line: number, color: string) => void
}

export default function SectionBlock({ subsection, sectionId, onTokenClick, onTokenColorChange }: Props) {
  const { type, tokens, groups, rawText, title } = subsection

  // cssVarMap: token.name → CSS var name list (for inline labels in renderers)
  const cssVarMap = useMemo((): Record<string, string[]> => {
    if (!sectionId) return {}
    const allTokens = [...tokens, ...groups.flatMap(g => g.tokens)]
    const map: Record<string, string[]> = {}
    for (const token of allTokens) {
      const vars = tokenToCssVars(sectionId, subsection, token)
      if (vars.length > 0) map[token.name] = vars.map(v => v.name)
    }
    return map
  }, [sectionId, subsection, tokens, groups])

  // cssVars: full list for the code block below the visual (design tokens)
  const cssVars = useMemo(
    () => sectionId ? subsectionToCssVars(sectionId, subsection) : [],
    [sectionId, subsection],
  )

  // componentCss: class-based CSS for component-spec subsections
  const componentCss = useMemo(() => {
    if (type !== 'component-spec') return null
    const result = componentSubsectionToCSS(title, tokens, groups)
    return result.hasContent ? result.css : null
  }, [type, title, tokens, groups])

  const renderContent = () => {
    // icon-style specs → dedicated editable/copyable block
    if (sectionId === 'icon-style' && type === 'spec' && tokens.length > 0) {
      return (
        <IconStyleSpecRenderer
          tokens={tokens}
          subsectionTitle={title}
          onTokenClick={onTokenClick}
        />
      )
    }

    switch (type) {
      case 'color-group':
        return <ColorGroupRenderer tokens={tokens} onTokenClick={onTokenClick} onTokenColorChange={onTokenColorChange} cssVarMap={cssVarMap} />
      case 'color-scale':
        return <ColorScaleRenderer tokens={tokens} onTokenClick={onTokenClick} onTokenColorChange={onTokenColorChange} cssVarMap={cssVarMap} />
      case 'gradient-group':
        return <GradientRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
      case 'scale':
        // Detect whether this is a type scale (values contain /) or spacing/other
        if (tokens[0]?.value.includes('/')) {
          return <TypeScaleRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
        }
        if (title.toLowerCase().includes('spac') || title.toLowerCase().includes('间距')) {
          return <SpacingScaleRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
        }
        if (title.toLowerCase().includes('radius') || title.toLowerCase().includes('圆角')) {
          return <BorderRadiusRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
        }
        return <GenericScaleRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
      case 'shadow-scale':
        return <ShadowScaleRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
      case 'easing-group':
        return <EasingRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
      case 'animation-pattern':
        return <AnimationRenderer groups={groups} tokens={tokens} onTokenClick={onTokenClick} />
      case 'ai-prompt':
        return rawText ? <AIPromptRenderer rawText={rawText} /> : null
      case 'list':
        return <ListRenderer tokens={tokens} onTokenClick={onTokenClick} />
      case 'text':
        return rawText ? <TextRenderer rawText={rawText} /> : null
      case 'rules':
        return rawText ? <RulesRenderer rawText={rawText} /> : null
      case 'font-list':
        return <GenericScaleRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
      case 'component-spec':
        return <ComponentSpecRenderer groups={groups} tokens={tokens} rawText={rawText} onTokenClick={onTokenClick} />
      case 'layout':
      case 'breakpoints':
      case 'spec':
      default:
        if (tokens.length > 0) {
          return <GenericScaleRenderer tokens={tokens} onTokenClick={onTokenClick} cssVarMap={cssVarMap} />
        }
        if (rawText) return <TextRenderer rawText={rawText} />
        return null
    }
  }

  const content = renderContent()
  if (!content) return null

  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
        {title}
      </h4>
      {content}
      {/* CSS code block — design token vars */}
      {cssVars.length > 0 && (
        <div className="mt-3">
          <CssVarBlock vars={cssVars} label={title} />
        </div>
      )}
      {/* CSS code block — component class-based CSS */}
      {componentCss && (
        <div className="mt-3">
          <CssVarBlock raw={componentCss} label={title} />
        </div>
      )}
    </div>
  )
}

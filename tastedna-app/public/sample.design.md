---
meta:
  project: "TasteDNA"
  version: "1.0.0"
  created: "2026-05-16"
  language: "zh-CN"
  description: "设计规范文档，定义平台的视觉语言、组件规范与资产风格"
---

# TasteDNA Design System

> 本文件是平台唯一的设计语言来源（Single Source of Truth）。可视化工具与 AI 提示词均由此文件生成。

---

## design-language
<!-- section: design-language -->

### keywords
<!-- type: list -->
- minimal        // 极简，去除装饰性噪音
- warm           // 温暖，非冷技术感
- playful        // 轻快，非严肃企业风
- trustworthy    // 可信，数据展示清晰准确

### personality
<!-- type: text -->
像一位有品位的设计师朋友——专业但不冷漠，简洁但有温度。界面像工具书，但不像说明书。

### ai-prompt-summary
<!-- type: ai-prompt -->
Design style: minimal and warm UI with soft neutral backgrounds, restrained use of brand color, generous whitespace, rounded corners (8–16px), subtle shadows. Typography uses a clean sans-serif, body text in dark gray (not pure black). Interactions feel responsive and light, not heavy or mechanical.

---

## colors
<!-- section: colors -->

### brand
<!-- type: color-group -->
- primary:        #4F6EF7  // 品牌主色，用于主操作、链接、选中态
- primary-light:  #EEF1FE  // 主色浅版，用于 hover 背景、tag 背景
- primary-dark:   #3451D1  // 主色深版，用于 active 态、pressed 态

### semantic
<!-- type: color-group -->
- success:        #34C97B  // 成功状态，用于完成提示、正向数据
- success-light:  #E8F8F0  // 成功浅版，用于成功 banner 背景
- warning:        #F5A623  // 警告状态，用于提醒、待处理
- warning-light:  #FEF6E7  // 警告浅版
- error:          #F04646  // 错误状态，用于表单校验、危险操作
- error-light:    #FEF0F0  // 错误浅版
- info:           #4F6EF7  // 信息状态，复用主色

### neutral
<!-- type: color-scale -->
- neutral-0:    #FFFFFF  // 纯白，卡片背景、模态框背景
- neutral-50:   #F8F9FB  // 页面底色，最浅的背景层
- neutral-100:  #F1F3F7  // 次级背景，hover 态
- neutral-200:  #E4E7EF  // 分割线、边框
- neutral-300:  #C9CEDB  // 禁用态边框
- neutral-400:  #9BA3B5  // placeholder 文字、图标
- neutral-500:  #6B7385  // 次要文字、label
- neutral-700:  #374151  // 正文
- neutral-900:  #111827  // 标题，最深文字

### gradient
<!-- type: gradient-group -->
- brand-gradient:    linear-gradient(135deg, #4F6EF7 0%, #9B72FF 100%)  // 品牌渐变，用于封面、空状态插画背景
- warm-gradient:     linear-gradient(135deg, #FFF8F0 0%, #FFF0F8 100%)  // 暖色渐变，用于欢迎区块背景

### dark-mode
<!-- type: color-group -->
- bg-base:      #0F1117  // 深色底层背景
- bg-surface:   #1C1F2A  // 深色卡片背景
- bg-elevated:  #252836  // 深色浮层背景
- border:       #2E3347  // 深色分割线

---

## typography
<!-- section: typography -->

### font-family
<!-- type: font-list -->
- sans:  "Inter", "PingFang SC", "SF Pro Text", system-ui, sans-serif  // 界面主字体
- mono:  "JetBrains Mono", "SF Mono", "Fira Code", monospace           // 代码、数据展示

### type-scale
<!-- type: scale -->
- xs:   12px / 1.5 / 400  // format: size / line-height / weight，用于辅助说明、角标
- sm:   13px / 1.5 / 400  // 小号文字、表格内容
- base: 14px / 1.6 / 400  // 正文默认尺寸
- md:   15px / 1.6 / 500  // 强调正文、按钮文字
- lg:   16px / 1.5 / 500  // 小标题、重要 label
- xl:   20px / 1.4 / 600  // 卡片标题、模块标题
- 2xl:  24px / 1.3 / 700  // 页面主标题
- 3xl:  32px / 1.2 / 700  // Landing 大标题
- 4xl:  48px / 1.1 / 800  // Hero 超大标题

### font-weight
<!-- type: scale -->
- regular:    400  // 正文
- medium:     500  // 强调、按钮
- semibold:   600  // 小标题
- bold:       700  // 标题
- extrabold:  800  // 超大标题、Hero

---

## spacing
<!-- section: spacing -->

### scale
<!-- type: scale -->
- 0:    0px
- 1:    4px   // 最小间距，icon 与文字间距
- 2:    8px   // 紧凑间距，badge 内边距
- 3:    12px  // 小间距，input 内边距
- 4:    16px  // 标准间距，卡片内边距
- 5:    20px  // 中等间距
- 6:    24px  // 区块内间距
- 8:    32px  // 区块间距
- 10:   40px  // 大区块间距
- 12:   48px  // 节间距
- 16:   64px  // 页面级间距
- 20:   80px  // 大页面间距
- 24:   96px  // Landing 节间距

### layout
<!-- type: layout -->
- sidebar-width:      240px  // 左侧导航宽度
- sidebar-collapsed:  64px   // 折叠态导航宽度
- topbar-height:      56px   // 顶部导航高度
- content-max-width:  1280px // 内容区最大宽度
- card-gap:           16px   // 卡片网格间距

### breakpoints
<!-- type: breakpoints -->
- sm:   640px   // 手机横屏
- md:   768px   // 平板竖屏
- lg:   1024px  // 平板横屏 / 小屏笔记本
- xl:   1280px  // 标准屏幕
- 2xl:  1536px  // 大屏

---

## borders
<!-- section: borders -->

### radius
<!-- type: scale -->
- none:  0px
- sm:    4px   // 小元素：badge、tag
- md:    8px   // 标准：input、button
- lg:    12px  // 卡片、下拉框
- xl:    16px  // 大卡片、模态框
- 2xl:   24px  // 特殊强调区块
- full:  9999px // 圆形：头像、pill 形按钮

### width
<!-- type: scale -->
- thin:    1px  // 默认边框
- medium:  2px  // 选中态、focus 态
- thick:   4px  // 强调边框（极少用）

---

## shadows
<!-- section: shadows -->

### elevation
<!-- type: shadow-scale -->
- none:   none                                                  // 无阴影，扁平元素
- xs:     0 1px 2px rgba(0,0,0,0.04)                          // 最轻，卡片默认态
- sm:     0 2px 8px rgba(0,0,0,0.06)                          // 轻度，hover 态卡片
- md:     0 4px 16px rgba(0,0,0,0.08)                         // 中度，dropdown、tooltip
- lg:     0 8px 32px rgba(0,0,0,0.10)                         // 较重，模态框
- xl:     0 16px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)  // 重度，抽屉、浮动面板
- brand:  0 4px 20px rgba(79,110,247,0.30)                    // 品牌色阴影，主按钮 hover 态

---

## motion
<!-- section: motion -->

### easing
<!-- type: easing-group -->
- ease-default:    cubic-bezier(0.4, 0, 0.2, 1)   // 默认过渡，大多数状态切换
- ease-in:         cubic-bezier(0.4, 0, 1, 1)      // 元素离场
- ease-out:        cubic-bezier(0, 0, 0.2, 1)      // 元素入场，弹出类
- ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1) // 弹性效果，微交互强调

### duration
<!-- type: scale -->
- instant:  0ms    // 无动画（减少动效偏好模式）
- fast:     100ms  // 极快，hover 颜色变化
- quick:    150ms  // 快速，按钮 press 态
- normal:   200ms  // 标准，状态切换、下拉展开
- slow:     300ms  // 较慢，模态框出现、页面过渡
- slower:   500ms  // 慢速，骨架屏淡出、成功动画

### patterns
<!-- type: animation-pattern -->

#### entrance           // 入场动画
- fade-in:         opacity 0→1, duration: slow, easing: ease-out
- slide-up:        translateY(12px)→0 + opacity 0→1, duration: slow, easing: ease-out
- slide-down:      translateY(-12px)→0 + opacity 0→1, duration: slow, easing: ease-out
- scale-in:        scale(0.95)→1 + opacity 0→1, duration: quick, easing: ease-spring
- pop-in:          scale(0.8)→1 + opacity 0→1, duration: normal, easing: ease-spring

#### exit              // 离场动画
- fade-out:        opacity 1→0, duration: quick, easing: ease-in
- slide-down-out:  translateY(0)→(12px) + opacity 1→0, duration: quick, easing: ease-in
- scale-out:       scale(1)→0.95 + opacity 1→0, duration: fast, easing: ease-in

#### interaction       // 交互反馈动画
- button-press:    scale(0.97), duration: fast, easing: ease-default
- card-hover:      translateY(-2px) + shadow-sm→shadow-md, duration: normal, easing: ease-out
- skeleton-pulse:  opacity 0.5→1 循环, duration: 1200ms, easing: ease-default
- success-check:   stroke-dashoffset 动画 + scale(0→1.1→1), duration: 500ms, easing: ease-spring

#### page-transition    // 页面级过渡
- route-change:    fade-out(100ms) + fade-in(200ms) with 50ms delay

---

## components
<!-- section: components -->

### button
<!-- type: component-spec -->
- height:          sm=28px, md=36px, lg=44px
- padding:         sm=px-3, md=px-4, lg=px-6
- font:            md weight, base size (md=14px, lg=15px)
- radius:          md (8px)
- transition:      all 150ms ease-default
- variants:        primary, secondary, ghost, danger, link
- primary:         bg=primary, text=white, hover: bg=primary-dark + shadow-brand
- secondary:       bg=neutral-100, text=neutral-700, hover: bg=neutral-200
- ghost:           bg=transparent, text=neutral-500, hover: bg=neutral-100, text=neutral-700

### input
<!-- type: component-spec -->
- height:          36px (default), 44px (large)
- padding:         px-3 py-2
- border:          1px neutral-200, focus: 2px primary
- radius:          md (8px)
- font:            base size, regular weight
- placeholder:     neutral-400
- transition:      border 150ms, shadow 150ms
- focus-shadow:    0 0 0 3px rgba(79,110,247,0.15)

### card
<!-- type: component-spec -->
- bg:              neutral-0
- border:          1px neutral-200
- radius:          lg (12px)
- shadow:          xs (default), sm (hover)
- padding:         6 (24px)
- transition:      shadow 200ms ease-out, transform 200ms ease-out
- hover:           shadow-sm + translateY(-2px)

### sidebar-nav
<!-- type: component-spec -->
- width:           240px
- bg:              neutral-50
- item-height:     40px
- item-padding:    px-3
- item-radius:     md (8px)
- item-default:    text=neutral-500, icon=neutral-400
- item-hover:      bg=neutral-100, text=neutral-700, icon=neutral-600
- item-active:     bg=primary-light, text=primary, icon=primary
- item-font:       sm (13px), medium weight

### tag / badge
<!-- type: component-spec -->
- height:          20px (sm), 24px (md)
- padding:         px-2
- radius:          sm (4px)
- font:            xs (12px), medium weight
- variants:        neutral, primary, success, warning, error

### modal
<!-- type: component-spec -->
- backdrop:        bg=rgba(0,0,0,0.4), blur=4px
- bg:              neutral-0
- radius:          xl (16px)
- shadow:          lg
- padding:         8 (32px)
- width:           sm=400px, md=560px, lg=720px, full=90vw
- entrance:        scale-in + fade-in, duration: slow

---

## illustration-style
<!-- section: illustration-style -->

### style-keywords
<!-- type: list -->
- flat-design        // 扁平风格，无强烈光影
- soft-colors        // 柔和色调，低饱和度
- geometric          // 几何形状构成
- friendly           // 圆润，亲切感
- minimal-detail     // 细节克制，不过度复杂

### color-palette
<!-- type: text -->
使用品牌色系（#4F6EF7, #9B72FF）作为主角色，辅以暖白（#FFF8F0）、米色（#F5F0E8）作为背景色。人物肤色使用 #FDDCB5（浅）和 #C68B5A（深）两种。阴影用低透明度的 #4F6EF7（蓝紫），而非灰色。

### composition-rules
<!-- type: list -->
- 图形居中，留白充足（边距不少于插画尺寸的 15%）
- 人物比例偏圆润，头部稍大（头身比约 1:3.5）
- 元素数量控制在 3–5 个，避免堆砌
- 背景使用渐变色块或简单几何，不用照片质感

### ai-prompt-template
<!-- type: ai-prompt -->
Flat illustration, {subject}, soft pastel colors with blue-purple (#4F6EF7) accents, geometric shapes, friendly and minimal style, white background, generous negative space, no gradients on characters, simple shadows using semi-transparent purple, clean vector art style. {additional_description}

### do-dont
<!-- type: rules -->
✅ DO:
- 使用圆角几何形状
- 保持色板统一（不超过 5 种颜色）
- 人物使用统一肤色体系

❌ DON'T:
- 写实风格、照片感纹理
- 强烈的描边（outline 超过 2px）
- 饱和度过高的颜色（HSL Saturation > 70%）

---

## icon-style
<!-- section: icon-style -->

### style-keywords
<!-- type: list -->
- line-icons         // 线性图标，非填充
- rounded-caps       // 端点圆润（stroke-linecap: round）
- rounded-joins      // 转角圆润（stroke-linejoin: round）
- consistent-weight  // 统一描边粗细
- optical-balance    // 视觉平衡，关键路径不偏移

### specs
<!-- type: spec -->
- grid:          24×24px (standard), 16×16px (small), 32×32px (large)
- stroke-width:  1.5px (standard grid), 1.25px (small grid)
- padding:       2px 内边距（可用区域 20×20px）
- corner-radius: 2px（直角元素的圆角处理）
- color:         currentColor（继承父级颜色）

### size-usage
<!-- type: list -->
- 16px:  面包屑、行内图标、tag 内图标
- 20px:  默认行内图标（正文旁）
- 24px:  导航图标、按钮图标
- 32px:  空状态图标、功能入口卡片

### ai-prompt-template
<!-- type: ai-prompt -->
SVG line icon for {subject}, 24×24px grid, 1.5px stroke width, stroke-linecap round, stroke-linejoin round, 2px padding from edges, monochrome (currentColor), minimal and clean design, no fill, balanced optical weight. Output only the SVG path data within a 24×24 viewBox.

### naming-convention
<!-- type: rules -->
- 格式：{category}-{name}.svg
- 示例：nav-home.svg, action-edit.svg, status-success.svg
- category 可选值：nav, action, status, media, file, social, arrow

---

## ai-context
<!-- section: ai-context -->

> 此节为给 AI 使用的完整上下文摘要，可直接粘贴进 AI 提示词。

### full-prompt
<!-- type: ai-prompt -->
You are building UI for the TasteDNA design system. Follow these rules strictly:

**Visual Language:** Minimal and warm. Generous whitespace. Soft neutral backgrounds (#F8F9FB base). Restrained use of brand color (#4F6EF7). Never use pure black text—use #374151 for body and #111827 for headings.

**Colors:** Primary #4F6EF7 (brand blue-purple), success #34C97B, warning #F5A623, error #F04646. Neutral scale from #FFFFFF to #111827.

**Typography:** Inter / PingFang SC. Body 14px/1.6 regular. Headings semibold to extrabold (600–800). Never use pure black (#000000) for text.

**Spacing:** 4px base unit. Component padding typically 12–16px. Card padding 24px. Section gaps 32–48px.

**Borders & Radius:** Default radius 8px (inputs/buttons), 12px (cards), 16px (modals). Border color #E4E7EF (1px).

**Shadows:** Subtle. Cards use `0 1px 2px rgba(0,0,0,0.04)`. Hover: `0 2px 8px rgba(0,0,0,0.06)`.

**Motion:** 150–300ms transitions. ease: cubic-bezier(0.4,0,0.2,1). Entrances use fade+slide-up (translateY 12px). Spring easing (0.34,1.56,0.64,1) for interactive feedback.

**Components:** Buttons height 36px (md), 44px (lg). Sidebar width 240px. Inputs with 3px focus ring using primary color at 15% opacity.

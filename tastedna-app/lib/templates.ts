export interface TemplateBlock {
  id: string
  label: string
  labelEn: string
  icon: string
  snippet: string
}

export interface TemplateGroup {
  group: string
  groupEn: string
  items: TemplateBlock[]
}

export const templateGroups: TemplateGroup[] = [
  {
    group: '颜色',
    groupEn: 'Colors',
    items: [
      {
        id: 'color-brand',
        label: '品牌色组',
        labelEn: 'Brand Colors',
        icon: '◉',
        snippet: `## colors
<!-- section: colors -->

### brand
<!-- type: color-group -->
- primary:        #4F6EF7  // 品牌主色，用于主操作、链接、选中态
- primary-light:  #EEF1FE  // 主色浅版，用于 hover 背景、tag 背景
- primary-dark:   #3451D1  // 主色深版，用于 active 态、pressed 态`,
      },
      {
        id: 'color-semantic',
        label: '语义色',
        labelEn: 'Semantic Colors',
        icon: '◉',
        snippet: `### semantic
<!-- type: color-group -->
- success:        #34C97B  // 成功状态，用于完成提示、正向数据
- success-light:  #E8F8F0  // 成功浅版，用于成功 banner 背景
- warning:        #F5A623  // 警告状态，用于提醒、待处理
- warning-light:  #FEF6E7  // 警告浅版
- error:          #F04646  // 错误状态，用于表单校验、危险操作
- error-light:    #FEF0F0  // 错误浅版`,
      },
      {
        id: 'color-scale',
        label: '灰阶色',
        labelEn: 'Neutral Scale',
        icon: '▤',
        snippet: `### neutral
<!-- type: color-scale -->
- neutral-0:    #FFFFFF  // 纯白，卡片背景
- neutral-50:   #F8F9FB  // 页面底色
- neutral-100:  #F1F3F7  // 次级背景、hover 态
- neutral-200:  #E4E7EF  // 分割线、边框
- neutral-300:  #C9CEDB  // 禁用态边框
- neutral-400:  #9BA3B5  // placeholder、图标
- neutral-500:  #6B7385  // 次要文字
- neutral-700:  #374151  // 正文
- neutral-900:  #111827  // 标题，最深文字`,
      },
      {
        id: 'color-gradient',
        label: '渐变',
        labelEn: 'Gradients',
        icon: '◑',
        snippet: `### gradient
<!-- type: gradient-group -->
- brand-gradient:  linear-gradient(135deg, #4F6EF7 0%, #9B72FF 100%)  // 品牌渐变
- warm-gradient:   linear-gradient(135deg, #FFF8F0 0%, #FFF0F8 100%)  // 暖色渐变`,
      },
    ],
  },
  {
    group: '排版',
    groupEn: 'Typography',
    items: [
      {
        id: 'typography-family',
        label: '字体族',
        labelEn: 'Font Family',
        icon: 'Aa',
        snippet: `## typography
<!-- section: typography -->

### font-family
<!-- type: font-list -->
- sans:       "Inter", "PingFang SC", system-ui, sans-serif  // 界面主字体
- serif:      "Georgia", serif                                // 长文阅读
- mono:       "JetBrains Mono", "Fira Code", monospace        // 代码`,
      },
      {
        id: 'typography-scale',
        label: '字号比例',
        labelEn: 'Type Scale',
        icon: 'Aa',
        snippet: `### type-scale
<!-- type: scale -->
- xs:   12px / 1.5 / 400  // 辅助说明、角标
- sm:   14px / 1.5 / 400  // 次要文字、label
- base: 16px / 1.6 / 400  // 正文默认
- lg:   18px / 1.5 / 500  // 小标题
- xl:   20px / 1.4 / 600  // 区块标题
- 2xl:  24px / 1.3 / 700  // 页面标题
- 3xl:  32px / 1.2 / 700  // 展示大标题`,
      },
    ],
  },
  {
    group: '空间',
    groupEn: 'Spacing',
    items: [
      {
        id: 'spacing-scale',
        label: '间距',
        labelEn: 'Spacing',
        icon: '⬜',
        snippet: `## spacing
<!-- section: spacing -->

### spacing-scale
<!-- type: scale -->
- 1:   4px   // 最小间距，icon 内边距
- 2:   8px   // 紧凑元素间距
- 3:   12px  // 小组件内边距
- 4:   16px  // 标准内边距
- 5:   20px  // 中等间距
- 6:   24px  // 区块间距
- 8:   32px  // 大区块间距
- 12:  48px  // 章节间距
- 16:  64px  // 页面级间距`,
      },
      {
        id: 'border-radius',
        label: '圆角',
        labelEn: 'Border Radius',
        icon: '⬡',
        snippet: `### border-radius
<!-- type: scale -->
- sm:   4px   // 小组件，tag、badge
- md:   8px   // 按钮、输入框
- lg:   12px  // 卡片
- xl:   16px  // 大卡片、弹窗
- full: 9999px // 胶囊按钮、头像`,
      },
    ],
  },
  {
    group: '效果',
    groupEn: 'Effects',
    items: [
      {
        id: 'shadows',
        label: '阴影',
        labelEn: 'Shadows',
        icon: '◫',
        snippet: `## shadows
<!-- section: shadows -->

### shadow-scale
<!-- type: shadow-scale -->
- sm:   0 1px 2px rgba(0,0,0,0.05)                          // 微弱，输入框静态态
- md:   0 4px 6px rgba(0,0,0,0.07)                          // 卡片默认
- lg:   0 10px 15px rgba(0,0,0,0.10)                        // 卡片 hover、下拉菜单
- xl:   0 20px 25px rgba(0,0,0,0.12), 0 8px 10px rgba(0,0,0,0.06)  // 弹窗、抽屉`,
      },
      {
        id: 'motion',
        label: '动效',
        labelEn: 'Motion',
        icon: '▷',
        snippet: `## motion
<!-- section: motion -->

### easing
<!-- type: easing-group -->
- ease-default:  cubic-bezier(0.4, 0, 0.2, 1)  // 通用缓动，大多数交互
- ease-in:       cubic-bezier(0.4, 0, 1, 1)    // 元素退出
- ease-out:      cubic-bezier(0, 0, 0.2, 1)    // 元素进入
- ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)  // 弹性，强调反馈

### duration
<!-- type: scale -->
- fast:    100ms  // 微交互，hover 变色
- normal:  200ms  // 标准过渡
- slow:    300ms  // 面板展开、弹窗`,
      },
    ],
  },
]

export const STARTER_TEMPLATE = `---
meta:
  project: "My Design System"
  version: "1.0.0"
  created: "${new Date().toISOString().slice(0, 10)}"
  language: "zh-CN"
  description: "我的设计规范文档"
---

# My Design System

> 本文件是设计语言的唯一来源（Single Source of Truth）。

---

## colors
<!-- section: colors -->

### brand
<!-- type: color-group -->
- primary:        #4F6EF7  // 品牌主色
- primary-light:  #EEF1FE  // 主色浅版
- primary-dark:   #3451D1  // 主色深版

### neutral
<!-- type: color-scale -->
- neutral-0:    #FFFFFF
- neutral-100:  #F1F3F7
- neutral-200:  #E4E7EF
- neutral-500:  #6B7385
- neutral-700:  #374151
- neutral-900:  #111827

---

## typography
<!-- section: typography -->

### font-family
<!-- type: font-list -->
- sans:  "Inter", system-ui, sans-serif  // 界面主字体
- mono:  "JetBrains Mono", monospace     // 代码

### type-scale
<!-- type: scale -->
- sm:   14px / 1.5 / 400
- base: 16px / 1.6 / 400
- lg:   18px / 1.5 / 500
- xl:   24px / 1.3 / 700

---

## spacing
<!-- section: spacing -->

### spacing-scale
<!-- type: scale -->
- 2:   8px
- 4:   16px
- 6:   24px
- 8:   32px
`

# DESIGN.md 语法规范 v1.0

本文档定义 DESIGN.md 的 markdown 语法规则，使可视化工具、AI Prompt 生成器和双向翻译引擎能够可靠地解析文件。

---

## 文件结构总览

```
DESIGN.md
├── YAML Front Matter        # 元数据块（--- 包裹）
├── H1 标题                  # 项目名称
├── H2 节（sections）        # 每个顶级功能节
│   ├── 节级 HTML 注释       # <!-- section: xxx --> 节标识
│   ├── H3 子节              # 节内分组
│   │   ├── 子节级 HTML 注释 # <!-- type: xxx --> 类型标识
│   │   └── 内容行           # 实际数据
│   └── ...
└── ...
```

---

## 1. Front Matter

文件顶部使用 YAML front matter 存储元数据，解析器应先提取此块。

```yaml
---
meta:
  project: "项目名"
  version: "1.0.0"
  created: "YYYY-MM-DD"
  language: "zh-CN"        # zh-CN | en-US | bilingual
  description: "说明"
---
```

---

## 2. 节标识注释（Section Markers）

每个 `##` 标题下方的第一行必须是节标识注释：

```markdown
## colors
<!-- section: colors -->
```

**解析规则：**
- 格式：`<!-- section: {section-id} -->`
- `section-id` 为 kebab-case，对应 JSON Schema 中的属性 key
- 可视化工具通过此 id 决定渲染哪种组件
- 点击可视化元素时，通过此 id 定位到对应的 markdown 行号

---

## 3. 类型标识注释（Type Markers）

每个 `###` 子标题下方的第一行是类型标识注释：

```markdown
### brand
<!-- type: color-group -->
```

**支持的 type 值：**

| type | 说明 | 可视化渲染方式 |
|------|------|--------------|
| `color-group` | 颜色 token 组 | 色块 + hex 标签 |
| `color-scale` | 色阶（0–900）| 横向色阶条 |
| `gradient-group` | 渐变组 | 渐变预览条 |
| `font-list` | 字体家族列表 | 字体名 + 示例文字 |
| `scale` | 数值比例尺（spacing/type/radius 等）| 比例可视化 |
| `shadow-scale` | 阴影层级 | 阴影卡片预览 |
| `easing-group` | 缓动曲线组 | 贝塞尔曲线图 |
| `animation-pattern` | 动效模式组 | 可播放动效预览 |
| `component-spec` | 组件规范 | 组件预览 + 属性表 |
| `ai-prompt` | AI 提示词 | 可复制的代码块 |
| `list` | 普通列表 | 标签列表 |
| `text` | 段落文本 | 富文本 |
| `rules` | Do/Don't 规则 | 双列规则卡 |
| `layout` | 布局常量 | 布局示意图 |
| `breakpoints` | 断点定义 | 响应式断点图 |
| `spec` | 通用规格说明 | 属性表格 |

---

## 4. Token 行语法

### 4.1 基础格式

```
- {name}: {value}  // {zh-comment}
```

- `name`：token 名称，kebab-case
- `value`：token 值（颜色/像素/字符串/CSS 值）
- `// {zh-comment}`：中文注释，描述用途（可选）

**示例：**
```markdown
- primary:       #4F6EF7  // 品牌主色，用于主操作、链接
- sidebar-width: 240px    // 左侧导航宽度
- ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)  // 弹性效果
```

### 4.2 多值格式（type-scale）

当一个 token 有多个子属性时，使用斜杠分隔：

```
- {name}: {size} / {line-height} / {weight}  // {zh-comment}
```

**示例：**
```markdown
- base: 14px / 1.6 / 400  // 正文默认尺寸
- xl:   20px / 1.4 / 600  // 卡片标题
```

### 4.3 动效模式格式

```
- {name}: {transform-description}, duration: {duration}, easing: {easing}  // {zh-comment}
```

**示例：**
```markdown
- slide-up: translateY(12px)→0 + opacity 0→1, duration: slow, easing: ease-out
```

---

## 5. 子节层级（H4）

在 H3 子节内部，使用 `####` 对内容分组：

```markdown
### patterns
<!-- type: animation-pattern -->

#### entrance           // 分组中文说明（行内注释）
- fade-in:  ...
- slide-up: ...

#### exit
- fade-out: ...
```

**解析规则：**
- `####` 标题文字作为分组 key
- 行内 `//` 注释作为分组的中文说明
- 分组 key 用于 JSON 中的嵌套结构

---

## 6. 双语注释规范

文件支持两种注释混用模式：

### 6.1 行内中文注释（优先用于 token）
```markdown
- primary: #4F6EF7  // 品牌主色，用于主要操作
```

### 6.2 段落文本中英双语（用于 text/rules 类型）
当 `language: bilingual` 时，段落文本需提供中英两版：

```markdown
### personality
<!-- type: text -->
<!-- lang: en -->
Like a designer friend — professional but warm. The interface feels like a reference book, not a manual.
<!-- lang: zh -->
像一位有品位的设计师朋友——专业但不冷漠。界面像工具书，但不像说明书。
```

### 6.3 翻译标记（解析器生成）

解析器翻译后，在原始 markdown 中插入对应语言的隐藏块：
```markdown
- primary: #4F6EF7  // 品牌主色
<!-- translated:en: Brand primary color, used for main actions and links -->
```
可视化工具读取此隐藏块显示英文说明，编辑时不显示在编辑器中。

---

## 7. AI Prompt 块（type: ai-prompt）

AI Prompt 内容直接写在 H3 子节下，无列表格式：

```markdown
### ai-prompt-summary
<!-- type: ai-prompt -->
Design style: minimal and warm UI with soft neutral backgrounds...
```

**占位符语法：** `{variable_name}`，大括号包裹，snake_case。

---

## 8. 行号与可视化定位协议

可视化工具与 markdown 编辑器之间通过**行号锚点**双向定位：

### 8.1 从可视化 → 编辑器
1. 用户点击可视化中的色块（如 `primary`）
2. 可视化工具查询解析后的 AST，找到 `colors.brand.primary` 对应的 **起始行号**
3. 编辑器滚动到该行并高亮

### 8.2 从编辑器 → 可视化
1. 用户修改 markdown 中的某行（如改变 `primary` 的 hex 值）
2. 编辑器触发 `onChange` 事件，携带修改的行号
3. 解析器增量解析该行，找到对应的 token path（`colors.brand.primary`）
4. 可视化组件订阅该 path，局部更新色块

### 8.3 AST 节点格式（解析器输出）

每个解析后的节点携带位置信息：

```typescript
interface DesignToken {
  path: string         // "colors.brand.primary"
  value: string        // "#4F6EF7"
  zh: string           // "品牌主色，用于主要操作"
  line: {
    start: number      // markdown 文件中的起始行号（1-indexed）
    end: number        // 结束行号
  }
  section: string      // "colors"
  type: string         // "color-group"
}
```

---

## 9. 完整节清单

以下是 DESIGN.md 支持的所有顶级节（`## section-id`）：

| Section ID | 中文名 | 可视化优先级 |
|-----------|--------|------------|
| `design-language` | 设计语言 | 2 |
| `colors` | 色彩系统 | 1（最高）|
| `typography` | 字体系统 | 1 |
| `spacing` | 间距与布局 | 3 |
| `borders` | 边框与圆角 | 3 |
| `shadows` | 阴影与层级 | 3 |
| `motion` | 动效系统 | 2 |
| `components` | 组件规范 | 1 |
| `illustration-style` | 插画风格 | 4 |
| `icon-style` | 图标风格 | 4 |
| `ai-context` | AI 上下文 | 5（仅工具用）|

---

## 10. 版本兼容性

- 解析器应忽略未知的 `<!-- type: xxx -->` 标记（兼容未来扩展）
- 未知节（非 Section 清单中的 `##` 标题）以 `type: text` 方式降级渲染
- Front matter 中缺失的字段使用 JSON Schema 中定义的 `default` 值

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
    group: '组件',
    groupEn: 'Components',
    items: [
      {
        id: 'comp-button',
        label: '按钮',
        labelEn: 'Button',
        icon: '⬛',
        snippet: `## components
<!-- section: components -->

### 按钮
<!-- type: component-spec -->
- usage:      主操作入口——表单提交、弹窗确认、页面级主操作；primary 变体每屏最多一个核心动作，secondary/ghost 用于辅助操作
- prohibited: 不能在表格行内使用 primary 变体；不能并排超过 2 个按钮；不能用 link 变体替代导航链接；danger 仅用于不可逆操作（删除/清空）
#### 变体
- primary:   主要按钮  // 品牌主色填充，核心操作
- secondary: 次要按钮  // 弱填充或描边，辅助操作
- ghost:     幽灵按钮  // 透明背景+描边
- danger:    危险按钮  // 红色填充，破坏性操作
- link:      链接按钮  // 无背景无描边，纯文字样式
#### 尺寸
- sm:  height 28px, padding 0 12px  // 表格内、紧凑场景
- md:  height 36px, padding 0 16px  // 默认
- lg:  height 44px, padding 0 20px  // 表单提交、强调
- xl:  height 52px, padding 0 24px  // 落地页 CTA
#### 状态
- hover:    背景亮度 +8%，过渡 150ms
- active:   背景亮度 -4%，transform scale(0.98)
- disabled: opacity 0.4，cursor not-allowed
- loading:  spinner 替换文字，禁用点击`,
      },
      {
        id: 'comp-input',
        label: '输入框',
        labelEn: 'Input',
        icon: '▭',
        snippet: `### 输入框
<!-- type: component-spec -->
- usage:      单行文本录入——搜索框、表单字段、筛选器；需配合 label 使用，placeholder 仅作补充说明而非替代 label
- prohibited: 不能省略 label（无障碍要求）；只读展示场景改用纯文本；不能嵌套在 table cell 内直接展示（改用 inline-edit 模式）
#### 变体
- default:   默认描边型  // 1px 中性色描边，focus 变品牌色
- filled:    填充型      // 浅色背景，无描边，focus 出现描边
- underline: 下划线型    // 仅底部描边，适合表单密集场景
#### 尺寸
- sm:  height 28px, text 12px  // 紧凑
- md:  height 36px, text 14px  // 默认
- lg:  height 44px, text 15px  // 突出场景
#### 状态
- focus:    描边变品牌色，出现 focus ring（2px offset）
- error:    红色描边 + 底部错误提示文字（12px，红色）
- success:  绿色描边 + 右侧成功图标
- disabled: opacity 0.4，背景变浅灰，cursor not-allowed`,
      },
      {
        id: 'comp-form-controls',
        label: '表单控件',
        labelEn: 'Form Controls',
        icon: '☑',
        snippet: `### 复选框
<!-- type: component-spec -->
- usage:      多选用 checkbox，单选用 radio，二元开关用 switch；选项数量 2–6 个时优先使用
- prohibited: 不能将 radio 与 checkbox 混用在同一选项组；switch 不用于多选场景；不能省略文字 label 仅靠颜色区分状态
#### 变体
- checkbox: 方形复选  // 选中时品牌色填充 + 白色勾
- radio:    圆形单选  // 选中时品牌色圆点
- switch:   滑动开关  // 开：品牌色背景；关：中性色背景
#### 状态
- checked:       品牌色填充，过渡 150ms ease-out
- indeterminate: 半选横线（仅 checkbox）
- disabled:      opacity 0.4`,
      },
      {
        id: 'comp-select',
        label: '选择器',
        labelEn: 'Select',
        icon: '▾',
        snippet: `### 选择器
<!-- type: component-spec -->
- usage:      有明确选项集合的单选/多选；选项超过 5 个时优先于 radio；combobox 用于选项过多需要搜索的场景
- prohibited: 选项少于 3 个时改用 radio；不能在 combobox 中省略搜索功能；不能将选择器用于日期/时间（改用 DatePicker）
#### 变体
- select:       单选下拉    // 触发器同输入框，右侧箭头图标
- multi-select: 多选下拉    // 已选项以标签（tag）形式展示在触发器内
- combobox:     可搜索下拉  // 触发器内置搜索输入，支持过滤
#### 状态
- open:     触发器品牌色描边，下拉面板 shadow-lg，max-height 240px 可滚动
- disabled: opacity 0.4`,
      },
      {
        id: 'comp-card',
        label: '卡片',
        labelEn: 'Card',
        icon: '▣',
        snippet: `### 卡片
<!-- type: component-spec -->
- usage:      内容容器——将同类信息归组展示；适用于列表项、数据摘要、功能入口；可点击时整体作为交互区域
- prohibited: 不能在 card 内嵌套 card（改用 section 分隔）；不能省略 padding 让内容贴边；card 内不能出现超过 1 个 primary button
#### 变体
- default:     默认卡片      // 白底，shadow-sm，radius-lg
- elevated:    悬浮卡片      // 白底，shadow-md，无描边
- outlined:    描边卡片      // 白底，1px 中性描边，无阴影
- interactive: 可交互卡片    // hover 时 shadow-md + translateY(-2px)，cursor pointer
- flat:        扁平卡片      // neutral-50 背景，无阴影无描边
#### 内部区域
- header: padding 16px 20px，标题 + 右侧操作区
- body:   padding 16px 20px，主内容区
- footer: padding 12px 20px，次要信息或底部操作，上分割线`,
      },
      {
        id: 'comp-badge',
        label: '徽标与标签',
        labelEn: 'Badge & Tag',
        icon: '◉',
        snippet: `### 徽标
<!-- type: component-spec -->
- usage:      状态标注和分类标签——badge 用于数量提示（未读数/计数），tag 用于可枚举的内容属性
- prohibited: 单个元素不能叠加超过 3 个 tag；不能用 tag 替代 button 触发操作；error 变体仅用于真实错误/失败状态
#### 变体
- default: 默认  // neutral-100 背景，neutral-700 文字
- primary: 品牌  // 品牌色浅版背景，品牌色文字
- success: 成功  // 绿色浅版背景，绿色文字
- warning: 警告  // 黄色浅版背景，黄色文字
- danger:  危险  // 红色浅版背景，红色文字
- outline: 描边  // 透明背景 + 1px 当前颜色描边
- dot:     圆点  // 6px 圆点 + 文字，状态指示
#### 尺寸
- sm: height 18px, text 11px, padding 0 6px   // 角标、列表内
- md: height 22px, text 12px, padding 0 8px   // 默认
- lg: height 28px, text 13px, padding 0 10px  // 突出展示`,
      },
      {
        id: 'comp-avatar',
        label: '头像',
        labelEn: 'Avatar',
        icon: '◯',
        snippet: `### 头像
<!-- type: component-spec -->
- usage:      用户身份展示——评论列表、消息气泡、个人主页；group 变体用于展示协作者或成员列表
- prohibited: 有真实头像时不能降级使用 icon 变体；不能脱离用户实体单独使用头像；group 最多叠加展示 4 个，超出显示数字
#### 变体
- image:    图片头像    // 圆形裁切，object-cover
- initials: 文字首字母  // 自动从姓名取首字母，背景色按哈希分配
- icon:     图标占位    // 用户图标，neutral-200 背景
- group:    头像组      // 叠加排列 -8px，最多显示 4 个 + 溢出数字
#### 尺寸
- xs:  20px  // 极紧凑列表
- sm:  28px  // 评论、消息列表
- md:  36px  // 默认
- lg:  48px  // 个人信息卡
- xl:  64px  // 个人主页小图
- 2xl: 96px  // 个人主页大图`,
      },
      {
        id: 'comp-alert',
        label: '提示与通知',
        labelEn: 'Alert & Toast',
        icon: '◎',
        snippet: `### 提示通知
<!-- type: component-spec -->
- usage:      toast 用于操作后的即时反馈（临时），alert 用于页面内常驻警告，banner 用于全局级公告
- prohibited: 不能用 toast 展示需要用户操作的信息（改用 alert/modal）；同时显示的 toast 不能超过 3 个；不能省略语义图标
#### 变体
- toast:   浮动通知  // 右上角，z-50，3s 自动消失，可手动关闭
- alert:   内嵌警告  // 页面内常驻，可关闭
- banner:  顶部通知  // 全宽，页面级重要公告
- callout: 内容提示  // 文档/详情页内嵌说明块
#### 语义
- info:    信息，品牌蓝，信息图标
- success: 成功，绿色，勾选图标
- warning: 警告，黄色，感叹图标
- error:   错误，红色，叉号图标
#### 内部元素
- icon:        左侧 16px 语义图标
- title:       加粗标题（可选）
- description: 正文说明
- action:      文字链接操作（可选）
- close:       右侧关闭按钮（可选）`,
      },
      {
        id: 'comp-modal',
        label: '模态框',
        labelEn: 'Modal & Drawer',
        icon: '▢',
        snippet: `### 模态框
<!-- type: component-spec -->
- usage:      阻断性交互——需用户明确确认或完成独立任务；sm 用于纯确认，md 用于简单表单，lg 用于复杂内容；sheet/drawer 用于移动端
- prohibited: 不能在 modal 内再打开另一个 modal；不能用 modal 展示纯信息（改用 toast/banner）；不能省略关闭按钮；表单字段不能超过 5 个
#### 变体
- dialog: 居中对话框  // 遮罩背景，居中，用于确认/表单
- sheet:  底部弹出    // 移动端从下滑入，max-height 90vh
- drawer: 侧边抽屉    // 从左或右覆盖，width 360-480px
- popover: 气泡弹层  // 锚定触发元素，无遮罩
#### 尺寸（dialog）
- sm:   max-width 400px  // 确认框
- md:   max-width 560px  // 标准表单
- lg:   max-width 720px  // 复杂内容
- full: 100vw × 100vh    // 全屏编辑
#### 交互
- overlay:  遮罩 rgba(0,0,0,0.4)，点击关闭
- enter:    fade-in + scale(0.96→1)，200ms ease-out
- exit:     fade-out + scale(1→0.96)，150ms ease-in`,
      },
      {
        id: 'comp-nav',
        label: '导航',
        labelEn: 'Navigation',
        icon: '≡',
        snippet: `### 导航
<!-- type: component-spec -->
- usage:      全局路由切换——topbar 用于顶级导航，sidebar 用于多级功能区，breadcrumb 用于层级定位，bottom-nav 用于移动端
- prohibited: 不能将操作按钮（新建/删除）放入导航 item；sidebar 顶级 item 不能超过 8 个；不能同时使用 topbar 和 sidebar 作为主导航
#### 变体
- topbar:     顶部导航栏    // height 56px，背景白/深色，底部 1px 分割线
- sidebar:    侧边导航      // width 240px，折叠态 64px（图标模式）
- bottom-nav: 移动端底部栏  // height 56px，最多 5 项
- breadcrumb: 面包屑        // 分隔符"/"，当前页不可点击
#### 元素
- logo:     品牌标识，左侧，height 24-32px
- nav-item: 导航项，height 40px，选中态品牌色文字+背景
- badge:    导航项右侧数量角标
- actions:  右侧操作区（搜索/通知/头像）`,
      },
      {
        id: 'comp-tabs',
        label: '标签页',
        labelEn: 'Tabs',
        icon: '⊟',
        snippet: `### 标签页
<!-- type: component-spec -->
- usage:      同级内容切换——将同一层级的不同视图组织在一起；line 变体用于大多数场景；tab 数量 2–5 个
- prohibited: 不能用 tab 做跨层级路由（改用导航）；不能嵌套 tab；不能超过 5 个 tab；tab 切换不触发页面跳转
#### 变体
- line:     下划线型  // 选中项底部 2px 品牌色线
- pill:     胶囊型    // 选中项品牌色浅版背景，radius-full
- card:     卡片型    // 独立卡片感，选中项白底+阴影
- vertical: 垂直型    // 左侧导航场景，选中项左侧竖条
#### 状态
- active:   品牌色文字 + 对应变体选中样式
- hover:    neutral-100 背景或文字加深
- disabled: opacity 0.4，cursor not-allowed`,
      },
      {
        id: 'comp-dropdown',
        label: '下拉菜单',
        labelEn: 'Dropdown',
        icon: '▾',
        snippet: `### 下拉菜单
<!-- type: component-spec -->
- usage:      情境操作收纳——操作较多不适合平铺时使用；context-menu 用于右键，command 用于全局快捷操作（⌘K）
- prohibited: 常用操作不能藏进下拉（应直接展示）；菜单项不能超过 10 个（加分组或搜索）；不能在下拉内嵌套下拉
#### 变体
- dropdown:     常规下拉  // shadow-lg，radius-lg，min-width 160px
- context-menu: 右键菜单  // 同 dropdown，跟随鼠标位置
- command:      命令面板  // 居中覆盖，带搜索框，⌘K 唤起
#### 菜单项
- item:          height 32px，padding 0 12px，hover neutral-50 背景
- item-icon:     左侧 16px 图标（可选）
- item-shortcut: 右侧快捷键提示，text-xs neutral-400
- item-danger:   红色文字，用于删除等破坏性操作
- divider:       1px neutral-100 分割线，margin 4px 0
- group-header:  分组标题，text-xs uppercase neutral-400，padding 6px 12px`,
      },
      {
        id: 'comp-table',
        label: '表格',
        labelEn: 'Table',
        icon: '⊞',
        snippet: `### 表格
<!-- type: component-spec -->
- usage:      结构化数据对比展示——多属性并列、批量操作；数据量大时配合分页；sortable 用于需要排序的列
- prohibited: 移动端不能使用 bordered 变体；表头列数不能超过 8 列（超出考虑横向滚动或隐藏列）；不能在 table cell 内嵌套 table
#### 变体
- default:  默认      // 行底部 1px 分割线，无外框
- bordered: 完整格线  // 所有单元格 1px 描边
- striped:  斑马纹    // 奇数行 neutral-50 背景
- compact:  紧凑      // row-height 32px，正常为 44px
#### 元素
- th:           表头，背景 neutral-50，font-medium，text-xs uppercase
- td:           单元格，padding 12px 16px
- row-hover:    neutral-50 背景，150ms 过渡
- row-selected: 品牌色浅版背景
#### 功能
- sortable:      列头右侧排序箭头，点击切换升/降序
- selectable:    首列复选框，支持全选
- sticky-header: position sticky，滚动时表头吸顶`,
      },
      {
        id: 'comp-progress',
        label: '进度与加载',
        labelEn: 'Progress & Loading',
        icon: '▷',
        snippet: `### 进度加载
<!-- type: component-spec -->
- usage:      spinner 用于局部/按钮内加载，skeleton 用于页面首屏占位，progress-bar 用于有明确进度的任务
- prohibited: 不能在同一屏同时出现超过 2 种加载形态；不能用 spinner 替代 skeleton 做整页骨架屏；加载超过 3s 必须提供取消入口
#### 变体
- progress-bar:  横向进度条  // height 4-8px，品牌色填充，radius-full
- progress-ring: 环形进度    // SVG stroke，32-64px
- skeleton:      骨架屏      // shimmer 动画（gradient 左→右扫光）
- spinner:       旋转菊花    // 16/20/24px，品牌色或 neutral-400
- dots:          三点跳动    // 6px 圆点，依次上下跳动，等待/输入中
#### 状态
- determinate:   有确定进度值，显示百分比文字（可选）
- indeterminate: 无限循环动画`,
      },
      {
        id: 'comp-search',
        label: '搜索框',
        labelEn: 'Search',
        icon: '⌕',
        snippet: `### 搜索框
<!-- type: component-spec -->
- usage:      inline 用于局部/列表内搜索，overlay 用于全局搜索（⌘K 唤起），instant 用于实时过滤列表
- prohibited: 不能省略清空按钮；全局搜索必须支持键盘导航（↑↓ 选择，Enter 确认）；不能将搜索结果内嵌在触发器元素内
#### 变体
- inline:   内嵌搜索  // 普通输入框 + 左侧放大镜图标
- overlay:  全局搜索  // ⌘K 唤起，居中覆盖，最大宽度 560px
- instant:  实时搜索  // 输入即触发，下方结果下拉列表
#### 元素
- prefix-icon:        16px 放大镜，neutral-400
- clear-btn:          右侧 ✕，输入非空时显示
- shortcut-hint:      ⌘K 提示，右侧灰色
- results-dropdown:   搜索结果下拉，分组 + 关键词高亮`,
      },
      {
        id: 'comp-pagination',
        label: '分页',
        labelEn: 'Pagination',
        icon: '◁▷',
        snippet: `### 分页
<!-- type: component-spec -->
- usage:      数据量超出单页时使用；default 用于精确跳页，simple 用于移动端，mini 用于空间极度受限场景
- prohibited: 数据量少于 20 条时改用全量展示（不分页）；不能省略总条数信息；不能将分页放在内容中间
#### 变体
- default: 页码列表  // 上一页 + 页码 + 下一页
- simple:  简洁型    // 仅「< 上一页 / 下一页 >」
- mini:    极简型    // 纯文字「12 / 48」
#### 元素
- prev-next:   前后翻页按钮，height 32px
- page-item:   单页码，width 32px，选中态品牌色填充
- ellipsis:    省略号，连续页超过 7 页时截断
- page-size:   每页条数选择器（10/20/50），右侧（可选）`,
      },
      {
        id: 'comp-form-layout',
        label: '表单布局',
        labelEn: 'Form Layout',
        icon: '⊟',
        snippet: `### 表单布局
<!-- type: component-spec -->
- usage:      vertical 用于大多数表单，horizontal 用于密集配置页，inline 用于筛选条件组；超过 8 个字段考虑分步骤
- prohibited: 不能在同一表单内混用多种布局风格；不能省略必填标识（* 号）；单步表单字段不能超过 8 个
#### 变体
- vertical:   垂直布局  // label 在上，input 在下，间距 4px
- horizontal: 水平布局  // label 在左固定宽度（120px），input 占满剩余
- inline:     内联布局  // 字段同行排列，紧凑场景
#### 字段元素
- label:     12-13px，neutral-700，font-medium，必填项右侧红星 *
- helper:    11-12px，neutral-400，input 下方 4px
- error-msg: 11-12px，红色，替换 helper 显示
- field-gap: 字段之间垂直间距 16-20px`,
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

> 本文件是设计语言的唯一来源（Single Source of Truth）。可视化工具与 AI 提示词均由此文件生成。

---

## design-language
<!-- section: design-language -->

### keywords
<!-- type: list -->
- minimal        // 极简，去除装饰性噪音
- warm           // 温暖，非冷技术感
- trustworthy    // 可信，数据展示清晰准确

### personality
<!-- type: text -->
像一位有品位的设计师朋友——专业但不冷漠，简洁但有温度。

### ai-prompt-summary
<!-- type: ai-prompt -->
Design style: minimal and warm UI with soft neutral backgrounds, restrained use of brand color, generous whitespace, rounded corners (8–16px), subtle shadows. Typography uses a clean sans-serif, body text in dark gray (not pure black).

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
- success:        #34C97B  // 成功状态
- success-light:  #E8F8F0  // 成功浅版背景
- warning:        #F5A623  // 警告状态
- warning-light:  #FEF6E7  // 警告浅版背景
- error:          #F04646  // 错误状态
- error-light:    #FEF0F0  // 错误浅版背景

### neutral
<!-- type: color-scale -->
- neutral-0:    #FFFFFF  // 纯白，卡片背景
- neutral-50:   #F8F9FB  // 页面底色
- neutral-100:  #F1F3F7  // 次级背景、hover 态
- neutral-200:  #E4E7EF  // 分割线、边框
- neutral-400:  #9BA3B5  // placeholder、图标
- neutral-500:  #6B7385  // 次要文字
- neutral-700:  #374151  // 正文
- neutral-900:  #111827  // 标题

### gradient
<!-- type: gradient-group -->
- brand-gradient:  linear-gradient(135deg, #4F6EF7 0%, #9B72FF 100%)  // 品牌渐变

---

## typography
<!-- section: typography -->

### font-family
<!-- type: font-list -->
- sans:  "Inter", "PingFang SC", system-ui, sans-serif  // 界面主字体
- mono:  "JetBrains Mono", "Fira Code", monospace        // 代码

### type-scale
<!-- type: scale -->
- xs:   12px / 1.5 / 400  // 辅助说明、角标
- sm:   13px / 1.5 / 400  // 小号文字、表格
- base: 14px / 1.6 / 400  // 正文默认
- lg:   16px / 1.5 / 500  // 小标题
- xl:   20px / 1.4 / 600  // 区块标题
- 2xl:  24px / 1.3 / 700  // 页面主标题
- 3xl:  32px / 1.2 / 700  // Landing 大标题

---

## spacing
<!-- section: spacing -->

### scale
<!-- type: scale -->
- 1:    4px   // 最小间距
- 2:    8px   // 紧凑间距
- 3:    12px  // 小间距
- 4:    16px  // 标准间距
- 6:    24px  // 区块内间距
- 8:    32px  // 区块间距
- 12:   48px  // 节间距
- 16:   64px  // 页面级间距

### layout
<!-- type: layout -->
- sidebar-width:      240px   // 左侧导航宽度
- topbar-height:      56px    // 顶部导航高度
- content-max-width:  1280px  // 内容区最大宽度
- card-gap:           16px    // 卡片网格间距

### breakpoints
<!-- type: breakpoints -->
- sm:   640px   // 手机横屏
- md:   768px   // 平板竖屏
- lg:   1024px  // 平板横屏
- xl:   1280px  // 标准屏幕

---

## borders
<!-- section: borders -->

### radius
<!-- type: scale -->
- sm:    4px    // 小元素：badge、tag
- md:    8px    // 标准：input、button
- lg:    12px   // 卡片、下拉框
- xl:    16px   // 大卡片、模态框
- full:  9999px // 圆形：头像、pill 形按钮

### width
<!-- type: scale -->
- thin:    1px  // 默认边框
- medium:  2px  // 选中态、focus 态

---

## shadows
<!-- section: shadows -->

### elevation
<!-- type: shadow-scale -->
- none:  none                                    // 无阴影
- xs:    0 1px 2px rgba(0,0,0,0.04)             // 最轻，卡片默认
- sm:    0 2px 8px rgba(0,0,0,0.06)             // 轻度，hover 态卡片
- md:    0 4px 16px rgba(0,0,0,0.08)            // 中度，dropdown
- lg:    0 8px 32px rgba(0,0,0,0.10)            // 较重，模态框
- brand: 0 4px 20px rgba(79,110,247,0.30)       // 品牌色阴影，主按钮 hover

---

## motion
<!-- section: motion -->

### easing
<!-- type: easing-group -->
- ease-default:  cubic-bezier(0.4, 0, 0.2, 1)      // 默认，大多数状态切换
- ease-out:      cubic-bezier(0, 0, 0.2, 1)         // 元素入场
- ease-in:       cubic-bezier(0.4, 0, 1, 1)         // 元素离场
- ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)  // 弹性，微交互强调

### duration
<!-- type: scale -->
- fast:    100ms  // 极快，hover 颜色变化
- quick:   150ms  // 快速，按钮 press 态
- normal:  200ms  // 标准，状态切换
- slow:    300ms  // 较慢，模态框、页面过渡

### patterns
<!-- type: animation-pattern -->

#### entrance           // 入场动画
- fade-in:   opacity 0→1, duration: slow, easing: ease-out
- slide-up:  translateY(12px)→0 + opacity 0→1, duration: slow, easing: ease-out
- scale-in:  scale(0.95)→1 + opacity 0→1, duration: quick, easing: ease-spring

#### exit               // 离场动画
- fade-out:  opacity 1→0, duration: quick, easing: ease-in
- scale-out: scale(1)→0.95 + opacity 1→0, duration: fast, easing: ease-in

#### interaction        // 交互反馈
- button-press:  scale(0.97), duration: fast, easing: ease-default
- card-hover:    translateY(-2px) + shadow-sm→shadow-md, duration: normal, easing: ease-out

---

## components
<!-- section: components -->

### 按钮
<!-- type: component-spec -->
- usage:      主操作入口——表单提交、弹窗确认、页面级主操作；primary 变体每屏最多一个核心动作
- prohibited: 不能在表格行内使用 primary 变体；不能并排超过 2 个按钮；danger 仅用于不可逆操作
#### 变体
- primary:    主要按钮  // 品牌主色填充，核心操作
- secondary:  次要按钮  // 弱填充，辅助操作
- ghost:      幽灵按钮  // 透明背景，次要操作
- danger:     危险按钮  // 红色，破坏性操作
#### 尺寸
- sm:  height 28px, padding 0 12px  // 表格内、紧凑场景
- md:  height 36px, padding 0 16px  // 默认
- lg:  height 44px, padding 0 20px  // 表单提交、强调

### 输入框
<!-- type: component-spec -->
- usage:      单行文本录入——搜索框、表单字段；需配合 label 使用，placeholder 仅补充说明
- prohibited: 不能省略 label；只读展示改用纯文本；不能嵌套在 table cell 内
#### 状态
- focus:    描边变品牌色，3px focus ring（品牌色 15% 透明度）
- error:    红色描边 + 底部错误提示文字
- disabled: opacity 0.4，cursor not-allowed

### 卡片
<!-- type: component-spec -->
- usage:      内容容器——同类信息归组；适用于列表项、数据摘要；可点击时整体作为交互区域
- prohibited: 不能在 card 内嵌套 card；card 内不能出现超过 1 个 primary button
#### 变体
- default:     白底，shadow-xs，radius-lg
- interactive: hover 时 shadow-sm + translateY(-2px)

---

## illustration-style
<!-- section: illustration-style -->

### style-keywords
<!-- type: list -->
- flat-design      // 扁平风格，无强烈光影
- soft-colors      // 柔和色调，低饱和度
- geometric        // 几何形状构成
- minimal-detail   // 细节克制

### color-palette
<!-- type: text -->
使用品牌色系作为主角色，辅以暖白、米色作为背景色。阴影用低透明度品牌蓝，而非灰色。

### do-dont
<!-- type: rules -->
✅ DO:
- 使用圆角几何形状
- 保持色板统一（不超过 5 种颜色）

❌ DON'T:
- 写实风格、照片感纹理
- 饱和度过高的颜色（HSL Saturation > 70%）

### ai-prompt-template
<!-- type: ai-prompt -->
Flat illustration, {subject}, soft pastel colors with brand color accents, geometric shapes, friendly and minimal style, white background, generous negative space, clean vector art style. {additional_description}

---

## icon-style
<!-- section: icon-style -->

### specs
<!-- type: spec -->
- style:          线性描边（stroke-only，fill: none）
- grid:           24×24px 标准，16×16px 小尺寸，32×32px 大尺寸
- stroke-width:   1.5px（24px 网格），1.25px（16px 网格）
- stroke-linecap: round  // 端点圆润
- stroke-linejoin: round  // 转角圆润
- padding:        1px 光学安全边距（可用区域 22×22px）
- color:          currentColor  // 继承父元素颜色，单色
- usage: 功能性图标——导航、操作按钮、状态提示、表单前缀
- prohibited: 不能使用实心填充（fill 非 none）；不能使用阴影或渐变；描边不得超过 2px；16px 以下不使用复杂路径（超过 6 个锚点）；不能在图标内混用多种描边粗细

### size-usage
<!-- type: list -->
- 16px:  面包屑、tag 内图标、行内紧凑图标
- 20px:  正文旁默认行内图标
- 24px:  导航图标、按钮前缀图标
- 32px:  空状态插图、功能入口卡片

### ai-prompt-template
<!-- type: ai-prompt -->
SVG line icon for {subject}, 24×24 viewBox, 1px padding from edges, stroke-width 1.5, stroke-linecap round, stroke-linejoin round, fill none, monochrome currentColor, minimal geometric paths, balanced optical weight, no decorative details. Output only raw SVG <path> elements, no wrapper tags.

---

## ai-context
<!-- section: ai-context -->

### full-prompt
<!-- type: ai-prompt -->
You are building UI for this design system. Follow these rules strictly:

**Visual Language:** Minimal and warm. Generous whitespace. Soft neutral backgrounds. Restrained use of brand color. Never use pure black text.

**Colors:** Use token variables. Never hardcode hex values. Semantic colors only for their intended states.

**Typography:** Clean sans-serif. Body 14px/1.6. Headings semibold to bold. Never pure black (#000000).

**Spacing:** 4px base unit. Component padding 12–16px. Card padding 24px.

**Components:** Always check usage and prohibited rules before placing a component.
`

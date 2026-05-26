# Web Visual AI Editor Acceptance Criteria

## 1. 验收目标

V0.1 验收重点是确认插件完成最小闭环，而不是验证复杂编辑能力。

当前状态：

1. V0.1 已完成代码实现、自动化验证和用户手动验收反馈，作为 V0.2 开发基线。
2. V0.2 样式编辑器与 V0.3 评论增强已完成代码实现，并已通过 Chrome 手动验收。
3. V0.4 标尺测距、V0.5 共享元素与 V0.5.5 UI Refresh 已完成代码实现；V0.6 自动布局辅助、V0.7 字体读取/切换与 V0.8 直接操作基础层已完成代码接入。2026-05-26 已按 Vibma 选中画板二次对齐工具栏、样式面板、记录面板和评论弹窗 UI，并继续压缩顶部按钮比例、收起无效自动布局场景、修复相似元素长 selector 溢出，且已接入正式浏览器图标与 `Packages/` 打包流程。当前自动化已覆盖 104 个单元测试与 TypeScript；Chrome 真实插件图标点击仍待手动验收。

最小闭环：

1. 进入编辑模式。
2. Hover 高亮 DOM。
3. 点击选中 DOM。
4. 展示元素信息。
5. 添加评论。
6. 列表汇总记录。
7. 点击记录定位元素。
8. 导出 JSON。
9. 导入 JSON。
10. 复制 AI Prompt。

## 2. 功能验收

### 2.1 插件启动

Given 用户已安装插件  
When 用户点击 Chrome 插件图标  
Then 当前网页进入编辑模式，并显示插件面板

通过标准：

1. 页面右侧出现插件面板。
2. 宿主页面未整体刷新。
3. 控制台无关键报错。
4. Chrome 工具栏显示正式插件图标，不再使用默认扩展占位图标。

### 2.2 Hover 高亮

Given 当前页面处于编辑模式  
When 用户移动鼠标到任意普通 DOM 元素上  
Then 该元素出现 hover 高亮框

通过标准：

1. 高亮框位置与元素基本一致。
2. 高亮框不会遮挡点击。
3. 移动到新元素时，高亮框更新。

### 2.3 点击选中元素

Given 当前页面处于编辑模式  
When 用户点击一个普通 DOM 元素  
Then 插件选中该元素，并展示 selected 高亮框

通过标准：

1. 原页面按钮或链接不会被误触发。
2. Panel 展示最新选中元素。
3. selected 高亮和 hover 高亮有视觉区分。

### 2.4 元素信息展示

Given 用户已选中元素  
When Panel 更新  
Then Panel 展示元素基础信息

必须展示字段：

1. `tagName`
2. `id`
3. `className`
4. `selector`
5. `text`
6. `width`
7. `height`
8. `x`
9. `y`

### 2.5 添加评论

Given 用户已选中元素  
When 用户输入评论并点击保存  
Then 记录保存到当前页面记录列表

通过标准：

1. 评论为空时不能保存。
2. 保存成功后列表出现新记录。
3. 记录包含元素摘要和评论内容。

### 2.6 记录列表

Given 页面已有多条记录  
When 用户查看插件面板  
Then 列表展示所有记录

通过标准：

1. 记录按创建时间展示。
2. 每条记录能看到元素 selector 和评论摘要。
3. 列表为空时展示空状态。

### 2.7 点击记录定位

Given 页面已有记录  
When 用户点击某条记录  
Then 页面滚动定位到对应元素

通过标准：

1. 元素存在时滚动到视口可见区域。
2. Overlay 显示定位高亮。
3. selector 找不到时显示未匹配提示，记录不丢失。

### 2.8 JSON 导出

Given 当前页面已有记录  
When 用户点击导出 JSON  
Then 插件生成符合 `docs/DATA_FORMAT.md` 的 JSON

通过标准：

1. JSON 包含 `app`、`version`、`exportedAt`。
2. JSON 包含页面信息。
3. JSON 包含全部记录。
4. JSON 可以被再次导入。

### 2.9 JSON 导入

Given 用户有一份合法 JSON  
When 用户导入 JSON  
Then 插件恢复记录列表

通过标准：

1. 合法 JSON 可以导入。
2. 非法 JSON 给出明确错误。
3. selector 未匹配记录仍保留。

### 2.10 复制 AI Prompt

Given 当前页面已有记录  
When 用户点击复制 AI Prompt  
Then 剪贴板写入 AI Prompt

通过标准：

1. Prompt 包含页面 URL 和 title。
2. Prompt 包含每条记录的 selector、元素文本、位置和评论。
3. 复制成功后给出反馈。

### 2.11 V0.6 自动布局辅助

Given 当前页面处于编辑模式
When 用户选择一个父容器为 flex / grid 且有可操作兄弟元素的元素
Then Panel 展示父容器基础布局信息和布局参数

通过标准：

1. 默认只在 flex / inline-flex / grid / inline-grid 且兄弟元素数量大于 1 时展开自动布局区块。
2. 自动布局区块显示方向、Gap、Padding、Margin 等主参数；父容器 selector、对齐方式和布局说明在“高级布局信息”折叠区。
3. 普通 block / inline 父容器或没有兄弟元素时，不在样式面板主流程中展开完整自动布局控件；用户进入自动布局模式时显示轻量降级提示。
4. 用户能保存布局方向、对齐方式、目标间距和补充说明。
5. 保存后记录列表新增一条布局记录。
6. 导出 JSON 包含当前版本号、`layoutContext` 和 `layoutIntent`；当前 V0.8 构建版本号为 `0.8`。
7. 复制 Prompt 时包含“布局辅助”段。
8. 旧版 JSON 导入后布局字段降级为 `null`，不影响旧记录展示。

### 2.12 V0.7 字体读取与切换

Given 当前页面处于编辑模式
When 用户选择文本元素或包含文本的元素
Then Panel 的“字体 / 排版”分组展示字体相关字段

通过标准：

1. 展示 `fontFamily`、`fontSize`、`fontWeight`、`lineHeight`、`letterSpacing`。
2. 用户能输入字体栈和字间距，并看到临时预览。
3. 保存记录后记录包含 `fontChanges`。
4. 导出 JSON 包含 `version: "0.8"` 和合法 `fontChanges`。
5. 复制 Prompt 时包含“字体修改”段。
6. 导入 V0.7 JSON 后合法 `fontChanges` 保留；旧版本字体类 `styleChanges` 可派生为 `fontChanges`。

### 2.13 V0.8 直接操作基础层

Given 当前页面处于编辑模式
When 用户点击顶部“自动布局”并选择同父容器内的元素
Then 页面出现中部粉色拖拽横条、紫色虚线参考线反馈，并支持命中同级元素后的精准交换预览

通过标准：

1. 顶部浮动工具栏存在“自动布局”按钮。
2. 自动布局模式下，选中元素出现紫色描边选中框和元素中部粉色横向拖拽条。
3. 拖动横条时显示目标元素框、紫色虚线参考线和“交换第 N 位”位置标签。
4. 拖到同父容器兄弟元素上时，页面按鼠标实际命中元素实时预览交换，并有位移动画；松开后确认位置并自动新增布局记录。
5. 导出 JSON 为 `version: "0.8"`，布局记录包含 `layoutContext` 和 `layoutIntent.note`。
6. 退出编辑器后，本次拖动造成的 DOM 顺序恢复。
7. 相似元素区存在“共享元素”开关，开启后高亮相似元素并影响保存记录的 `sharedGroup`。
8. 字体区存在“读取本地字体”入口；不支持或拒绝权限时展示降级提示，手动字体栈输入仍可预览。

## 3. 体验验收

1. 面板不能遮挡整个页面，默认右侧浮层即可。
2. 面板布局清晰，元素信息、评论输入、记录列表、导入导出分区明确。
3. 顶部胶囊工具栏固定在页面顶部居中，浏览、选择、测量、评论、自动布局、记录、关闭按钮布局和 Figma 设计稿一致。
4. 面板顶部功能条包含属性/记录切换、共享元素开关和重置按钮，并可拖动面板，用户能把面板移开正在检查的页面区域。
5. 长度类数值输入采用左数值右单位的胶囊样式，默认 `px`，支持 `pt`，清空后回到 `0`。
6. 自动布局拖动时，紫色拖手、参考线、目标框和位置标签必须易于辨认。
7. Hover、selected、measurement、auto-layout 状态必须易区分。
8. 编辑模式状态必须明显。
9. 退出编辑模式后，宿主页面交互和本次拖动造成的 DOM 顺序恢复正常。
10. 导入失败、复制失败、无选中元素、空记录列表、本地字体读取失败都有明确提示。

## 4. 技术验收

1. MV3 manifest 格式正确。
2. 插件可以作为 unpacked extension 加载。
3. 构建命令成功。
4. Content Script 不污染宿主页面全局 CSS。
5. Panel 和 Overlay 使用 Shadow DOM 隔离样式。
6. 不需要后端服务。
7. 不需要登录。
8. 不加载远程脚本。
9. 不自动采集整页 DOM。

当前工程验证命令：

```bash
cd extension
npm run verify
```

当前工程加载路径：

```text
extension/dist
```

在 Chrome 中使用 `Load unpacked` 加载 `extension/dist`。

当前本地验收页面：

```text
extension/test-pages/basic.html
```

当前自动化验证结果：

1. 当前 V0.8 已通过 `cd extension && npm run verify`，覆盖 104 个单元测试、TypeScript 类型检查和 Vite 构建。
2. Chrome 148 隔离自动化烟测已通过：使用 `--remote-debugging-pipe` + `--enable-unsafe-extension-debugging` 调用 CDP `Extensions.loadUnpacked` 加载 `extension/dist`，再通过项目 service worker 执行 `chrome.scripting.executeScript` 和 `WVAIE_TOGGLE_EDITOR` 注入链路。
3. 本次 Chrome 烟测覆盖 Panel / Overlay 创建、真实页面元素点击、V0.4 A/B 双元素测距、V0.5 相似按钮批量记录、记录列表展示、JSON 导出、Panel 拖动、删除弹窗焦点循环和 Prompt 复制。
4. V0.4/V0.5/V0.5.5 导出 JSON 已复核：测距记录包含 `measurements.pair.horizontalDistance: 24`；批量记录包含 `sharedGroup.totalMatched: 3` 和 2 个其他目标。
5. V0.6 自动化质量门禁已复核：导出版本为 `0.6`，新增布局读取、布局 JSON 兼容和 Prompt 布局段测试；页面内 content script 烟测已确认选中 `#save-button` 后读取父容器 `display: flex`、`gap: 12px`，保存布局意图后记录包含 `layoutContext` 与 `layoutIntent`。
6. V0.6 页面内验收烟测已通过：保存“横向 + 居中 + 16px gap”布局意图后，导出 JSON 版本为 `0.6` 且包含 `layoutIntent.gap: "16px"`；点击“复制 Prompt”后剪贴板文本包含“布局辅助”和“目标间距：16px”。
7. V0.7 自动化质量门禁已复核：导出版本为 `0.7`，新增字体字段读取、`fontChanges` JSON 兼容和 Prompt 字体段测试。
8. V0.7 页面内验收烟测已通过：选中 `#style-primary-button` 后“字体 / 排版”分组展示字体字段，修改字体为 `Inter, Arial, sans-serif`、字间距为 `0.4px` 后可预览；保存记录后导出 JSON 包含 `fontChanges`，复制 Prompt 包含“字体修改”和“字间距（letterSpacing）”。
9. V0.8 自动化质量门禁已复核：导出版本升级为 `0.8`，`npm run verify` 通过；Chrome headless 页面内烟测已确认顶部“自动布局”、V0.8 标识、紫色拖手、同父容器换位、布局记录、退出恢复、共享元素开关与字体读取入口。
10. 当前自动化环境中，远程调试端口不支持 `Extensions.loadUnpacked`，`--load-extension` worker 调试上下文也无法复用 `chrome.scripting.executeScript`；因此 V0.6/V0.7 烟测使用页面内模拟 content script 消息验证业务链路，不能替代人工点击真实插件图标。
11. Chrome 普通 `--load-extension` / `--disable-extensions-except` 启动参数在当前 Chrome 148 环境未注册项目扩展；自动化加载需使用 CDP pipe 模式，正式人工验收仍使用扩展管理页的 `Load unpacked`。
12. CDP `Extensions.triggerAction` 对冷启动 action 存在预热波动，本次主流程使用项目 worker 直接调用同款注入 API 验证；后续人工验收仍需确认真实点击插件图标和整体视觉手感。

手动验收步骤：

1. 运行 `npm run verify`。
2. 在 Chrome 打开扩展管理页。
3. 使用 `Load unpacked` 加载 `extension/dist`。
4. 打开 `extension/test-pages/basic.html`。
5. 点击插件图标进入编辑模式。
6. 逐项验证 hover、选中、评论保存、记录定位、JSON 导出、JSON 导入和 Prompt 复制。
7. 选中按钮组、卡片或列表内元素，验证 V0.6 布局辅助展示和保存布局意图。
8. 点击顶部“自动布局”，选中按钮组内元素，拖动紫色横条验证 V0.8 同父容器换位、参考线反馈和退出恢复。
9. 选中按钮或标题文本，验证 V0.7/V0.8 字体字段展示、本地字体读取入口、字体预览和保存字体修改。
10. 导出 JSON 并复制 Prompt，确认记录包含 `layoutContext` / `layoutIntent`、`fontChanges`、“布局辅助”段和“字体修改”段，JSON 版本为 `0.8`。

当前已知风险：

1. `npm audit --audit-level=moderate` 报告 Vite / esbuild / Vitest 开发工具链存在 5 个 moderate 漏洞。
2. `npm audit fix` 无法在非破坏性范围内修复。
3. npm 建议的 `npm audit fix --force` 会升级到 breaking 的 Vite 版本，暂未自动执行。
4. 该风险当前影响开发服务器链路，不影响已构建 extension 的运行代码；后续应单独安排工具链升级验证。

## 5. 暂不验收内容

V0.1 不验收：

1. 样式编辑器。
2. 自动生成 CSS。
3. AI 自动改代码。
4. React / Vue 组件识别。
5. 多人协作。
6. 云端同步。
7. iframe 深度编辑。
8. Shadow DOM 深度解析。
9. 标尺测距。
10. 自动布局。

## 6. V0.2 样式编辑器验收

V0.2 验收重点是确认基础样式编辑器闭环，而不是生产级 CSS 生成。

当前状态：代码实现已完成，已通过 Chrome 手动验收；本节保留作为回归验收口径。

### 6.1 样式读取

Given 用户选中普通 HTMLElement  
When Panel 更新  
Then Panel 样式预览区按"颜色 / 排版 / 内边距 / 外边距 / 边框 / 阴影"分组展示白名单样式

通过标准：

1. 样式属性有固定展示顺序（与 `STYLE_PROPERTY_DEFINITIONS` 一致）。
2. 非 HTMLElement 元素显示"该元素暂不支持样式预览"提示。
3. 不读取输入框 value。

### 6.2 样式预览

Given 用户已选中元素  
When 用户修改 `backgroundColor`、`fontSize`、`borderRadius` 或其他白名单属性  
Then 页面元素即时显示预览效果

通过标准：

1. 预览只作用于当前元素。
2. 预览写入临时 inline style，原 inline 值通过 `WeakMap` 缓存。
3. 输入数值类属性时自动追加 `px`。
4. 颜色取色器和文本输入双向同步。
5. 无效输入不应导致页面或 Panel 报错。

### 6.3 重置预览

Given 用户已经修改当前元素样式  
When 用户点击"重置当前预览"  
Then 当前元素恢复修改前状态

通过标准：

1. 恢复原始 inline style，未修改属性不受影响。
2. 当前 `styleDraft` 被清空。
3. 退出编辑模式或导入 JSON 时清理全部预览。

### 6.4 保存样式记录

Given 用户修改了一个或多个样式  
When 用户点击"保存记录"  
Then 记录保存 `styleChanges`

通过标准：

1. `styleChanges` 包含 `property`、`label`、`oldValue`、`newValue`，数值型附带 `unit: "px"`。
2. 评论为空但有样式变化时允许保存。
3. 评论为空且无样式变化时按钮禁用，不允许保存。
4. 列表项展示样式差异摘要。

### 6.5 JSON 和 Prompt

Given 当前页面存在样式记录  
When 用户导出 JSON 或复制 Prompt  
Then 输出内容包含样式差异

通过标准：

1. JSON 版本升级到 `0.2`。
2. 导入 V0.1 JSON 仍可成功（自动补 `styleChanges: []`）。
3. Prompt 中每条记录附 `样式修改：` 子列表。
4. Prompt 明确提示 AI 不要机械写 inline style，应优先结合现有样式体系实现。

### 6.6 V0.2 手动验收步骤

1. 运行 `cd extension && npm run verify`。
2. 在 Chrome 扩展管理页 `Load unpacked` 加载 `extension/dist`。
3. 打开 `extension/test-pages/basic.html`，关注页面的 `主要按钮`、`样式编辑器验收目标` 区块。
4. 点击插件图标进入编辑模式。
5. 依次验证：选中按钮 → 改背景色和圆角 → 看到即时预览；选中卡片 → 改字号和阴影；选中间距块 → 改 padding 和 margin。
6. 验证"重置当前预览"恢复 inline style。
7. 验证保存样式记录（评论为空）成功，列表展示样式摘要。
8. 验证导出 JSON 含 `styleChanges` 和 `version: "0.2"`；尝试导入旧 V0.1 JSON。
9. 验证复制 Prompt 文本包含 `样式修改：` 段落。
10. 验证退出编辑模式后页面回到初始视觉，没有插件残留的 inline style。

## 7. V0.3 评论增强验收

V0.3 验收重点是确认评论结构化（类型、优先级、状态、交互态、作用域）、编辑/删除、筛选、Prompt 分组的完整闭环。

当前状态：代码实现已完成，已通过 Chrome 手动验收；本节保留作为回归验收口径。

### 7.1 类型/优先级/状态选择

Given 用户已选中元素或处于页面评论模式
When 用户在 CommentEditor 中选择类型、优先级
Then 保存的记录包含 `category`、`priority`、`status: open` 字段

通过标准：

1. 类型下拉包含：视觉/文案/交互/布局/数据/状态（共 6 项）。
2. 优先级下拉包含：高/中/低（共 3 项）。
3. 默认值：类型=视觉、优先级=中、状态=待处理。

### 7.2 交互态记录

Given 用户已选中元素
When 用户选择 `category = 交互` 或 `category = 状态`
Then 自动展开 `interactionState` 下拉

通过标准：

1. 其他类型时可点击"+ 添加交互态"手动展开。
2. 交互态选项：默认/悬停/聚焦/按下/禁用/加载/空状态/错误。
3. Prompt 输出包含"交互态：xxx"。

### 7.3 页面级评论

Given 用户不选元素
When 用户写入并保存评论
Then 记录 `scope = "page"`，`element = null`

通过标准：

1. 列表中显示"页面评论"占位（而非 selector）。
2. 不展示交互态选择（页面级不需要）。
3. JSON 导出/导入正确处理 `element: null`。
4. Prompt 输出"作用域：页面级评论"。

### 7.4 编辑记录

Given 列表中存在记录
When 用户点击"编辑"按钮
Then CommentEditor 进入编辑模式，预填原值

通过标准：

1. 编辑模式显示橙色"编辑模式：正在修改记录"横幅。
2. 按钮文案变为"保存修改" + "取消"。
3. 保存后原 `id`、`createdAt`、`element`、`styleChanges` 保留，`updatedAt` 刷新。
4. 取消编辑回到默认 CommentEditor。

### 7.5 删除记录

Given 列表中存在记录
When 用户点击"删除"按钮
Then 弹出 Panel 内 ConfirmDialog 二次确认

通过标准：

1. 默认聚焦"取消"，避免误删。
2. 点击"确认"删除记录；点击"取消"或背景关闭对话框不删除。
3. 不使用 `window.confirm` 阻塞宿主页面。

### 7.6 状态切换

Given 列表中存在记录
When 用户点击状态徽标下拉
Then 状态切换为 open / resolved / deferred

通过标准：

1. 状态变更刷新 `updatedAt`。
2. 当前筛选下记录可能隐藏，状态消息提示用户。

### 7.7 筛选

Given 列表有多种类型和状态的记录
When 用户在筛选条选择"状态：待处理"或"类型：交互"
Then 列表只展示匹配项

通过标准：

1. 类型筛选默认"全部"，可选 6 种类型。
2. 状态筛选默认"全部"，可选 3 种状态。
3. 筛选结果为空时显示"没有符合筛选条件的记录"。
4. 总记录数显示在标题中：`修改记录 (N)`。

### 7.8 JSON 兼容

Given 用户导入 V0.1 或 V0.2 JSON
When 解析完成
Then 所有记录补齐 V0.3 默认元信息

通过标准：

1. V0.1/V0.2 记录默认：category=visual、priority=medium、interactionState=null、scope=element。
2. V0.1/V0.2 status 保持原值（open/resolved）。
3. V0.3 导入 V0.3 JSON 完整保留所有字段。
4. V0.3 导出的 JSON 版本为 `0.3`。

### 7.9 Prompt 分组

Given 当前 session 含多种类型的记录
When 用户点击复制 Prompt
Then Prompt 按"视觉 / 文案 / 交互 / 布局 / 数据 / 状态"分组

通过标准：

1. 开头总览：`总览：共 N 条记录（必改 X 条 / 建议 Y 条 / 备注 Z 条）`。
2. 只输出存在记录的分组，避免空标题。
3. 组内按优先级（高 → 中 → 低）排序。
4. deferred 记录标注 `（暂缓 / 仅供参考）`。
5. 页面级记录显示"作用域：页面级评论"。
6. 交互态记录显示"交互态：xxx"。

### 7.10 V0.3 手动验收步骤

1. 运行 `cd extension && npm run verify`。
2. 在 Chrome 扩展管理页 `Load unpacked` 加载 `extension/dist`。
3. 打开 `extension/test-pages/basic.html`，关注 `V0.3 评论增强验收目标` 区块。
4. 点击插件图标进入编辑模式。
5. 依次验证：
   - 选中悬停按钮 → 类型=交互 + 交互态=悬停 → 保存记录
   - 选中禁用按钮 → 类型=交互 + 交互态=禁用 + 优先级=高 → 保存记录
   - 选中空状态卡片 → 类型=状态 + 交互态=空状态 → 保存记录
   - 选中输入框 → 类型=交互 + 交互态=聚焦 → 保存记录
   - 不选元素 → 在 CommentEditor 中切换为页面评论 → 写"整体节奏太挤" → 保存
6. 验证记录列表显示类型/优先级/状态徽标。
7. 验证点击状态徽标可切换 open/resolved/deferred。
8. 验证点击"编辑"进入编辑模式，修改类型并保存。
9. 验证点击"删除"弹出 ConfirmDialog，点击取消不删除。
10. 验证类型筛选"交互"和状态筛选"待处理"组合，列表正确过滤。
11. 验证导出 JSON 含 `version: "0.3"`、新字段（category/priority/status/interactionState/scope）。
12. 验证导入 V0.2 JSON 仍可成功，所有记录自动补齐默认元数据。
13. 验证复制 Prompt 内容按类型分组、按优先级排序、含总览统计、deferred 标注、页面作用域。
14. 验证退出编辑模式后页面回到初始视觉，没有插件残留。

## 8. V0.4 标尺测距验收

V0.4 验收重点是确认元素尺寸、视口距离、父容器距离、双元素测距的完整闭环，并将测距结果结构化保存到记录和 Prompt。

当前状态：代码实现已完成；当前 V0.8 构建已覆盖 V0.4 能力，Chrome 148 pipe 自动烟测已复核双元素测距 JSON 落库，等待 Chrome 手动视觉与交互复核。

### 8.1 元素尺寸展示

Given 用户已选中元素
When Panel 更新
Then Panel 显示"尺寸：W × H px"，且 Overlay 在选中框右上角显示尺寸标签

通过标准：

1. 数值取整。
2. 标签自动避让视口边缘（上方超出时切换到下方）。
3. selected 元素切换时数值实时更新。

### 8.2 视口距离

Given 用户已选中元素
When Panel 更新
Then Panel 显示"距视口"四个数值（上/右/下/左）

通过标准：

1. 4 个数值取整。
2. 元素跨出视口时显示负值。

### 8.3 父容器距离

Given 用户已选中元素
When Panel 更新
Then Panel 显示"距父容器"四个数值 + 父容器 selector

通过标准：

1. 父容器 selector 截断到 32 字符。
2. 父容器 rect 为 0 时显示"无父容器距离"。

### 8.4 双元素测距

Given 用户点击"开始双元素测距"按钮
When 用户依次点击元素 A 和元素 B
Then Overlay 显示 A/B 紫粉虚线高亮框、跨视口紫色虚线参考线，以及距离线和数值标签

通过标准：

1. 进入测距模式时 Panel 显示"请点击页面元素选择 A"。
2. 选完 A 后 Panel 显示"请点击页面元素选择 B"。
3. 等待选择 B 时，如果用户在页面上再次点击 A，系统直接取消 A 并回到"请选择 A"，不需要回面板点"重新测距"。
4. 选完 B 后 Overlay 显示水平/垂直虚线距离线与跨视口虚线参考线，Panel 显示水平/垂直/中心距离。
5. 提供"重新测距"和"退出测距模式"按钮。

### 8.5 附加测距复选框

Given 当前选中元素，且 measurement 不为 null
When CommentEditor 渲染
Then 显示"附加测距数据"复选框

通过标准：

1. 默认勾选。
2. 取消勾选后保存的记录 `measurements` 为 `null`。
3. 双元素测距模式下复选框强制为 true 且禁用，显示"双元素测距必须附测距"提示。
4. 页面级评论模式（scope === "page"）时不显示复选框。

### 8.6 保存测距到记录

Given 用户当前有测距数据
When 用户勾选"附加测距"并保存记录
Then 记录 `measurements` 字段包含完整数据

通过标准：

1. 取消勾选时 `measurements = null`。
2. 双元素测距记录强制写入 `pair`。
3. 编辑现有记录时可重新勾选/取消。

### 8.7 JSON 兼容

Given 用户导入 V0.1 / V0.2 / V0.3 / V0.4 JSON
When 解析完成
Then 所有旧版本记录 `measurements` 默认为 `null`，V0.4 记录 measurements 完整保留

通过标准：

1. 当前 V0.8 构建导出 JSON 的 `version: "0.8"`，单元素测距记录的 `sharedGroup`、`layoutContext`、`layoutIntent` 默认可为 `null`，无字体修改时 `fontChanges` 可为空数组。
2. V0.1 / V0.2 / V0.3 JSON 导入后所有记录都有 `measurements` 字段。
3. V0.4 JSON 导入后 measurements 字段完整保留。

### 8.8 AI Prompt 测距段落

Given 当前 session 含有带 measurements 的记录
When 用户点击复制 Prompt
Then Prompt 中带 measurements 的记录附"测距：" 子段落

通过标准：

1. `measurements === null` 的记录不输出测距子段落。
2. `parent === null` 时不输出"距父容器"行。
3. `pair === null` 时不输出"与目标元素"行。
4. 含 pair 的记录显示水平/垂直/中心距离。

### 8.9 滚动 / resize 更新

Given Overlay 显示尺寸标签或测距线
When 用户滚动页面或 resize 视口
Then 标签和距离线位置实时更新

### 8.10 V0.4 手动验收步骤

1. 运行 `cd extension && npm run verify`。
2. 在 Chrome 扩展管理页 `Load unpacked` 重新加载 `extension/dist`（或刷新已加载插件）。
3. 打开 `extension/test-pages/basic.html`，关注 `V0.4 标尺测距验收目标` 区块。
4. 点击插件图标进入编辑模式。
5. 依次验证：
   - 选中"A 按钮" → Panel 显示尺寸、距视口、距父容器；Overlay 显示尺寸标签
   - 点击"开始双元素测距" → 选中 A 按钮 → 选中 B 按钮 → Overlay 显示紫/粉高亮 + 距离线
   - Panel 显示水平距离 ≈ 24px（gap 设置）
   - 勾选/取消"附加测距数据"
   - 保存记录后查看 RecordList 中的记录
6. 选中"选中我，查看距父容器 padding=40px"子元素 → 距父容器四边应为 40px。
7. 编辑现有记录，验证 measurement 重新读取并显示。
8. 导出 JSON → 检查 `version: "0.8"`、`measurements` 字段，以及单元素记录的 `sharedGroup: null`。
9. 导入 V0.3 / V0.2 / V0.1 JSON → 所有记录 `measurements` 默认 null。
10. 复制 Prompt → 含 `measurements` 的记录应有"测距："子段落（尺寸/视口/父容器/目标元素）。
11. 退出测距模式 → Overlay 清空。
12. 退出编辑模式 → 页面无插件残留。

## 9. V0.5 共享元素验收

V0.5 验收重点是确认“识别同类元素 -> 用户确认批量范围 -> 结构化导出”的闭环，不验证框架组件识别或自动修改代码。

当前状态：代码实现完成，已通过单元测试、TypeScript、构建验证与 Chrome 148 pipe 自动烟测；相似元素长 selector 已限制在面板宽度内显示，等待 Chrome 手动视觉与交互复核。

### 9.1 功能要求

1. 选中 `V0.5 共享元素验收目标` 中的任一卡片、蓝色按钮或列表项后，Panel 展示相似元素数量、匹配类型和 selector 列表。
2. 聚焦或 hover selector 列表项时，页面对应目标出现短暂定位闪烁。
3. 点击“高亮全部”时，当前元素与全部候选出现红粉虚线框，3 秒后淡出并清理。
4. 勾选“应用到相似元素”保存记录后，记录列表显示“批量 × N”徽标；未勾选时为普通单元素记录。
5. 范围筛选“单元素 / 批量”分别仅显示对应记录；点击批量徽标可再次高亮保存范围。
6. 编辑批量记录时复选框默认勾选，取消后保存应清除 `sharedGroup`。
7. 页面级评论仍可新建和编辑，且其 `element`、`interactionState`、`measurements`、`sharedGroup` 始终为 `null`，`styleChanges` 始终为空数组。
8. 匹配特征、className 或 selector 很长时，Panel 不出现横向溢出；列表行用省略号裁切，悬停可看完整 title。

### 9.2 数据与 Prompt 要求

1. 新导出的 JSON 为 `version: "0.8"`，批量记录包含 `sharedGroup.matchLevel/primaryFeature/totalMatched/truncated/targets`。
2. 导入 V0.1 至 V0.4 数据时，各记录补 `sharedGroup: null`。
3. 导入 V0.5 / V0.6 / V0.7 / V0.8 批量记录时，保存的 `sharedGroup` 原样保留，不重新识别页面。
4. AI Prompt 对批量记录输出“作用范围”及中文匹配级别；截断结果输出提示。
5. 导入包含元素残留字段的页面级记录时自动清空这些字段；元素级记录缺少合法 `element` 时提示导入失败。

### 9.3 手动验收步骤

1. 运行 `cd extension && npm run verify`。
2. 在 Chrome 扩展管理页重新加载 `extension/dist`，打开 `extension/test-pages/basic.html`。
3. 选中四张 `.shared-card` 中任意一张，确认计数为 4 并点击“高亮全部”。
4. 选中三个 `.shared-btn.btn-primary` 中任意按钮，勾选批量应用，填写评论并保存。
5. 切到记录页检查批量徽标、范围筛选、批量高亮；导出 JSON 与复制 Prompt 复核批量范围。
6. 对五个 `.shared-item` 重复一次保存与取消共享编辑流程。
7. 新增一条页面评论并编辑保存，导出后确认其不含元素、交互态、样式变更、测距或共享范围。
8. 退出编辑模式，确认无高亮框、面板或宿主页面交互残留。

## 10. V0.5.5 UI Refresh 验收

V0.5.5 验收重点是确认视觉组件已经真正接入主流程，同时确认为 UI 重构补充的键盘与编辑态隔离没有回归。

当前状态：代码整合完成，当前 V0.8 构建已通过 104 个单元测试、TypeScript、Vite build；2026-05-26 已通过 Vibma 读取 Figma 选中画板并二次对齐顶部工具栏、383px 样式面板、记录面板和评论弹窗，且已继续收紧顶部按钮比例、自动布局展示规则、相似元素长文本裁切和保存按钮不换行，等待 Chrome 手动视觉与交互复核。

### 10.1 视觉与布局

1. 浮动工具栏固定在页面顶部，按钮顺序为浏览、选择、测量、评论、自动布局、记录与关闭，且操作均可用。
2. Panel 使用 Figma 设计稿中的 383px 深色毛玻璃 Inspector、深灰 8px 控件和蓝紫强调色。
3. Panel 默认位于右侧，拖动顶部功能条后可自由移动，并在视口内保留可操作区域。
4. 元素信息、样式编辑、测距、相似元素、评论、记录行和交付区均保持明确的视觉层级。
5. 选中元素时 Overlay 显示红粉选中框与包含 tag/尺寸的深色标签；评论记录显示粉紫编号点；测距线使用紫色虚线参考效果，相似目标使用红粉高对比反馈。
6. 工具栏外观与 Figma 顶栏一致：黑色胶囊背景、34px 紧凑图标按钮、Figma 导出图标、圆形 hover / active 态、记录按钮文字和蓝色数量徽标；导入、导出 JSON 与复制 Prompt 仍保留在 Panel 交付区。
7. Panel 顶部功能条外观与 Figma 样式面板一致：属性/记录切换、共享元素开关、重置按钮在同一行，控件高度为 42px 级，且该行作为拖拽区域。
8. 相似元素匹配特征、selector 列表和评论区保存按钮在 383px 面板内不溢出、不换行破坏布局。

### 10.2 可访问性与回归

1. 同时显示页面评论与元素评论时，点击任意 label 均只聚焦其对应控件，页面中不存在重复表单 `id`。
2. 编辑页面评论时不显示元素评论保存入口，保存后记录仍为页面作用域。
3. 点击删除记录后，焦点先落在“取消”；`Tab` / `Shift+Tab` 不离开对话框；按 `Escape` 关闭后焦点恢复。
4. 使用键盘可操作批量范围徽标、“高亮全部”、属性/记录导航和工具栏按钮；工具栏图标按钮必须有明确 `aria-label`。
5. 开启系统减少动态效果时，卡片/按钮/批量淡出等非必要 transition 不影响操作。
6. 拖动 Panel 时不会触发页面元素选择；拖动释放、取消或退出编辑模式后无全局事件残留。
7. 评论模式弹窗初始聚焦 textarea，`Esc` 可关闭当前弹窗，保存后仍停留在评论模式以便继续点选元素。

### 10.3 手动验收步骤

1. 运行 `cd extension && npm run verify` 和 `cd extension && npm run package`，在 Chrome 扩展管理页重新加载 `extension/dist`。
2. 打开 `extension/test-pages/basic.html`，点击插件图标，检查浮动工具栏、暗色面板和空状态卡片；工具栏需对齐 Figma 顶栏的按钮顺序、胶囊质感、Figma 图标、34px 紧凑按钮比例、圆形 hover / active 态与记录蓝色徽标。
3. 拖动 Panel 顶部功能条到页面左侧、底部和右侧边缘，确认拖动顺畅且不会越出视口；调整窗口尺寸后确认 Panel 仍可见。
4. 选中普通元素，检查元素尺寸标签、样式卡片、页面评论与元素评论各自控件 label 聚焦关系。
5. 点击顶部“评论”，再点击页面任意元素，确认元素旁出现黑色评论弹窗与粉紫圆形编号；填写评论并保存后，记录列表新增元素记录，Overlay 保留该元素的评论编号点。
6. 在样式编辑中选中一个长度输入，确认数值框与单位胶囊分离，默认 `px`，切换到 `pt` 后自动换算，清空后变为 `0`。
7. 完成一次 V0.4 双元素测距与一次 V0.5 批量范围保存，检查 Overlay 色彩、记录行块、记录蓝色徽标与交付区；当前 Chrome pipe 自动烟测已覆盖该数据闭环，人工复核重点放在视觉判断与手感。
8. 新增并编辑页面评论，确认元素评论保存入口在编辑期间不出现，导出数据仍满足第 9 节页面级字段约束。
9. 删除一条记录，使用键盘验证取消焦点、焦点循环、`Escape` 关闭与焦点恢复。
10. 切换到系统“减少动态效果”后复核主要交互，再退出编辑模式确认宿主页面无残留。

## 11. V0.7 字体读取与切换验收

### 11.1 手动验收步骤

1. 运行 `cd extension && npm run verify`，在 Chrome 扩展管理页重新加载 `extension/dist`。
2. 打开 `extension/test-pages/basic.html`，点击插件图标进入编辑模式。
3. 选中 `主要按钮` 或 `卡片标题`。
4. 展开“字体 / 排版”，确认展示字体、字号、字重、行高和字间距。
5. 将字体输入为 `Inter, Arial, sans-serif`，将字间距输入为 `0.4px`，确认页面产生临时预览。
6. 点击“保存记录”，切换到记录页。
7. 导出 JSON，确认版本为 `0.8` 且记录包含 `fontChanges`。
8. 复制 Prompt，确认包含“字体修改”和对应字体字段。
9. 点击“重置”或退出编辑模式，确认临时预览不会继续污染宿主页面。

## 12. V0.8 直接操作基础层验收

### 12.1 手动验收步骤

1. 运行 `cd extension && npm run verify`，在 Chrome 扩展管理页重新加载 `extension/dist`。
2. 打开 `extension/test-pages/basic.html`，点击插件图标进入编辑模式。
3. 点击顶部浮动工具栏“自动布局”。
4. 选中按钮组中的一个按钮，确认选中框变成紫色描边，元素中部出现粉色横向拖拽条。
5. 拖动横条压到另一个同级按钮上，确认出现目标框、紫色虚线参考线和“交换第 N 位”标签，并能看到元素实时预览交换与让位动画。
6. 松开后确认当前预览顺序被保留，记录列表新增“布局调整”记录。
7. 导出 JSON，确认版本为 `0.8`，记录包含 `layoutContext` 与 `layoutIntent.note`。
8. 退出编辑器，确认按钮顺序恢复到拖动前。
9. 选中相似按钮或列表项，打开“共享元素”开关，确认整组相似元素高亮。
10. 展开“字体 / 排版”，点击“读取本地字体”；支持环境应出现字体族选项，不支持环境应显示降级提示且手动字体栈仍可预览。

## 13. 建议测试页面

V0.1 后续应创建一个本地测试页面，至少包含：

1. 标题文本。
2. 普通段落。
3. 主按钮和次按钮。
4. 表单输入框。
5. 卡片列表。
6. 表格或列表。
7. 空状态区域。

V0.2 测试页面额外包含：

1. 主要按钮（验证背景色、圆角、阴影修改）。
2. 卡片（验证字号、阴影修改）。
3. 间距块（验证 padding、margin 修改）。

V0.3 测试页面额外包含：

1. 悬停按钮（验证 hover 状态）。
2. 禁用按钮（验证 disabled 状态）。
3. 聚焦输入框（验证 focus 状态）。
4. 空状态卡片（验证 empty 状态）。
5. Loading skeleton（验证 loading 状态）。
6. 错误 banner（验证 error 状态）。

V0.4 测试页面额外包含：

1. A 按钮 + B 按钮（双元素水平测距样本，gap=24px）。
2. 父容器 + 子元素（父容器 padding=40px，子元素 width=200px）。
3. 提示文本标注预期像素值，便于人工核对。

V0.5 测试页面额外包含：

1. 四张同 class 卡片。
2. 三个同 class 主按钮与一个负例按钮。
3. 五个同 class 列表项。

V0.7 / V0.8 测试页面额外包含：

1. 带明确字体、字号、字重、行高的标题或按钮。
2. 可用于检查 `fontFamily` 和 `letterSpacing` 预览的文本元素。
3. 同父容器内至少两个按钮或卡片，用于检查自动布局拖动换位。
4. 多个 class 相同的按钮、卡片或列表项，用于检查共享元素开关。

测试页面用于确认插件能覆盖常见 DOM 结构、交互态、测距、批量范围、字体场景与同父容器换位场景。

## 14. 文档同步验收

每次功能开发完成后，必须检查：

1. `docs/DEVELOPMENT_PLAN.md` 是否更新任务状态。
2. `docs/PRODUCT_SPEC.md` 是否仍与功能范围一致。
3. `docs/TECH_ARCHITECTURE.md` 是否仍与代码架构一致。
4. `docs/DATA_FORMAT.md` 是否仍与实际导入导出一致。
5. `DOCUMENTATION_INDEX.md` 是否需要更新文档状态。

# Web Visual AI Editor Technical Architecture

## 1. 技术目标

V0.1 使用 Chrome Extension Manifest V3 实现一个无需后端服务的本地插件闭环。插件只在用户点击后对当前 tab 注入能力，不默认常驻所有页面。

核心技术目标：

1. MV3 插件可安装。
2. 当前页面可进入和退出编辑模式。
3. 页面内可以 hover、选中、定位 DOM 元素。
4. 插件 UI 不污染宿主页面样式。
5. 编辑记录可以导入、导出和复制 Prompt。

当前阶段：

1. V0.1 已完成代码实现，并通过用户手动验收反馈。
2. V0.2 样式编辑器已完成代码实现，已通过 Chrome 手动验收。
3. V0.3 评论增强已完成代码实现，已通过 Chrome 手动验收。
4. V0.4 标尺测距已完成代码实现，并通过 Chrome 148 pipe 自动烟测的数据闭环，仍待 Chrome 手动视觉与交互验收。
5. V0.5 共享元素闭环已完成代码实现：相似识别、批量高亮、`sharedGroup` 记录、范围筛选和 Prompt 输出均已接入，并通过 Chrome 148 pipe 自动烟测，等待 Chrome 手动视觉与交互验收。
6. V0.5.5 UI Refresh 代码整合已完成：Sketch-style 哑光深色 Inspector、Figma 对齐的黑色胶囊浮动工具栏、可拖动 Panel、紧凑记录行与 Overlay 红粉高对比反馈均已接入；已通过 Chrome 148 pipe 自动烟测，等待 Chrome 视觉与键盘回归验收。
7. V0.6 自动布局辅助已完成代码实现：直接父容器布局读取、布局意图保存、JSON `0.6` 和 Prompt 布局段已接入；`npm run verify` 已通过，等待 Chrome 手动交互验收。
8. V0.7 字体读取与切换已完成代码实现：`fontFamily` / `letterSpacing` 字段读取与预览、`fontChanges`、JSON `0.7` 和 Prompt 字体段已接入；`npm run verify` 与 Chrome headless 页面内烟测已通过，等待 Chrome 手动交互验收。
9. V0.8 直接操作基础层已完成代码实现：顶部“自动布局”模式、中部粉色拖拽横条、基于鼠标命中目标的同父容器精准交换预览、交换位移动画、紫色虚线参考线反馈、共享元素开关和本地字体读取入口已接入；JSON 升级为 `0.8`，等待 Chrome 手动交互验收。

## 2. 推荐技术栈

| 类型 | 选择 |
|---|---|
| Extension | Chrome Extension Manifest V3 |
| 语言 | TypeScript |
| 构建 | Vite |
| 面板 UI | React |
| 页面隔离 | Shadow DOM |
| 状态 | V0.1 内存状态 + 可选 `chrome.storage.local` |
| 后端 | V0.1 不需要后端 |

## 2.1 当前工程骨架

当前工程位于 `extension/`：

```text
extension/
  manifest.json
  package.json
  tsconfig.json
  vite.config.ts
  src/
    background/service-worker.ts
    content/index.ts
    content/dom-inspector.ts
    content/selector.ts
    content/session-store.ts
    content/style-inspector.ts
    content/style-preview.ts
    content/measurement.ts          # V0.4 新增
    content/similar-elements.ts     # V0.5 新增
    content/layout-inspector.ts     # V0.6 新增
    overlay/overlay-root.ts
    overlay/highlight-layer.ts
    panel/panel-root.tsx
    panel/design-tokens.ts             # V0.5.5 设计 token
    panel/App.tsx
    panel/components/
      ElementInfoPanel.tsx
      StyleEditorPanel.tsx
      CommentEditor.tsx
      RecordList.tsx
      RecordFilters.tsx           # V0.3 新增
      ConfirmDialog.tsx           # V0.3 新增
      PageCommentPanel.tsx        # V0.3 新增
      MeasurementPanel.tsx        # V0.4 新增
      SimilarElementsPanel.tsx    # V0.5 新增
      LayoutPanel.tsx             # V0.6 新增
      InspectorSection.tsx        # V0.5.5 新增
      StatusBadge.tsx             # V0.5.5 新增
      FloatingToolbar.tsx         # V0.5.5 新增
      ImportExportBar.tsx
    shared/
      types.ts
      messages.ts
      prompt-template.ts
      json-schema.ts
      font-changes.ts            # V0.7 新增
      record-metadata.ts          # V0.3 新增
  test-pages/basic.html
```

当前构建输出位于 `extension/dist/`：

```text
extension/dist/
  manifest.json
  background/service-worker.js
  content/index.js
```

当前验证命令：

```bash
cd extension
npm run verify
```

说明：

1. `manifest.json` 仍放在 `extension/` 根目录，构建时复制到 `dist/manifest.json`。
2. `background/service-worker.ts` 已接入插件图标点击和 content script 注入。
3. `content/index.ts` 已提供编辑模式启停、hover、点击选中、顶部评论模式、评论保存（含 V0.3 元数据）、记录定位、JSON 导入导出、Prompt 复制、样式快照、临时预览、样式差异保存、记录编辑、记录删除、状态切换、筛选状态管理。
4. `content/style-inspector.ts` 暴露 `STYLE_PROPERTY_DEFINITIONS` 与 `readStyleSnapshot(element)`，按白名单顺序返回 computed style。
5. `content/style-preview.ts` 暴露 `createStylePreviewManager()`，使用 `WeakMap` 保存元素原始 inline style，支持 `apply` / `reset` / `resetAll`。
6. `content/session-store.ts` 管理评论、测距、共享范围、布局意图与字体修改记录；导出 V0.8，兼容导入 V0.1 至 V0.8，并在新增、编辑、导入边界统一清除页面评论的元素专属字段。
7. `shared/record-metadata.ts` 是 V0.3 类型/优先级/状态/交互态选项的单一来源，提供中文映射和默认值。
8. React Panel 已接入选中元素信息、样式编辑、页面/元素评论、快速评论弹窗、记录列表、ConfirmDialog、导入导出和复制 Prompt；V0.4 接入测距，V0.5 接入相似元素折叠区块、批量复选框与范围筛选，V0.5.5 使用 `InspectorSection` / `StatusBadge` / `FloatingToolbar` 统一主界面，V0.6 接入 `LayoutPanel` 保存布局意图，V0.7 在 `StyleEditorPanel` 的“字体 / 排版”分组补齐字体字段，V0.8 在 `FloatingToolbar`、`SimilarElementsPanel` 与 `StyleEditorPanel` 接入自动布局、共享开关和本地字体入口。
9. `content/measurement.ts` 是 V0.4 纯函数模块：`readSize`、`readViewportDistances`、`readParentDistances`、`computePairMeasurement`，接受 DOMRect-like 输入，输出取整数值。
10. `overlay/overlay-root.ts` 在 V0.4 扩展了 measurement layer：渲染 size label（右上角，自动避让视口）、pair distance lines（水平/垂直）、跨视口紫色虚线参考线以及距离数值；V0.5.5 直接复用该 Shadow DOM 标签作为元素标签，并使用红粉高对比反馈；V0.8 新增紫色自动布局选中态、中部粉色拖拽横条、目标框、紫色虚线参考线和交换位置标签；评论模式会按元素记录渲染粉紫编号点，不向宿主页面注入全局样式。
11. `content/similar-elements.ts` 实现三级相似识别与 50 个目标截断；`overlay-root.ts` 渲染 3 秒批量虚线高亮。
12. `content/layout-inspector.ts` 读取选中元素直接父容器的 selector、display、flex/grid 常见对齐字段、gap、当前子元素序号和兄弟总数。
13. `extension/test-pages/basic.html` 额外包含 V0.5 卡片、按钮组与列表项批量目标；V0.6 可复用按钮组等 flex 场景验收布局辅助，V0.7 可复用样式编辑器按钮、卡片标题等文本元素验收字体字段，V0.8 可复用按钮组验收自动布局拖手换位。

## 2.2 V0.5.5 面板设计系统与可访问性

1. `panel/panel-root.tsx` 是 Shadow DOM 样式唯一落点，使用 `rgba(18, 18, 18, 0.97)` 哑光深色基底、深灰胶囊控件、弱边界与蓝紫强调色，避免污染宿主页面。
2. `InspectorSection` 提供语义容器包装（`section` / `article` / `footer`），`StatusBadge` 在可点击场景渲染原生 `button`，记录范围高亮可通过键盘触发。
3. `CommentEditor` 使用 React `useId()` 生成表单关联 ID，页面评论与元素评论同时存在时不会产生重复 `id`。
4. `ConfirmDialog` 初始聚焦取消按钮、支持 `Escape` 关闭与 Tab 循环，并在关闭后恢复触发元素焦点。
5. 页面评论编辑期间隐藏元素评论保存入口，防止同一 `editingRecord` 被错误更新为元素范围记录。
6. `panel-root.tsx` 绑定 Panel 标题栏 Pointer Events 拖动逻辑：默认右侧定位不变，用户拖动后改用 `left/top` 定位，并在拖动与窗口 resize 时限制在视口 8px 安全边距内。
7. `StyleEditorPanel` 的长度输入采用“数值 + 单位”胶囊控件，`px` 和 `pt` 之间自动换算；`StyleChange.unit` 允许记录长度单位，便于导出和 Prompt 保留修改意图。
8. `QuickCommentPopover` 使用 Panel Shadow DOM 渲染页面内固定定位弹窗：顶部工具栏进入评论模式后，点击宿主元素会选中元素、弹出评论框，保存后复用既有 `addEditRecord` 流程，不新增 JSON 字段。
9. `FloatingToolbar` 按 Figma 顶栏结构渲染：浏览、选择、测量、评论、自动布局为 icon-only 模式按钮；记录为图标 + 文案 + 数量徽标；关闭按钮独立在分隔线后；导入、导出 JSON 与复制 Prompt 继续由 `ImportExportBar` 承载。

## 3. Manifest V3 权限

推荐最小权限：

```json
{
  "permissions": ["activeTab", "scripting", "storage", "clipboardWrite"],
  "host_permissions": ["<all_urls>"]
}
```

权限说明：

| 权限 | 用途 |
|---|---|
| `activeTab` | 用户点击插件后访问当前 tab |
| `scripting` | 注入 Content Script |
| `storage` | 保存当前页面草稿或最近导入数据 |
| `clipboardWrite` | 复制 AI Prompt |
| `<all_urls>` | 支持在任意网页上运行 |

## 4. 模块职责

### 4.1 Background Service Worker

职责：

1. 响应插件图标点击。
2. 获取当前 active tab。
3. 注入 Content Script。
4. 发送 toggle editing 消息。
5. 维护 tab 级别的启停状态。

不负责：

1. 不读取 DOM。
2. 不生成 selector。
3. 不管理评论记录细节。
4. 不渲染 UI。

### 4.2 Content Script

职责：

1. 初始化编辑模式。
2. 创建 Panel 和 Overlay 容器。
3. 监听 mousemove、click、scroll、resize。
4. 获取 DOM 元素。
5. 生成元素快照。
6. 维护当前页面 session。
7. 协调 Panel 和 Overlay。

不负责：

1. 不直接实现复杂 React UI。
2. 不执行远程请求。
3. 不改变宿主页面业务逻辑。

### 4.3 Panel

职责：

1. 展示选中元素基础信息。
2. 提供评论输入。
3. 展示评论记录列表。
4. 提供导入 JSON。
5. 提供导出 JSON。
6. 提供复制 AI Prompt。
7. 展示错误、空状态、导入失败、selector 未匹配等反馈。

不负责：

1. 不直接监听页面 DOM hover。
2. 不直接计算元素位置。
3. 不操作宿主页面节点。

### 4.4 Overlay

职责：

1. 绘制 hover 高亮框。
2. 绘制 selected 高亮框。
3. 绘制定位闪烁效果。
4. 根据 scroll 和 resize 重新计算位置。
5. 绘制测距线、测距跨视口紫色虚线参考线与相似元素批量虚线高亮，批量高亮在 3 秒后淡出清理。

不负责：

1. 不保存业务状态。
2. 不处理评论。
3. 不导入导出数据。

## 5. 页面运行结构

Content Script 在页面中创建两个 Shadow DOM 根节点：

1. `web-visual-ai-editor-overlay-root`
2. `web-visual-ai-editor-panel-root`

Overlay 根节点：

1. 固定定位。
2. 极高 `z-index`。
3. `pointer-events: none`。
4. 不影响宿主页面点击。

Panel 根节点：

1. 默认固定在页面右侧。
2. 有独立 Shadow DOM 样式。
3. 面板区域需要排除元素选择，避免用户选中插件 UI。
4. 标题栏可作为拖动手柄，拖动位置只属于当前页面会话，不进入业务数据。

## 6. 消息流

### 6.1 启动编辑模式

1. 用户点击插件图标。
2. Background 收到 `chrome.action.onClicked`。
3. Background 注入 Content Script。
4. Background 发送 `EDITOR_TOGGLE`。
5. Content Script 初始化或销毁编辑模式。

### 6.2 选择元素

1. 用户 hover 页面元素。
2. Content Script 获取 `event.target`。
3. Content Script 计算 rect。
4. Overlay 显示 hover 框。
5. 用户点击元素。
6. Content Script 阻止默认点击。
7. Content Script 生成 `ElementSnapshot`。
8. Panel 展示元素信息。

### 6.3 保存评论

1. 用户在 Panel 输入评论。
2. Panel 触发保存。
3. Content Script 校验当前 selected element。
4. Content Script 创建 `EditRecord`。
5. Session 更新。
6. Panel 列表刷新。

### 6.4 保存共享元素记录

1. 用户选中 `HTMLElement` 后，Content Script 调用 `findSimilarElements()`。
2. Panel 展示匹配级别、候选 selector 和“应用到相似元素”复选框。
3. 用户可先通过 hover/聚焦预览单个候选，或点击“高亮全部”检查范围。
4. 保存时，仅在用户主动勾选后把当前候选快照写为 `EditRecord.sharedGroup`。
5. 记录页可按单元素/批量筛选，并使用保存时快照进行批量高亮。
6. JSON 与 Prompt 导出批量范围；导入 V0.1 至 V0.4 时 `sharedGroup` 规范化为 `null`。

### 6.5 保存布局意图记录

1. 用户选中 `HTMLElement` 后，Content Script 调用 `readLayoutContext()` 读取直接父容器布局上下文。
2. Runtime 保存 `currentLayoutContext`，并在 scroll / resize 时随当前选中元素重新计算。
3. Panel 的 `LayoutPanel` 展示父容器 selector、display、方向、对齐、gap、当前子元素位置。
4. 用户填写方向、对齐、目标间距或说明后点击“保存布局意图”。
5. Content Script 生成 `category: "layout"` 的元素级记录，并写入 `layoutContext` 与 `layoutIntent`。
6. JSON 与 Prompt 导出布局上下文；导入 V0.1 至 V0.5 时布局字段规范化为 `null`。

### 6.6 定位元素

1. 用户点击记录列表。
2. Content Script 使用 selector 查询 DOM。
3. 如果存在，执行 `scrollIntoView`。
4. Overlay 显示 selected 和闪烁高亮。
5. 如果不存在，Panel 显示未匹配提示。

## 7. Selector 生成策略

优先级：

1. 稳定 id：`#submit-button`
2. `data-testid`：`[data-testid="submit-button"]`
3. `data-cy`：`[data-cy="submit-button"]`
4. `aria-label`：`button[aria-label="保存"]`
5. tag + class：`button.primary-action`
6. DOM path：`body > main > section:nth-child(2) > button:nth-child(1)`

要求：

1. selector 必须可序列化。
2. selector 不能依赖插件自身 DOM。
3. selector 找不到时，记录不能丢失。
4. 需要同时保存 text、rect、tagName 作为兜底上下文。

## 8. 状态管理

V0.1 推荐状态：

```ts
type RuntimeState = {
  enabled: boolean;
  hoveredElement: ElementSnapshot | null;
  selectedElement: ElementSnapshot | null;
  session: EditorSession;
};
```

状态存储策略：

1. 首选 Content Script 内存状态，保证简单可控。
2. 可选同步到 `chrome.storage.local`，用于页面刷新后恢复。
3. JSON 导入导出使用版本号控制兼容。

## 9. 性能策略

1. mousemove 使用 `requestAnimationFrame` 或 throttle。
2. hover 时只计算当前元素 rect，不遍历 DOM。
3. scroll 和 resize 时只更新当前 hover / selected 框。
4. Panel UI 状态更新不要绑定到每一次 mousemove。
5. 避免向宿主页面注入大型依赖。

## 10. 降级策略

| 风险 | 降级 |
|---|---|
| selector 找不到 | 保留记录，显示未匹配 |
| iframe 无法访问 | V0.1 提示暂不支持 |
| Shadow DOM 内部无法选中 | V0.1 只记录 Shadow Host |
| 页面 z-index 过高 | Overlay 使用独立根节点和最高层级 |
| 页面 CSP 限制 | 只注入 extension 打包资源，不加载远程脚本 |
| 页面点击被插件拦截 | 退出编辑模式时移除所有监听 |

## 11. V0.2 样式编辑器架构

V0.2 延续 V0.1 的 Background / Content Script / Panel / Overlay 分层，不新增后端服务。

### 11.1 Style Inspector

文件：`extension/src/content/style-inspector.ts`

职责：

1. 接收当前选中的 `Element`。
2. 判断是否为 `HTMLElement`，否则返回空数组。
3. 使用 `getComputedStyle(element)` 读取白名单样式。
4. 返回可序列化的 `StylePropertySnapshot[]`，顺序由 `STYLE_PROPERTY_DEFINITIONS` 决定。
5. 同时导出 `FONT_WEIGHT_OPTIONS`，供 Panel 字重 select 控件复用。

不负责：

1. 不写入页面样式。
2. 不解析复杂 CSS 简写。
3. 不推断 CSS 变量来源。

### 11.2 Style Preview Manager

文件：`extension/src/content/style-preview.ts`

职责：

1. 对支持的 `HTMLElement` 写入临时 inline style。
2. 首次修改时记录原始 inline style 值，存入 `WeakMap`。
3. 单元素 `reset()` 恢复所有被记录的属性，并清除原始值缓存。
4. `resetAll()` 在退出编辑模式或导入 JSON 时统一清理全部预览。
5. 非 `HTMLElement` 的 `apply()` 返回 `{ ok: false, reason }`，由 Panel 显示。

不负责：

1. 不生成生产级 CSS。
2. 不保存业务记录。
3. 不跨页面持久化样式。

### 11.3 Panel Style Editor

文件：`extension/src/panel/components/StyleEditorPanel.tsx`

职责：

1. 按外观 / 字体排版 / 间距 / 描边效果分组展示白名单样式；V0.7 在字体排版中补齐 `fontFamily` 与 `letterSpacing`。
2. 颜色支持 `<input type="color">` + 文本输入，长度数值支持 `px` / `pt` 胶囊单位，字重为 select，字间距与阴影为纯文本。
3. V0.8 的字体族控件支持 Local Font Access：点击“读取本地字体”后调用 `window.queryLocalFonts()`，成功时去重展示本机字体族，失败或不支持时保留手动字体栈输入。
4. 通过 `onStyleDraftChange(property, value)` 把 draft 写回 Content Script，由 Preview Manager 应用。
5. 通过 `onResetStylePreview` 触发当前元素重置。
6. 不直接持久化 draft 到 session，保存动作由 `CommentEditor` 触发。

### 11.4 数据流

1. 用户选中元素。
2. Content Script 读取 `ElementSnapshot` 和 `StylePropertySnapshot[]`。
3. Panel 展示元素信息和样式控件。
4. 用户修改样式值。
5. Content Script 通过 Preview Manager 写入临时 inline style。
6. 用户保存记录。
7. Session Store 把当前 draft 与原值差异化为 `StyleChange[]` 写入 `EditRecord.styleChanges`。
8. V0.7 从字体类 `styleChanges` 派生 `EditRecord.fontChanges`。
9. V0.8 自动布局拖动完成后复用 `layoutContext` / `layoutIntent` 保存“从第 X 位移动到第 Y 位”的布局记录。
10. JSON / Prompt 导出包含样式差异；字体差异在 Prompt 中输出为独立“字体修改”段。

### 11.5 清理策略

V0.2 已实现：

1. 点击"重置当前预览"时，恢复当前元素被插件改过的 inline style。
2. 切换选中元素或重新选中同一元素时，`styleDraft` 重置；上一个元素的预览保留在页面，直到用户重置或退出。
3. 退出编辑模式时，调用 `resetAll()` 清除全部预览。
4. 导入 JSON 不自动应用样式到页面，避免意外污染当前网页。

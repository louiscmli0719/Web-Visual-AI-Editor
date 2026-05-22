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
2. V0.2 样式编辑器已完成代码实现，已通过 `npm run verify`（单测 22/22、TypeScript、Vite build），等待 Chrome 手动加载复核。

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
    overlay/overlay-root.ts
    overlay/highlight-layer.ts
    panel/panel-root.tsx
    panel/App.tsx
    panel/components/
      ElementInfoPanel.tsx
      StyleEditorPanel.tsx
      CommentEditor.tsx
      RecordList.tsx
      ImportExportBar.tsx
    shared/
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
3. `content/index.ts` 已提供编辑模式启停、hover、点击选中、评论保存、记录定位、JSON 导入导出、Prompt 复制、样式快照、临时预览和样式差异保存。
4. `content/style-inspector.ts` 暴露 `STYLE_PROPERTY_DEFINITIONS` 与 `readStyleSnapshot(element)`，按白名单顺序返回 computed style。
5. `content/style-preview.ts` 暴露 `createStylePreviewManager()`，使用 `WeakMap` 保存元素原始 inline style，支持 `apply` / `reset` / `resetAll`。
6. React Panel 已接入选中元素信息、样式编辑、评论输入、记录列表、导入导出和复制 Prompt 操作。
7. `extension/test-pages/basic.html` 包含 V0.1 元素以及 V0.2 主按钮、卡片、标题、间距样本，用于本地手动验收。

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

1. 固定在页面右侧。
2. 有独立 Shadow DOM 样式。
3. 面板区域需要排除元素选择，避免用户选中插件 UI。

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

### 6.4 定位元素

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

1. 按颜色 / 排版 / 内边距 / 外边距 / 边框 / 阴影分组展示 V0.2 白名单样式。
2. 颜色支持 `<input type="color">` + 文本输入，数值自动补 `px`，字重为 select，阴影为纯文本。
3. 通过 `onStyleDraftChange(property, value)` 把 draft 写回 Content Script，由 Preview Manager 应用。
4. 通过 `onResetStylePreview` 触发当前元素重置。
5. 不直接持久化 draft 到 session，保存动作由 `CommentEditor` 触发。

### 11.4 数据流

1. 用户选中元素。
2. Content Script 读取 `ElementSnapshot` 和 `StylePropertySnapshot[]`。
3. Panel 展示元素信息和样式控件。
4. 用户修改样式值。
5. Content Script 通过 Preview Manager 写入临时 inline style。
6. 用户保存记录。
7. Session Store 把当前 draft 与原值差异化为 `StyleChange[]` 写入 `EditRecord.styleChanges`。
8. JSON / Prompt 导出包含样式差异。

### 11.5 清理策略

V0.2 已实现：

1. 点击"重置当前预览"时，恢复当前元素被插件改过的 inline style。
2. 切换选中元素或重新选中同一元素时，`styleDraft` 重置；上一个元素的预览保留在页面，直到用户重置或退出。
3. 退出编辑模式时，调用 `resetAll()` 清除全部预览。
4. 导入 JSON 不自动应用样式到页面，避免意外污染当前网页。

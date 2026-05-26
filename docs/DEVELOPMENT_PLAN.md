# Web Visual AI Editor Development Plan

## 1. 当前阶段

当前阶段：V0.1 已通过用户手动验收；V0.2 样式编辑器与 V0.3 评论增强已通过 Chrome 手动验收。V0.4 标尺测距、V0.5 共享元素与 V0.5.5 UI Refresh 代码实现已完成；V0.6 自动布局辅助、V0.7 字体读取/切换与 V0.8 直接操作基础层已完成代码接入。2026-05-26 已通过 Vibma 读取 Figma 选中画板并二次对齐工具栏、样式面板、记录面板和评论弹窗的 UI，当前继续压缩顶部按钮比例，把自动布局参数限制为 flex / grid 且有可操作兄弟元素时展开，并修复相似元素长 selector 溢出；正式浏览器图标与 `Packages/` 打包流程已接入。当前已通过 `npm run verify`（104 个单元测试 + TypeScript + Vite build），真实插件图标点击仍待 Chrome 手动验收。

当前目标：

1. 按 `docs/ACCEPTANCE_CRITERIA.md` 联合验收 V0.4 测距、V0.5 共享元素、V0.5.5 UI Refresh、V0.6 自动布局辅助、V0.7 字体读取/切换与 V0.8 直接操作基础层。
2. 重点回归 Figma 对齐后的紧凑顶部胶囊工具栏、浏览器图标、Panel 顶部功能条拖动、共享元素开关、相似元素长 selector 裁切、样式/记录/评论深灰控件、顶部评论模式就地弹窗、评论编号点、自动布局有效场景展开与无效场景降级提示、自动布局中部粉色拖拽横条、同父容器精准交换预览、交换位移动画、紫色虚线参考线反馈、测距模式页面内点击 A 取消重选、字体字段展示、本地字体读取入口、JSON 0.8 导出、Prompt 字体/布局段、页面评论编辑隔离、删除弹窗键盘操作、`Packages/web-visual-ai-editor-v0.8.0.zip` 包和宿主页面退出恢复。

## 2. 第一阶段目标

第一阶段交付一个本地可安装的 Chrome 插件，完成以下闭环：

1. 点击插件图标进入编辑模式。
2. Hover DOM 元素显示高亮。
3. 点击 DOM 元素选中。
4. 面板展示元素信息。
5. 保存评论。
6. 列表展示记录。
7. 点击记录定位元素。
8. 导出 JSON。
9. 导入 JSON。
10. 复制 AI Prompt。

## 3. 推荐项目目录

```text
Web Visual AI Editor/
  AGENTS.md
  DOCUMENTATION_INDEX.md
  docs/
    PRODUCT_SPEC.md
    V0.2_STYLE_EDITOR_SPEC.md
    TECH_ARCHITECTURE.md
    DATA_FORMAT.md
    DEVELOPMENT_PLAN.md
    ACCEPTANCE_CRITERIA.md
    superpowers/plans/
      2026-05-22-v0.2-style-editor.md
  extension/
    manifest.json
    package.json
    tsconfig.json
    vite.config.ts
    src/
      background/
        service-worker.ts
      content/
        index.ts
        dom-inspector.ts
        selector.ts
        session-store.ts
      overlay/
        overlay-root.ts
        highlight-layer.ts
      panel/
        App.tsx
        components/
          ElementInfoPanel.tsx
          CommentEditor.tsx
          RecordList.tsx
          ImportExportBar.tsx
      shared/
        types.ts
        messages.ts
        prompt-template.ts
        json-schema.ts
    public/
      icons/
```

## 4. 任务拆解

### Task 1：文档基线

状态：已完成初版。

输入：产品目标、MVP 边界、技术方向。

处理：

1. 创建项目协作规则。
2. 创建产品规格。
3. 创建技术架构。
4. 创建数据格式。
5. 创建开发计划。
6. 创建验收标准。

输出：

1. `AGENTS.md`
2. `DOCUMENTATION_INDEX.md`
3. `docs/PRODUCT_SPEC.md`
4. `docs/TECH_ARCHITECTURE.md`
5. `docs/DATA_FORMAT.md`
6. `docs/DEVELOPMENT_PLAN.md`
7. `docs/ACCEPTANCE_CRITERIA.md`

### Task 2：Extension 工程骨架

状态：已完成。

输入：技术架构文档和推荐目录。

处理：

1. 创建 `extension/` 目录。
2. 初始化 `package.json`。
3. 配置 Vite + TypeScript。
4. 创建 `manifest.json`。
5. 创建基础 background、content、panel、overlay 入口。

输出：

1. 可构建的 Chrome Extension 工程。
2. 本地 build 命令可运行。
3. Chrome 可以加载 unpacked extension。

已创建文件：

1. `.gitignore`
2. `extension/package.json`
3. `extension/package-lock.json`
4. `extension/manifest.json`
5. `extension/tsconfig.json`
6. `extension/vite.config.ts`
7. `extension/src/background/service-worker.ts`
8. `extension/src/content/index.ts`
9. `extension/src/content/dom-inspector.ts`
10. `extension/src/content/selector.ts`
11. `extension/src/content/session-store.ts`
12. `extension/src/overlay/overlay-root.ts`
13. `extension/src/overlay/highlight-layer.ts`
14. `extension/src/panel/panel-root.tsx`
15. `extension/src/panel/App.tsx`
16. `extension/src/panel/components/*`
17. `extension/src/shared/*`

当前验证命令：

```bash
cd extension
npm run verify
```

### Task 3：Background 启停能力

状态：已完成代码实现，已通过 Edge 自动化烟测，待 Chrome 手动加载复核。

输入：用户点击插件按钮。

处理：

1. 监听 `chrome.action.onClicked`。
2. 获取当前 active tab。
3. 注入 Content Script。
4. 发送 toggle editing 消息。

输出：当前页面可以进入或退出编辑模式。

当前进展：

1. `background/service-worker.ts` 已监听插件图标点击。
2. 已通过 `chrome.scripting.executeScript` 注入 `content/index.js`。
3. 已发送 `WVAIE_TOGGLE_EDITOR` 消息。
4. `content/index.ts` 已能切换编辑模式、Overlay 和 Panel。

后续仍需人工验证：

1. 在 Chrome 中加载 `extension/dist`。
2. 点击插件图标确认进入/退出编辑模式。
3. 在真实网页上确认错误页面、受限页面的降级表现。

### Task 4：Content Script 事件系统

状态：已完成代码实现，已通过 Edge 自动化烟测，待 Chrome 手动加载复核。

输入：编辑模式启用状态。

处理：

1. 注册 mousemove。
2. 注册 click。
3. 注册 scroll。
4. 注册 resize。
5. 排除插件自身 DOM。

输出：可以捕获宿主页面 DOM 交互。

当前实现：

1. 已注册 `mousemove`、`click`、`scroll`、`resize`。
2. 已排除插件自身 Panel 和 Overlay。
3. 已在编辑模式下阻止宿主页面点击误触发。

### Task 5：Overlay 高亮层

状态：已完成代码实现，已通过 Edge 自动化烟测，待 Chrome 手动加载复核。

输入：hovered element 和 selected element 的 rect。

处理：

1. 创建 Overlay Shadow Root。
2. 绘制 hover 框。
3. 绘制 selected 框。
4. 支持滚动和 resize 后更新位置。

输出：用户能明确看到当前 hover 和 selected 元素。

当前实现：

1. 已绘制 hover 框。
2. 已绘制 selected 框。
3. 已支持定位闪烁。
4. 已在滚动和 resize 后重新计算位置。

### Task 6：元素快照和 selector

状态：已完成。

输入：DOM Element。

处理：

1. 读取 tagName、id、className、text。
2. 读取 rect。
3. 按优先级生成 selector。
4. 输出 `ElementSnapshot`。

输出：Panel 可以展示完整元素信息。

当前实现：

1. `dom-inspector.ts` 读取元素快照。
2. `selector.ts` 生成 id、稳定属性和 DOM path selector。
3. `selector.test.ts` 覆盖 selector 生成优先级。

### Task 7：Panel UI

状态：已完成代码实现，已通过 Edge 自动化烟测，待 Chrome 手动加载复核。

输入：当前 selected element 和 session records。

处理：

1. 创建右侧面板。
2. 展示元素信息。
3. 提供评论输入。
4. 提供保存按钮。
5. 提供记录列表。
6. 提供导入、导出、复制 Prompt 操作。

输出：用户可以完成评论记录管理。

当前实现：

1. React Panel 展示元素信息。
2. 支持评论输入和保存。
3. 支持记录列表。
4. 支持导出 JSON、导入 JSON、复制 Prompt。

### Task 8：评论记录列表

状态：已完成代码实现，已通过 Edge 自动化烟测，待 Chrome 手动加载复核。

输入：用户保存评论。

处理：

1. 生成记录 ID。
2. 写入 session。
3. 更新列表。
4. 支持记录点击定位。

输出：当前页面所有修改记录可查看、可定位。

当前实现：

1. `session-store.ts` 负责生成记录。
2. 记录列表支持点击定位。
3. selector 未匹配时保留记录并提示。

### Task 9：JSON 导入导出

状态：已完成代码实现，JSON 导出入口已通过 Edge 自动化烟测，导入仍需 Chrome 手动复核。

输入：当前 session 或用户导入的 JSON。

处理：

1. 导出时序列化 `EditorSession`。
2. 导入时解析和校验 schema。
3. 恢复记录列表。
4. 标记 selector 未匹配记录。

输出：JSON 可以跨会话保存和恢复。

当前实现：

1. `serializeEditorSession` 负责 JSON 导出。
2. `parseEditorSessionExport` 负责 JSON 导入校验。
3. `session-store.test.ts` 覆盖导出导入和错误提示。

### Task 10：AI Prompt 复制

状态：已完成代码实现，复制入口已通过 Edge 自动化烟测，剪贴板权限反馈仍需 Chrome 手动复核。

输入：当前 page info 和 records。

处理：

1. 使用 Prompt 模板生成文本。
2. 调用剪贴板写入。
3. 显示复制成功或失败反馈。

输出：用户获得可直接发给 AI / Codex 的 Prompt。

当前实现：

1. `buildAiPrompt` 负责生成 Prompt。
2. `prompt-template.test.ts` 覆盖页面信息、selector 和评论内容。

### Task 11：基础验收页面

状态：已完成。

输入：MVP 验收标准。

处理：

1. 创建本地测试 HTML 页面。
2. 覆盖按钮、文本、卡片、表单、列表等常见元素。
3. 用该页面验证 hover、select、comment、export、import、prompt。

输出：插件有稳定的本地验收环境。

已创建文件：

1. `extension/test-pages/basic.html`

### Task 12：V0.1 手动验收收口

状态：已完成。

输入：用户手动验收反馈。

处理：

1. 确认 V0.1 测试体验无阻塞问题。
2. 将项目阶段从 V0.1 验收推进到 V0.2 准备。
3. 保留 Chrome 手动加载作为后续回归验收方式。

输出：V0.1 可作为后续开发基线。

### Task 13：V0.2 样式编辑器规格

状态：已完成。

输入：项目路线图中 V0.2 样式编辑器目标。

处理：

1. 定义 V0.2 样式编辑器的产品目标。
2. 定义支持的样式属性白名单。
3. 定义样式读取、预览、重置、保存、导入导出和 Prompt 输出边界。
4. 明确非目标和降级方案。

输出：

1. `docs/V0.2_STYLE_EDITOR_SPEC.md`

### Task 14：V0.2 可执行实现计划

状态：已完成。

输入：V0.2 样式编辑器规格。

处理：

1. 拆解需要新增和修改的文件。
2. 拆解类型、样式读取、预览管理、Panel UI、JSON / Prompt、测试页面和文档同步任务。
3. 为每个任务定义测试命令和预期结果。

输出：

1. `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md`

### Task 15：V0.2 数据结构和测试

状态：已完成。

输入：V0.2 实现计划 Task 1。

处理：

1. 新增 `StylePropertyName`、`StylePropertySnapshot`、`StyleChange`、`StyleDraft` 类型。
2. 扩展 `EditRecord.styleChanges`。
3. 调整 session-store 保存逻辑，允许评论为空但 styleChanges 非空。
4. 调整 `serializeEditorSession` 输出 `version: "0.2"`，`parseEditorSessionExport` 兼容 V0.1/V0.2。
5. 补充单元测试覆盖样式记录、版本升级、V0.1 兼容导入。

输出：

1. `extension/src/shared/types.ts`
2. `extension/src/shared/json-schema.ts`
3. `extension/src/content/session-store.ts`
4. `extension/src/content/session-store.test.ts`

### Task 16：V0.2 样式读取与预览

状态：已完成。

输入：选中元素和样式白名单。

处理：

1. 新增 `style-inspector.ts`：导出 `STYLE_PROPERTY_DEFINITIONS`、`FONT_WEIGHT_OPTIONS`、`readStyleSnapshot`。
2. 新增 `style-preview.ts`：通过 `WeakMap` 缓存原始 inline style，提供 `apply` / `reset` / `resetAll`。
3. 在 `content/index.ts` 中接入选中流程：读取快照、维护 `styleDraft`、计算差异、在退出与导入时调用 `resetAll`。
4. 补充 inspector 与 preview 单元测试。

输出：

1. `extension/src/content/style-inspector.ts`
2. `extension/src/content/style-inspector.test.ts`
3. `extension/src/content/style-preview.ts`
4. `extension/src/content/style-preview.test.ts`
5. `extension/src/content/index.ts`

### Task 17：V0.2 Panel 和导出升级

状态：已完成。

输入：样式快照、样式 draft 和记录列表。

处理：

1. 新增 `StyleEditorPanel.tsx`，按分组渲染白名单控件，提供"重置当前预览"按钮。
2. 调整 `PanelState`、`PanelHandlers` 与 `panel-root` 注入样式相关字段。
3. `CommentEditor` 文案改为"保存记录"，允许 styleChanges 触发保存。
4. `RecordList` 渲染 `样式修改` 摘要。
5. Prompt 模板追加样式段落和实现提示。
6. `test-pages/basic.html` 增加主按钮、卡片、标题、间距样本。

输出：

1. `extension/src/panel/components/StyleEditorPanel.tsx`
2. `extension/src/panel/components/CommentEditor.tsx`
3. `extension/src/panel/components/RecordList.tsx`
4. `extension/src/panel/App.tsx`
5. `extension/src/panel/panel-root.tsx`
6. `extension/src/shared/prompt-template.ts`
7. `extension/src/shared/prompt-template.test.ts`
8. `extension/test-pages/basic.html`

## 5. 当前下一步

V0.6 已经具备可手动验收的代码与构建：

1. 在 Chrome 扩展管理页 `Load unpacked` 重新加载 `extension/dist`。
2. 打开 `extension/test-pages/basic.html`。
3. 按 `docs/ACCEPTANCE_CRITERIA.md` 复核 V0.4 元素尺寸/视口距离/父容器距离/双元素测距/附加测距复选框/Prompt 测距段落/JSON 兼容。
4. 验证 V0.5 相似元素检测、批量高亮、共享记录保存、范围筛选、JSON sharedGroup 与 Prompt 作用范围。
5. 验证 V0.5.5 暗色 Inspector、浮动工具栏、Panel 顶部功能条拖动、长度单位胶囊、删除弹窗键盘焦点和页面评论编辑隔离。
6. 验证 V0.6 布局辅助展示、布局意图保存、JSON `layoutContext/layoutIntent` 和 Prompt “布局辅助”段。

V0.4 已完成任务清单：

### Task V0.4-1：Measurement Module + Types
- 创建 `extension/src/content/measurement.ts`（4 个纯函数：readSize / readViewportDistances / readParentDistances / computePairMeasurement）
- 创建 `extension/src/content/measurement.test.ts`（12 个测试）
- 扩展 `types.ts` 添加 Measurements 类型与 EditRecord.measurements 字段

### Task V0.4-2：Session Store + JSON 兼容
- `addEditRecord` 和 `updateEditRecord` 接受 measurements 参数
- 升级 JSON 版本到 0.4，支持 V0.1/V0.2/V0.3/V0.4 导入
- 旧版本记录导入时默认补 `measurements: null`

### Task V0.4-3：Overlay 测距渲染
- 扩展 `overlay-root.ts` 添加 size label、pair distance lines、distance labels
- 新增 MeasurementOverlay 类型
- 标签位置自动避让视口边缘

### Task V0.4-4：Panel Measurement Panel
- 创建 `extension/src/panel/components/MeasurementPanel.tsx`
- 显示尺寸、距视口、距父容器、双元素测距分组
- 测距模式按钮：开始/重置/退出

### Task V0.4-5 + 6：Runtime 集成 + 附加测距复选框
- EditorRuntime 添加 measurementMode、pairFirstElement、pairSecondElement、currentMeasurements、attachMeasurements
- 实现 enterMeasurementMode、exitMeasurementMode、resetPairMeasurement 等 handlers
- handleClick 支持双元素测距状态机
- saveRecord / updateRecord 根据 attachMeasurements 写入 measurements
- 双元素测距强制 attachMeasurements = true
- 视口滚动/resize 时重新计算 measurements

### Task V0.4-7：AI Prompt 测距段落
- 重构 `prompt-template.ts` 添加 formatMeasurements 函数
- 输出"测距："子段落，含尺寸/距视口/距父容器/与目标元素
- null 字段自动省略
- 4 个新增测试覆盖所有分支

### Task V0.4-8：测试页面
- 添加 V0.4 标尺测距验收目标区块
- 包含双元素（A / B 按钮，水平间距 24px）、子父容器（padding=40px）

### Task V0.4-9：文档同步
- DOCUMENTATION_INDEX.md、PROJECT_ROADMAP.md、DEVELOPMENT_PLAN.md、ACCEPTANCE_CRITERIA.md、DATA_FORMAT.md、TECH_ARCHITECTURE.md 全部同步

### Task V0.5-1 至 V0.5-10：共享元素闭环

状态：代码实现完成，已通过 Chrome 148 pipe 自动烟测的数据闭环，等待 Chrome 手动视觉与交互验收。

- `types.ts` / `session-store.ts` / `json-schema.ts`：导出版本升级至 `0.5`，记录新增 `sharedGroup`，旧数据兼容导入。
- `similar-elements.ts`：三级匹配、插件节点排除与 50 个上限已具备单元测试。
- `overlay-root.ts`：批量目标红粉虚线高亮，3 秒后淡出清理。
- `SimilarElementsPanel.tsx` / `CommentEditor.tsx`：候选预览、高亮全部与主动批量应用复选框。
- `RecordList.tsx` / `RecordFilters.tsx`：批量徽标、截断提示、单元素/批量筛选。
- `prompt-template.ts`：批量范围与截断提醒写入 AI Prompt。
- `test-pages/basic.html`：卡片、按钮、列表批量验收目标。
- 同轮恢复 `PageCommentPanel` 主流程接线，避免页面级评论在面板重构后不可新建或编辑。

### Task V0.5.5-1 至 V0.5.5-12：UI Refresh 整合

状态：代码实现完成，`v0.5.5-beta.1` 预览包已准备通过 GitHub Release 分发，已通过 Chrome 148 pipe 自动烟测，等待 Chrome 手动视觉与交互复核后决定正式版本。

- `panel/design-tokens.ts` / `panel-root.tsx`：Sketch-style 深色基础色、蓝紫强调、383px 面板、8px 深灰控件/徽标/焦点/减少动画样式已统一；Panel 顶部功能条拖动和视口边界约束已接入。
- `InspectorSection.tsx` / `StatusBadge.tsx` / `FloatingToolbar.tsx` / `PanelUtilityBar.tsx`：主面板可复用构件已接入，点击徽标使用原生按钮语义；顶部工具栏已按 Vibma 选中画板对齐为黑色胶囊、34px icon-only 模式按钮、记录文字按钮与蓝色数量徽标；Panel 顶部功能条承载属性/记录切换、共享元素开关和重置按钮，并已收紧为 42px 级控件高度。
- `ElementInfoPanel.tsx` / `StyleEditorPanel.tsx` / `MeasurementPanel.tsx` / `SimilarElementsPanel.tsx` / `CommentEditor.tsx` / `RecordList.tsx` / `ImportExportBar.tsx`：主要内容区已改为紧凑 Inspector 区块和深灰控件；长度输入改为左数值右单位胶囊，默认 `px`、支持 `pt`、清空归零；相似元素长匹配特征和 selector 已限制在面板内单行裁切，保存按钮禁止换行。
- `overlay/overlay-root.ts`：复用现有尺寸标签承载元素标签能力，选择框、测距线、相似高亮与标签配色改为红粉高对比反馈；不引入新的宿主页面样式注入点。
- `CommentEditor.tsx` / `ConfirmDialog.tsx` / `App.tsx`：修复重复表单 ID、对话框焦点/Escape/Tab 键盘操作，以及页面记录编辑误串元素评论入口的问题。

已完成验证：

1. V0.5.5 当轮 `cd extension && npm run verify` 已通过：89 个单元测试、TypeScript、Vite build；当前 V0.8 已提升到 104 个单元测试并通过同一质量门禁，本次 Figma 工具栏比例、自动布局展示规则、浏览器图标、相似元素溢出修复和打包流程调整后也需要通过 `npm run verify` 与 `npm run package`。
2. 长度单位胶囊保存记录时已按实际新值后缀写入 `StyleChange.unit`，避免切换为 `pt` 后导出仍标记为 `px`。
3. Chrome 148 pipe 自动烟测已覆盖 `extension/dist` 加载、项目 worker 注入、Panel / Overlay 创建、V0.4 双元素测距、V0.5 批量记录、记录列表、JSON 导出、Panel 拖动、删除弹窗键盘焦点和 Prompt 复制。
4. Chrome 普通 `--load-extension` / `--disable-extensions-except` 启动参数在当前环境未注册项目扩展；自动化使用 CDP pipe 加载，正式人工验收仍以 Chrome 扩展管理页 `Load unpacked` 为准。
5. 仍需人工复核真实插件图标点击、浏览器工具栏图标展示、相似元素长文本裁切和整体视觉手感。

### Task V0.6-1 至 V0.6-7：自动布局辅助

状态：代码实现完成，`npm run verify` 已通过；Chrome 页面内 content script 烟测已验证布局读取、保存、JSON 导出与 Prompt 复制，真实插件图标点击仍待手动验收。

实现内容：

1. `types.ts` / `json-schema.ts` / `session-store.ts`：导出版本升级至 `0.6`，记录新增 `layoutContext` 与 `layoutIntent`，兼容导入 V0.1 至 V0.6。
2. `content/layout-inspector.ts`：读取选中元素直接父容器 selector、display、flex/grid 常见字段、gap 和子元素位置。
3. `content/index.ts`：runtime 保存 `currentLayoutContext`，选择元素、滚动和 resize 时更新；新增 `saveLayoutIntent()` 保存布局记录。
4. `panel/components/LayoutPanel.tsx`：展示布局事实，支持保存方向、对齐、目标间距和说明；当前默认只在 flex / grid 且有可操作兄弟元素时展开完整布局参数，普通 block / inline 场景降级为轻提示。
5. `prompt-template.ts`：新增“布局辅助”Prompt 子段落。
6. 测试已覆盖布局读取、V0.6 JSON 导入导出与 Prompt 输出。
7. Chrome 页面内烟测已覆盖：启用 content script、选中 `#save-button`、展示 LayoutPanel、读取父容器 flex/gap、保存横向居中 + `16px` gap 布局意图、导出 JSON `version: "0.6"`、复制包含“布局辅助”和“目标间距：16px”的 AI Prompt。
8. 文档已同步 `V0.6_AUTO_LAYOUT_SPEC.md`、`DATA_FORMAT.md`、`TECH_ARCHITECTURE.md`、`ACCEPTANCE_CRITERIA.md` 和本计划。

---

### Task V0.7-1 至 V0.7-5：字体读取与切换

状态：代码实现完成，`npm run verify` 已通过；Chrome headless 页面内 content script 烟测已验证字体字段展示、预览、保存、JSON 导出与 Prompt 复制，真实插件图标点击仍待手动验收。

实现内容：

1. `types.ts` / `json-schema.ts` / `session-store.ts`：导出版本升级至 `0.7`，记录新增 `fontChanges`，兼容导入 V0.1 至 V0.7。
2. `shared/font-changes.ts`：集中维护字体字段白名单与 `deriveFontChanges()`。
3. `content/style-inspector.ts`：新增 `fontFamily` 与 `letterSpacing` computed style 读取。
4. `panel/components/StyleEditorPanel.tsx`：将“排版”分组升级为“字体 / 排版”，支持字体栈与字间距输入。
5. `prompt-template.ts`：新增“字体修改”Prompt 子段，并避免字体项重复出现在普通样式段。
6. 测试已覆盖字体字段读取、V0.7 JSON 导入导出与 Prompt 字体段输出。
7. Chrome headless 页面内烟测已覆盖：选中 `#style-primary-button`、展示“字体 / 排版”、修改字体为 `Inter, Arial, sans-serif`、字间距 `0.4px`、保存记录、导出 JSON `version: "0.7"` 且包含 `fontChanges`、复制包含“字体修改”和“字间距（letterSpacing）”的 AI Prompt。
8. 文档已同步 `V0.7_FONT_SPEC.md`、`DATA_FORMAT.md`、`TECH_ARCHITECTURE.md`、`ACCEPTANCE_CRITERIA.md` 和本计划。

---

### Task V0.8-1 至 V0.8-7：直接操作基础层

状态：代码实现完成，`npm run verify` 与 Chrome headless 页面内烟测已通过；Chrome 真实插件手动验收待执行。

实现内容：

1. `types.ts` / `json-schema.ts` / `session-store.ts`：导出版本升级至 `0.8`，兼容导入 V0.1 至 V0.8。
2. `panel/components/FloatingToolbar.tsx`：交互模式新增 `auto-layout`，顶部工具栏新增“自动布局”按钮。
3. `overlay/overlay-root.ts`：新增紫色自动布局选中态、中部粉色拖拽横条、目标框、紫色虚线参考线和交换位置标签；测距层补齐跨视口虚线参考线。
4. `content/index.ts`：支持同父容器兄弟元素基于鼠标命中目标的精准交换预览和位移动画，松开后写入布局记录，并在退出编辑器时恢复拖动前 DOM 顺序；测距模式支持页面内再次点击 A 取消并重选。
5. `panel/components/SimilarElementsPanel.tsx`：相似元素区新增“共享元素”开关，开启后高亮相似元素并影响后续记录保存范围。
6. `panel/components/StyleEditorPanel.tsx`：字体族控件新增“读取本地字体”入口、本地字体下拉和手动字体栈降级。
7. Chrome headless 页面内烟测已覆盖：自动布局按钮可见、V0.8 标识可见、拖动 `#save-button` 到 `cancel-button` 后自动保存布局记录、退出编辑器后 DOM 顺序恢复、共享元素开关可开启并高亮 3 个相似元素、字体读取入口可见。
8. 文档已同步 `V0.8_DIRECT_MANIPULATION_SPEC.md`、`DATA_FORMAT.md`、`TECH_ARCHITECTURE.md`、`ACCEPTANCE_CRITERIA.md`、`PROJECT_ROADMAP.md` 和本计划。

---

### 历史版本完成情况（V0.3 及之前保留以备追溯）

V0.3 评论增强已通过 Chrome 手动验收，V0.2 样式编辑器已通过 Chrome 手动验收，V0.1 最小闭环已通过用户手动验收。详细任务记录见 git 历史与 plan 文档。

继续实现前默认约定：

1. 是否使用 React 作为 Panel UI。
2. 是否使用 Vite 构建 extension。
3. 是否先只做 Chrome，不考虑 Firefox。

默认推荐：

1. 使用 React。
2. 使用 Vite。
3. 只做 Chrome MV3。

## 6. 文档维护要求

每完成一个 Task，必须同步更新本文件中的任务状态。

状态取值：

1. 未开始。
2. 进行中。
3. 已完成。
4. 阻塞。
5. 暂缓。

如果任务拆分或新增，必须同步更新：

1. 本文件。
2. `DOCUMENTATION_INDEX.md` 的文档状态表。
3. 必要时更新 `docs/ACCEPTANCE_CRITERIA.md`。

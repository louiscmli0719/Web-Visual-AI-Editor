# Web Visual AI Editor Development Plan

## 1. 当前阶段

当前阶段：V0.1 MVP 已完成代码实现并通过用户手动验收。V0.2 样式编辑器已完成代码实现，并通过 `npm run verify`（单元测试 22/22、TypeScript、Vite build），等待 Chrome 手动加载复核。V0.3 评论增强已完成产品规格 + 可执行实施计划，等待用户审批后开始代码实现。

当前目标：

1. 完成 V0.2 Chrome 手动验收。
2. 获取 V0.3 计划审批后，按 `docs/superpowers/plans/2026-05-22-v0.3-comment-enhancement.md` 推进 V0.3 实现：记录元信息、页面级评论、编辑删除、状态切换、Prompt 分组、JSON 兼容。

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

V0.2 已经具备可手动验收的代码与构建：

1. 在 Chrome 扩展管理页 `Load unpacked` 加载 `extension/dist`。
2. 打开 `extension/test-pages/basic.html` 中的 `样式编辑器验收目标` 区块。
3. 按 `docs/ACCEPTANCE_CRITERIA.md` 第 6 节逐项验证 V0.2 样式预览、重置、保存、JSON、Prompt 和退出清理。

完成手动验收后，再进入 V0.3 准备：

1. 评论类型（视觉 / 交互 / 内容 / 体验）。
2. 评论优先级（必改 / 建议 / 备注）。
3. 交互态说明（默认 / 悬停 / 点击 / 禁用）。

已完成验证：

1. `cd extension && npm run verify` 已通过：单元测试 22/22、TypeScript、Vite build。
2. Edge MV3 自动化烟测仍覆盖 V0.1 主流程，V0.2 部分以单元测试 + Chrome 手动验收为主。
3. Chrome 命令行加载 unpacked extension 在当前环境被浏览器策略限制，仍以 Chrome 扩展管理页 `Load unpacked` 作为正式人工验收方式。

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

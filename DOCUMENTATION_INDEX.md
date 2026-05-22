# Web Visual AI Editor Documentation Index

本文档是项目文档入口和自动维护规则。后续开发中，如果产品范围、技术架构、数据格式、任务状态或验收标准变化，必须同步更新对应文档。

## 当前阶段

当前阶段：V0.1 已通过用户手动验收；V0.2 样式编辑器代码实现完成并通过 `npm run verify`，等待 Chrome 手动验收；V0.3 评论增强已完成产品规格与可执行实施计划，等待用户审批后开始代码实现。

当前目标：完成 V0.2 Chrome 手动验收，并在 V0.3 计划获批后按 `docs/superpowers/plans/2026-05-22-v0.3-comment-enhancement.md` 推进 V0.3 类型 / 优先级 / 状态 / 交互态 / 页面级评论 / 编辑删除 / Prompt 分组的实现。

当前边界：V0.3 不做多人协作、远程同步、审批流、自动分类、撤销栈、强制可视化交互态预览；只升级记录元信息、加入编辑/删除/状态/页面级评论与 Prompt 分组。

## 文档清单

| 文档 | 职责 | 何时更新 |
|---|---|---|
| `AGENTS.md` | 项目协作规则、Agent 工作约束、文档自动更新规则 | 协作流程、项目边界、默认工作方式变化时 |
| `docs/PROJECT_ROADMAP.md` | 项目总目标、完整功能蓝图、版本路线图、版本验收标准 | 总体目标、版本规划、长期功能蓝图变化时 |
| `docs/PRODUCT_SPEC.md` | 产品目标、用户流程、MVP 功能边界、非目标 | 产品范围、用户流程、核心功能变化时 |
| `docs/V0.2_STYLE_EDITOR_SPEC.md` | V0.2 样式编辑器产品规格、功能边界、验收标准、风险降级 | V0.2 样式编辑器范围、控件、数据、验收变化时 |
| `docs/V0.3_COMMENT_ENHANCEMENT_SPEC.md` | V0.3 评论增强产品规格、记录元信息、页面评论、编辑删除、Prompt 分组、验收 | V0.3 评论增强范围、字段、UI、验收变化时 |
| `docs/TECH_ARCHITECTURE.md` | MV3 架构、模块职责、消息流、运行机制 | 架构、目录、模块职责、权限策略变化时 |
| `docs/DATA_FORMAT.md` | 数据结构、JSON 导入导出格式、AI Prompt 模板 | 字段、schema、prompt 结构、版本兼容变化时 |
| `docs/DEVELOPMENT_PLAN.md` | 第一阶段开发任务拆解、里程碑、执行顺序 | 任务完成、延期、拆分、新增或优先级变化时 |
| `docs/ACCEPTANCE_CRITERIA.md` | 功能验收、体验验收、技术验收、测试场景 | 验收口径、测试命令、测试页面、质量门禁变化时 |
| `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md` | V0.2 样式编辑器可执行实现计划 | V0.2 实现拆解、文件边界、测试步骤变化时 |
| `docs/superpowers/plans/2026-05-22-v0.3-comment-enhancement.md` | V0.3 评论增强可执行实现计划 | V0.3 实现拆解、文件边界、测试步骤变化时 |

## 推荐阅读顺序

1. 先读 `AGENTS.md`，确认项目规则和边界。
2. 再读 `docs/PROJECT_ROADMAP.md`，确认项目总目标和版本路线图。
3. 再读 `docs/PRODUCT_SPEC.md`，确认 V0.1 产品目标和 MVP。
4. 开始 V0.2 / V0.3 前读对应规格：`docs/V0.2_STYLE_EDITOR_SPEC.md`、`docs/V0.3_COMMENT_ENHANCEMENT_SPEC.md`。
5. 再读 `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md` 和 `docs/superpowers/plans/2026-05-22-v0.3-comment-enhancement.md`，确认实现任务。
6. 再读 `docs/TECH_ARCHITECTURE.md`，确认技术实现方式。
7. 再读 `docs/DATA_FORMAT.md`，确认数据协议和导出格式。
8. 再读 `docs/DEVELOPMENT_PLAN.md`，确认当前应该做什么。
9. 最后读 `docs/ACCEPTANCE_CRITERIA.md`，确认如何验收。

## 自动更新触发条件

后续任何实现任务完成前，必须检查以下问题：

1. 是否新增、删除或调整了 MVP 功能？
   - 是：更新 `docs/PRODUCT_SPEC.md`。
2. 是否改变了 Content Script、Background、Panel、Overlay 的职责？
   - 是：更新 `docs/TECH_ARCHITECTURE.md`。
3. 是否改变了 `EditorSession`、`ElementSnapshot`、`EditRecord`、JSON 导出格式或 Prompt 模板？
   - 是：更新 `docs/DATA_FORMAT.md`。
4. 是否完成、拆分、新增或取消了开发任务？
   - 是：更新 `docs/DEVELOPMENT_PLAN.md`。
5. 是否新增测试页面、测试命令、验收标准或质量门禁？
   - 是：更新 `docs/ACCEPTANCE_CRITERIA.md`。
6. 是否改变项目总目标、完整功能蓝图或版本路线图？
   - 是：更新 `docs/PROJECT_ROADMAP.md`。
7. 是否新增重要文档或改变文档职责？
   - 是：更新本文件。

## 文档状态表

| 文档 | 当前状态 | 最近更新时间 | 备注 |
|---|---|---|---|
| `AGENTS.md` | 初版完成 | 2026-05-22 | 已包含自动更新规则 |
| `docs/PROJECT_ROADMAP.md` | 已同步当前阶段 | 2026-05-22 | V0.2 代码完成，V0.3 进入规格 + 计划阶段 |
| `docs/PRODUCT_SPEC.md` | 已补充 V0.2 入口 | 2026-05-22 | V0.1 MVP 已验收，V0.2 / V0.3 详见独立规格 |
| `docs/V0.2_STYLE_EDITOR_SPEC.md` | 初版完成 | 2026-05-22 | 覆盖 V0.2 样式编辑器功能边界、数据、验收和风险 |
| `docs/V0.3_COMMENT_ENHANCEMENT_SPEC.md` | 初版完成 | 2026-05-22 | 覆盖 V0.3 记录元信息、页面级评论、编辑删除、Prompt 分组、风险 |
| `docs/TECH_ARCHITECTURE.md` | 已同步 V0.2 实现 | 2026-05-22 | style-inspector / style-preview / StyleEditorPanel 已落地，V0.3 架构补充将在实施期间同步 |
| `docs/DATA_FORMAT.md` | 已同步 V0.2 实现 | 2026-05-22 | version 0.2、styleChanges 必填；V0.3 字段将在实施期间同步 |
| `docs/DEVELOPMENT_PLAN.md` | V0.2 实现已完成 | 2026-05-22 | V0.2 Task 15-17 完成，V0.3 任务清单将随实施同步 |
| `docs/ACCEPTANCE_CRITERIA.md` | 已同步 V0.2 实现 | 2026-05-22 | V0.2 正式验收已写入，V0.3 验收将在实施期间同步 |
| `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md` | 已执行完毕 | 2026-05-22 | 9 个 Task 全部完成 |
| `docs/superpowers/plans/2026-05-22-v0.3-comment-enhancement.md` | 初版完成 | 2026-05-22 | 9 个 Task 全部待执行，按 TDD + 文档同步顺序 |

## 维护要求

1. 文档必须和代码实际状态保持一致。
2. 如果代码已经变化但文档暂时无法同步，最终回复必须明确指出差异和后续补齐文件。
3. 不允许为了通过验收而删除文档中的真实风险。
4. 不允许把已暂缓功能悄悄加入 V0.1 实现范围。
5. 文档更新必须保留 MVP 最小闭环优先级。

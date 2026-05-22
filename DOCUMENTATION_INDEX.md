# Web Visual AI Editor Documentation Index

本文档是项目文档入口和自动维护规则。后续开发中，如果产品范围、技术架构、数据格式、任务状态或验收标准变化，必须同步更新对应文档。

## 当前阶段

当前阶段：V0.1 MVP 最小闭环已通过用户手动验收反馈，项目进入 V0.2 样式编辑器规格与实现准备阶段。

当前目标：按 `docs/V0.2_STYLE_EDITOR_SPEC.md` 和 `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md` 实现样式读取、样式预览、样式差异保存、JSON / Prompt 导出升级。

当前边界：V0.2 只做基础样式读取、临时预览和结构化差异导出；不做生产级 CSS 生成、源码定位、响应式断点编辑、相似组件批量应用、云端同步和多人协作。

## 文档清单

| 文档 | 职责 | 何时更新 |
|---|---|---|
| `AGENTS.md` | 项目协作规则、Agent 工作约束、文档自动更新规则 | 协作流程、项目边界、默认工作方式变化时 |
| `docs/PROJECT_ROADMAP.md` | 项目总目标、完整功能蓝图、版本路线图、版本验收标准 | 总体目标、版本规划、长期功能蓝图变化时 |
| `docs/PRODUCT_SPEC.md` | 产品目标、用户流程、MVP 功能边界、非目标 | 产品范围、用户流程、核心功能变化时 |
| `docs/V0.2_STYLE_EDITOR_SPEC.md` | V0.2 样式编辑器产品规格、功能边界、验收标准、风险降级 | V0.2 样式编辑器范围、控件、数据、验收变化时 |
| `docs/TECH_ARCHITECTURE.md` | MV3 架构、模块职责、消息流、运行机制 | 架构、目录、模块职责、权限策略变化时 |
| `docs/DATA_FORMAT.md` | 数据结构、JSON 导入导出格式、AI Prompt 模板 | 字段、schema、prompt 结构、版本兼容变化时 |
| `docs/DEVELOPMENT_PLAN.md` | 第一阶段开发任务拆解、里程碑、执行顺序 | 任务完成、延期、拆分、新增或优先级变化时 |
| `docs/ACCEPTANCE_CRITERIA.md` | 功能验收、体验验收、技术验收、测试场景 | 验收口径、测试命令、测试页面、质量门禁变化时 |
| `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md` | V0.2 样式编辑器可执行实现计划 | V0.2 实现拆解、文件边界、测试步骤变化时 |

## 推荐阅读顺序

1. 先读 `AGENTS.md`，确认项目规则和边界。
2. 再读 `docs/PROJECT_ROADMAP.md`，确认项目总目标和版本路线图。
3. 再读 `docs/PRODUCT_SPEC.md`，确认 V0.1 产品目标和 MVP。
4. 开始 V0.2 前读 `docs/V0.2_STYLE_EDITOR_SPEC.md`，确认样式编辑器范围。
5. 再读 `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md`，确认实现任务。
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
| `docs/PROJECT_ROADMAP.md` | 已同步当前阶段 | 2026-05-22 | V0.1 已人工验收，V0.2 进入样式编辑器准备阶段 |
| `docs/PRODUCT_SPEC.md` | 已补充 V0.2 入口 | 2026-05-22 | V0.1 MVP 已验收，V0.2 详见独立规格 |
| `docs/V0.2_STYLE_EDITOR_SPEC.md` | 初版完成 | 2026-05-22 | 覆盖 V0.2 样式编辑器功能边界、数据、验收和风险 |
| `docs/TECH_ARCHITECTURE.md` | 已补充 V0.2 规划模块 | 2026-05-22 | 新增 style inspector、preview manager、Panel 样式控件规划 |
| `docs/DATA_FORMAT.md` | 已补充 V0.2 数据扩展 | 2026-05-22 | 新增 StyleChange 和 styleChanges 兼容策略 |
| `docs/DEVELOPMENT_PLAN.md` | 已进入 V0.2 准备阶段 | 2026-05-22 | V0.2 规格和实现计划已完成，下一步可执行代码实现 |
| `docs/ACCEPTANCE_CRITERIA.md` | 已补充 V0.2 验收草案 | 2026-05-22 | 覆盖基础样式预览、重置、JSON 和 Prompt 验收 |
| `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md` | 初版完成 | 2026-05-22 | V0.2 可执行实现计划 |

## 维护要求

1. 文档必须和代码实际状态保持一致。
2. 如果代码已经变化但文档暂时无法同步，最终回复必须明确指出差异和后续补齐文件。
3. 不允许为了通过验收而删除文档中的真实风险。
4. 不允许把已暂缓功能悄悄加入 V0.1 实现范围。
5. 文档更新必须保留 MVP 最小闭环优先级。

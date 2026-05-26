# Web Visual AI Editor Documentation Index

本文档是项目文档入口和自动维护规则。后续开发中，如果产品范围、技术架构、数据格式、任务状态或验收标准变化，必须同步更新对应文档。

## 当前阶段

当前阶段：V0.1 已通过用户手动验收；V0.2 样式编辑器与 V0.3 评论增强已通过 Chrome 手动验收；V0.4 标尺测距、V0.5 共享元素与 V0.5.5 UI Refresh 已完成代码闭环。V0.6 自动布局辅助、V0.7 字体读取/切换与 V0.8 直接操作基础层已完成代码接入，当前导出 JSON 为 `0.8`；2026-05-26 已通过 Vibma 读取 Figma 选中画板并二次对齐工具栏、样式面板、记录面板和评论弹窗 UI；当前已修复评论 pin 全局编号和尺寸，继续收紧样式面板内部 SVG 图标与尺寸，并将顶部胶囊按钮比例压缩到 34px / 42px 级；自动布局面板已调整为只在 flex / grid 且有可操作兄弟元素时展开，普通 block / inline 场景不再占用样式面板主流程；相似元素长 selector 已裁切在面板内；正式浏览器图标和 `Packages/` 打包流程已接入。当前已通过 `npm run verify`（104 个单元测试 + TypeScript + Vite build）和 Chrome headless 页面内烟测，Chrome 真实插件手动验收仍待人工复核。

当前目标：在 Chrome 中人工复核真实插件图标点击、浏览器工具栏正式图标、Vibma 设计稿对齐后的紧凑顶部胶囊工具栏、383px 深色 Inspector、Panel 顶部功能条拖动、样式/记录/评论深灰控件、相似元素长 selector 裁切、顶部评论模式就地弹窗与评论编号点、自动布局有效场景展开与无效场景降级提示、V0.8 自动布局中部粉色拖拽横条、精准交换预览、交换位移动画、紫色虚线参考线、测距模式页面内点击 A 取消重选、共享元素开关、本地字体读取入口、JSON 0.8 导出、`Packages/web-visual-ai-editor-v0.8.0.zip` 包和退出编辑器后的页面恢复。

当前边界：V0.4 不做设计稿对比、跨 iframe 测距或每条记录多个测距对；V0.5 不做框架组件识别或自动批量改代码。V0.5.5 只改 UI 呈现、Panel 顶部功能条拖动、长度单位胶囊与必要可访问性/编辑态隔离修复。V0.6 只读取直接父容器基础布局并记录用户意图，Inspector 只默认展开可产生作用的 flex / grid 场景。V0.7 不做字体上传、云端字体管理、跨系统字体一致性保证或商用字体授权判断。V0.8 不做完整 Figma Auto Layout、跨父容器拖拽、自由定位、永久参考线系统或本地字体可用性保证。

## 文档清单

| 文档 | 职责 | 何时更新 |
|---|---|---|
| `AGENTS.md` | 项目协作规则、Agent 工作约束、文档自动更新规则 | 协作流程、项目边界、默认工作方式变化时 |
| `docs/CURRENT_HANDOFF.md` | 当前对话交接记录、用户意图、已完成修复、验证结果、待复核事项 | 换对话框前、阶段性调试交接、用户反馈重点变化时 |
| `docs/PROJECT_ROADMAP.md` | 项目总目标、完整功能蓝图、版本路线图、版本验收标准 | 总体目标、版本规划、长期功能蓝图变化时 |
| `docs/PRODUCT_SPEC.md` | 产品目标、用户流程、MVP 功能边界、非目标 | 产品范围、用户流程、核心功能变化时 |
| `docs/V0.2_STYLE_EDITOR_SPEC.md` | V0.2 样式编辑器产品规格、功能边界、验收标准、风险降级 | V0.2 样式编辑器范围、控件、数据、验收变化时 |
| `docs/V0.3_COMMENT_ENHANCEMENT_SPEC.md` | V0.3 评论增强产品规格、记录元信息、页面评论、编辑删除、Prompt 分组、验收 | V0.3 评论增强范围、字段、UI、验收变化时 |
| `docs/V0.4_RULER_SPEC.md` | V0.4 标尺测距产品规格、尺寸/视口/父容器/双元素测距、验收 | V0.4 测距范围、数据、UI、验收变化时 |
| `docs/V0.5_SHARED_ELEMENTS_SPEC.md` | V0.5 共享元素产品规格、相似元素检测、批量应用、验收 | V0.5 共享元素范围、算法、UI、验收变化时 |
| `docs/V0.5.5_UI_REFRESH_SPEC.md` | V0.5.5 UI Refresh 产品规格、Sketch-style 哑光 Inspector、设计系统、验收 | V0.5.5 UI 设计系统、组件、颜色、验收变化时 |
| `docs/V0.6_AUTO_LAYOUT_SPEC.md` | V0.6 自动布局辅助产品规格、布局上下文、布局意图、验收 | V0.6 布局读取、UI、数据、Prompt、验收变化时 |
| `docs/V0.7_FONT_SPEC.md` | V0.7 字体读取与切换产品规格、字体字段、`fontChanges`、Prompt、验收 | V0.7 字体读取、UI、数据、Prompt、验收变化时 |
| `docs/V0.8_DIRECT_MANIPULATION_SPEC.md` | V0.8 直接操作基础层、自动布局拖手、共享元素开关、本地字体入口、验收 | V0.8 直接操作、Overlay、字体入口、共享元素开关、数据版本变化时 |
| `docs/TECH_ARCHITECTURE.md` | MV3 架构、模块职责、消息流、运行机制 | 架构、目录、模块职责、权限策略变化时 |
| `docs/DATA_FORMAT.md` | 数据结构、JSON 导入导出格式、AI Prompt 模板 | 字段、schema、prompt 结构、版本兼容变化时 |
| `docs/DEVELOPMENT_PLAN.md` | 第一阶段开发任务拆解、里程碑、执行顺序 | 任务完成、延期、拆分、新增或优先级变化时 |
| `docs/ACCEPTANCE_CRITERIA.md` | 功能验收、体验验收、技术验收、测试场景 | 验收口径、测试命令、测试页面、质量门禁变化时 |
| `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md` | V0.2 样式编辑器可执行实现计划 | V0.2 实现拆解、文件边界、测试步骤变化时 |
| `docs/superpowers/plans/2026-05-22-v0.3-comment-enhancement.md` | V0.3 评论增强可执行实现计划 | V0.3 实现拆解、文件边界、测试步骤变化时 |
| `docs/superpowers/plans/2026-05-23-v0.4-ruler.md` | V0.4 标尺测距可执行实现计划 | V0.4 实现拆解、文件边界、测试步骤变化时 |
| `docs/superpowers/plans/2026-05-23-v0.5-shared-elements.md` | V0.5 共享元素可执行实现计划 | V0.5 实现拆解、文件边界、测试步骤变化时 |
| `docs/superpowers/plans/2026-05-23-v0.5.5-ui-refresh.md` | V0.5.5 UI Refresh 可执行实现计划 | V0.5.5 实现拆解、文件边界、测试步骤变化时 |
| `docs/superpowers/plans/2026-05-24-v0.6-auto-layout.md` | V0.6 自动布局辅助可执行实现计划 | V0.6 实现拆解、文件边界、测试步骤变化时 |
| `docs/superpowers/plans/2026-05-24-v0.7-font.md` | V0.7 字体读取与切换可执行实现计划 | V0.7 实现拆解、文件边界、测试步骤变化时 |
| `docs/superpowers/plans/2026-05-24-v0.8-direct-manipulation.md` | V0.8 直接操作基础层可执行实现计划 | V0.8 实现拆解、文件边界、测试步骤变化时 |

## 推荐阅读顺序

1. 先读 `AGENTS.md`，确认项目规则和边界。
2. 如果是接续当前对话，先读 `docs/CURRENT_HANDOFF.md`，确认最新用户反馈、已修复内容和待复核事项。
3. 再读 `docs/PROJECT_ROADMAP.md`，确认项目总目标和版本路线图。
4. 再读 `docs/PRODUCT_SPEC.md`，确认 V0.1 产品目标和 MVP。
5. 开始 V0.2 / V0.3 / V0.4 / V0.5 / V0.5.5 / V0.6 / V0.7 / V0.8 前读对应规格：
   - `docs/V0.2_STYLE_EDITOR_SPEC.md`
   - `docs/V0.3_COMMENT_ENHANCEMENT_SPEC.md`
   - `docs/V0.4_RULER_SPEC.md`
   - `docs/V0.5_SHARED_ELEMENTS_SPEC.md`
   - `docs/V0.5.5_UI_REFRESH_SPEC.md`
   - `docs/V0.6_AUTO_LAYOUT_SPEC.md`
   - `docs/V0.7_FONT_SPEC.md`
   - `docs/V0.8_DIRECT_MANIPULATION_SPEC.md`
6. 再读对应实现计划：
   - `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md`
   - `docs/superpowers/plans/2026-05-22-v0.3-comment-enhancement.md`
   - `docs/superpowers/plans/2026-05-23-v0.4-ruler.md`
   - `docs/superpowers/plans/2026-05-23-v0.5-shared-elements.md`
   - `docs/superpowers/plans/2026-05-23-v0.5.5-ui-refresh.md`
   - `docs/superpowers/plans/2026-05-24-v0.6-auto-layout.md`
   - `docs/superpowers/plans/2026-05-24-v0.7-font.md`
   - `docs/superpowers/plans/2026-05-24-v0.8-direct-manipulation.md`
7. 再读 `docs/TECH_ARCHITECTURE.md`，确认技术实现方式。
8. 再读 `docs/DATA_FORMAT.md`，确认数据协议和导出格式。
9. 再读 `docs/DEVELOPMENT_PLAN.md`，确认当前应该做什么。
10. 最后读 `docs/ACCEPTANCE_CRITERIA.md`，确认如何验收。

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
| `docs/CURRENT_HANDOFF.md` | 已新增 | 2026-05-26 | 记录当前对话重点、评论 pin 修复、Vibma 尺寸、浏览器图标、相似元素裁切、面板图标还原和后续复核事项 |
| `docs/PROJECT_ROADMAP.md` | 已同步当前阶段 | 2026-05-26 | 已加入 Vibma 选中画板二次对齐后的 V0.5.5 UI 状态 |
| `docs/PRODUCT_SPEC.md` | 已同步当前阶段 | 2026-05-24 | V0.1 MVP 已验收，V0.2 / V0.3 / V0.4 / V0.5 / V0.5.5 / V0.6 / V0.7 / V0.8 详见独立规格 |
| `docs/V0.2_STYLE_EDITOR_SPEC.md` | 初版完成 | 2026-05-22 | 覆盖 V0.2 样式编辑器功能边界、数据、验收和风险 |
| `docs/V0.3_COMMENT_ENHANCEMENT_SPEC.md` | 初版完成 | 2026-05-22 | 覆盖 V0.3 记录元信息、页面级评论、编辑删除、Prompt 分组、风险 |
| `docs/V0.4_RULER_SPEC.md` | 初版完成 | 2026-05-23 | 覆盖 V0.4 元素尺寸/视口距离/父容器距离/双元素测距、风险 |
| `docs/V0.5_SHARED_ELEMENTS_SPEC.md` | 已实现待验收 | 2026-05-26 | 覆盖 V0.5 相似元素检测、批量应用、风险，Task 1-10 已接入，并补充长 selector 裁切验收 |
| `docs/V0.5.5_UI_REFRESH_SPEC.md` | 已实现待验收 | 2026-05-26 | 已按 Vibma 选中画板二次对齐工具栏、样式面板、记录面板和评论弹窗 UI，并收紧顶部按钮比例、补充正式图标与打包流程 |
| `docs/V0.6_AUTO_LAYOUT_SPEC.md` | 已实现待验收 | 2026-05-26 | 覆盖 V0.6 父容器布局读取、有效场景展开、无效场景降级、布局意图、JSON/Prompt 和验收 |
| `docs/V0.7_FONT_SPEC.md` | 已实现待验收 | 2026-05-24 | 覆盖 V0.7 字体读取、字体预览、`fontChanges`、JSON/Prompt 和验收 |
| `docs/V0.8_DIRECT_MANIPULATION_SPEC.md` | 已实现待验收 | 2026-05-24 | 覆盖 V0.8 自动布局中部拖拽横条、精准交换预览、交换位移动画、紫色虚线参考线、共享开关、本地字体入口和验收 |
| `docs/TECH_ARCHITECTURE.md` | 已同步 V0.8 实现 | 2026-05-26 | 已加入 `PanelUtilityBar`、Panel 顶部功能条拖动、Vibma 画板 UI、浏览器图标和打包流程说明 |
| `docs/DATA_FORMAT.md` | 已同步 V0.8 实现 | 2026-05-24 | version 0.8、`fontChanges`、`layoutContext`、`layoutIntent`、`measurements` 与 `sharedGroup` 兼容规则已写入 |
| `docs/DEVELOPMENT_PLAN.md` | V0.8 代码完成待验收 | 2026-05-26 | 已加入 Vibma 设计稿二次对齐后的 Chrome 手动回归重点 |
| `docs/ACCEPTANCE_CRITERIA.md` | 已同步 V0.8 实现 | 2026-05-26 | 已加入顶部胶囊工具栏、Panel 顶部功能条和 Figma 对齐 UI 验收口径 |
| `docs/superpowers/plans/2026-05-22-v0.2-style-editor.md` | 已执行完毕 | 2026-05-22 | 9 个 Task 全部完成 |
| `docs/superpowers/plans/2026-05-22-v0.3-comment-enhancement.md` | 已执行完毕 | 2026-05-23 | 9 个 Task 全部完成 |
| `docs/superpowers/plans/2026-05-23-v0.4-ruler.md` | 已执行完毕 | 2026-05-23 | 9 个 Task 全部完成 |
| `docs/superpowers/plans/2026-05-23-v0.5-shared-elements.md` | 已执行待验收 | 2026-05-23 | Task 1-10 已实现，待 Chrome 手动复核 |
| `docs/superpowers/plans/2026-05-23-v0.5.5-ui-refresh.md` | 已执行待验收 | 2026-05-23 | 代码整合完成，Chrome 视觉/交互复核未完成 |
| `docs/superpowers/plans/2026-05-24-v0.6-auto-layout.md` | 已执行待验收 | 2026-05-24 | 代码整合完成，`npm run verify` 通过，Chrome 手动验收未完成 |
| `docs/superpowers/plans/2026-05-24-v0.7-font.md` | 已执行待验收 | 2026-05-24 | 代码整合完成，`npm run verify` 与页面内烟测通过，Chrome 手动验收未完成 |
| `docs/superpowers/plans/2026-05-24-v0.8-direct-manipulation.md` | 已执行待验收 | 2026-05-24 | 代码整合完成，`npm run verify` 通过，Chrome 手动验收未完成 |

## 维护要求

1. 文档必须和代码实际状态保持一致。
2. 如果代码已经变化但文档暂时无法同步，最终回复必须明确指出差异和后续补齐文件。
3. 不允许为了通过验收而删除文档中的真实风险。
4. 不允许把已暂缓功能悄悄加入 V0.1 实现范围。
5. 文档更新必须保留 MVP 最小闭环优先级。

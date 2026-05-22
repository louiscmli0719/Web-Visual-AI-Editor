# Web Visual AI Editor Acceptance Criteria

## 1. 验收目标

V0.1 验收重点是确认插件完成最小闭环，而不是验证复杂编辑能力。

当前状态：V0.1 已完成代码实现、自动化验证和用户手动验收反馈，后续作为 V0.2 开发基线。

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

## 3. 体验验收

1. 面板不能遮挡整个页面，默认右侧浮层即可。
2. 面板布局清晰，元素信息、评论输入、记录列表、导入导出分区明确。
3. Hover 和 selected 状态必须易区分。
4. 编辑模式状态必须明显。
5. 退出编辑模式后，宿主页面交互恢复正常。
6. 导入失败、复制失败、无选中元素、空记录列表都有明确提示。

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

1. `cd extension && npm run verify` 已通过，覆盖单元测试、TypeScript 类型检查和 Vite 构建。
2. Edge MV3 自动化烟测已通过插件激活、元素选中、评论保存、记录列表、记录定位、Overlay / Panel 存在、导出 JSON / 复制 Prompt 按钮启用。
3. 自动化烟测通过 CDP 调用 service worker 注入 content script，模拟真实鼠标和键盘输入验证主流程。
4. Chrome 命令行加载 unpacked extension 在当前环境被浏览器策略限制，Chrome 正式验收仍使用扩展管理页的 `Load unpacked`。
5. CDP 对 Shadow DOM 内部按钮的坐标点击存在自动化误差；记录定位业务逻辑已通过按钮点击事件验证，后续人工验收仍需确认真实鼠标点击体验。

手动验收步骤：

1. 运行 `npm run verify`。
2. 在 Chrome 打开扩展管理页。
3. 使用 `Load unpacked` 加载 `extension/dist`。
4. 打开 `extension/test-pages/basic.html`。
5. 点击插件图标进入编辑模式。
6. 逐项验证 hover、选中、评论保存、记录定位、JSON 导出、JSON 导入和 Prompt 复制。

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

## 6. V0.2 验收草案

V0.2 验收重点是确认基础样式编辑器闭环，而不是生产级 CSS 生成。

### 6.1 样式读取

Given 用户选中普通 HTMLElement  
When Panel 更新  
Then Panel 展示颜色、字号、字重、行高、间距、圆角、边框和阴影等白名单样式

通过标准：

1. 样式属性有固定展示顺序。
2. 非 HTMLElement 元素显示不支持提示。
3. 不读取输入框 value。

### 6.2 样式预览

Given 用户已选中元素  
When 用户修改 `backgroundColor`、`fontSize` 或 `borderRadius`  
Then 页面元素即时显示预览效果

通过标准：

1. 预览只作用于当前元素。
2. 预览写入临时 inline style。
3. 无效输入不应导致页面报错。

### 6.3 重置预览

Given 用户已经修改当前元素样式  
When 用户点击“重置当前预览”  
Then 当前元素恢复修改前状态

通过标准：

1. 恢复原始 inline style。
2. 不影响其他未修改样式。
3. 退出编辑模式时清理全部预览。

### 6.4 保存样式记录

Given 用户修改了一个或多个样式  
When 用户点击保存记录  
Then 记录保存 `styleChanges`

通过标准：

1. `styleChanges` 包含 property、oldValue、newValue。
2. 评论为空但有样式变化时允许保存。
3. 评论为空且无样式变化时不允许保存。

### 6.5 JSON 和 Prompt

Given 当前页面存在样式记录  
When 用户导出 JSON 或复制 Prompt  
Then 输出内容包含样式差异

通过标准：

1. JSON 版本升级到 `0.2`。
2. 导入 V0.1 JSON 仍可成功。
3. Prompt 明确提示 AI 不要机械写 inline style，应优先结合现有样式体系实现。

## 7. 建议测试页面

V0.1 后续应创建一个本地测试页面，至少包含：

1. 标题文本。
2. 普通段落。
3. 主按钮和次按钮。
4. 表单输入框。
5. 卡片列表。
6. 表格或列表。
7. 空状态区域。

测试页面用于确认插件能覆盖常见 DOM 结构。

## 8. 文档同步验收

每次功能开发完成后，必须检查：

1. `docs/DEVELOPMENT_PLAN.md` 是否更新任务状态。
2. `docs/PRODUCT_SPEC.md` 是否仍与功能范围一致。
3. `docs/TECH_ARCHITECTURE.md` 是否仍与代码架构一致。
4. `docs/DATA_FORMAT.md` 是否仍与实际导入导出一致。
5. `DOCUMENTATION_INDEX.md` 是否需要更新文档状态。

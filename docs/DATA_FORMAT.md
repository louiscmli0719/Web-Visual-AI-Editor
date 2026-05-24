# Web Visual AI Editor Data Format

## 1. 当前版本

当前运行时与导出格式为 `version: "0.8"`。V0.8 不新增顶层数据字段，重点把自动布局拖动换位写入既有 `layoutContext` / `layoutIntent`，同时保留 V0.7 字体修改子集 `fontChanges`、V0.5 共享元素范围 `sharedGroup`、V0.4 测距 `measurements`、V0.3 元信息与 V0.2 样式差异。当前样式差异中的长度值支持 `px` / `pt` 单位切换，导出时会保留单位后缀。

兼容策略：

1. 可导入 `0.1`、`0.2`、`0.3`、`0.4`、`0.5`、`0.6`、`0.7`、`0.8`。
2. 导入 `0.1` 至 `0.3` 时补齐元信息与 `measurements: null`。
3. 导入 `0.1` 至 `0.4` 时补齐 `sharedGroup: null`。
4. 导入 `0.1` 至 `0.5` 时补齐 `layoutContext: null` 和 `layoutIntent: null`。
5. 导入 `0.5` 至 `0.8` 时保留通过校验的 `sharedGroup`，不基于当前 DOM 重新匹配。
6. 导入 `0.6` 至 `0.8` 时保留通过校验的 `layoutContext` 与 `layoutIntent`。
7. 导入 `0.7` 或 `0.8` 时保留通过校验的 `fontChanges`；导入旧版本时从字体类 `styleChanges` 派生。
8. 任意导入成功后，内存中的规范化会话版本为 `0.8`。

## 2. 核心类型

```ts
type EditorSession = {
  version: "0.8";
  sessionId: string;
  page: PageInfo;
  createdAt: string;
  updatedAt: string;
  records: EditRecord[];
};

type PageInfo = {
  url: string;
  origin: string;
  title: string;
  viewport: { width: number; height: number };
};

type ElementSnapshot = {
  tagName: string;
  id: string | null;
  className: string | null;
  selector: string;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
};
```

### 2.1 EditRecord

```ts
type EditRecord = {
  id: string;
  element: ElementSnapshot | null;
  comment: string;
  category: RecordCategory;
  priority: RecordPriority;
  status: RecordStatus;
  interactionState: InteractionState | null;
  scope: "element" | "page";
  createdAt: string;
  updatedAt: string;
  styleChanges: StyleChange[];
  fontChanges?: FontChange[];
  measurements: Measurements | null;
  sharedGroup: SharedGroup | null;
  layoutContext?: LayoutContext | null;
  layoutIntent?: LayoutIntent | null;
};
```

约束：

1. `scope: "page"` 时 `element`、`interactionState`、`measurements`、`sharedGroup`、`layoutContext`、`layoutIntent` 均为 `null`，`styleChanges` 和 `fontChanges` 固定为 `[]`；页面建议不绑定元素级样式、状态、测距、共享范围、字体差异或布局上下文。
2. 元素记录只有在用户主动勾选“应用到相似元素”时才写入 `sharedGroup`。
3. `comment` 与 `styleChanges` 至少一项非空才保存元素记录。

### 2.2 元信息与样式差异

```ts
type RecordCategory = "visual" | "copy" | "interaction" | "layout" | "data" | "state";
type RecordPriority = "low" | "medium" | "high";
type RecordStatus = "open" | "resolved" | "deferred";
type InteractionState =
  | "default" | "hover" | "focus" | "active"
  | "disabled" | "loading" | "empty" | "error";

type StyleChange = {
  property: string;
  label: string;
  oldValue: string;
  newValue: string;
  unit?: "px" | "pt";
};

type FontPropertyName =
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "lineHeight"
  | "letterSpacing";

type FontChange = {
  property: FontPropertyName;
  label: string;
  oldValue: string;
  newValue: string;
  unit?: "px" | "pt";
};
```

说明：

1. `unit` 仅用于长度类样式差异，默认 `px`，可由面板切换为 `pt`。
2. `oldValue` / `newValue` 保留完整字符串，例如 `12px -> 9pt`。
3. 导入旧版本数据时，缺失的 `unit` 会按默认值处理，不影响兼容性。
4. `fontChanges` 是字体相关 `styleChanges` 的结构化子集，覆盖 `fontFamily`、`fontSize`、`fontWeight`、`lineHeight`、`letterSpacing`。
5. App 新保存的 V0.8 元素记录会继续写入 `fontChanges`；旧数据导入后如存在字体类 `styleChanges` 会自动派生。

### 2.3 Measurements

```ts
type Measurements = {
  size: { width: number; height: number };
  viewport: { top: number; right: number; bottom: number; left: number };
  parent: {
    selector: string;
    distances: { top: number; right: number; bottom: number; left: number };
  } | null;
  pair: {
    selector: string;
    text: string;
    rect: { x: number; y: number; width: number; height: number };
    horizontalDistance: number;
    verticalDistance: number;
    centerDistance: number;
  } | null;
};
```

距离单位为像素，数值按当前实现取整。`pair` 仍只表达一对元素，不因共享范围扩展。

### 2.4 SharedGroup

```ts
type MatchLevel = "exact" | "class-primary" | "tag-only";

type SharedGroup = {
  matchLevel: MatchLevel;
  primaryFeature: string;
  totalMatched: number;
  truncated: boolean;
  targets: ElementSnapshot[];
};
```

字段规则：

| 字段 | 说明 |
|---|---|
| `matchLevel` | `exact` 为 tag + 完整 class，`class-primary` 为同 tag + 主 class，`tag-only` 为同父容器同 tag |
| `primaryFeature` | Prompt 中用于说明批量范围的识别特征 |
| `totalMatched` | 包含当前记录 `element` 的目标数量，上限为 50 |
| `truncated` | 页面中识别到超过 50 个目标时为 `true` |
| `targets` | 除当前 `element` 外的匹配目标快照 |

### 2.5 LayoutContext / LayoutIntent

```ts
type LayoutDisplay = "flex" | "inline-flex" | "grid" | "inline-grid" | "block" | "inline" | "other";

type LayoutContext = {
  parentSelector: string;
  parentTagName: string;
  display: LayoutDisplay;
  flexDirection: string | null;
  justifyContent: string | null;
  alignItems: string | null;
  gap: { row: string; column: string };
  childIndex: number;
  siblingCount: number;
};

type LayoutIntent = {
  direction: "none" | "horizontal" | "vertical";
  alignment: "none" | "start" | "center" | "end" | "space-between";
  gap: string;
  note: string;
};
```

字段规则：

| 字段 | 说明 |
|---|---|
| `layoutContext.parentSelector` | 选中元素父容器 selector，用于让 AI 找到需要调整的布局层级 |
| `layoutContext.display` | 父容器 computed `display` 的归一化结果 |
| `flexDirection` / `justifyContent` / `alignItems` | flex/grid 常见布局字段；非相关布局可为 `null` |
| `gap` | 父容器 row / column gap 字符串，保留浏览器 computed 值 |
| `childIndex` / `siblingCount` | 当前元素在父容器中的位置上下文 |
| `layoutIntent` | 用户在面板中主动保存的布局修改意图，不自动改写宿主页面 |

## 3. JSON 导出示例

```json
{
  "app": "Web Visual AI Editor",
  "version": "0.8",
  "exportedAt": "2026-05-23T13:00:00.000Z",
  "page": {
    "url": "https://example.com/pricing",
    "origin": "https://example.com",
    "title": "Pricing",
    "viewport": { "width": 1440, "height": 900 }
  },
  "records": [
    {
      "id": "rec_shared_1",
      "comment": "统一所有套餐按钮的圆角",
      "category": "visual",
      "priority": "high",
      "status": "open",
      "interactionState": null,
      "scope": "element",
      "createdAt": "2026-05-23T12:58:00.000Z",
      "updatedAt": "2026-05-23T12:58:00.000Z",
      "element": {
        "tagName": "button",
        "id": null,
        "className": "shared-btn btn-primary",
        "selector": ".shared-btn:nth-child(1)",
        "text": "立即创建",
        "rect": { "x": 48, "y": 420, "width": 108, "height": 42 }
      },
      "styleChanges": [
        {
          "property": "fontFamily",
          "label": "字体",
          "oldValue": "Arial, sans-serif",
          "newValue": "Inter, Arial, sans-serif"
        }
      ],
      "fontChanges": [
        {
          "property": "fontFamily",
          "label": "字体",
          "oldValue": "Arial, sans-serif",
          "newValue": "Inter, Arial, sans-serif"
        }
      ],
      "measurements": null,
      "sharedGroup": {
        "matchLevel": "exact",
        "primaryFeature": "button.shared-btn.btn-primary",
        "totalMatched": 3,
        "truncated": false,
        "targets": [
          {
            "tagName": "button",
            "id": null,
            "className": "shared-btn btn-primary",
            "selector": ".shared-btn:nth-child(2)",
            "text": "立即升级",
            "rect": { "x": 168, "y": 420, "width": 108, "height": 42 }
          }
        ]
      },
      "layoutContext": null,
      "layoutIntent": null
    }
  ]
}
```

## 4. 导入校验与降级

导入必须校验 `app`、受支持版本、`page`、`records`、元素 selector 与 rect。V0.5+ 的 `sharedGroup` 仅在以下字段合法时保留：

1. `matchLevel` 是三个枚举之一。
2. `primaryFeature` 为字符串。
3. `totalMatched` 为数字，`truncated` 为布尔值。
4. `targets` 为合法 `ElementSnapshot[]`。

不合法的 `sharedGroup` 会降级为 `null`，避免导入数据驱动错误批量作用范围。

V0.6 至 V0.8 的 `layoutContext` 与 `layoutIntent` 仅在字段和枚举值合法时保留；旧版本导入或非法布局字段均降级为 `null`，避免 Prompt 输出错误布局上下文。

V0.7 / V0.8 的 `fontChanges` 仅在字段合法且 `property` 属于字体白名单时保留；旧版本导入时会从合法 `styleChanges` 派生字体修改。

导入时同时维护作用域不变量：

1. `scope: "page"` 的记录会清空导入载荷中残留的 `element`、`interactionState`、`styleChanges`、`fontChanges`、`measurements`、`sharedGroup`、`layoutContext` 与 `layoutIntent`。
2. `scope: "element"` 的记录必须包含合法 `element`；无目标元素的记录拒绝导入。

## 5. AI Prompt 输出

有 `sharedGroup` 的记录在评论后增加批量说明，例如：

```text
- 作用范围：以下修改请应用到 3 个相似元素（匹配级别：精确匹配（tag + 完整 class））：
  - .shared-btn:nth-child(1)
  - .shared-btn:nth-child(2)
  - .shared-btn:nth-child(3)
```

`truncated: true` 时追加“识别结果已截断到 50 个，可能漏掉部分元素”。`measurements` 仍单独输出“测距”段，页面级记录不输出元素或批量段。

有 `fontChanges` 的记录会增加字体修改段，并从普通样式修改段中过滤掉重复字体项，例如：

```text
- 字体修改：
  - 字体（fontFamily）: Arial, sans-serif -> Inter, Arial, sans-serif
  - 字间距（letterSpacing）: normal -> 0.4px
```

有 `layoutContext` 或 `layoutIntent` 的记录会增加布局辅助段，例如：

```text
- 布局辅助：
  - 父容器：.toolbar（DIV，display: flex）
  - 当前布局：direction row / justify flex-start / align center
  - 当前间距：row 16px / column 24px
  - 当前子元素位置：第 2 个 / 共 3 个
  - 目标方向：横向
  - 目标对齐：居中对齐
  - 目标间距：16px
  - 补充说明：保持按钮组居中并等距。
```

## 6. 隐私规则

1. JSON 和 Prompt 可能包含页面 URL、主动选中的元素文本与 selector。
2. 共享记录会包含用户确认过的相似元素快照，但不自动导出未确认的候选。
3. 插件不读取敏感输入值，不上传页面内容，也不注入远程脚本。
4. 用户在对外发送导出内容前应检查其中是否包含敏感业务信息。

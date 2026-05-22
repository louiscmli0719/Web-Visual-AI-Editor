# Web Visual AI Editor Data Format

## 1. 设计目标

V0.1 的数据格式要满足三个目标：

1. 插件自身可以导入导出。
2. AI / Codex 可以理解用户修改意图。
3. 前端开发人员可以根据 selector、位置、文本和评论定位问题。

数据格式必须简单、稳定、可版本化。

当前状态：

1. V0.2 当前实现使用 `version: "0.2"`。
2. V0.2 已实现 `styleChanges`，与评论共存于同一条 `EditRecord`。
3. V0.2 导入兼容 V0.1 JSON：缺失 `styleChanges` 时默认补空数组。

## 2. 核心类型

### 2.1 EditorSession

```ts
type EditorSession = {
  version: "0.2";
  sessionId: string;
  page: PageInfo;
  createdAt: string;
  updatedAt: string;
  records: EditRecord[];
};
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `version` | string | 当前数据版本 |
| `sessionId` | string | 当前页面编辑会话 ID |
| `page` | PageInfo | 页面基础信息 |
| `createdAt` | ISO string | 会话创建时间 |
| `updatedAt` | ISO string | 会话更新时间 |
| `records` | EditRecord[] | 当前页面所有评论和修改记录 |

### 2.2 PageInfo

```ts
type PageInfo = {
  url: string;
  origin: string;
  title: string;
  viewport: {
    width: number;
    height: number;
  };
};
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `url` | string | 当前页面完整 URL |
| `origin` | string | 当前页面 origin |
| `title` | string | 页面标题 |
| `viewport.width` | number | 视口宽度 |
| `viewport.height` | number | 视口高度 |

### 2.3 ElementSnapshot

```ts
type ElementSnapshot = {
  tagName: string;
  id: string | null;
  className: string | null;
  selector: string;
  text: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `tagName` | string | DOM 标签名，统一小写或统一原始值 |
| `id` | string \| null | DOM id |
| `className` | string \| null | DOM class |
| `selector` | string | 用于重新定位元素的 selector |
| `text` | string | 元素文本，建议限制长度 |
| `rect.x` | number | 元素相对视口 x |
| `rect.y` | number | 元素相对视口 y |
| `rect.width` | number | 元素宽度 |
| `rect.height` | number | 元素高度 |

### 2.4 EditRecord

```ts
type EditRecord = {
  id: string;
  element: ElementSnapshot;
  comment: string;
  styleChanges: StyleChange[];
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
};
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 记录 ID |
| `element` | ElementSnapshot | 被评论元素快照 |
| `comment` | string | 用户评论或修改意图，可以为空字符串 |
| `styleChanges` | StyleChange[] | V0.2 样式差异列表，V0.1 导入时默认补空数组 |
| `status` | open/resolved | 记录状态 |
| `createdAt` | ISO string | 创建时间 |
| `updatedAt` | ISO string | 更新时间 |

保存规则：

1. `comment` 与 `styleChanges` 至少一个不能为空，否则不会写入记录。
2. `styleChanges` 中只保留 `newValue` 与 `oldValue` 不同的属性。

### 2.5 StyleChange

```ts
type StylePropertyName =
  | "color"
  | "backgroundColor"
  | "fontSize"
  | "fontWeight"
  | "lineHeight"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "borderRadius"
  | "borderWidth"
  | "borderColor"
  | "boxShadow";

type StyleChange = {
  property: StylePropertyName;
  label: string;
  oldValue: string;
  newValue: string;
  unit?: "px";
};
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `property` | StylePropertyName | CSS 属性名，使用 DOM style camelCase 命名 |
| `label` | string | 面板展示名称 |
| `oldValue` | string | 修改前 computed style 值 |
| `newValue` | string | 用户设置的新值 |
| `unit` | "px" | 数值类属性的单位，V0.2 只规划 px |

## 3. JSON 导出格式

```json
{
  "app": "Web Visual AI Editor",
  "version": "0.2",
  "exportedAt": "2026-05-22T10:00:00.000Z",
  "page": {
    "url": "https://example.com/dashboard",
    "origin": "https://example.com",
    "title": "Dashboard",
    "viewport": {
      "width": 1440,
      "height": 900
    }
  },
  "records": [
    {
      "id": "rec_001",
      "status": "open",
      "comment": "这个按钮不够醒目，希望改成主按钮，并增加更明确的文案。",
      "createdAt": "2026-05-22T10:01:00.000Z",
      "updatedAt": "2026-05-22T10:01:00.000Z",
      "element": {
        "tagName": "button",
        "id": "submit",
        "className": "btn secondary",
        "selector": "#submit",
        "text": "提交",
        "rect": {
          "x": 1180,
          "y": 720,
          "width": 96,
          "height": 40
        }
      },
      "styleChanges": [
        {
          "property": "backgroundColor",
          "label": "背景色",
          "oldValue": "rgb(255, 255, 255)",
          "newValue": "#006be6"
        },
        {
          "property": "borderRadius",
          "label": "圆角",
          "oldValue": "0px",
          "newValue": "12px",
          "unit": "px"
        }
      ]
    }
  ]
}
```

## 4. JSON 导入校验

导入时必须校验：

1. 根对象必须是 object。
2. `app` 必须等于 `Web Visual AI Editor`。
3. `version` 必须是 `0.1` 或 `0.2`。
4. `records` 必须是数组。
5. 每条记录必须包含 `id`、`comment`、`element.selector`。
6. 每条记录的 `element.rect` 必须包含 `x`、`y`、`width`、`height`。

V0.2 兼容规则：

1. 导入 `version: "0.1"` 时，记录被规范化为 V0.2，`styleChanges` 默认补 `[]`。
2. 导入 `version: "0.2"` 时，`styleChanges` 可以不存在或为空数组。
3. 如果存在 `styleChanges`，每条变化必须包含 `property`、`label`、`oldValue`、`newValue`。
4. 不被识别的样式条目会被忽略，记录仍保留。
5. 导入后插件不会自动把 `styleChanges` 重新应用到页面，避免污染当前网页。

导入失败输出：

1. JSON 解析失败：提示“JSON 格式不正确”。
2. app 不匹配：提示“不是 Web Visual AI Editor 导出的数据”。
3. version 不支持：提示“当前版本暂不支持该数据版本”。
4. records 缺失：提示“未找到可导入的修改记录”。

## 5. Selector 未匹配处理

导入或定位时，如果 `document.querySelector(record.element.selector)` 找不到元素：

1. 记录仍保留。
2. 列表项显示“当前页面未匹配到元素”。
3. AI Prompt 仍导出该记录。
4. 后续可根据 `text`、`tagName`、`rect` 进行人工判断。

## 6. AI Prompt 导出模板

```text
你是资深前端工程师和 UI 设计还原助手。

请根据以下网页改稿记录，对目标页面进行修改。你需要优先保持现有技术栈、组件结构、样式体系和交互逻辑，不要大范围重构。

页面信息：
- URL: {{page.url}}
- Title: {{page.title}}
- Viewport: {{page.viewport.width}} x {{page.viewport.height}}

修改要求：
{{#records}}
第 {{index}} 项：
- 元素选择器：{{element.selector}}
- 元素类型：{{element.tagName}}
- 元素文本：{{element.text}}
- 元素位置：x={{element.rect.x}}, y={{element.rect.y}}, width={{element.rect.width}}, height={{element.rect.height}}
- 用户评论 / 修改意图：{{comment}}
{{#hasStyleChanges}}
- 样式修改：
  - {{property}}: {{oldValue}} -> {{newValue}}
{{/hasStyleChanges}}

请找到对应元素或最接近的组件实现，并按评论意图与样式差异修改。
{{/records}}

输出要求：
1. 说明你修改了哪些文件。
2. 说明每条评论和样式修改对应的实现方式。
3. 如果 selector 无法直接匹配，请根据文本、位置和上下文寻找最接近元素。
4. 处理样式修改时，请优先结合现有样式系统（如设计 token、CSS 变量、Tailwind 等）实现，不要机械写 inline style。
5. 不要删除无关功能。
6. 修改后请运行必要的构建、类型检查或测试。
```

V0.2 Prompt 额外要求：

1. 样式修改应优先落到现有 CSS、组件样式或设计 token 中。
2. 不要机械把所有修改写成 inline style。
3. 如果项目存在主题变量，应优先复用主题变量。
4. 评论为空但存在 `styleChanges` 时，Prompt 中评论字段输出为「空」，AI 仅根据样式差异执行。

## 7. 隐私注意事项

1. JSON 会包含页面 URL。
2. JSON 会包含用户主动选择元素的文本。
3. V0.1 不应读取输入框 value。
4. V0.1 不应自动采集整页 DOM。
5. 导出前 UI 应提示用户检查敏感信息。

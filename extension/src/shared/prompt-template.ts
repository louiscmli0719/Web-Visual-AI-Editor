import type { EditRecord, EditorSession, StyleChange } from "./types";

export const AI_PROMPT_TEMPLATE = `你是资深前端工程师和 UI 设计还原助手。

请根据以下网页改稿记录，对目标页面进行修改。你需要优先保持现有技术栈、组件结构、样式体系和交互逻辑，不要大范围重构。

页面信息：
- URL: {{page.url}}
- Title: {{page.title}}
- Viewport: {{page.viewport.width}} x {{page.viewport.height}}

修改要求：
{{records}}

输出要求：
1. 说明你修改了哪些文件。
2. 说明每条评论和样式修改对应的实现方式。
3. 如果 selector 无法直接匹配，请根据文本、位置和上下文寻找最接近元素。
4. 处理样式修改时，请优先结合现有样式系统（如设计 token、CSS 变量、Tailwind 等）实现，不要机械写 inline style。
5. 不要删除无关功能。
6. 修改后请运行必要的构建、类型检查或测试。`;

export function buildAiPrompt(session: EditorSession): string {
  const records = session.records.map(formatRecord).join("\n\n");

  return AI_PROMPT_TEMPLATE.replace("{{page.url}}", session.page.url)
    .replace("{{page.title}}", session.page.title)
    .replace("{{page.viewport.width}}", String(session.page.viewport.width))
    .replace("{{page.viewport.height}}", String(session.page.viewport.height))
    .replace("{{records}}", records || "当前没有修改记录。");
}

function formatRecord(record: EditRecord, index: number): string {
  const { element } = record;
  const lines = [
    `第 ${index + 1} 项：`,
    `- 元素选择器：${element.selector}`,
    `- 元素类型：${element.tagName}`,
    `- 元素文本：${element.text || "空"}`,
    `- 元素位置：x=${element.rect.x}, y=${element.rect.y}, width=${element.rect.width}, height=${element.rect.height}`,
    `- 用户评论 / 修改意图：${record.comment || "空"}`
  ];

  if (record.styleChanges.length > 0) {
    lines.push("- 样式修改：");
    for (const change of record.styleChanges) {
      lines.push(`  - ${formatStyleChange(change)}`);
    }
  }

  lines.push("");
  lines.push("请找到对应元素或最接近的组件实现，并按评论意图与样式差异修改。");

  return lines.join("\n");
}

function formatStyleChange(change: StyleChange): string {
  return `${change.property}: ${change.oldValue || "空"} -> ${change.newValue || "空"}`;
}

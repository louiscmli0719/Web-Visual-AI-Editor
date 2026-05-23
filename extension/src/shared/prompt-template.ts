import type { EditRecord, EditorSession, StyleChange, RecordCategory, Measurements, ElementSnapshot, SharedGroup } from "./types";
import {
  formatRecordCategory,
  formatRecordPriority,
  formatRecordStatus,
  formatInteractionState,
} from "./record-metadata";

const CATEGORY_ORDER: RecordCategory[] = ["visual", "copy", "interaction", "layout", "data", "state"];

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function buildAiPrompt(session: EditorSession): string {
  const { records } = session;

  const summary = buildSummary(records);
  const groupedSections = buildGroupedSections(records);

  return `你是资深前端工程师和 UI 设计还原助手。

请根据以下网页改稿记录，对目标页面进行修改。你需要优先保持现有技术栈、组件结构、样式体系和交互逻辑，不要大范围重构。

页面信息：
- URL: ${session.page.url}
- Title: ${session.page.title}
- Viewport: ${session.page.viewport.width} x ${session.page.viewport.height}

${summary}

修改要求：
${groupedSections || "当前没有修改记录。"}

输出要求：
1. 说明你修改了哪些文件。
2. 说明每条评论和样式修改对应的实现方式。
3. 如果 selector 无法直接匹配，请根据文本、位置和上下文寻找最接近元素。
4. 处理样式修改时，请优先结合现有样式系统（如设计 token、CSS 变量、Tailwind 等）实现，不要机械写 inline style。
5. 不要删除无关功能。
6. 标记为"暂缓 / 仅供参考"的记录请暂时不要执行，仅作为参考信息。
7. 优先处理"必改"（高优先级）记录，再处理"建议"（中优先级）和"备注"（低优先级）。
8. 修改后请运行必要的构建、类型检查或测试。`;
}

function buildSummary(records: EditRecord[]): string {
  if (records.length === 0) {
    return "总览：当前没有修改记录。";
  }

  const high = records.filter((r) => r.priority === "high").length;
  const medium = records.filter((r) => r.priority === "medium").length;
  const low = records.filter((r) => r.priority === "low").length;

  return `总览：共 ${records.length} 条记录（必改 ${high} 条 / 建议 ${medium} 条 / 备注 ${low} 条）`;
}

function buildGroupedSections(records: EditRecord[]): string {
  const sections: string[] = [];

  for (const category of CATEGORY_ORDER) {
    const categoryRecords = records.filter((r) => r.category === category);

    if (categoryRecords.length === 0) {
      continue;
    }

    // Sort within group by priority (high -> medium -> low)
    const sorted = [...categoryRecords].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    );

    const formattedRecords = sorted.map((record, index) => formatRecord(record, index)).join("\n\n");

    sections.push(`## ${formatRecordCategory(category)}\n\n${formattedRecords}`);
  }

  return sections.join("\n\n");
}

function formatRecord(record: EditRecord, index: number): string {
  const { element } = record;
  const deferredMark = record.status === "deferred" ? "（暂缓 / 仅供参考）" : "";
  const priorityLabel = formatRecordPriority(record.priority);
  const statusLabel = formatRecordStatus(record.status);

  const lines = [
    `第 ${index + 1} 项 [${priorityLabel}优先级 / ${statusLabel}] ${deferredMark}`.trim(),
  ];

  if (element) {
    lines.push(
      `- 元素选择器：${element.selector}`,
      `- 元素类型：${element.tagName}`,
      `- 元素文本：${element.text || "空"}`,
      `- 元素位置：x=${element.rect.x}, y=${element.rect.y}, width=${element.rect.width}, height=${element.rect.height}`
    );
  } else {
    lines.push(`- 作用域：页面级评论`);
  }

  if (record.interactionState) {
    lines.push(`- 交互态：${formatInteractionState(record.interactionState)}`);
  }

  lines.push(`- 用户评论 / 修改意图：${record.comment || "空"}`);

  if (record.sharedGroup && element) {
    lines.push(...formatSharedGroup(element, record.sharedGroup));
  }

  if (record.styleChanges.length > 0) {
    lines.push("- 样式修改：");
    for (const change of record.styleChanges) {
      lines.push(`  - ${formatStyleChange(change)}`);
    }
  }

  if (record.measurements) {
    lines.push(...formatMeasurements(record.measurements));
  }

  lines.push("");
  lines.push(
    element
      ? "请找到对应元素或最接近的组件实现，并按评论意图与样式差异修改。"
      : "请根据页面整体情况实现此建议。"
  );

  if (record.styleChanges.length > 0) {
    lines.push("注意：处理样式时请优先结合现有样式系统实现。");
  }

  return lines.join("\n");
}

function formatMeasurements(m: Measurements): string[] {
  const lines = ["- 测距："];

  lines.push(`  - 当前尺寸：${m.size.width}×${m.size.height}`);
  lines.push(
    `  - 距视口：上 ${m.viewport.top} / 右 ${m.viewport.right} / 下 ${m.viewport.bottom} / 左 ${m.viewport.left}`
  );

  if (m.parent) {
    lines.push(
      `  - 距父容器（${m.parent.selector}）：上 ${m.parent.distances.top} / 右 ${m.parent.distances.right} / 下 ${m.parent.distances.bottom} / 左 ${m.parent.distances.left}`
    );
  }

  if (m.pair) {
    lines.push(
      `  - 与目标元素（${m.pair.selector}）：水平 ${m.pair.horizontalDistance}、垂直 ${m.pair.verticalDistance}、中心 ${m.pair.centerDistance}`
    );
  }

  return lines;
}

function formatSharedGroup(element: ElementSnapshot, group: SharedGroup): string[] {
  const matchLevelLabels = {
    exact: "精确匹配（tag + 完整 class）",
    "class-primary": "主类匹配（同 tag + 同主类）",
    "tag-only": "结构匹配（同父容器同 tag）"
  } satisfies Record<SharedGroup["matchLevel"], string>;
  const targets = [element, ...group.targets];
  const lines = [
    `- 作用范围：以下修改请应用到 ${group.totalMatched} 个相似元素（匹配级别：${matchLevelLabels[group.matchLevel]}）：`
  ];

  for (const target of targets.slice(0, 10)) {
    lines.push(`  - ${target.selector}`);
  }

  if (targets.length > 10) {
    lines.push("  - ...");
  }

  if (group.truncated) {
    lines.push("  - 注意：识别结果已截断到 50 个，可能漏掉部分元素。");
  }

  return lines;
}

function formatStyleChange(change: StyleChange): string {
  return `${change.property}: ${change.oldValue || "空"} -> ${change.newValue || "空"}`;
}

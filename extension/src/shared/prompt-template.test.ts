import { describe, expect, it } from "vitest";
import type { EditorSession } from "./types";
import { buildAiPrompt } from "./prompt-template";

describe("buildAiPrompt", () => {
  it("includes page context and every edit record", () => {
    const session: EditorSession = {
      version: "0.4",
      sessionId: "session_1",
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: {
          width: 1440,
          height: 900
        }
      },
      records: [
        {
          id: "record_1",
          status: "open",
          comment: "按钮需要更醒目",
          category: "visual",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-22T00:01:00.000Z",
          updatedAt: "2026-05-22T00:01:00.000Z",
          styleChanges: [],
          measurements: null,
          sharedGroup: null,
          element: {
            tagName: "button",
            id: "submit",
            className: "btn",
            selector: "#submit",
            text: "提交",
            rect: {
              x: 10,
              y: 20,
              width: 100,
              height: 40
            }
          }
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("URL: https://example.com");
    expect(prompt).toContain("元素选择器：#submit");
    expect(prompt).toContain("用户评论 / 修改意图：按钮需要更醒目");
  });

  it("renders style changes when present", () => {
    const session: EditorSession = {
      version: "0.4",
      sessionId: "session_1",
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "record_1",
          status: "open",
          comment: "",
          category: "visual",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-22T00:01:00.000Z",
          updatedAt: "2026-05-22T00:01:00.000Z",
          element: {
            tagName: "button",
            id: "submit",
            className: "btn",
            selector: "#submit",
            text: "提交",
            rect: { x: 0, y: 0, width: 100, height: 40 }
          },
          styleChanges: [
            {
              property: "backgroundColor",
              label: "背景色",
              oldValue: "rgb(255, 255, 255)",
              newValue: "#006be6"
            },
            {
              property: "borderRadius",
              label: "圆角",
              oldValue: "0px",
              newValue: "12px",
              unit: "px"
            }
          ],
          measurements: null,
          sharedGroup: null
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("样式修改：");
    expect(prompt).toContain("- backgroundColor: rgb(255, 255, 255) -> #006be6");
    expect(prompt).toContain("- borderRadius: 0px -> 12px");
    expect(prompt).toContain("用户评论 / 修改意图：空");
    expect(prompt).toContain("优先结合现有样式系统");
  });

  it("renders font changes as a dedicated Prompt section", () => {
    const session: EditorSession = {
      version: "0.7",
      sessionId: "session_font",
      createdAt: "2026-05-24T00:00:00.000Z",
      updatedAt: "2026-05-24T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "record_font",
          status: "open",
          comment: "标题字体换成 Inter，并稍微增加字间距",
          category: "visual",
          priority: "high",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-24T00:01:00.000Z",
          updatedAt: "2026-05-24T00:01:00.000Z",
          element: {
            tagName: "h1",
            id: null,
            className: "hero-title",
            selector: ".hero-title",
            text: "Web Visual AI Editor",
            rect: { x: 0, y: 0, width: 320, height: 64 }
          },
          styleChanges: [
            {
              property: "fontFamily",
              label: "字体",
              oldValue: "Arial, sans-serif",
              newValue: "Inter, Arial, sans-serif"
            },
            {
              property: "letterSpacing",
              label: "字间距",
              oldValue: "normal",
              newValue: "0.4px"
            }
          ],
          fontChanges: [
            {
              property: "fontFamily",
              label: "字体",
              oldValue: "Arial, sans-serif",
              newValue: "Inter, Arial, sans-serif"
            },
            {
              property: "letterSpacing",
              label: "字间距",
              oldValue: "normal",
              newValue: "0.4px"
            }
          ],
          measurements: null,
          sharedGroup: null
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("字体修改：");
    expect(prompt).toContain("字体（fontFamily）: Arial, sans-serif -> Inter, Arial, sans-serif");
    expect(prompt).toContain("字间距（letterSpacing）: normal -> 0.4px");
    expect(prompt).not.toContain("- fontFamily: Arial, sans-serif -> Inter, Arial, sans-serif");
  });

  it("groups records by category and sorts by priority", () => {
    const session: EditorSession = {
      version: "0.4",
      sessionId: "session_1",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "r1",
          status: "open",
          comment: "低优先级视觉",
          category: "visual",
          priority: "low",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: {
            tagName: "div",
            id: null,
            className: null,
            selector: "div",
            text: "",
            rect: { x: 0, y: 0, width: 100, height: 100 }
          },
          styleChanges: [],
          measurements: null,
          sharedGroup: null
        },
        {
          id: "r2",
          status: "open",
          comment: "高优先级交互",
          category: "interaction",
          priority: "high",
          interactionState: "hover",
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: {
            tagName: "button",
            id: null,
            className: null,
            selector: "button",
            text: "",
            rect: { x: 0, y: 0, width: 100, height: 40 }
          },
          styleChanges: [],
          measurements: null,
          sharedGroup: null
        },
        {
          id: "r3",
          status: "open",
          comment: "高优先级视觉",
          category: "visual",
          priority: "high",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: {
            tagName: "span",
            id: null,
            className: null,
            selector: "span",
            text: "",
            rect: { x: 0, y: 0, width: 50, height: 20 }
          },
          styleChanges: [],
          measurements: null,
          sharedGroup: null
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    // Should have summary
    expect(prompt).toContain("总览：共 3 条记录");
    expect(prompt).toContain("必改 2 条");
    expect(prompt).toContain("备注 1 条");

    // Should group by category
    expect(prompt).toContain("## 视觉");
    expect(prompt).toContain("## 交互");

    // Within visual category, high priority should come before low
    const visualSection = prompt.split("## 视觉")[1].split("##")[0];
    const highIndex = visualSection.indexOf("高优先级视觉");
    const lowIndex = visualSection.indexOf("低优先级视觉");
    expect(highIndex).toBeLessThan(lowIndex);
  });

  it("marks deferred records", () => {
    const session: EditorSession = {
      version: "0.4",
      sessionId: "session_1",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "r1",
          status: "deferred",
          comment: "暂缓的记录",
          category: "visual",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: {
            tagName: "div",
            id: null,
            className: null,
            selector: "div",
            text: "",
            rect: { x: 0, y: 0, width: 100, height: 100 }
          },
          styleChanges: [],
          measurements: null,
          sharedGroup: null
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("（暂缓 / 仅供参考）");
  });

  it("handles page-scope records", () => {
    const session: EditorSession = {
      version: "0.4",
      sessionId: "session_1",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "r1",
          status: "open",
          comment: "整体间距太紧",
          category: "layout",
          priority: "medium",
          interactionState: null,
          scope: "page",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: null,
          styleChanges: [],
          measurements: null,
          sharedGroup: null
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("作用域：页面级评论");
    expect(prompt).toContain("整体间距太紧");
  });

  it("includes measurement sub-section for records with measurements", () => {
    const session: EditorSession = {
      version: "0.4",
      sessionId: "session_1",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "r1",
          status: "open",
          comment: "按钮太小",
          category: "visual",
          priority: "high",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: {
            tagName: "button",
            id: "submit",
            className: "btn",
            selector: "#submit",
            text: "提交",
            rect: { x: 100, y: 200, width: 80, height: 32 }
          },
          styleChanges: [],
          measurements: {
            size: { width: 80, height: 32 },
            viewport: { top: 200, right: 1260, bottom: 668, left: 100 },
            parent: {
              selector: ".form-row",
              distances: { top: 8, right: 16, bottom: 8, left: 16 }
            },
            pair: {
              selector: ".cancel-btn",
              text: "取消",
              rect: { x: 200, y: 200, width: 80, height: 32 },
              horizontalDistance: 20,
              verticalDistance: 0,
              centerDistance: 100
            }
          },
          sharedGroup: null
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("测距：");
    expect(prompt).toContain("当前尺寸：80×32");
    expect(prompt).toContain("距视口：上 200");
    expect(prompt).toContain("距父容器（.form-row）");
    expect(prompt).toContain("与目标元素（.cancel-btn）");
    expect(prompt).toContain("水平 20");
  });

  it("omits measurement sub-section when measurements is null", () => {
    const session: EditorSession = {
      version: "0.4",
      sessionId: "session_1",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "r1",
          status: "open",
          comment: "无测距",
          category: "visual",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: {
            tagName: "div",
            id: null,
            className: null,
            selector: "div",
            text: "",
            rect: { x: 0, y: 0, width: 100, height: 50 }
          },
          styleChanges: [],
          measurements: null,
          sharedGroup: null
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).not.toContain("测距：");
    expect(prompt).not.toContain("当前尺寸");
  });

  it("omits parent and pair lines when they are null in measurements", () => {
    const session: EditorSession = {
      version: "0.4",
      sessionId: "session_1",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "r1",
          status: "open",
          comment: "只有尺寸和视口",
          category: "visual",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: {
            tagName: "div",
            id: null,
            className: null,
            selector: "div",
            text: "",
            rect: { x: 0, y: 0, width: 100, height: 50 }
          },
          styleChanges: [],
          measurements: {
            size: { width: 100, height: 50 },
            viewport: { top: 0, right: 1340, bottom: 850, left: 0 },
            parent: null,
            pair: null
          },
          sharedGroup: null
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("测距：");
    expect(prompt).toContain("当前尺寸：100×50");
    expect(prompt).toContain("距视口");
    expect(prompt).not.toContain("距父容器");
    expect(prompt).not.toContain("与目标元素");
  });

  it("includes layout context and intent for V0.6 layout records", () => {
    const session: EditorSession = {
      version: "0.6",
      sessionId: "session_layout",
      createdAt: "2026-05-24T00:00:00.000Z",
      updatedAt: "2026-05-24T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "layout_1",
          status: "open",
          comment: "布局意图：改为横向排列；居中对齐；目标间距 16px",
          category: "layout",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-24T00:01:00.000Z",
          updatedAt: "2026-05-24T00:01:00.000Z",
          element: {
            tagName: "button",
            id: "submit",
            className: "btn",
            selector: "#submit",
            text: "提交",
            rect: { x: 100, y: 200, width: 80, height: 32 }
          },
          styleChanges: [],
          measurements: null,
          sharedGroup: null,
          layoutContext: {
            parentSelector: ".toolbar",
            parentTagName: "DIV",
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: { row: "16px", column: "24px" },
            childIndex: 1,
            siblingCount: 3
          },
          layoutIntent: {
            direction: "horizontal",
            alignment: "center",
            gap: "16px",
            note: "保持按钮组居中并等距。"
          }
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("布局辅助：");
    expect(prompt).toContain("父容器：.toolbar");
    expect(prompt).toContain("当前布局：direction row");
    expect(prompt).toContain("目标方向：横向");
    expect(prompt).toContain("目标对齐：居中对齐");
    expect(prompt).toContain("目标间距：16px");
  });

  it("describes shared scope and truncation for batch records", () => {
    const session: EditorSession = {
      version: "0.5",
      sessionId: "session_shared",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:01:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "shared_1",
          status: "open",
          comment: "统一卡片标题字号",
          category: "visual",
          priority: "high",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:01:00.000Z",
          element: {
            tagName: "h3",
            id: null,
            className: "card-title",
            selector: ".card:nth-child(1) .card-title",
            text: "标题一",
            rect: { x: 0, y: 0, width: 100, height: 24 }
          },
          styleChanges: [],
          measurements: null,
          sharedGroup: {
            matchLevel: "class-primary",
            primaryFeature: "h3.card-title",
            totalMatched: 50,
            truncated: true,
            targets: [
              {
                tagName: "h3",
                id: null,
                className: "card-title",
                selector: ".card:nth-child(2) .card-title",
                text: "标题二",
                rect: { x: 0, y: 40, width: 100, height: 24 }
              }
            ]
          }
        }
      ]
    };

    const prompt = buildAiPrompt(session);

    expect(prompt).toContain("作用范围：以下修改请应用到 50 个相似元素");
    expect(prompt).toContain("主类匹配（同 tag + 同主类）");
    expect(prompt).toContain(".card:nth-child(1) .card-title");
    expect(prompt).toContain(".card:nth-child(2) .card-title");
    expect(prompt).toContain("已截断到 50 个");
  });
});

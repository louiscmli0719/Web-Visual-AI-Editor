import { describe, expect, it } from "vitest";
import type { EditorSession } from "./types";
import { buildAiPrompt } from "./prompt-template";

describe("buildAiPrompt", () => {
  it("includes page context and every edit record", () => {
    const session: EditorSession = {
      version: "0.2",
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
          createdAt: "2026-05-22T00:01:00.000Z",
          updatedAt: "2026-05-22T00:01:00.000Z",
          styleChanges: [],
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
      version: "0.2",
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
          ]
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
});


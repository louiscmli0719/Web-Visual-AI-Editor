import { describe, expect, it } from "vitest";
import type { ElementSnapshot, StyleChange, SharedGroup } from "../shared/types";
import { addEditRecord, createInitialSession, parseEditorSessionExport, serializeEditorSession } from "./session-store";
import { DEFAULT_RECORD_METADATA } from "../shared/record-metadata";

const element: ElementSnapshot = {
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
};

const backgroundChange: StyleChange = {
  property: "backgroundColor",
  label: "背景色",
  oldValue: "rgb(255, 255, 255)",
  newValue: "#006be6"
};

const lengthChange: StyleChange = {
  property: "fontSize",
  label: "字号",
  oldValue: "12px",
  newValue: "9pt",
  unit: "pt"
};

const sharedGroup: SharedGroup = {
  matchLevel: "exact",
  primaryFeature: "button.btn",
  totalMatched: 2,
  truncated: false,
  targets: [{ ...element, id: "cancel", selector: "#cancel", text: "取消" }]
};

describe("session-store", () => {
  it("adds trimmed comments as open edit records", () => {
    const session = createInitialSession({
      idFactory: () => "session_1",
      now: () => "2026-05-22T00:00:00.000Z"
    });

    const updated = addEditRecord(session, element, "  按钮需要更醒目  ", [], DEFAULT_RECORD_METADATA, null, null, {
      idFactory: () => "record_1",
      now: () => "2026-05-22T00:01:00.000Z"
    });

    expect(updated.records).toHaveLength(1);
    expect(updated.records[0]).toMatchObject({
      id: "record_1",
      comment: "按钮需要更醒目",
      status: "open",
      category: "visual",
      priority: "medium",
      scope: "element",
      element,
      styleChanges: [],
      measurements: null,
      sharedGroup: null
    });
    expect(updated.updatedAt).toBe("2026-05-22T00:01:00.000Z");
  });

  it("saves a record with style changes even when comment is empty", () => {
    const session = createInitialSession({
      idFactory: () => "session_1",
      now: () => "2026-05-22T00:00:00.000Z"
    });

    const updated = addEditRecord(session, element, "", [backgroundChange], DEFAULT_RECORD_METADATA, null, null, {
      idFactory: () => "record_1",
      now: () => "2026-05-22T00:01:00.000Z"
    });

    expect(updated.records).toHaveLength(1);
    expect(updated.records[0]?.comment).toBe("");
    expect(updated.records[0]?.styleChanges).toEqual([backgroundChange]);
  });

  it("rejects records with empty comment and empty style changes", () => {
    const session = createInitialSession({
      idFactory: () => "session_1",
      now: () => "2026-05-22T00:00:00.000Z"
    });

    const updated = addEditRecord(session, element, "   ", [], DEFAULT_RECORD_METADATA, null, null, {
      idFactory: () => "record_1",
      now: () => "2026-05-22T00:01:00.000Z"
    });

    expect(updated.records).toHaveLength(0);
    expect(updated.updatedAt).toBe("2026-05-22T00:00:00.000Z");
  });

  it("round-trips exported session JSON with style changes", () => {
    const session = createInitialSession({
      idFactory: () => "session_1",
      now: () => "2026-05-22T00:00:00.000Z"
    });
    const updated = addEditRecord(session, element, "按钮需要更醒目", [backgroundChange, lengthChange], DEFAULT_RECORD_METADATA, null, sharedGroup, {
      idFactory: () => "record_1",
      now: () => "2026-05-22T00:01:00.000Z"
    });

    const exportedJson = serializeEditorSession(updated, {
      now: () => "2026-05-22T00:02:00.000Z"
    });
    const parsed = parseEditorSessionExport(exportedJson);

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].comment).toBe("按钮需要更醒目");
    expect(parsed.ok && parsed.session.records[0].styleChanges).toEqual([backgroundChange, lengthChange]);
    expect(parsed.ok && parsed.session.records[0].sharedGroup).toEqual(sharedGroup);
  });

  it("exports the V0.5 data format version", () => {
    const session = createInitialSession({
      idFactory: () => "session_1",
      now: () => "2026-05-22T00:00:00.000Z"
    });
    const exportedJson = serializeEditorSession(session, {
      now: () => "2026-05-22T00:02:00.000Z"
    });

    expect(JSON.parse(exportedJson).version).toBe("0.5");
  });

  it("imports V0.1 JSON without style changes for backward compatibility", () => {
    const v01Payload = {
      app: "Web Visual AI Editor",
      version: "0.1",
      exportedAt: "2026-05-22T00:00:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "legacy_1",
          status: "open",
          comment: "旧记录",
          createdAt: "2026-05-22T00:00:00.000Z",
          updatedAt: "2026-05-22T00:00:00.000Z",
          element
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(v01Payload));

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].styleChanges).toEqual([]);
    expect(parsed.ok && parsed.session.records[0].category).toBe("visual");
    expect(parsed.ok && parsed.session.records[0].priority).toBe("medium");
    expect(parsed.ok && parsed.session.records[0].scope).toBe("element");
    expect(parsed.ok && parsed.session.records[0].sharedGroup).toBe(null);
  });

  it("imports V0.2 JSON and adds default metadata", () => {
    const v02Payload = {
      app: "Web Visual AI Editor",
      version: "0.2",
      exportedAt: "2026-05-22T00:00:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "v02_1",
          status: "resolved",
          comment: "V0.2 记录",
          createdAt: "2026-05-22T00:00:00.000Z",
          updatedAt: "2026-05-22T00:00:00.000Z",
          element,
          styleChanges: [backgroundChange]
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(v02Payload));

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].status).toBe("resolved");
    expect(parsed.ok && parsed.session.records[0].styleChanges).toEqual([backgroundChange]);
    expect(parsed.ok && parsed.session.records[0].category).toBe("visual");
    expect(parsed.ok && parsed.session.records[0].priority).toBe("medium");
  });

  it("imports V0.3 JSON with full metadata", () => {
    const v03Payload = {
      app: "Web Visual AI Editor",
      version: "0.3",
      exportedAt: "2026-05-23T00:00:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "v03_1",
          status: "deferred",
          comment: "V0.3 记录",
          category: "interaction",
          priority: "high",
          interactionState: "hover",
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element,
          styleChanges: []
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(v03Payload));

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].status).toBe("deferred");
    expect(parsed.ok && parsed.session.records[0].category).toBe("interaction");
    expect(parsed.ok && parsed.session.records[0].priority).toBe("high");
    expect(parsed.ok && parsed.session.records[0].interactionState).toBe("hover");
    expect(parsed.ok && parsed.session.records[0].scope).toBe("element");
  });

  it("imports V0.3 page-scope record with null element", () => {
    const v03PagePayload = {
      app: "Web Visual AI Editor",
      version: "0.3",
      exportedAt: "2026-05-23T00:00:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "page_1",
          status: "open",
          comment: "页面级评论",
          category: "layout",
          priority: "medium",
          interactionState: null,
          scope: "page",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: null,
          styleChanges: []
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(v03PagePayload));

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].element).toBe(null);
    expect(parsed.ok && parsed.session.records[0].scope).toBe("page");
    expect(parsed.ok && parsed.session.records[0].comment).toBe("页面级评论");
  });

  it("imports V0.1/V0.2/V0.3 records with null measurements (V0.4 default)", () => {
    const v03Payload = {
      app: "Web Visual AI Editor",
      version: "0.3",
      exportedAt: "2026-05-23T00:00:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "rec_1",
          status: "open",
          comment: "test",
          category: "visual",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element,
          styleChanges: []
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(v03Payload));

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].measurements).toBe(null);
    expect(parsed.ok && parsed.session.records[0].sharedGroup).toBe(null);
    expect(parsed.ok && parsed.session.version).toBe("0.5");
  });

  it("imports V0.4 JSON with full measurements", () => {
    const v04Payload = {
      app: "Web Visual AI Editor",
      version: "0.4",
      exportedAt: "2026-05-23T00:00:00.000Z",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "rec_v04",
          status: "open",
          comment: "with measurements",
          category: "layout",
          priority: "high",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element,
          styleChanges: [],
          measurements: {
            size: { width: 100, height: 40 },
            viewport: { top: 20, right: 1230, bottom: 840, left: 10 },
            parent: null,
            pair: null
          }
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(v04Payload));

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].measurements).not.toBe(null);
    expect(parsed.ok && parsed.session.records[0].measurements?.size).toEqual({ width: 100, height: 40 });
    expect(parsed.ok && parsed.session.records[0].sharedGroup).toBe(null);
  });

  it("imports V0.5 JSON with shared group data intact", () => {
    const v05Payload = {
      app: "Web Visual AI Editor",
      version: "0.5",
      exportedAt: "2026-05-23T00:00:00.000Z",
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
          comment: "统一按钮样式",
          category: "visual",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element,
          styleChanges: [],
          measurements: null,
          sharedGroup
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(v05Payload));

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].sharedGroup).toEqual(sharedGroup);
  });

  it("drops element-only fields from imported page-scope records", () => {
    const payload = {
      app: "Web Visual AI Editor",
      version: "0.5",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "page_invalid_scope",
          status: "open",
          comment: "页面建议",
          category: "layout",
          priority: "medium",
          interactionState: "hover",
          scope: "page",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element,
          styleChanges: [backgroundChange],
          measurements: {
            size: { width: 100, height: 40 },
            viewport: { top: 0, right: 0, bottom: 0, left: 0 },
            parent: null,
            pair: null
          },
          sharedGroup
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(payload));

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].element).toBe(null);
    expect(parsed.ok && parsed.session.records[0].interactionState).toBe(null);
    expect(parsed.ok && parsed.session.records[0].styleChanges).toEqual([]);
    expect(parsed.ok && parsed.session.records[0].measurements).toBe(null);
    expect(parsed.ok && parsed.session.records[0].sharedGroup).toBe(null);
  });

  it("rejects imported element-scope records without a target element", () => {
    const payload = {
      app: "Web Visual AI Editor",
      version: "0.5",
      page: {
        url: "https://example.com",
        origin: "https://example.com",
        title: "Example",
        viewport: { width: 1440, height: 900 }
      },
      records: [
        {
          id: "element_without_target",
          status: "open",
          comment: "缺少目标",
          category: "visual",
          priority: "medium",
          interactionState: null,
          scope: "element",
          createdAt: "2026-05-23T00:00:00.000Z",
          updatedAt: "2026-05-23T00:00:00.000Z",
          element: null,
          styleChanges: []
        }
      ]
    };

    const parsed = parseEditorSessionExport(JSON.stringify(payload));

    expect(parsed).toEqual({
      ok: false,
      reason: "导入数据缺少必要字段"
    });
  });

  it("rejects invalid imported data with a user-facing reason", () => {
    const parsed = parseEditorSessionExport(`{"app":"Other Tool","version":"0.1","records":[]}`);

    expect(parsed).toEqual({
      ok: false,
      reason: "不是 Web Visual AI Editor 导出的数据"
    });
  });
});

import { describe, expect, it } from "vitest";
import type { ElementSnapshot, StyleChange } from "../shared/types";
import { addEditRecord, createInitialSession, parseEditorSessionExport, serializeEditorSession } from "./session-store";

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

describe("session-store", () => {
  it("adds trimmed comments as open edit records", () => {
    const session = createInitialSession({
      idFactory: () => "session_1",
      now: () => "2026-05-22T00:00:00.000Z"
    });

    const updated = addEditRecord(session, element, "  按钮需要更醒目  ", [], {
      idFactory: () => "record_1",
      now: () => "2026-05-22T00:01:00.000Z"
    });

    expect(updated.records).toHaveLength(1);
    expect(updated.records[0]).toMatchObject({
      id: "record_1",
      comment: "按钮需要更醒目",
      status: "open",
      element,
      styleChanges: []
    });
    expect(updated.updatedAt).toBe("2026-05-22T00:01:00.000Z");
  });

  it("saves a record with style changes even when comment is empty", () => {
    const session = createInitialSession({
      idFactory: () => "session_1",
      now: () => "2026-05-22T00:00:00.000Z"
    });

    const updated = addEditRecord(session, element, "", [backgroundChange], {
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

    const updated = addEditRecord(session, element, "   ", [], {
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
    const updated = addEditRecord(session, element, "按钮需要更醒目", [backgroundChange], {
      idFactory: () => "record_1",
      now: () => "2026-05-22T00:01:00.000Z"
    });

    const exportedJson = serializeEditorSession(updated, {
      now: () => "2026-05-22T00:02:00.000Z"
    });
    const parsed = parseEditorSessionExport(exportedJson);

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.session.records[0].comment).toBe("按钮需要更醒目");
    expect(parsed.ok && parsed.session.records[0].styleChanges).toEqual([backgroundChange]);
  });

  it("exports the V0.2 data format version", () => {
    const session = createInitialSession({
      idFactory: () => "session_1",
      now: () => "2026-05-22T00:00:00.000Z"
    });
    const exportedJson = serializeEditorSession(session, {
      now: () => "2026-05-22T00:02:00.000Z"
    });

    expect(JSON.parse(exportedJson).version).toBe("0.2");
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
  });

  it("rejects invalid imported data with a user-facing reason", () => {
    const parsed = parseEditorSessionExport(`{"app":"Other Tool","version":"0.1","records":[]}`);

    expect(parsed).toEqual({
      ok: false,
      reason: "不是 Web Visual AI Editor 导出的数据"
    });
  });
});


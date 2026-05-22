import { createRoot, type Root } from "react-dom/client";
import { App, type PanelState } from "./App";
import type { EditRecord, StylePropertyName } from "../shared/types";

export type PanelController = {
  update(input: PanelState): void;
  destroy(): void;
};

export type PanelHandlers = {
  onSaveComment(comment: string): void;
  onLocateRecord(record: EditRecord): void;
  onExportJson(): void;
  onImportJson(value: string): void;
  onCopyPrompt(): void;
  onStyleDraftChange(property: StylePropertyName, value: string): void;
  onResetStylePreview(): void;
};

const PANEL_HOST_ID = "web-visual-ai-editor-panel-root";

export function createPanelRoot(handlers: PanelHandlers): PanelController {
  const existing = document.getElementById(PANEL_HOST_ID);

  if (existing) {
    existing.remove();
  }

  const host = document.createElement("div");
  host.id = PANEL_HOST_ID;
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const mount = document.createElement("div");

  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .wvaie-panel {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      max-height: calc(100dvh - 32px);
      width: 360px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 10px;
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
      overflow: hidden;
      pointer-events: auto;
    }

    .wvaie-header {
      flex: none;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      background: #f8fafc;
    }

    .wvaie-header strong {
      display: block;
      font-size: 14px;
      line-height: 1.3;
    }

    .wvaie-header span {
      color: #64748b;
      font-size: 12px;
      line-height: 1.3;
      white-space: nowrap;
    }

    .wvaie-section {
      display: grid;
      gap: 8px;
      padding: 14px 16px 16px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }

    .wvaie-scroll {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .wvaie-section h2 {
      margin: 0;
      color: #0f172a;
      font-size: 13px;
      line-height: 1.4;
    }

    .wvaie-section p,
    .wvaie-section dd,
    .wvaie-section dt,
    .wvaie-empty,
    .wvaie-status-message {
      margin: 0;
      color: #334155;
      font-size: 13px;
      line-height: 1.5;
    }

    .wvaie-section dl {
      display: grid;
      grid-template-columns: 86px minmax(0, 1fr);
      gap: 6px 10px;
      margin: 0;
    }

    .wvaie-section dt {
      color: #64748b;
    }

    .wvaie-section dd {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .wvaie-textarea {
      box-sizing: border-box;
      width: 100%;
      resize: vertical;
      min-height: 82px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 10px;
      color: #0f172a;
      font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .wvaie-actions,
    .wvaie-footer {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .wvaie-button {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      color: #0f172a;
      cursor: pointer;
      font: 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 8px 10px;
    }

    .wvaie-button-primary {
      border-color: #006be6;
      background: #006be6;
      color: #ffffff;
    }

    .wvaie-button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    .wvaie-record-list {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .wvaie-record {
      display: grid;
      gap: 6px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }

    .wvaie-record strong,
    .wvaie-code {
      overflow-wrap: anywhere;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.45;
    }

    .wvaie-record p {
      margin: 0;
    }

    .wvaie-record-style {
      display: grid;
      gap: 4px;
      border-top: 1px dashed #cbd5e1;
      margin-top: 4px;
      padding-top: 6px;
    }

    .wvaie-record-style h3 {
      margin: 0;
      color: #475569;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.4;
    }

    .wvaie-record-style ul {
      display: grid;
      gap: 2px;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .wvaie-record-style li {
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    .wvaie-style-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .wvaie-style-row {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      align-items: center;
      gap: 6px 10px;
    }

    .wvaie-style-row label {
      color: #475569;
      font-size: 12px;
      line-height: 1.4;
    }

    .wvaie-style-input,
    .wvaie-style-select {
      box-sizing: border-box;
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px;
      color: #0f172a;
      font: 12px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .wvaie-style-color {
      display: grid;
      grid-template-columns: 36px minmax(0, 1fr);
      gap: 6px;
      align-items: center;
    }

    .wvaie-style-color input[type="color"] {
      width: 36px;
      height: 28px;
      padding: 0;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
    }

    .wvaie-style-group-title {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .wvaie-style-changed {
      color: #006be6;
      font-weight: 600;
    }

    .wvaie-status-message {
      color: #006be6;
    }
  `;

  shadow.append(style, mount);

  const root: Root = createRoot(mount);
  let currentState: PanelState = {
    enabled: true,
    selectedElement: null,
    selectedStyleSnapshot: [],
    selectedStyleSupported: false,
    styleDraft: {},
    records: [],
    statusMessage: "请选择页面元素并添加评论。",
    unmatchedRecordIds: new Set()
  };

  function render(): void {
    root.render(<App handlers={handlers} state={currentState} />);
  }

  render();

  return {
    update(input) {
      currentState = input;
      render();
    },
    destroy() {
      root.unmount();
      host.remove();
    }
  };
}

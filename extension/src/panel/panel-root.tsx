import { createRoot, type Root } from "react-dom/client";
import { App, type PanelState } from "./App";
import type { EditRecord, StylePropertyName, RecordMetadata, RecordStatus, RecordCategory, RecordRangeFilter } from "../shared/types";

export type PanelController = {
  update(input: PanelState): void;
  destroy(): void;
};

export type PanelHandlers = {
  onSaveComment(comment: string, metadata: RecordMetadata): void;
  onSavePageComment(comment: string, metadata: RecordMetadata): void;
  onLocateRecord(record: EditRecord): void;
  onEditRecord(record: EditRecord): void;
  onDeleteRecord(record: EditRecord): void;
  onStatusChange(recordId: string, status: RecordStatus): void;
  onCancelEdit(): void;
  onFilterCategoryChange(category: RecordCategory | "all"): void;
  onFilterStatusChange(status: RecordStatus | "all"): void;
  onFilterRangeChange(range: RecordRangeFilter): void;
  onHoverSimilar(index: number | null): void;
  onHighlightAllSimilar(): void;
  onHighlightSharedGroup(record: EditRecord): void;
  onExportJson(): void;
  onImportJson(value: string): void;
  onCopyPrompt(): void;
  onStyleDraftChange(property: StylePropertyName, value: string): void;
  onResetStylePreview(): void;
  onEnterMeasurementMode(): void;
  onExitMeasurementMode(): void;
  onResetPairMeasurement(): void;
  onToggleAttachMeasurements(next: boolean): void;
  onToggleApplyToSimilar(next: boolean): void;
  onBrowseMode(): void;
  onSelectMode(): void;
  onShowInspector(): void;
  onShowRecords(): void;
  onClose(): void;
};

const PANEL_HOST_ID = "web-visual-ai-editor-panel-root";
const PANEL_DRAG_MARGIN = 8;

type PanelDragController = {
  clamp(): void;
  destroy(): void;
};

type PanelDragState = {
  handle: HTMLElement;
  panel: HTMLElement;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function isInteractiveDragTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return target.closest("button, input, select, textarea, a, summary, [role='button'], [contenteditable='true']") !== null;
}

function bindPanelDrag(mount: HTMLElement): PanelDragController {
  let dragState: PanelDragState | null = null;
  let lastDraggedPanel: HTMLElement | null = null;

  function clampPanel(panel: HTMLElement): void {
    if (panel.hidden || !panel.style.left || !panel.style.top) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - PANEL_DRAG_MARGIN;
    const maxY = window.innerHeight - rect.height - PANEL_DRAG_MARGIN;
    const nextLeft = clampNumber(rect.left, PANEL_DRAG_MARGIN, maxX);
    const nextTop = clampNumber(rect.top, PANEL_DRAG_MARGIN, maxY);

    panel.style.left = `${Math.round(nextLeft)}px`;
    panel.style.top = `${Math.round(nextTop)}px`;
  }

  function movePanel(event: PointerEvent): void {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const maxX = window.innerWidth - dragState.width - PANEL_DRAG_MARGIN;
    const maxY = window.innerHeight - dragState.height - PANEL_DRAG_MARGIN;
    const nextLeft = clampNumber(event.clientX - dragState.offsetX, PANEL_DRAG_MARGIN, maxX);
    const nextTop = clampNumber(event.clientY - dragState.offsetY, PANEL_DRAG_MARGIN, maxY);

    dragState.panel.style.left = `${Math.round(nextLeft)}px`;
    dragState.panel.style.top = `${Math.round(nextTop)}px`;
    event.preventDefault();
  }

  function endDrag(event: PointerEvent): void {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    dragState.panel.classList.remove("wvaie-panel-dragging");
    dragState.handle.releasePointerCapture?.(dragState.pointerId);
    dragState = null;
    window.removeEventListener("pointermove", movePanel);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  }

  function startDrag(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0 || isInteractiveDragTarget(event.target)) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const header = target.closest(".wvaie-header");
    const panel = header?.closest(".wvaie-panel");
    if (!(header instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    dragState = {
      handle: header,
      panel,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    lastDraggedPanel = panel;

    panel.style.left = `${Math.round(rect.left)}px`;
    panel.style.top = `${Math.round(rect.top)}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.classList.add("wvaie-panel-dragging");

    header.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", movePanel);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    event.preventDefault();
    event.stopPropagation();
  }

  function handleResize(): void {
    if (!lastDraggedPanel?.isConnected) {
      lastDraggedPanel = null;
      return;
    }

    clampPanel(lastDraggedPanel);
  }

  mount.addEventListener("pointerdown", startDrag);
  window.addEventListener("resize", handleResize);

  return {
    clamp() {
      if (lastDraggedPanel?.isConnected) {
        clampPanel(lastDraggedPanel);
      }
    },
    destroy() {
      mount.removeEventListener("pointerdown", startDrag);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", movePanel);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      dragState?.panel.classList.remove("wvaie-panel-dragging");
      if (dragState) {
        dragState.handle.releasePointerCapture?.(dragState.pointerId);
      }
      dragState = null;
      lastDraggedPanel = null;
    },
  };
}

export function createPanelRoot(handlers: PanelHandlers): PanelController {
  document.getElementById(PANEL_HOST_ID)?.remove();

  const host = document.createElement("div");
  host.id = PANEL_HOST_ID;
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const mount = document.createElement("div");
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      color-scheme: dark;
      --bg: #121212;
      --bg-panel: rgba(18, 18, 18, 0.97);
      --bg-toolbar: rgba(20, 20, 20, 0.98);
      --bg-raised: rgba(255, 255, 255, 0.055);
      --bg-field: rgba(255, 255, 255, 0.085);
      --bg-field-hover: rgba(255, 255, 255, 0.11);
      --bg-hover: rgba(255, 255, 255, 0.075);
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.18);
      --text: rgba(255, 255, 255, 0.95);
      --text-muted: rgba(226, 232, 240, 0.82);
      --text-dim: rgba(148, 163, 184, 0.78);
      --accent: #5b6cff;
      --accent-secondary: #9aa4ff;
      --accent-hover: #6b7aff;
      --accent-soft: rgba(91, 108, 255, 0.16);
      --accent-fill: #5b6cff;
      --accent-fill-hover: #6b7aff;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --mono: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
      --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      font-family: var(--sans);
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    [hidden] {
      display: none !important;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      color: inherit;
    }

    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible,
    summary:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }

    .wvaie-floating-toolbar {
      position: fixed;
      top: max(14px, env(safe-area-inset-top));
      left: 50%;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateX(-50%);
      padding: 6px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--bg-toolbar);
      color: var(--text);
      box-shadow: 0 16px 44px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      pointer-events: auto;
    }

    .wvaie-toolbar-group {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .wvaie-toolbar-divider {
      width: 1px;
      height: 28px;
      background: var(--border);
    }

    .wvaie-toolbar-button,
    .wvaie-icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 38px;
      border: 1px solid transparent;
      border-radius: 12px;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 13px;
      padding: 0 10px;
      transition: background 160ms ease-out, color 160ms ease-out, box-shadow 160ms ease-out;
    }

    .wvaie-icon-button {
      min-width: 38px;
      padding: 0;
    }

    .wvaie-toolbar-button svg,
    .wvaie-icon-button svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.65;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .wvaie-toolbar-button:hover:not(:disabled),
    .wvaie-icon-button:hover {
      background: var(--bg-hover);
      color: var(--text);
    }

    .wvaie-toolbar-button-active {
      background: var(--accent-soft);
      color: #fff;
      box-shadow: inset 0 0 0 1px rgba(91, 108, 255, 0.72);
    }

    .wvaie-toolbar-button-active:hover:not(:disabled) {
      background: var(--accent-fill-hover);
      color: #fff;
    }

    .wvaie-toolbar-button:disabled {
      cursor: not-allowed;
      opacity: 0.42;
    }

    .wvaie-toolbar-badge {
      min-width: 17px;
      border-radius: 9px;
      padding: 1px 5px;
      background: var(--bg-hover);
      color: var(--text);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }

    .wvaie-toolbar-button-active .wvaie-toolbar-badge {
      background: rgba(255, 255, 255, 0.22);
    }

    .wvaie-panel {
      position: fixed;
      top: max(66px, calc(env(safe-area-inset-top) + 58px));
      right: max(14px, env(safe-area-inset-right));
      z-index: 2147483645;
      display: flex;
      flex-direction: column;
      width: min(360px, calc(100vw - 28px));
      max-height: calc(100dvh - max(82px, calc(env(safe-area-inset-top) + 74px)));
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 22px;
      background: var(--bg-panel);
      color: var(--text);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      pointer-events: auto;
    }

    .wvaie-header {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 62px;
      padding: 14px 22px 12px;
      border-bottom: 1px solid var(--border);
      background: transparent;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .wvaie-panel-dragging .wvaie-header {
      cursor: grabbing;
    }

    .wvaie-header-title {
      margin: 0;
      color: var(--text);
      font-size: 15px;
      font-weight: 600;
      line-height: 20px;
    }

    .wvaie-header-mode {
      margin: 0;
      color: var(--text-dim);
      font-size: 12px;
      line-height: 16px;
    }

    .wvaie-header-version {
      border: 1px solid rgba(91, 108, 255, 0.52);
      border-radius: 999px;
      padding: 4px 9px;
      background: rgba(91, 108, 255, 0.14);
      color: #dfe3ff;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    .wvaie-panel-tabs {
      display: grid;
      flex: none;
      grid-template-columns: 1fr 1fr;
      height: 46px;
      border-bottom: 1px solid var(--border);
      background: transparent;
    }

    .wvaie-panel-tabs button {
      position: relative;
      border: 0;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }

    .wvaie-panel-tabs button:hover {
      background: var(--bg-raised);
      color: var(--text);
    }

    .wvaie-panel-tabs .wvaie-tab-active {
      color: var(--text);
    }

    .wvaie-panel-tabs .wvaie-tab-active::after {
      position: absolute;
      right: 20px;
      bottom: 0;
      left: 20px;
      height: 2px;
      content: "";
      border-radius: 1px;
      background: var(--accent);
    }

    .wvaie-count {
      margin-left: 5px;
      color: var(--text-dim);
      font-variant-numeric: tabular-nums;
    }

    .wvaie-status-message {
      flex: none;
      margin: 0;
      margin: 12px 22px 0;
      padding: 10px 13px;
      border-radius: 13px;
      background: var(--bg-field);
      color: var(--text-muted);
      font-size: 12px;
      line-height: 17px;
    }

    .wvaie-scroll {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-bottom: 18px;
      scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
    }

    .wvaie-inspector-section {
      display: grid;
      gap: 12px;
      margin: 22px 22px 0;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    .wvaie-inspector-section-hover {
      transition: background 160ms ease-out;
    }

    .wvaie-inspector-section-hover:hover {
      background: rgba(255, 255, 255, 0.025);
    }

    .wvaie-card-title {
      margin: 0;
      color: var(--text);
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
    }

    .wvaie-status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      line-height: 16px;
      white-space: nowrap;
    }

    .wvaie-status-badge-primary {
      background: var(--accent-fill);
      color: #fff;
    }

    .wvaie-status-badge-info {
      border-color: rgba(91, 108, 255, 0.34);
      background: var(--accent-soft);
      color: #dfe3ff;
    }

    .wvaie-status-badge-success {
      border-color: rgba(16, 185, 129, 0.28);
      background: rgba(16, 185, 129, 0.16);
      color: #79e0bd;
    }

    .wvaie-status-badge-warning {
      border-color: rgba(245, 158, 11, 0.3);
      background: rgba(245, 158, 11, 0.16);
      color: #ffd181;
    }

    .wvaie-status-badge-error {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.16);
      color: #ffb2b2;
    }

    button.wvaie-status-badge {
      cursor: pointer;
      font-family: var(--sans);
      transition: border-color 180ms ease-out, background 180ms ease-out;
    }

    button.wvaie-status-badge:hover {
      border-color: rgba(91, 108, 255, 0.58);
      background: rgba(91, 108, 255, 0.22);
    }

    .wvaie-empty-state {
      padding: 18px 0;
      text-align: center;
    }

    .wvaie-empty-state h2 {
      margin: 0;
      color: var(--text);
      font-size: 14px;
      font-weight: 500;
    }

    .wvaie-empty-state p,
    .wvaie-inline-empty {
      margin: 0;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 18px;
    }

    .wvaie-inline-empty {
      padding: 16px;
    }

    .wvaie-element-summary {
      gap: 14px;
    }

    .wvaie-element-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 0;
    }

    .wvaie-element-tag {
      color: var(--accent-secondary);
      font-size: 17px;
      font-weight: 600;
    }

    .wvaie-element-dimensions {
      color: var(--text);
      font: 600 14px/18px var(--mono);
      font-variant-numeric: tabular-nums;
    }

    .wvaie-element-path {
      overflow: hidden;
      margin: 0;
      padding: 0;
      color: var(--text-muted);
      font: 12px/18px var(--mono);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-property-section {
      display: grid;
      gap: 12px;
      margin-top: 2px;
      padding: 18px 0 0;
      border-top: 1px solid var(--border);
    }

    .wvaie-property-section h2,
    .wvaie-import-export h2,
    .wvaie-record-heading h2 {
      margin: 0;
      color: var(--text);
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
    }

    .wvaie-value-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }

    .wvaie-four-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .wvaie-value-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
      padding: 0 14px;
      border-radius: 12px;
      background: var(--bg-field);
      color: var(--text-muted);
      font-size: 13px;
    }

    .wvaie-four-grid .wvaie-value-cell {
      display: grid;
      justify-content: center;
      gap: 1px;
      min-height: 42px;
      padding: 4px;
      text-align: center;
    }

    .wvaie-value-cell strong {
      color: var(--text);
      font: 600 15px/18px var(--mono);
      font-variant-numeric: tabular-nums;
    }

    .wvaie-property-details {
      padding: 0;
      color: var(--text-muted);
      font-size: 12px;
    }

    .wvaie-property-details summary,
    .wvaie-control-group summary,
    .wvaie-similar-panel summary {
      cursor: pointer;
      list-style: none;
      color: var(--text);
      font-size: 14px;
      font-weight: 700;
      line-height: 42px;
    }

    .wvaie-property-details summary::before,
    .wvaie-control-group summary::before,
    .wvaie-similar-panel summary::before {
      display: inline-block;
      width: 15px;
      content: "›";
      color: var(--text-dim);
    }

    details[open] > summary::before {
      transform: rotate(90deg);
    }

    .wvaie-element-text,
    .wvaie-element-selector {
      margin: 4px 0 0 15px;
      padding: 9px 12px;
      border-radius: 12px;
      background: var(--bg-field);
      color: var(--text-muted);
      font: 12px/17px var(--mono);
      overflow-wrap: anywhere;
    }

    .wvaie-style-editor,
    .wvaie-measurement-panel {
      gap: 12px;
    }

    .wvaie-similar-panel {
      padding: 0;
      color: var(--text-muted);
      font-size: 12px;
    }

    .wvaie-similar-panel summary {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .wvaie-similar-panel summary::before {
      flex: none;
    }

    .wvaie-similar-count {
      margin-left: auto;
      border-radius: 11px;
      padding: 3px 8px;
      background: var(--bg-field);
      color: var(--text-dim);
      font-size: 11px;
    }

    .wvaie-similar-content {
      display: grid;
      gap: 10px;
      padding: 0 0 2px 15px;
    }

    .wvaie-similar-feature,
    .wvaie-similar-help {
      margin: 0;
      line-height: 18px;
    }

    .wvaie-similar-feature code {
      margin-left: 5px;
      color: var(--text);
      font: 11px/17px var(--mono);
    }

    .wvaie-similar-truncated {
      margin-left: 6px;
      color: #bfdbfe;
    }

    .wvaie-similar-list {
      display: grid;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .wvaie-similar-target {
      width: 100%;
      overflow: hidden;
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 9px 12px;
      background: var(--bg-field);
      color: var(--text-muted);
      cursor: pointer;
      font: 11px/16px var(--mono);
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-similar-target:hover,
    .wvaie-similar-target:focus-visible {
      border-color: var(--accent-secondary);
      color: var(--text);
    }

    .wvaie-control-group {
      border-bottom: 1px solid var(--border);
      padding: 0;
    }

    .wvaie-style-grid {
      display: grid;
      gap: 8px;
      padding: 0 0 14px 15px;
    }

    .wvaie-style-row {
      display: grid;
      grid-template-columns: 104px minmax(0, 1fr);
      align-items: center;
      gap: 10px;
    }

    .wvaie-style-row label {
      color: var(--text-muted);
      font-size: 13px;
    }

    .wvaie-style-row label.wvaie-style-changed {
      color: var(--accent);
    }

    .wvaie-style-input,
    .wvaie-style-select,
    .wvaie-select,
    .wvaie-filter-select,
    .wvaie-record-status-select,
    .wvaie-textarea {
      width: 100%;
      min-height: 40px;
      border: 1px solid transparent;
      border-radius: 12px;
      background: var(--bg-field);
      color: var(--text);
      font-size: 13px;
      padding: 8px 13px;
    }

    .wvaie-style-length {
      display: flex;
      align-items: stretch;
      min-height: 40px;
      overflow: hidden;
      border: 1px solid transparent;
      border-radius: 14px;
      background: var(--bg-field);
      transition: background 160ms ease-out, border-color 160ms ease-out, box-shadow 160ms ease-out;
    }

    .wvaie-style-length:hover {
      border-color: var(--border-strong);
      background: var(--bg-field-hover);
    }

    .wvaie-style-length:focus-within {
      border-color: rgba(91, 108, 255, 0.78);
      box-shadow: inset 0 0 0 1px rgba(91, 108, 255, 0.24);
    }

    .wvaie-style-length-input {
      flex: 1 1 auto;
      min-width: 0;
      border: 0;
      background: transparent;
      color: var(--text);
      font-size: 13px;
      line-height: 1;
      padding: 10px 12px 10px 13px;
    }

    .wvaie-style-length-input:focus {
      outline: none;
    }

    .wvaie-style-length-unit {
      flex: none;
      width: 66px;
      border: 0;
      border-left: 1px solid var(--border);
      background-color: rgba(255, 255, 255, 0.045);
      background-image:
        linear-gradient(45deg, transparent 50%, var(--text-dim) 50%),
        linear-gradient(135deg, var(--text-dim) 50%, transparent 50%);
      background-position:
        calc(100% - 13px) 52%,
        calc(100% - 9px) 52%;
      background-repeat: no-repeat;
      background-size: 4px 4px;
      color: var(--text);
      cursor: pointer;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      padding: 0 22px 0 10px;
      text-align: center;
      appearance: none;
    }

    .wvaie-style-length-unit:hover {
      background-color: rgba(255, 255, 255, 0.065);
    }

    .wvaie-style-length-unit:focus {
      outline: none;
    }

    .wvaie-style-input:hover,
    .wvaie-style-select:hover,
    .wvaie-select:hover,
    .wvaie-filter-select:hover,
    .wvaie-record-status-select:hover,
    .wvaie-textarea:hover {
      border-color: var(--border-strong);
      background: var(--bg-field-hover);
    }

    .wvaie-style-input:focus,
    .wvaie-style-select:focus,
    .wvaie-select:focus,
    .wvaie-filter-select:focus,
    .wvaie-record-status-select:focus,
    .wvaie-textarea:focus {
      border-color: rgba(91, 108, 255, 0.78);
      box-shadow: inset 0 0 0 1px rgba(91, 108, 255, 0.24);
      outline: none;
    }

    .wvaie-style-color {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr);
      gap: 10px;
    }

    .wvaie-style-color input[type="color"] {
      width: 44px;
      height: 40px;
      padding: 5px;
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      background: var(--bg-field);
    }

    .wvaie-preview-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 13px;
      border-radius: 12px;
      background: var(--accent-soft);
      color: var(--text);
      font-size: 12px;
    }

    .wvaie-mode-banner {
      display: grid;
      gap: 3px;
      padding: 12px 13px;
      border: 1px solid var(--border);
      border-radius: 13px;
      background: var(--accent-soft);
      font-size: 12px;
    }

    .wvaie-mode-banner strong {
      font-size: 13px;
    }

    .wvaie-mode-banner span {
      color: var(--text-muted);
      line-height: 18px;
    }

    .wvaie-measurement-size {
      margin: 0;
      color: var(--text);
      font: 14px/20px var(--mono);
      font-variant-numeric: tabular-nums;
    }

    .wvaie-measurement-selector {
      overflow: hidden;
      margin: 0;
      color: var(--text-muted);
      font: 12px/18px var(--mono);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-pair-results {
      border-radius: 14px;
      padding: 13px;
      background: var(--accent-soft);
    }

    .wvaie-measurement-actions {
      display: flex;
      gap: 8px;
      padding: 2px 0 0;
    }

    .wvaie-comment-editor {
      display: grid;
      gap: 12px;
    }

    .wvaie-page-comment-collapsed,
    .wvaie-page-comment-expanded {
      display: grid;
      gap: 10px;
      padding: 0;
    }

    .wvaie-page-comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .wvaie-page-comment-header h2 {
      margin: 0;
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
    }

    .wvaie-help-text {
      margin: 0;
      color: var(--text-muted);
      font-size: 11px;
      line-height: 17px;
    }

    .wvaie-page-comment-body,
    .wvaie-comment-editor-embedded {
      display: grid;
      gap: 12px;
    }

    .wvaie-comment-editor-embedded {
      padding-top: 4px;
    }

    .wvaie-comment-label {
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
    }

    .wvaie-textarea {
      min-height: 76px;
      resize: vertical;
      line-height: 19px;
    }

    .wvaie-metadata-controls {
      display: grid;
      gap: 9px;
    }

    .wvaie-form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .wvaie-form-field {
      display: grid;
      gap: 5px;
    }

    .wvaie-form-field label {
      color: var(--text-muted);
      font-size: 11px;
    }

    .wvaie-attach-measurement {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 18px;
    }

    .wvaie-attach-measurement input {
      margin-top: 2px;
      accent-color: var(--accent);
    }

    .wvaie-attach-measurement-hint {
      color: var(--text-dim);
    }

    .wvaie-option-checks {
      display: grid;
      gap: 7px;
    }

    .wvaie-edit-mode-banner {
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--accent-soft);
      color: var(--text);
      font-size: 12px;
    }

    .wvaie-actions,
    .wvaie-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .wvaie-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      border: 1px solid transparent;
      border-radius: 12px;
      background: var(--bg-field);
      color: var(--text);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      padding: 0 14px;
      transition: background 160ms ease-out, border-color 160ms ease-out, box-shadow 160ms ease-out;
    }

    .wvaie-button:hover:not(:disabled) {
      border-color: var(--border-strong);
      background: var(--bg-field-hover);
    }

    .wvaie-button-primary {
      border-color: transparent;
      background: var(--accent-fill);
      color: #fff;
      box-shadow: inset 0 0 0 1px rgba(91, 108, 255, 0.36);
    }

    .wvaie-button-primary:hover:not(:disabled) {
      border-color: transparent;
      background: var(--accent-fill-hover);
    }

    .wvaie-button-text {
      border-color: transparent;
      background: transparent;
      color: var(--text-muted);
    }

    .wvaie-button-danger {
      color: #ffb4a4;
    }

    .wvaie-button-danger:hover:not(:disabled) {
      border-color: var(--danger);
      background: rgba(239, 68, 68, 0.14);
    }

    .wvaie-button:disabled {
      cursor: not-allowed;
      opacity: 0.42;
    }

    .wvaie-record-list-view {
      display: grid;
      gap: 12px;
      padding: 18px 22px 12px;
    }

    .wvaie-record-heading,
    .wvaie-record-filters {
      margin: 0;
    }

    .wvaie-record-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-dim);
      font-size: 13px;
    }

    .wvaie-record-heading span {
      font-variant-numeric: tabular-nums;
    }

    .wvaie-record-filters {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .wvaie-filter-group {
      display: grid;
      gap: 5px;
    }

    .wvaie-filter-label {
      color: var(--text-muted);
      font-size: 11px;
    }

    .wvaie-record-list {
      display: grid;
      gap: 10px;
    }

    .wvaie-record {
      display: grid;
      gap: 9px;
      padding: 12px;
      border-radius: 14px;
      background: var(--bg-raised);
    }

    .wvaie-record-topline {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .wvaie-record-comment {
      margin: 0;
      color: var(--text);
      font-size: 13px;
      line-height: 19px;
    }

    .wvaie-record-selector {
      overflow: hidden;
      margin: 0;
      color: var(--text-muted);
      font: 11px/17px var(--mono);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-record-style-list {
      display: grid;
      gap: 4px;
      margin: 0;
      padding: 8px 0 0;
      border-top: 1px solid var(--border);
      list-style: none;
    }

    .wvaie-record-style-list li {
      display: grid;
      gap: 2px;
      color: var(--text-muted);
      font-size: 11px;
    }

    .wvaie-record-style-list code {
      color: var(--text);
      font: 11px/16px var(--mono);
    }

    .wvaie-record-warning {
      margin: 0;
      color: #ffb4a4;
      font-size: 11px;
    }

    .wvaie-record-control-row {
      display: flex;
      gap: 5px;
      margin-top: 2px;
    }

    .wvaie-record-status-select {
      flex: 1;
    }

    .wvaie-import-export {
      display: grid;
      gap: 12px;
      margin-bottom: 12px;
    }

    .wvaie-import-export .wvaie-footer {
      justify-content: flex-start;
    }

    .wvaie-privacy-note {
      margin: 0;
      color: var(--text-muted);
      font-size: 11px;
      line-height: 17px;
    }

    .wvaie-dialog-backdrop {
      position: absolute;
      inset: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgba(0, 0, 0, 0.56);
    }

    .wvaie-dialog {
      display: grid;
      gap: 12px;
      width: 100%;
      padding: 16px;
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      background: rgba(24, 24, 24, 0.98);
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .wvaie-dialog-title,
    .wvaie-dialog-message {
      margin: 0;
    }

    .wvaie-dialog-title {
      font-size: 14px;
    }

    .wvaie-dialog-message {
      color: var(--text-muted);
      font-size: 12px;
      line-height: 18px;
    }

    .wvaie-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    @media (prefers-reduced-motion: reduce) {
      .wvaie-toolbar-button,
      .wvaie-icon-button,
      .wvaie-button,
      .wvaie-inspector-section-hover,
      button.wvaie-status-badge {
        transition: none;
      }
    }
  `;

  shadow.append(style, mount);

  const root: Root = createRoot(mount);
  const panelDrag = bindPanelDrag(mount);
  let currentState: PanelState = {
    enabled: true,
    panelView: "inspector",
    interactionMode: "select",
    selectedElement: null,
    selectedStyleSnapshot: [],
    selectedStyleSupported: false,
    styleDraft: {},
    records: [],
    statusMessage: "选择模式：点击网页元素查看并编辑属性。",
    unmatchedRecordIds: new Set(),
    editingRecord: null,
    filterCategory: "all",
    filterStatus: "all",
    filterRange: "all",
    measurement: null,
    measurementMode: "off",
    attachMeasurements: true,
    similarMatchLevel: null,
    similarPrimaryFeature: "",
    similarTotalMatched: 1,
    similarTruncated: false,
    similarElements: [],
    applyToSimilar: false,
  };

  function render(): void {
    root.render(<App handlers={handlers} state={currentState} />);
    requestAnimationFrame(() => panelDrag.clamp());
  }

  render();

  return {
    update(input) {
      currentState = input;
      render();
    },
    destroy() {
      panelDrag.destroy();
      root.unmount();
      host.remove();
    },
  };
}

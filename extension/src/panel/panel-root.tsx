import { createRoot, type Root } from "react-dom/client";
import { App, type PanelState } from "./App";
import type {
  EditRecord,
  StylePropertyName,
  RecordMetadata,
  RecordStatus,
  RecordCategory,
  RecordRangeFilter,
  LayoutIntent
} from "../shared/types";

export type PanelController = {
  update(input: PanelState): void;
  destroy(): void;
};

export type PanelHandlers = {
  onSaveComment(comment: string, metadata: RecordMetadata): void;
  onSaveQuickComment(comment: string, metadata: RecordMetadata): void;
  onCancelQuickComment(): void;
  onSavePageComment(comment: string, metadata: RecordMetadata): void;
  onSaveLayoutIntent(intent: LayoutIntent): void;
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
  onAutoLayoutMode(): void;
  onCommentMode(): void;
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

    const handle = target.closest(".wvaie-panel-drag-handle, .wvaie-header");
    const panel = handle?.closest(".wvaie-panel");
    if (!(handle instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    dragState = {
      handle,
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

    handle.setPointerCapture?.(event.pointerId);
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
      --bg-panel: linear-gradient(180deg, rgba(24, 24, 24, 0.94) 0%, rgba(15, 15, 15, 0.94) 100%);
      --bg-toolbar: rgba(24, 24, 24, 0.9);
      --bg-raised: rgba(80, 80, 80, 0.5);
      --bg-field: rgba(80, 80, 80, 0.5);
      --bg-field-hover: rgba(80, 80, 80, 0.64);
      --bg-hover: rgba(80, 80, 80, 0.42);
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.18);
      --text: rgba(255, 255, 255, 0.95);
      --text-muted: #e8e8e8;
      --text-dim: rgba(232, 232, 232, 0.5);
      --accent: #535dff;
      --accent-secondary: #aeb5ff;
      --accent-hover: #626bff;
      --accent-soft: rgba(83, 93, 255, 0.16);
      --accent-fill: #535dff;
      --accent-fill-hover: #626bff;
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

    .wvaie-floating-row {
      position: fixed;
      top: max(14px, env(safe-area-inset-top));
      left: 50%;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      transform: translateX(-50%);
      gap: 10px;
      pointer-events: auto;
    }

    .wvaie-floating-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: 100px;
      background: rgba(24, 24, 24, 0.9);
      color: #e8e8e8;
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(8px);
      pointer-events: auto;
    }

    .wvaie-floating-switch,
    .wvaie-floating-refresh {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      background: rgba(40, 40, 40, 0.9);
      color: #e8e8e8;
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(8px);
    }

    .wvaie-floating-switch {
      gap: 10px;
      border-radius: 100px;
      padding: 5px 5px 5px 13px;
      cursor: pointer;
      font-size: 13px;
      line-height: 20px;
      white-space: nowrap;
    }

    .wvaie-floating-switch-disabled {
      cursor: not-allowed;
      opacity: 0.48;
    }

    .wvaie-floating-switch input {
      position: relative;
      width: 56px;
      height: 32px;
      margin: 0;
      border: 0;
      border-radius: 999px;
      appearance: none;
      background: rgba(80, 80, 80, 0.6);
      cursor: pointer;
      transition: background 160ms ease-out;
    }

    .wvaie-floating-switch input::before {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: #fff;
      content: "";
      transition: transform 160ms ease-out;
    }

    .wvaie-floating-switch input:checked {
      background: #535dff;
    }

    .wvaie-floating-switch input:checked::before {
      transform: translateX(24px);
    }

    .wvaie-floating-refresh {
      justify-content: center;
      width: 44px;
      border-radius: 999px;
      cursor: pointer;
      padding: 0;
    }

    .wvaie-floating-refresh:hover {
      background: rgba(80, 80, 80, 0.72);
    }

    .wvaie-floating-refresh svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .wvaie-toolbar-group {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .wvaie-toolbar-divider {
      width: 1px;
      height: 25px;
      background: rgba(255, 255, 255, 0.16);
    }

    .wvaie-toolbar-button,
    .wvaie-icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 34px;
      height: 34px;
      min-height: 34px;
      border: 1px solid transparent;
      border-radius: 17px;
      background: transparent;
      color: #e8e8e8;
      cursor: pointer;
      font-size: 13px;
      padding: 8px;
      transition: background 160ms ease-out, color 160ms ease-out, opacity 160ms ease-out;
    }

    .wvaie-icon-button {
      min-width: 34px;
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

    .wvaie-toolbar-button svg .wvaie-toolbar-icon-fill {
      fill: currentColor;
      stroke: none;
    }

    .wvaie-toolbar-button:hover:not(:disabled),
    .wvaie-icon-button:hover {
      border-radius: 17px;
      background: rgba(80, 80, 80, 0.38);
      color: #fff;
    }

    .wvaie-toolbar-button-active {
      border-radius: 100px;
      background: rgba(80, 80, 80, 0.6);
      color: #fff;
      box-shadow: none;
    }

    .wvaie-toolbar-button-active:hover:not(:disabled) {
      background: rgba(80, 80, 80, 0.72);
      color: #fff;
    }

    .wvaie-toolbar-button-record {
      width: auto;
      border-radius: 17px;
      background: rgba(80, 80, 80, 0.6);
      padding: 8px;
    }

    .wvaie-toolbar-label {
      color: #e8e8e8;
      font-family: var(--sans);
      font-size: 13px;
      font-weight: 400;
      line-height: 18px;
      white-space: nowrap;
    }

    .wvaie-toolbar-button:disabled {
      cursor: not-allowed;
      opacity: 0.42;
    }

    .wvaie-toolbar-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      min-height: 17px;
      border-radius: 20px;
      padding: 0 4px;
      background: #535dff;
      color: #e8e8e8;
      font-size: 11px;
      line-height: 15px;
      font-variant-numeric: tabular-nums;
    }

    .wvaie-toolbar-button-active .wvaie-toolbar-badge {
      background: #535dff;
    }

    .wvaie-panel {
      position: fixed;
      top: max(90px, calc(env(safe-area-inset-top) + 74px));
      right: max(14px, env(safe-area-inset-right));
      z-index: 2147483645;
      display: flex;
      flex-direction: column;
      width: min(383px, calc(100vw - 28px));
      max-height: calc(100dvh - max(106px, calc(env(safe-area-inset-top) + 98px)));
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      background: var(--bg-panel);
      background-color: rgba(24, 24, 24, 0.94);
      color: var(--text);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(8px);
      pointer-events: auto;
    }

    .wvaie-panel-utility {
      display: flex;
      flex: none;
      align-items: center;
      gap: 8px;
      min-height: 56px;
      padding: 12px 16px 0;
      color: #e8e8e8;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .wvaie-panel-utility-pill,
    .wvaie-panel-shared-pill,
    .wvaie-panel-refresh-circle {
      display: inline-flex;
      align-items: center;
      min-height: 42px;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      background: rgba(40, 40, 40, 0.9);
      color: #e8e8e8;
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(8px);
    }

    .wvaie-panel-dragging .wvaie-panel-utility,
    .wvaie-panel-dragging .wvaie-header {
      cursor: grabbing;
    }

    .wvaie-panel-utility-group {
      display: flex;
      flex: none;
      align-items: center;
      gap: 8px;
    }

    .wvaie-panel-utility-pill {
      gap: 6px;
      border-radius: 999px;
      padding: 5px;
    }

    .wvaie-panel-mode-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      min-width: 32px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: transparent;
      color: #e8e8e8;
      cursor: pointer;
      padding: 7px;
      transition: background 160ms ease-out, border-color 160ms ease-out, color 160ms ease-out;
    }

    .wvaie-panel-mode-button:hover,
    .wvaie-panel-mode-button-active {
      background: rgba(80, 80, 80, 0.6);
      color: #fff;
    }

    .wvaie-panel-mode-button svg,
    .wvaie-panel-refresh-circle svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.65;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .wvaie-panel-mode-button svg .wvaie-panel-icon-fill {
      fill: currentColor;
      stroke: none;
    }

    .wvaie-panel-record-toggle {
      gap: 5px;
      min-width: 59px;
      padding-right: 7px;
    }

    .wvaie-panel-record-label {
      color: #e8e8e8;
      font-size: 13px;
      line-height: 18px;
      white-space: nowrap;
    }

    .wvaie-panel-utility-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      min-height: 17px;
      border-radius: 20px;
      padding: 0 4px;
      background: #535dff;
      color: #e8e8e8;
      font-size: 11px;
      line-height: 15px;
      font-variant-numeric: tabular-nums;
    }

    .wvaie-panel-shared-pill {
      display: inline-flex;
      flex: 1 1 auto;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
      border-radius: 999px;
      padding: 5px 5px 5px 13px;
      color: #e8e8e8;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      line-height: 18px;
      white-space: nowrap;
    }

    .wvaie-panel-shared-pill-disabled {
      cursor: not-allowed;
      opacity: 0.48;
    }

    .wvaie-panel-shared-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-panel-shared-pill input {
      position: relative;
      flex: none;
      width: 54px;
      height: 32px;
      margin: 0;
      border: 0;
      border-radius: 999px;
      appearance: none;
      background: rgba(80, 80, 80, 0.6);
      cursor: pointer;
      transition: background 160ms ease-out;
    }

    .wvaie-panel-shared-pill input::before {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: #fff;
      content: "";
      transition: transform 160ms ease-out;
    }

    .wvaie-panel-shared-pill input:checked {
      background: #535dff;
    }

    .wvaie-panel-shared-pill input:checked::before {
      transform: translateX(22px);
    }

    .wvaie-panel-refresh-circle {
      justify-content: center;
      flex: none;
      width: 42px;
      padding: 0;
      border-radius: 999px;
      cursor: pointer;
    }

    .wvaie-panel-refresh-circle:hover {
      background: rgba(80, 80, 80, 0.72);
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
      margin: 16px 16px 0;
      padding: 9px 12px;
      border-radius: 10px;
      background: rgba(80, 80, 80, 0.32);
      color: var(--text-muted);
      font-size: 12px;
      line-height: 17px;
    }

    .wvaie-scroll {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-bottom: 16px;
      scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
    }

    .wvaie-scroll > .wvaie-inspector-section:first-child,
    .wvaie-record-list-view {
      margin-top: 24px;
    }

    .wvaie-inspector-section {
      display: grid;
      gap: 12px;
      margin: 24px 16px 0;
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

    .wvaie-section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .wvaie-section-heading h2 {
      margin: 0;
      color: var(--text);
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
    }

    .wvaie-section-heading span {
      border-radius: 999px;
      padding: 2px 7px;
      background: var(--accent-soft);
      color: #dfe3ff;
      font-size: 11px;
      line-height: 16px;
    }

    .wvaie-layout-facts {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 12px;
      border-radius: 8px;
      background: var(--bg-field);
    }

    .wvaie-layout-facts div {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr);
      gap: 10px;
      align-items: baseline;
    }

    .wvaie-layout-facts dt,
    .wvaie-layout-facts dd {
      margin: 0;
      font-size: 12px;
      line-height: 18px;
    }

    .wvaie-layout-facts dt {
      color: var(--text-dim);
    }

    .wvaie-layout-facts dd {
      overflow-wrap: anywhere;
      color: var(--text-muted);
      font-family: var(--mono);
    }

    .wvaie-layout-direct-card {
      display: grid;
      gap: 4px;
      padding: 12px 13px;
      border: 1px solid rgba(91, 108, 255, 0.24);
      border-radius: 14px;
      background: var(--accent-soft);
    }

    .wvaie-layout-direct-card strong {
      color: var(--text);
      font-size: 13px;
      line-height: 18px;
    }

    .wvaie-layout-direct-card p {
      margin: 0;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 18px;
    }

    .wvaie-layout-panel {
      gap: 14px;
    }

    .wvaie-layout-panel-empty {
      gap: 10px;
    }

    .wvaie-layout-direction-grid,
    .wvaie-layout-mode-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .wvaie-layout-mode-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      min-height: 48px;
      border: 1px solid transparent;
      border-radius: 8px;
      background: var(--bg-field);
      color: var(--text);
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
      transition: background 160ms ease-out, border-color 160ms ease-out, box-shadow 160ms ease-out;
    }

    .wvaie-layout-mode-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      color: var(--text-muted);
      flex: none;
    }

    .wvaie-layout-mode-icon svg,
    .wvaie-layout-spacing-icon svg,
    .wvaie-style-icon svg,
    .wvaie-style-font-trigger svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .wvaie-layout-mode-icon rect,
    .wvaie-layout-spacing-icon rect {
      fill: currentColor;
      stroke: none;
    }

    .wvaie-layout-mode-button:hover {
      border-color: var(--border-strong);
      background: var(--bg-field-hover);
    }

    .wvaie-layout-mode-active {
      border-color: rgba(83, 93, 255, 0.72);
      background: rgba(83, 93, 255, 0.2);
      box-shadow: inset 0 0 0 1px rgba(83, 93, 255, 0.2);
    }

    .wvaie-layout-overview-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .wvaie-layout-preview-card,
    .wvaie-layout-gap-card {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 82px;
      border-radius: 8px;
      background: var(--bg-field);
      padding: 12px;
    }

    .wvaie-layout-preview-card {
      position: relative;
      display: grid;
      align-items: stretch;
      overflow: hidden;
    }

    .wvaie-layout-preview-bars {
      position: relative;
      display: grid;
      gap: 6px;
      align-content: center;
      justify-items: stretch;
      min-height: 58px;
      padding: 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
    }

    .wvaie-layout-preview-bars::before {
      position: absolute;
      inset: 10px;
      content: "";
      background-image: radial-gradient(circle, rgba(232, 232, 232, 0.34) 1px, transparent 1.5px);
      background-position: 0 0;
      background-size: 72px 34px;
      opacity: 0.72;
    }

    .wvaie-layout-preview-bars span {
      position: relative;
      display: block;
      height: 8px;
      border-radius: 6px;
      background: rgba(83, 93, 255, 0.85);
    }

    .wvaie-layout-preview-bars-horizontal {
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      align-items: end;
    }

    .wvaie-layout-preview-bars-horizontal span {
      width: 8px;
      height: auto;
      min-height: 30px;
    }

    .wvaie-layout-preview-meta {
      display: none;
    }

    .wvaie-layout-preview-meta span,
    .wvaie-layout-gap-caption,
    .wvaie-layout-spacing-title {
      color: var(--text-dim);
      font-size: 12px;
      line-height: 16px;
    }

    .wvaie-layout-preview-meta strong,
    .wvaie-layout-gap-value {
      overflow: hidden;
      color: var(--text);
      font: 600 13px/18px var(--mono);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-layout-gap-card .wvaie-style-input {
      flex: 1 1 auto;
      min-height: 40px;
      border: 0;
      background: transparent;
      padding: 0;
      font-size: 14px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .wvaie-layout-gap-caption {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex: none;
    }

    .wvaie-layout-gap-caption svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .wvaie-layout-spacing-block {
      display: grid;
      gap: 8px;
    }

    .wvaie-layout-advanced {
      display: grid;
      gap: 10px;
      padding-top: 2px;
    }

    .wvaie-layout-advanced summary {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 12px;
      line-height: 18px;
      list-style: none;
    }

    .wvaie-layout-advanced summary::-webkit-details-marker {
      display: none;
    }

    .wvaie-layout-advanced summary::before {
      display: inline-block;
      width: 12px;
      color: var(--text-dim);
      content: "›";
      transition: transform 160ms ease-out;
    }

    .wvaie-layout-advanced[open] summary::before {
      transform: rotate(90deg);
    }

    .wvaie-layout-save-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 40px;
      border-radius: 8px;
      background: rgba(83, 93, 255, 0.14);
      color: var(--text);
      font-size: 12px;
      line-height: 18px;
      padding: 8px 10px 8px 12px;
    }

    .wvaie-layout-save-strip .wvaie-button {
      min-height: 30px;
      padding: 0 11px;
    }

    .wvaie-layout-spacing-grid,
    .wvaie-layout-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .wvaie-layout-spacing-cell,
    .wvaie-layout-context-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 40px;
      border-radius: 8px;
      background: var(--bg-field);
      padding: 10px 12px;
    }

    .wvaie-layout-spacing-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 0 0 auto;
    }

    .wvaie-layout-spacing-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 0;
      background: transparent;
      color: var(--text-muted);
      font: 600 11px/1 var(--mono);
    }

    .wvaie-layout-spacing-label {
      display: none;
      color: var(--text);
      font-size: 13px;
      line-height: 18px;
    }

    .wvaie-layout-spacing-cell .wvaie-style-length {
      min-height: 40px;
      flex: 1 1 auto;
      background: transparent;
    }

    .wvaie-layout-context-cell strong {
      overflow: hidden;
      color: var(--text);
      font: 600 13px/18px var(--mono);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-layout-context-cell span {
      color: var(--text-dim);
      font-size: 12px;
      line-height: 16px;
      white-space: nowrap;
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

    .wvaie-property-section h2,
    .wvaie-import-export h2,
    .wvaie-record-heading h2 {
      margin: 0;
      color: var(--text);
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
    }

    .wvaie-control-group summary,
    .wvaie-similar-panel summary {
      cursor: pointer;
      list-style: none;
      color: var(--text);
      font-size: 14px;
      font-weight: 700;
      line-height: 42px;
    }

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

    .wvaie-style-editor,
    .wvaie-measurement-panel {
      gap: 12px;
    }

    .wvaie-similar-panel {
      padding: 0;
      color: var(--text-muted);
      font-size: 12px;
      min-width: 0;
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
      min-width: 0;
      max-width: 100%;
      padding: 0 0 2px 15px;
    }

    .wvaie-similar-feature,
    .wvaie-similar-help {
      margin: 0;
      line-height: 18px;
      min-width: 0;
    }

    .wvaie-similar-feature code {
      display: block;
      max-width: 100%;
      margin-top: 6px;
      overflow: hidden;
      border-radius: 8px;
      padding: 7px 9px;
      background: var(--bg-field);
      color: var(--text);
      font: 11px/17px var(--mono);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-similar-truncated {
      display: inline-block;
      margin-top: 6px;
      color: #bfdbfe;
    }

    .wvaie-shared-switch {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: var(--bg-field);
      color: var(--text);
      cursor: pointer;
    }

    .wvaie-shared-switch span {
      display: grid;
      gap: 2px;
    }

    .wvaie-shared-switch strong {
      font-size: 13px;
      line-height: 18px;
    }

    .wvaie-shared-switch small {
      color: var(--text-dim);
      font-size: 11px;
      line-height: 16px;
    }

    .wvaie-shared-switch input {
      position: relative;
      flex: none;
      width: 42px;
      height: 24px;
      margin: 0;
      border: 0;
      border-radius: 999px;
      appearance: none;
      background: rgba(255, 255, 255, 0.18);
      cursor: pointer;
      transition: background 160ms ease-out;
    }

    .wvaie-shared-switch input::before {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      content: "";
      transition: transform 160ms ease-out;
    }

    .wvaie-shared-switch input:checked {
      background: var(--accent-fill);
    }

    .wvaie-shared-switch input:checked::before {
      transform: translateX(18px);
    }

    .wvaie-similar-list {
      display: grid;
      gap: 4px;
      min-width: 0;
      max-width: 100%;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .wvaie-similar-list li {
      min-width: 0;
      max-width: 100%;
    }

    .wvaie-similar-target {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      border: 1px solid transparent;
      border-radius: 8px;
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

    .wvaie-style-section {
      display: grid;
      gap: 12px;
    }

    .wvaie-style-section-grid {
      display: grid;
      gap: 10px;
    }

    .wvaie-style-dual-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .wvaie-style-dual-cell {
      display: grid;
      min-height: 40px;
      border-radius: 8px;
      background: var(--bg-field);
      padding: 10px 12px;
    }

    .wvaie-style-row-title {
      color: var(--text-dim);
      font-size: 12px;
      line-height: 16px;
    }

    .wvaie-style-compact-shell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .wvaie-style-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 0;
      background: transparent;
      color: var(--text-muted);
      font: 600 11px/1 var(--mono);
      flex: none;
    }

    .wvaie-style-inline-input,
    .wvaie-style-inline-select,
    .wvaie-style-inline-unit,
    .wvaie-style-inline-value {
      min-width: 0;
      border: 0;
      background: transparent;
      color: var(--text);
      font-size: 13px;
      line-height: 20px;
      padding: 0;
    }

    .wvaie-style-inline-select,
    .wvaie-style-inline-unit {
      appearance: none;
      cursor: pointer;
    }

    .wvaie-style-inline-input:focus,
    .wvaie-style-inline-select:focus,
    .wvaie-style-inline-unit:focus {
      outline: none;
    }

    .wvaie-style-inline-length {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1 1 auto;
    }

    .wvaie-style-inline-input {
      flex: 1 1 auto;
      width: 100%;
    }

    .wvaie-style-inline-unit,
    .wvaie-style-alpha-pill,
    .wvaie-style-font-trigger {
      flex: none;
      color: var(--text-muted);
      font-size: 12px;
    }

    .wvaie-style-font-compact {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1 1 auto;
    }

    .wvaie-style-font-compact .wvaie-style-inline-select {
      flex: 1 1 auto;
      min-width: 0;
    }

    .wvaie-style-font-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
    }

    .wvaie-style-color-row,
    .wvaie-style-corner-row,
    .wvaie-style-single-row,
    .wvaie-style-shadow-row {
      display: grid;
      gap: 8px;
    }

    .wvaie-style-color-strip {
      display: grid;
      grid-template-columns: 20px minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      min-height: 40px;
      border-radius: 8px;
      background: var(--bg-field);
      padding: 10px 12px;
    }

    .wvaie-style-color-swatch {
      width: 20px;
      height: 20px;
      border: 0;
      border-radius: 4px;
      padding: 0;
      background: transparent;
    }

    .wvaie-style-color-value {
      min-height: auto;
      border: 0;
      background: transparent;
      padding: 0;
    }

    .wvaie-style-shadow-textarea {
      min-height: 80px;
      resize: none;
    }

    .wvaie-style-inline-value {
      font: 600 14px/20px var(--mono);
      font-variant-numeric: tabular-nums;
    }

    .wvaie-advanced-info-grid {
      display: grid;
      gap: 8px;
    }

    .wvaie-advanced-info-cell {
      display: grid;
      gap: 8px;
    }

    .wvaie-advanced-info-text {
      margin: 0;
      min-height: 64px;
      border-radius: 8px;
      background: var(--bg-field);
      color: var(--text-muted);
      font: 12px/18px var(--mono);
      padding: 12px;
      overflow-wrap: anywhere;
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
      border-radius: 8px;
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
      border-radius: 8px;
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
      border-radius: 8px;
      background: var(--bg-field);
    }

    .wvaie-font-family-control {
      display: grid;
      gap: 8px;
    }

    .wvaie-font-family-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
    }

    .wvaie-font-family-row .wvaie-button {
      min-height: 40px;
      white-space: nowrap;
    }

    .wvaie-font-status {
      margin: 0;
      color: var(--text-dim);
      font-size: 11px;
      line-height: 16px;
    }

    .wvaie-preview-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 13px;
      border-radius: 8px;
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

    .wvaie-quick-comment {
      position: fixed;
      z-index: 2147483646;
      display: grid;
      width: 302px;
      gap: 24px;
      padding: 16px;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      background: rgba(24, 24, 24, 0.9);
      color: var(--text);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(8px);
      pointer-events: auto;
    }

    .wvaie-quick-comment-title,
    .wvaie-quick-comment-current {
      margin: 0;
    }

    .wvaie-quick-comment-title {
      color: var(--text);
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
    }

    .wvaie-quick-comment-current {
      color: var(--text);
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wvaie-quick-comment-textarea {
      min-height: 220px;
      margin-top: -16px;
    }

    .wvaie-quick-comment-meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-top: -8px;
    }

    .wvaie-quick-comment-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: -8px;
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

    .wvaie-page-comment-trigger {
      min-height: 88px;
      width: 100%;
      border: 0;
      border-radius: 8px;
      background: var(--bg-field);
      color: var(--text-dim);
      cursor: text;
      font-size: 13px;
      line-height: 20px;
      padding: 12px;
      text-align: left;
    }

    .wvaie-page-comment-trigger:hover {
      background: var(--bg-field-hover);
      color: var(--text-muted);
    }

    .wvaie-page-comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .wvaie-page-comment-header h2 {
      margin: 0;
      color: var(--text);
      font-size: 16px;
      font-weight: 700;
      line-height: 22px;
    }

    .wvaie-help-text {
      margin: 0;
      color: var(--text-muted);
      font-size: 13px;
      line-height: 22px;
    }

    .wvaie-page-comment-body,
    .wvaie-comment-editor-embedded {
      display: grid;
      gap: 12px;
    }

    .wvaie-comment-editor-embedded {
      padding-top: 4px;
    }

    .wvaie-textarea {
      min-height: 88px;
      resize: vertical;
      line-height: 20px;
    }

    .wvaie-comment-shell,
    .wvaie-comment-meta-panel {
      display: grid;
      gap: 12px;
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
      font-size: 14px;
      line-height: 20px;
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

    .wvaie-comment-textarea {
      min-height: 88px;
    }

    .wvaie-comment-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 33px;
    }

    .wvaie-comment-options {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .wvaie-edit-mode-banner {
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--accent-soft);
      color: var(--text);
      font-size: 12px;
    }

    .wvaie-actions,
    .wvaie-footer {
      display: flex;
      flex: none;
      justify-content: flex-end;
      gap: 8px;
    }

    .wvaie-layout-footer {
      display: flex;
      justify-content: flex-end;
    }

    .wvaie-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      border: 1px solid transparent;
      border-radius: 8px;
      background: var(--bg-field);
      color: var(--text);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      padding: 0 14px;
      white-space: nowrap;
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
      padding: 0 16px 12px;
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
      border-radius: 8px;
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
      flex-wrap: wrap;
    }

    .wvaie-record-status-select {
      flex: 1;
      min-width: 106px;
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
      border-radius: 8px;
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
    layoutContext: null,
    quickCommentTarget: null,
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

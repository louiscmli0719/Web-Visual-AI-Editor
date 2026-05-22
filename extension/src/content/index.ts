import { createOverlayRoot, type OverlayController } from "../overlay/overlay-root";
import { createPanelRoot, type PanelController } from "../panel/panel-root";
import type { EditorMessage } from "../shared/messages";
import type {
  EditRecord,
  ElementSnapshot,
  StyleChange,
  StyleDraft,
  StylePropertyName,
  StylePropertySnapshot
} from "../shared/types";
import { buildAiPrompt } from "../shared/prompt-template";
import { readElementSnapshot } from "./dom-inspector";
import { readStyleSnapshot, STYLE_PROPERTY_DEFINITIONS } from "./style-inspector";
import { createStylePreviewManager, type StylePreviewManager } from "./style-preview";
import {
  addEditRecord,
  createInitialSession,
  parseEditorSessionExport,
  serializeEditorSession
} from "./session-store";

type EditorRuntime = {
  enabled: boolean;
  listenerReady: boolean;
  overlay: OverlayController | null;
  panel: PanelController | null;
  hoveredElement: Element | null;
  selectedElement: HTMLElement | null;
  selectedSnapshot: ElementSnapshot | null;
  selectedStyleSnapshot: StylePropertySnapshot[];
  selectedStyleSupported: boolean;
  styleDraft: StyleDraft;
  stylePreviewManager: StylePreviewManager;
  session: ReturnType<typeof createInitialSession>;
  statusMessage: string;
  unmatchedRecordIds: Set<string>;
  rafId: number | null;
};

declare global {
  interface Window {
    __webVisualAiEditorRuntime?: EditorRuntime;
  }
}

function getRuntime(): EditorRuntime {
  if (!window.__webVisualAiEditorRuntime) {
    window.__webVisualAiEditorRuntime = {
      enabled: false,
      listenerReady: false,
      overlay: null,
      panel: null,
      hoveredElement: null,
      selectedElement: null,
      selectedSnapshot: null,
      selectedStyleSnapshot: [],
      selectedStyleSupported: false,
      styleDraft: {},
      stylePreviewManager: createStylePreviewManager(),
      session: createInitialSession(),
      statusMessage: "请选择页面元素并添加评论。",
      unmatchedRecordIds: new Set(),
      rafId: null
    };
  }

  return window.__webVisualAiEditorRuntime;
}

function enableEditor(runtime: EditorRuntime): void {
  if (runtime.enabled) {
    return;
  }

  runtime.overlay = createOverlayRoot();
  runtime.panel = createPanelRoot({
    onSaveComment(comment) {
      saveRecord(runtime, comment);
    },
    onLocateRecord(record) {
      locateRecord(runtime, record);
    },
    onExportJson() {
      exportJson(runtime);
    },
    onImportJson(value) {
      importJson(runtime, value);
    },
    onCopyPrompt() {
      void copyPrompt(runtime);
    },
    onStyleDraftChange(property, value) {
      updateStyleDraft(runtime, property, value);
    },
    onResetStylePreview() {
      resetStylePreview(runtime);
    }
  });
  runtime.enabled = true;
  addEditorListeners();
  updateUi(runtime);
}

function disableEditor(runtime: EditorRuntime): void {
  if (!runtime.enabled) {
    return;
  }

  runtime.stylePreviewManager.resetAll();
  runtime.overlay?.destroy();
  runtime.panel?.destroy();
  runtime.overlay = null;
  runtime.panel = null;
  runtime.enabled = false;
  runtime.hoveredElement = null;
  runtime.selectedElement = null;
  runtime.selectedSnapshot = null;
  runtime.selectedStyleSnapshot = [];
  runtime.selectedStyleSupported = false;
  runtime.styleDraft = {};
  removeEditorListeners();
}

function toggleEditor(): boolean {
  const runtime = getRuntime();

  if (runtime.enabled) {
    disableEditor(runtime);
  } else {
    enableEditor(runtime);
  }

  return runtime.enabled;
}

const runtime = getRuntime();

if (!runtime.listenerReady) {
  chrome.runtime.onMessage.addListener((message: EditorMessage, _sender, sendResponse) => {
    if (message.type !== "WVAIE_TOGGLE_EDITOR") {
      return false;
    }

    const enabled = toggleEditor();
    sendResponse({ ok: true, enabled });
    return false;
  });

  runtime.listenerReady = true;
}

function addEditorListeners(): void {
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("click", handleClick, true);
  window.addEventListener("scroll", handleViewportChange, true);
  window.addEventListener("resize", handleViewportChange, true);
}

function removeEditorListeners(): void {
  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("click", handleClick, true);
  window.removeEventListener("scroll", handleViewportChange, true);
  window.removeEventListener("resize", handleViewportChange, true);
}

function handleMouseMove(event: MouseEvent): void {
  const runtime = getRuntime();

  if (!runtime.enabled || isPluginEvent(event)) {
    return;
  }

  const target = getEventElement(event);

  if (!target) {
    return;
  }

  runtime.hoveredElement = target;
  scheduleUiUpdate(runtime);
}

function handleClick(event: MouseEvent): void {
  const runtime = getRuntime();

  if (!runtime.enabled || isPluginEvent(event)) {
    return;
  }

  const target = getEventElement(event);

  if (!target) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  selectElement(runtime, target, "已选中元素，可以添加评论或编辑样式。");
}

function handleViewportChange(): void {
  const runtime = getRuntime();

  if (!runtime.enabled) {
    return;
  }

  scheduleUiUpdate(runtime);
}

function saveRecord(runtime: EditorRuntime, comment: string): void {
  if (!runtime.selectedSnapshot) {
    runtime.statusMessage = "请先选择页面元素。";
    updateUi(runtime);
    return;
  }

  const styleChanges = computeStyleChanges(runtime);

  if (!comment.trim() && styleChanges.length === 0) {
    runtime.statusMessage = "请填写评论或修改样式后再保存。";
    updateUi(runtime);
    return;
  }

  runtime.session = addEditRecord(runtime.session, runtime.selectedSnapshot, comment, styleChanges);
  runtime.statusMessage = "记录已保存。";
  updateUi(runtime);
}

function locateRecord(runtime: EditorRuntime, record: EditRecord): void {
  const element = document.querySelector(record.element.selector);

  if (!element) {
    runtime.unmatchedRecordIds.add(record.id);
    runtime.statusMessage = "当前页面未匹配到该元素。";
    updateUi(runtime);
    return;
  }

  runtime.unmatchedRecordIds.delete(record.id);
  element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  selectElement(runtime, element, "已定位到记录对应元素。");
  runtime.overlay?.flash(rectFromElement(element));
}

function exportJson(runtime: EditorRuntime): void {
  const json = serializeEditorSession(runtime.session);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `web-visual-ai-editor-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(objectUrl);
  runtime.statusMessage = "JSON 已导出。";
  updateUi(runtime);
}

function importJson(runtime: EditorRuntime, value: string): void {
  const parsed = parseEditorSessionExport(value);

  if (!parsed.ok) {
    runtime.statusMessage = parsed.reason;
    updateUi(runtime);
    return;
  }

  runtime.session = parsed.session;
  runtime.selectedElement = null;
  runtime.selectedSnapshot = null;
  runtime.selectedStyleSnapshot = [];
  runtime.selectedStyleSupported = false;
  runtime.styleDraft = {};
  runtime.unmatchedRecordIds = new Set();
  runtime.statusMessage = `已导入 ${parsed.session.records.length} 条记录。`;
  updateUi(runtime);
}

async function copyPrompt(runtime: EditorRuntime): Promise<void> {
  try {
    await navigator.clipboard.writeText(buildAiPrompt(runtime.session));
    runtime.statusMessage = "AI Prompt 已复制。";
  } catch {
    runtime.statusMessage = "复制失败，请检查浏览器剪贴板权限。";
  }

  updateUi(runtime);
}

function selectElement(runtime: EditorRuntime, element: Element, statusMessage: string): void {
  const isHtmlElement = element instanceof HTMLElement;

  runtime.selectedElement = isHtmlElement ? element : null;
  runtime.selectedSnapshot = readElementSnapshot(element);
  runtime.selectedStyleSnapshot = isHtmlElement ? readStyleSnapshot(element) : [];
  runtime.selectedStyleSupported = isHtmlElement;
  runtime.styleDraft = {};
  runtime.statusMessage = isHtmlElement ? statusMessage : "该元素暂不支持样式预览。";
  updateUi(runtime);
}

function updateStyleDraft(runtime: EditorRuntime, property: StylePropertyName, value: string): void {
  if (!runtime.selectedElement) {
    runtime.statusMessage = "请先选择页面元素。";
    updateUi(runtime);
    return;
  }

  const original = findOriginalValue(runtime.selectedStyleSnapshot, property);
  const normalized = value.trim();

  runtime.styleDraft = {
    ...runtime.styleDraft,
    [property]: normalized
  };

  if (!normalized || normalized === original) {
    delete runtime.styleDraft[property];

    if (runtime.selectedElement) {
      const result = runtime.stylePreviewManager.apply(runtime.selectedElement, property, original ?? "");

      if (!result.ok) {
        runtime.statusMessage = result.reason;
      }
    }

    updateUi(runtime);
    return;
  }

  const result = runtime.stylePreviewManager.apply(runtime.selectedElement, property, normalized);

  if (!result.ok) {
    runtime.statusMessage = result.reason;
  } else {
    runtime.statusMessage = "已应用临时预览，未保存到记录。";
  }

  updateUi(runtime);
}

function resetStylePreview(runtime: EditorRuntime): void {
  if (!runtime.selectedElement) {
    return;
  }

  runtime.stylePreviewManager.reset(runtime.selectedElement);
  runtime.styleDraft = {};
  runtime.statusMessage = "已重置当前元素样式预览。";
  updateUi(runtime);
}

function computeStyleChanges(runtime: EditorRuntime): StyleChange[] {
  const changes: StyleChange[] = [];

  for (const definition of STYLE_PROPERTY_DEFINITIONS) {
    const draftValue = runtime.styleDraft[definition.property];

    if (typeof draftValue !== "string" || !draftValue) {
      continue;
    }

    const originalValue = findOriginalValue(runtime.selectedStyleSnapshot, definition.property);

    if (originalValue === draftValue) {
      continue;
    }

    changes.push({
      property: definition.property,
      label: definition.label,
      oldValue: originalValue ?? "",
      newValue: draftValue,
      unit: definition.unit
    });
  }

  return changes;
}

function findOriginalValue(
  snapshot: StylePropertySnapshot[],
  property: StylePropertyName
): string | null {
  return snapshot.find((item) => item.property === property)?.value ?? null;
}

function scheduleUiUpdate(runtime: EditorRuntime): void {
  if (runtime.rafId !== null) {
    return;
  }

  runtime.rafId = window.requestAnimationFrame(() => {
    runtime.rafId = null;
    updateUi(runtime);
  });
}

function updateUi(runtime: EditorRuntime): void {
  runtime.overlay?.update({
    enabled: runtime.enabled,
    hoverRect: runtime.hoveredElement ? rectFromElement(runtime.hoveredElement) : null,
    selectedRect: runtime.selectedElement ? rectFromElement(runtime.selectedElement) : null
  });

  runtime.panel?.update({
    enabled: runtime.enabled,
    selectedElement: runtime.selectedSnapshot,
    selectedStyleSnapshot: runtime.selectedStyleSnapshot,
    selectedStyleSupported: runtime.selectedStyleSupported,
    styleDraft: runtime.styleDraft,
    records: runtime.session.records,
    statusMessage: runtime.statusMessage,
    unmatchedRecordIds: runtime.unmatchedRecordIds
  });
}

function rectFromElement(element: Element) {
  const rect = element.getBoundingClientRect();

  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

function getEventElement(event: Event): Element | null {
  const [target] = event.composedPath();

  return target instanceof Element ? target : null;
}

function isPluginEvent(event: Event): boolean {
  return event.composedPath().some((target) => {
    return target instanceof HTMLElement && target.id.startsWith("web-visual-ai-editor-");
  });
}

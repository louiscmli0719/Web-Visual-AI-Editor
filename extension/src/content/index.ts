import { createOverlayRoot, type OverlayController, type HighlightRect, type MeasurementOverlay } from "../overlay/overlay-root";
import { createPanelRoot, type PanelController } from "../panel/panel-root";
import type { PanelView } from "../panel/App";
import type { InteractionMode } from "../panel/components/FloatingToolbar";
import type { EditorMessage } from "../shared/messages";
import type {
  EditRecord,
  ElementSnapshot,
  StyleChange,
  StyleDraft,
  StylePropertyName,
  StylePropertySnapshot,
  RecordMetadata,
  RecordCategory,
  RecordStatus,
  Measurements,
  MatchLevel,
  SharedGroup,
  RecordRangeFilter
} from "../shared/types";
import { buildAiPrompt } from "../shared/prompt-template";
import { readStyleUnit } from "../shared/style-units";
import { readElementSnapshot } from "./dom-inspector";
import { readStyleSnapshot, STYLE_PROPERTY_DEFINITIONS } from "./style-inspector";
import { createStylePreviewManager, type StylePreviewManager } from "./style-preview";
import { buildElementSelector } from "./selector";
import {
  readSize,
  readViewportDistances,
  readParentDistances,
  computePairMeasurement
} from "./measurement";
import { findSimilarElements } from "./similar-elements";
import {
  addEditRecord,
  updateEditRecord,
  deleteEditRecord,
  setRecordStatus,
  createInitialSession,
  parseEditorSessionExport,
  serializeEditorSession
} from "./session-store";

type MeasurementMode = "off" | "awaiting-a" | "awaiting-b" | "complete";

type EditorRuntime = {
  enabled: boolean;
  panelView: PanelView;
  interactionMode: InteractionMode;
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
  editingRecord: EditRecord | null;
  filterCategory: RecordCategory | "all";
  filterStatus: RecordStatus | "all";
  filterRange: RecordRangeFilter;
  measurementMode: MeasurementMode;
  pairFirstElement: HTMLElement | null;
  pairSecondElement: HTMLElement | null;
  currentMeasurements: Measurements | null;
  attachMeasurements: boolean;
  similarMatchLevel: MatchLevel | null;
  similarPrimaryFeature: string;
  similarTotalMatched: number;
  similarTruncated: boolean;
  similarElements: HTMLElement[];
  similarSnapshots: ElementSnapshot[];
  applyToSimilar: boolean;
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
      panelView: "inspector",
      interactionMode: "select",
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
      editingRecord: null,
      filterCategory: "all",
      filterStatus: "all",
      filterRange: "all",
      measurementMode: "off",
      pairFirstElement: null,
      pairSecondElement: null,
      currentMeasurements: null,
      attachMeasurements: true,
      similarMatchLevel: null,
      similarPrimaryFeature: "",
      similarTotalMatched: 1,
      similarTruncated: false,
      similarElements: [],
      similarSnapshots: [],
      applyToSimilar: false,
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
    onSaveComment(comment, metadata) {
      if (runtime.editingRecord) {
        updateRecord(runtime, runtime.editingRecord.id, comment, metadata);
      } else {
        saveRecord(runtime, comment, metadata);
      }
    },
    onSavePageComment(comment, metadata) {
      if (runtime.editingRecord?.scope === "page") {
        updateRecord(runtime, runtime.editingRecord.id, comment, metadata);
        return;
      }
      runtime.session = addEditRecord(runtime.session, null, comment, [], metadata, null, null);
      runtime.statusMessage = "页面评论已保存。";
      updateUi(runtime);
    },
    onLocateRecord(record) {
      locateRecord(runtime, record);
    },
    onEditRecord(record) {
      startEditRecord(runtime, record);
    },
    onDeleteRecord(record) {
      deleteRecord(runtime, record.id);
    },
    onStatusChange(recordId, status) {
      changeRecordStatus(runtime, recordId, status);
    },
    onCancelEdit() {
      cancelEditRecord(runtime);
    },
    onFilterCategoryChange(category) {
      runtime.filterCategory = category;
      updateUi(runtime);
    },
    onFilterStatusChange(status) {
      runtime.filterStatus = status;
      updateUi(runtime);
    },
    onFilterRangeChange(range) {
      runtime.filterRange = range;
      updateUi(runtime);
    },
    onHoverSimilar(index) {
      hoverSimilarElement(runtime, index);
    },
    onHighlightAllSimilar() {
      highlightAllSimilar(runtime);
    },
    onHighlightSharedGroup(record) {
      highlightSharedGroup(runtime, record);
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
    },
    onEnterMeasurementMode() {
      enterMeasurementMode(runtime);
    },
    onExitMeasurementMode() {
      exitMeasurementMode(runtime);
    },
    onResetPairMeasurement() {
      resetPairMeasurement(runtime);
    },
    onToggleAttachMeasurements(next) {
      runtime.attachMeasurements = next;
      updateUi(runtime);
    },
    onToggleApplyToSimilar(next) {
      runtime.applyToSimilar = next;
      updateUi(runtime);
    },
    onBrowseMode() {
      enterBrowseMode(runtime);
    },
    onSelectMode() {
      enterSelectMode(runtime);
    },
    onShowInspector() {
      runtime.panelView = "inspector";
      updateUi(runtime);
    },
    onShowRecords() {
      showRecords(runtime);
    },
    onClose() {
      disableEditor(runtime);
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
  runtime.panelView = "inspector";
  runtime.interactionMode = "select";
  runtime.hoveredElement = null;
  runtime.selectedElement = null;
  runtime.selectedSnapshot = null;
  runtime.selectedStyleSnapshot = [];
  runtime.selectedStyleSupported = false;
  runtime.styleDraft = {};
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  runtime.currentMeasurements = null;
  runtime.editingRecord = null;
  clearSimilarElements(runtime);
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
  document.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("scroll", handleViewportChange, true);
  window.addEventListener("resize", handleViewportChange, true);
}

function removeEditorListeners(): void {
  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("keydown", handleKeyDown, true);
  window.removeEventListener("scroll", handleViewportChange, true);
  window.removeEventListener("resize", handleViewportChange, true);
}

function handleMouseMove(event: MouseEvent): void {
  const runtime = getRuntime();

  if (!runtime.enabled || runtime.interactionMode === "browse" || isPluginEvent(event)) {
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

  if (!runtime.enabled || isPluginEvent(event) || runtime.interactionMode === "browse") {
    return;
  }

  const target = getEventElement(event);

  if (!target || !(target instanceof HTMLElement)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  // Block selection when editing a record
  if (runtime.editingRecord) {
    runtime.statusMessage = "正在编辑记录，先取消编辑再选元素。";
    updateUi(runtime);
    return;
  }

  // Pair measurement: capture A or B
  if (runtime.measurementMode === "awaiting-a") {
    runtime.pairFirstElement = target;
    runtime.measurementMode = "awaiting-b";
    selectElement(runtime, target, "已选择元素 A，请点击元素 B。");
    return;
  }

  if (runtime.measurementMode === "awaiting-b") {
    if (!runtime.pairFirstElement || target === runtime.pairFirstElement) {
      runtime.statusMessage = "不能选择同一个元素，请选择另一个元素。";
      updateUi(runtime);
      return;
    }
    runtime.pairSecondElement = target;
    runtime.measurementMode = "complete";
    selectElement(runtime, runtime.pairFirstElement, "双元素测距完成，元素 A 保持为记录对象。");
    return;
  }

  selectElement(runtime, target, "已选中元素，可以添加评论或编辑样式。");
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape") {
    return;
  }

  const runtime = getRuntime();

  if (!runtime.enabled) {
    return;
  }

  if (runtime.editingRecord) {
    cancelEditRecord(runtime);
    return;
  }

  if (runtime.interactionMode === "measure") {
    exitMeasurementMode(runtime);
    return;
  }

  enterBrowseMode(runtime);
}

function handleViewportChange(): void {
  const runtime = getRuntime();

  if (!runtime.enabled) {
    return;
  }

  computeCurrentMeasurements(runtime);
  scheduleUiUpdate(runtime);
}

function saveRecord(runtime: EditorRuntime, comment: string, metadata: RecordMetadata): void {
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

  const shouldAttach =
    runtime.attachMeasurements ||
    (runtime.currentMeasurements?.pair !== null && runtime.currentMeasurements !== null);
  const measurements = shouldAttach ? runtime.currentMeasurements : null;
  const sharedGroup = buildSharedGroup(runtime);

  runtime.session = addEditRecord(
    runtime.session,
    runtime.selectedSnapshot,
    comment,
    styleChanges,
    metadata,
    measurements,
    sharedGroup
  );
  runtime.statusMessage = "记录已保存。";
  runtime.applyToSimilar = false;
  // Exit measurement mode after saving a pair record
  if (runtime.measurementMode === "complete") {
    runtime.measurementMode = "off";
    runtime.interactionMode = "select";
    runtime.pairFirstElement = null;
    runtime.pairSecondElement = null;
    computeCurrentMeasurements(runtime);
  }
  updateUi(runtime);
}

function locateRecord(runtime: EditorRuntime, record: EditRecord): void {
  if (!record.element) {
    // Page-scope record, just show it
    runtime.statusMessage = "这是页面级评论。";
    updateUi(runtime);
    return;
  }

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

function startEditRecord(runtime: EditorRuntime, record: EditRecord): void {
  if (record.element) {
    const target = document.querySelector(record.element.selector);
    if (target instanceof HTMLElement) {
      selectElement(runtime, target, "已定位到待编辑记录的元素。");
    }
  }
  runtime.panelView = "inspector";
  runtime.interactionMode = "select";
  runtime.editingRecord = record;
  runtime.applyToSimilar = record.sharedGroup !== null;
  runtime.statusMessage = "编辑模式：修改完成后点击保存。";
  updateUi(runtime);
}

function cancelEditRecord(runtime: EditorRuntime): void {
  runtime.editingRecord = null;
  runtime.applyToSimilar = false;
  runtime.statusMessage = "已取消编辑。";
  updateUi(runtime);
}

function updateRecord(runtime: EditorRuntime, recordId: string, comment: string, metadata: RecordMetadata): void {
  const shouldAttach = metadata.scope === "element" && runtime.attachMeasurements && runtime.currentMeasurements !== null;
  const measurements = shouldAttach ? runtime.currentMeasurements : null;
  const sharedGroup = metadata.scope === "element" ? buildSharedGroup(runtime) : null;

  runtime.session = updateEditRecord(runtime.session, recordId, comment, metadata, measurements, sharedGroup);
  runtime.editingRecord = null;
  runtime.applyToSimilar = false;
  runtime.statusMessage = "记录已更新。";
  updateUi(runtime);
}

function deleteRecord(runtime: EditorRuntime, recordId: string): void {
  runtime.session = deleteEditRecord(runtime.session, recordId);
  runtime.unmatchedRecordIds.delete(recordId);
  runtime.statusMessage = "记录已删除。";
  updateUi(runtime);
}

function changeRecordStatus(runtime: EditorRuntime, recordId: string, status: RecordStatus): void {
  runtime.session = setRecordStatus(runtime.session, recordId, status);
  runtime.statusMessage = `状态已更新为：${status === "open" ? "待处理" : status === "resolved" ? "已处理" : "暂缓"}`;
  updateUi(runtime);
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
  clearSimilarElements(runtime);
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
  runtime.applyToSimilar = false;
  runtime.panelView = "inspector";
  runtime.statusMessage = isHtmlElement ? statusMessage : "该元素暂不支持样式预览。";
  computeSimilarElements(runtime);
  computeCurrentMeasurements(runtime);
  updateUi(runtime);
}

function computeCurrentMeasurements(runtime: EditorRuntime): void {
  if (!runtime.selectedElement) {
    runtime.currentMeasurements = null;
    return;
  }

  const elementRect = runtime.selectedElement.getBoundingClientRect();
  const rect = { x: elementRect.x, y: elementRect.y, width: elementRect.width, height: elementRect.height };
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  // Parent distances
  let parent: Measurements["parent"] = null;
  const parentElement = runtime.selectedElement.parentElement;
  if (parentElement) {
    const parentRect = parentElement.getBoundingClientRect();
    const parentRectPlain = {
      x: parentRect.x,
      y: parentRect.y,
      width: parentRect.width,
      height: parentRect.height
    };
    const distances = readParentDistances(rect, parentRectPlain);
    if (distances) {
      parent = {
        selector: buildElementSelector(parentElement),
        distances
      };
    }
  }

  // Pair measurement
  let pair: Measurements["pair"] = null;
  if (
    runtime.measurementMode === "complete" &&
    runtime.pairFirstElement &&
    runtime.pairSecondElement
  ) {
    // Use the OTHER element as the pair target (not the currently selected one)
    const otherElement =
      runtime.selectedElement === runtime.pairFirstElement
        ? runtime.pairSecondElement
        : runtime.pairFirstElement;
    const otherRect = otherElement.getBoundingClientRect();
    const otherRectPlain = {
      x: otherRect.x,
      y: otherRect.y,
      width: otherRect.width,
      height: otherRect.height
    };
    const pairResult = computePairMeasurement(rect, otherRectPlain);
    const otherSnapshot = readElementSnapshot(otherElement);

    pair = {
      selector: otherSnapshot.selector,
      text: otherSnapshot.text,
      rect: {
        x: Math.round(otherRect.x),
        y: Math.round(otherRect.y),
        width: Math.round(otherRect.width),
        height: Math.round(otherRect.height)
      },
      horizontalDistance: pairResult.horizontalDistance,
      verticalDistance: pairResult.verticalDistance,
      centerDistance: pairResult.centerDistance
    };
  }

  runtime.currentMeasurements = {
    size: readSize(rect),
    viewport: readViewportDistances(rect, viewport),
    parent,
    pair
  };
}

function computeSimilarElements(runtime: EditorRuntime): void {
  if (!runtime.selectedElement) {
    clearSimilarElements(runtime);
    return;
  }

  const result = findSimilarElements(runtime.selectedElement, document.body);
  runtime.similarMatchLevel = result.matchLevel;
  runtime.similarPrimaryFeature = result.primaryFeature;
  runtime.similarTotalMatched = result.totalMatched;
  runtime.similarTruncated = result.truncated;
  runtime.similarElements = result.similar;
  runtime.similarSnapshots = result.similar.map((element) => readElementSnapshot(element));
}

function clearSimilarElements(runtime: EditorRuntime): void {
  runtime.similarMatchLevel = null;
  runtime.similarPrimaryFeature = "";
  runtime.similarTotalMatched = 1;
  runtime.similarTruncated = false;
  runtime.similarElements = [];
  runtime.similarSnapshots = [];
  runtime.applyToSimilar = false;
}

function buildSharedGroup(runtime: EditorRuntime): SharedGroup | null {
  if (
    !runtime.applyToSimilar ||
    !runtime.similarMatchLevel ||
    runtime.similarSnapshots.length === 0
  ) {
    return null;
  }

  return {
    matchLevel: runtime.similarMatchLevel,
    primaryFeature: runtime.similarPrimaryFeature,
    totalMatched: runtime.similarTotalMatched,
    truncated: runtime.similarTruncated,
    targets: runtime.similarSnapshots
  };
}

function hoverSimilarElement(runtime: EditorRuntime, index: number | null): void {
  if (index === null) {
    return;
  }

  const element = runtime.similarElements[index];
  if (element) {
    runtime.overlay?.flash(rectFromElement(element));
  }
}

function highlightAllSimilar(runtime: EditorRuntime): void {
  if (!runtime.selectedElement || runtime.similarElements.length === 0) {
    return;
  }

  runtime.overlay?.highlightSimilar([
    rectFromElement(runtime.selectedElement),
    ...runtime.similarElements.map(rectFromElement)
  ]);
  runtime.statusMessage = `已高亮 ${runtime.similarTotalMatched} 个相似元素。`;
  updateUi(runtime);
}

function highlightSharedGroup(runtime: EditorRuntime, record: EditRecord): void {
  if (!record.element || !record.sharedGroup) {
    return;
  }

  runtime.overlay?.highlightSimilar([
    record.element.rect,
    ...record.sharedGroup.targets.map((target) => target.rect)
  ]);
  runtime.statusMessage = `已高亮记录中的 ${record.sharedGroup.totalMatched} 个批量目标。`;
  updateUi(runtime);
}

function enterMeasurementMode(runtime: EditorRuntime): void {
  runtime.interactionMode = "measure";
  runtime.panelView = "inspector";
  runtime.pairSecondElement = null;
  if (runtime.selectedElement) {
    runtime.measurementMode = "awaiting-b";
    runtime.pairFirstElement = runtime.selectedElement;
    runtime.statusMessage = "已将当前元素设为 A，请选择参照元素 B。";
  } else {
    runtime.measurementMode = "awaiting-a";
    runtime.pairFirstElement = null;
    runtime.statusMessage = "请点击页面元素选择起点 A。";
  }
  updateUi(runtime);
}

function exitMeasurementMode(runtime: EditorRuntime): void {
  runtime.interactionMode = "select";
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  computeCurrentMeasurements(runtime);
  runtime.statusMessage = "已退出测距模式。";
  updateUi(runtime);
}

function resetPairMeasurement(runtime: EditorRuntime): void {
  runtime.interactionMode = "measure";
  runtime.measurementMode = "awaiting-a";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  computeCurrentMeasurements(runtime);
  runtime.statusMessage = "已重置测距，请重新选择 A。";
  updateUi(runtime);
}

function enterBrowseMode(runtime: EditorRuntime): void {
  runtime.interactionMode = "browse";
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  runtime.hoveredElement = null;
  computeCurrentMeasurements(runtime);
  runtime.statusMessage = "浏览模式：网页原有点击和输入已恢复。";
  updateUi(runtime);
}

function enterSelectMode(runtime: EditorRuntime): void {
  runtime.interactionMode = "select";
  runtime.panelView = "inspector";
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  computeCurrentMeasurements(runtime);
  runtime.statusMessage = "选择模式：点击网页元素查看并编辑属性。";
  updateUi(runtime);
}

function showRecords(runtime: EditorRuntime): void {
  runtime.panelView = "records";
  runtime.interactionMode = "browse";
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  runtime.hoveredElement = null;
  computeCurrentMeasurements(runtime);
  runtime.statusMessage = "查看当前页面的修改记录。";
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
      unit: definition.unit ? readStyleUnit(draftValue, definition.unit) : undefined
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
    selectedRect: runtime.selectedElement ? rectFromElement(runtime.selectedElement) : null,
    selectedElement: runtime.selectedElement,
    measurement: buildOverlayMeasurement(runtime)
  });

  runtime.panel?.update({
    enabled: runtime.enabled,
    panelView: runtime.panelView,
    interactionMode: runtime.interactionMode,
    selectedElement: runtime.selectedSnapshot,
    selectedStyleSnapshot: runtime.selectedStyleSnapshot,
    selectedStyleSupported: runtime.selectedStyleSupported,
    styleDraft: runtime.styleDraft,
    records: runtime.session.records,
    statusMessage: runtime.statusMessage,
    unmatchedRecordIds: runtime.unmatchedRecordIds,
    editingRecord: runtime.editingRecord,
    filterCategory: runtime.filterCategory,
    filterStatus: runtime.filterStatus,
    filterRange: runtime.filterRange,
    measurement: runtime.currentMeasurements,
    measurementMode: runtime.measurementMode,
    attachMeasurements: runtime.attachMeasurements,
    similarMatchLevel: runtime.similarMatchLevel,
    similarPrimaryFeature: runtime.similarPrimaryFeature,
    similarTotalMatched: runtime.similarTotalMatched,
    similarTruncated: runtime.similarTruncated,
    similarElements: runtime.similarSnapshots,
    applyToSimilar: runtime.applyToSimilar
  });
}

function buildOverlayMeasurement(runtime: EditorRuntime): MeasurementOverlay | null {
  if (!runtime.currentMeasurements) {
    return null;
  }

  let pair: MeasurementOverlay["pair"] = null;

  if (
    runtime.measurementMode === "complete" &&
    runtime.pairFirstElement &&
    runtime.pairSecondElement &&
    runtime.currentMeasurements.pair
  ) {
    const aRect = runtime.pairFirstElement.getBoundingClientRect();
    const bRect = runtime.pairSecondElement.getBoundingClientRect();

    pair = {
      a: { x: aRect.x, y: aRect.y, width: aRect.width, height: aRect.height },
      b: { x: bRect.x, y: bRect.y, width: bRect.width, height: bRect.height },
      horizontalDistance: runtime.currentMeasurements.pair.horizontalDistance,
      verticalDistance: runtime.currentMeasurements.pair.verticalDistance
    };
  }

  return {
    size: runtime.currentMeasurements.size,
    pair
  };
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

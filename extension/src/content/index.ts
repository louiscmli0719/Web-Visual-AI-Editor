import {
  createOverlayRoot,
  type OverlayController,
  type HighlightRect,
  type LayoutDragStart,
  type LayoutGuideOverlay,
  type MeasurementOverlay,
  type CommentPinOverlay
} from "../overlay/overlay-root";
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
  RecordRangeFilter,
  LayoutContext,
  LayoutIntent
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
import { readLayoutContext } from "./layout-inspector";
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
type LayoutFlow = "horizontal" | "vertical";

type LayoutDragState = {
  pointerId: number;
  element: HTMLElement;
  parent: HTMLElement;
  originalIndex: number;
  originalNextSibling: Element | null;
  previewIndex: number;
  previewTarget: HTMLElement | null;
  animationStyles: Map<HTMLElement, LayoutAnimationStyle>;
  animationTimers: Map<HTMLElement, number>;
  flow: LayoutFlow;
};

type LayoutDropInfo = {
  insertIndex: number;
  swapTarget: HTMLElement;
  targetRect: HighlightRect | null;
  lineRect: HighlightRect;
  alignmentLines: HighlightRect[];
  label: string;
};

type LayoutAnimationStyle = {
  transform: string;
  transition: string;
  willChange: string;
};

type LayoutMove = {
  element: HTMLElement;
  parent: HTMLElement;
  originalNextSibling: Element | null;
};

type QuickCommentTarget = {
  element: ElementSnapshot;
  rect: ElementSnapshot["rect"];
};

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
  currentLayoutContext: LayoutContext | null;
  quickCommentTarget: QuickCommentTarget | null;
  attachMeasurements: boolean;
  similarMatchLevel: MatchLevel | null;
  similarPrimaryFeature: string;
  similarTotalMatched: number;
  similarTruncated: boolean;
  similarElements: HTMLElement[];
  similarSnapshots: ElementSnapshot[];
  applyToSimilar: boolean;
  layoutDrag: LayoutDragState | null;
  layoutGuide: LayoutGuideOverlay | null;
  layoutMoves: LayoutMove[];
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
      currentLayoutContext: null,
      quickCommentTarget: null,
      attachMeasurements: true,
      similarMatchLevel: null,
      similarPrimaryFeature: "",
      similarTotalMatched: 1,
      similarTruncated: false,
      similarElements: [],
      similarSnapshots: [],
      applyToSimilar: false,
      layoutDrag: null,
      layoutGuide: null,
      layoutMoves: [],
      rafId: null
    };
  }

  return window.__webVisualAiEditorRuntime;
}

function enableEditor(runtime: EditorRuntime): void {
  if (runtime.enabled) {
    return;
  }

  runtime.overlay = createOverlayRoot({
    onLayoutDragStart(event) {
      startLayoutDrag(runtime, event);
    }
  });
  runtime.panel = createPanelRoot({
    onSaveComment(comment, metadata) {
      if (runtime.editingRecord) {
        updateRecord(runtime, runtime.editingRecord.id, comment, metadata);
      } else {
        saveRecord(runtime, comment, metadata);
      }
    },
    onSaveQuickComment(comment, metadata) {
      saveQuickComment(runtime, comment, metadata);
    },
    onCancelQuickComment() {
      cancelQuickComment(runtime);
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
    onSaveLayoutIntent(intent) {
      saveLayoutIntent(runtime, intent);
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
    onAutoLayoutMode() {
      enterAutoLayoutMode(runtime);
    },
    onCommentMode() {
      enterCommentMode(runtime);
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
  restoreLayoutMoves(runtime);
  clearLayoutDrag(runtime);
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
  runtime.currentLayoutContext = null;
  runtime.quickCommentTarget = null;
  runtime.editingRecord = null;
  runtime.layoutGuide = null;
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

  if (!runtime.enabled || runtime.layoutDrag || runtime.interactionMode === "browse" || isPluginEvent(event)) {
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

  if (runtime.interactionMode === "comment") {
    openQuickComment(runtime, target);
    return;
  }

  if (runtime.interactionMode === "measure") {
    handleMeasurementClick(runtime, target);
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

  if (runtime.quickCommentTarget) {
    cancelQuickComment(runtime);
    return;
  }

  if (runtime.interactionMode === "measure") {
    exitMeasurementMode(runtime);
    return;
  }

  if (runtime.interactionMode === "auto-layout") {
    enterSelectMode(runtime);
    return;
  }

  enterBrowseMode(runtime);
}

function handleMeasurementClick(runtime: EditorRuntime, target: HTMLElement): void {
  if (runtime.measurementMode === "awaiting-a") {
    setMeasurementFirstElement(runtime, target, "已选择元素 A，请点击元素 B。");
    return;
  }

  if (runtime.measurementMode === "awaiting-b") {
    if (!runtime.pairFirstElement) {
      setMeasurementFirstElement(runtime, target, "已选择元素 A，请点击元素 B。");
      return;
    }

    if (target === runtime.pairFirstElement) {
      clearMeasurementSelection(runtime, "已取消元素 A，请重新点击页面元素选择 A。");
      return;
    }

    runtime.pairSecondElement = target;
    runtime.measurementMode = "complete";
    selectElement(runtime, runtime.pairFirstElement, "双元素测距完成，元素 A 保持为记录对象；点击 A 可取消并重新测距。");
    return;
  }

  if (runtime.measurementMode === "complete") {
    if (target === runtime.pairFirstElement) {
      clearMeasurementSelection(runtime, "已取消本次测距，请重新点击页面元素选择 A。");
      return;
    }

    setMeasurementFirstElement(runtime, target, "已重新选择元素 A，请点击元素 B。");
    return;
  }

  setMeasurementFirstElement(runtime, target, "已选择元素 A，请点击元素 B。");
}

function setMeasurementFirstElement(runtime: EditorRuntime, target: HTMLElement, statusMessage: string): void {
  runtime.pairFirstElement = target;
  runtime.pairSecondElement = null;
  runtime.measurementMode = "awaiting-b";
  selectElement(runtime, target, statusMessage);
}

function clearMeasurementSelection(runtime: EditorRuntime, statusMessage: string): void {
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  runtime.measurementMode = "awaiting-a";
  clearSelectedElement(runtime, statusMessage);
}

function handleViewportChange(): void {
  const runtime = getRuntime();

  if (!runtime.enabled) {
    return;
  }

  computeCurrentMeasurements(runtime);
  computeCurrentLayoutContext(runtime);
  refreshQuickCommentTarget(runtime);
  runtime.layoutGuide = null;
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

function openQuickComment(runtime: EditorRuntime, target: HTMLElement): void {
  selectElement(runtime, target, "评论模式：已选中元素，请填写评论。");

  if (!runtime.selectedSnapshot) {
    runtime.statusMessage = "该元素暂不支持添加评论。";
    updateUi(runtime);
    return;
  }

  runtime.quickCommentTarget = {
    element: runtime.selectedSnapshot,
    rect: rectFromElement(target)
  };
  runtime.statusMessage = "评论弹窗已打开，保存后会加入记录列表。";
  updateUi(runtime);
}

function saveQuickComment(runtime: EditorRuntime, comment: string, metadata: RecordMetadata): void {
  const target = runtime.quickCommentTarget;
  const nextComment = comment.trim();

  if (!target || !runtime.selectedSnapshot) {
    runtime.statusMessage = "请先在评论模式下点击页面元素。";
    updateUi(runtime);
    return;
  }

  if (!nextComment) {
    runtime.statusMessage = "请填写评论后再保存。";
    updateUi(runtime);
    return;
  }

  runtime.session = addEditRecord(
    runtime.session,
    runtime.selectedSnapshot,
    nextComment,
    [],
    { ...metadata, scope: "element" },
    null,
    buildSharedGroup(runtime)
  );
  runtime.quickCommentTarget = null;
  runtime.applyToSimilar = false;
  runtime.statusMessage = "评论已保存，可继续点击页面元素添加下一条。";
  updateUi(runtime);
}

function cancelQuickComment(runtime: EditorRuntime): void {
  runtime.quickCommentTarget = null;
  runtime.statusMessage = runtime.interactionMode === "comment"
    ? "已取消当前评论，仍可继续点击元素添加评论。"
    : "已取消当前评论。";
  updateUi(runtime);
}

function refreshQuickCommentTarget(runtime: EditorRuntime): void {
  if (!runtime.quickCommentTarget || !runtime.selectedElement || !runtime.selectedSnapshot) {
    return;
  }

  runtime.quickCommentTarget = {
    element: runtime.selectedSnapshot,
    rect: rectFromElement(runtime.selectedElement)
  };
}

function saveLayoutIntent(runtime: EditorRuntime, intent: LayoutIntent): void {
  if (!runtime.selectedSnapshot || !runtime.currentLayoutContext) {
    runtime.statusMessage = "请先选择可识别父容器布局的元素。";
    updateUi(runtime);
    return;
  }

  const metadata: RecordMetadata = {
    category: "layout",
    priority: "medium",
    status: "open",
    interactionState: null,
    scope: "element"
  };

  runtime.session = addEditRecord(
    runtime.session,
    runtime.selectedSnapshot,
    buildLayoutComment(intent),
    [],
    metadata,
    null,
    buildSharedGroup(runtime),
    {
      layoutContext: runtime.currentLayoutContext,
      layoutIntent: intent
    }
  );
  runtime.statusMessage = "布局意图已保存。";
  runtime.applyToSimilar = false;
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
  runtime.currentMeasurements = null;
  runtime.currentLayoutContext = null;
  runtime.quickCommentTarget = null;
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
  runtime.quickCommentTarget = null;
  runtime.applyToSimilar = false;
  runtime.panelView = "inspector";
  runtime.statusMessage = isHtmlElement ? statusMessage : "该元素暂不支持样式预览。";
  computeSimilarElements(runtime);
  computeCurrentMeasurements(runtime);
  computeCurrentLayoutContext(runtime);
  updateUi(runtime);
}

function clearSelectedElement(runtime: EditorRuntime, statusMessage: string): void {
  runtime.selectedElement = null;
  runtime.selectedSnapshot = null;
  runtime.selectedStyleSnapshot = [];
  runtime.selectedStyleSupported = false;
  runtime.styleDraft = {};
  runtime.quickCommentTarget = null;
  runtime.applyToSimilar = false;
  runtime.panelView = "inspector";
  runtime.statusMessage = statusMessage;
  clearSimilarElements(runtime);
  computeCurrentMeasurements(runtime);
  computeCurrentLayoutContext(runtime);
  updateUi(runtime);
}

function computeCurrentMeasurements(runtime: EditorRuntime): void {
  if (!runtime.selectedElement) {
    runtime.currentMeasurements = null;
    runtime.currentLayoutContext = null;
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

function computeCurrentLayoutContext(runtime: EditorRuntime): void {
  runtime.currentLayoutContext = runtime.selectedElement ? readLayoutContext(runtime.selectedElement) : null;
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
  clearLayoutDrag(runtime);
  runtime.quickCommentTarget = null;
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
  clearLayoutDrag(runtime);
  runtime.quickCommentTarget = null;
  runtime.interactionMode = "select";
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  computeCurrentMeasurements(runtime);
  runtime.statusMessage = "已退出测距模式。";
  updateUi(runtime);
}

function resetPairMeasurement(runtime: EditorRuntime): void {
  clearLayoutDrag(runtime);
  runtime.quickCommentTarget = null;
  runtime.interactionMode = "measure";
  runtime.measurementMode = "awaiting-a";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  computeCurrentMeasurements(runtime);
  runtime.statusMessage = "已重置测距，请重新选择 A。";
  updateUi(runtime);
}

function enterBrowseMode(runtime: EditorRuntime): void {
  clearLayoutDrag(runtime);
  runtime.quickCommentTarget = null;
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
  clearLayoutDrag(runtime);
  runtime.quickCommentTarget = null;
  runtime.interactionMode = "select";
  runtime.panelView = "inspector";
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  computeCurrentMeasurements(runtime);
  runtime.statusMessage = "选择模式：点击网页元素查看并编辑属性。";
  updateUi(runtime);
}

function enterAutoLayoutMode(runtime: EditorRuntime): void {
  runtime.quickCommentTarget = null;
  runtime.interactionMode = "auto-layout";
  runtime.panelView = "inspector";
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  runtime.layoutGuide = null;
  computeCurrentMeasurements(runtime);
  computeCurrentLayoutContext(runtime);
  runtime.statusMessage = runtime.selectedElement
    ? "自动布局：拖动元素中部粉色横条，和同父容器元素精准交换。"
    : "自动布局：先点击一个元素，再拖动粉色横条交换同级元素位置。";
  updateUi(runtime);
}

function enterCommentMode(runtime: EditorRuntime): void {
  clearLayoutDrag(runtime);
  runtime.interactionMode = "comment";
  runtime.panelView = "inspector";
  runtime.measurementMode = "off";
  runtime.pairFirstElement = null;
  runtime.pairSecondElement = null;
  runtime.quickCommentTarget = null;
  computeCurrentMeasurements(runtime);
  computeCurrentLayoutContext(runtime);
  runtime.statusMessage = "评论模式：点击页面元素，直接添加一条评论。";
  updateUi(runtime);
}

function startLayoutDrag(runtime: EditorRuntime, event: LayoutDragStart): void {
  if (runtime.interactionMode !== "auto-layout") {
    enterAutoLayoutMode(runtime);
  }

  if (!runtime.selectedElement?.parentElement) {
    runtime.statusMessage = "自动布局需要先选择一个有父容器的元素。";
    updateUi(runtime);
    return;
  }

  const parent = runtime.selectedElement.parentElement;
  const children = getLayoutChildren(parent);
  if (children.length < 2) {
    runtime.statusMessage = "当前父容器内没有可交换位置的同级元素。";
    updateUi(runtime);
    return;
  }

  clearLayoutDrag(runtime);
  runtime.layoutDrag = {
    pointerId: event.pointerId,
    element: runtime.selectedElement,
    parent,
    originalIndex: children.indexOf(runtime.selectedElement),
    originalNextSibling: runtime.selectedElement.nextElementSibling,
    previewIndex: children.indexOf(runtime.selectedElement),
    previewTarget: null,
    animationStyles: new Map(),
    animationTimers: new Map(),
    flow: readLayoutFlow(parent)
  };
  runtime.layoutGuide = buildLayoutGuide(runtime.layoutDrag, event.clientX, event.clientY);
  runtime.statusMessage = "正在调整布局位置：拖到同级元素上会精准交换，松开后保存记录。";

  window.addEventListener("pointermove", handleLayoutDragMove, true);
  window.addEventListener("pointerup", handleLayoutDragEnd, true);
  window.addEventListener("pointercancel", handleLayoutDragEnd, true);
  updateUi(runtime);
}

function handleLayoutDragMove(event: PointerEvent): void {
  const runtime = getRuntime();
  if (!runtime.layoutDrag || event.pointerId !== runtime.layoutDrag.pointerId) {
    return;
  }

  const dropInfo = computeLayoutDropInfo(runtime.layoutDrag, event.clientX, event.clientY);

  if (dropInfo) {
    previewLayoutMove(runtime.layoutDrag, dropInfo);
    runtime.layoutGuide = buildLayoutGuideFromDropInfo(dropInfo);
  } else {
    runtime.layoutGuide = null;
  }

  scheduleUiUpdate(runtime);
  event.preventDefault();
  event.stopPropagation();
}

function handleLayoutDragEnd(event: PointerEvent): void {
  const runtime = getRuntime();
  if (!runtime.layoutDrag || event.pointerId !== runtime.layoutDrag.pointerId) {
    return;
  }

  const drag = runtime.layoutDrag;
  const dropInfo = computeLayoutDropInfo(drag, event.clientX, event.clientY);

  if (event.type === "pointercancel") {
    restoreLayoutPreview(drag);
    clearLayoutAnimationStyles(drag);
    clearLayoutDrag(runtime);
    runtime.statusMessage = "已取消本次布局拖动。";
    updateUi(runtime);
    return;
  }

  clearLayoutDrag(runtime);

  if (!dropInfo) {
    runtime.layoutGuide = null;
  }

  commitLayoutMove(runtime, drag);
  event.preventDefault();
  event.stopPropagation();
}

function clearLayoutDrag(runtime: EditorRuntime): void {
  if (!runtime.layoutDrag && !runtime.layoutGuide) {
    return;
  }

  runtime.layoutDrag = null;
  runtime.layoutGuide = null;
  window.removeEventListener("pointermove", handleLayoutDragMove, true);
  window.removeEventListener("pointerup", handleLayoutDragEnd, true);
  window.removeEventListener("pointercancel", handleLayoutDragEnd, true);
}

function commitLayoutMove(runtime: EditorRuntime, drag: LayoutDragState): void {
  if (!drag.element.isConnected || !drag.parent.isConnected) {
    runtime.statusMessage = "目标元素已从页面移除，布局调整已取消。";
    updateUi(runtime);
    return;
  }

  const nextChildren = getLayoutChildren(drag.parent);
  const nextIndex = nextChildren.indexOf(drag.element);

  selectElement(
    runtime,
    drag.element,
    nextIndex === drag.originalIndex
      ? "自动布局：位置未变化。"
      : `自动布局：已移动到第 ${nextIndex + 1} 位，并保存布局记录。`
  );

  if (nextIndex === drag.originalIndex) {
    return;
  }

  if (!runtime.layoutMoves.some((move) => move.element === drag.element)) {
    runtime.layoutMoves.push({
      element: drag.element,
      parent: drag.parent,
      originalNextSibling: drag.originalNextSibling
    });
  }

  const layoutIntent: LayoutIntent = {
    direction: drag.flow,
    alignment: "none",
    gap: "",
    note: `拖动换位：从第 ${drag.originalIndex + 1} 位移动到第 ${nextIndex + 1} 位。`
  };
  const metadata: RecordMetadata = {
    category: "layout",
    priority: "medium",
    status: "open",
    interactionState: null,
    scope: "element"
  };

  runtime.session = addEditRecord(
    runtime.session,
    readElementSnapshot(drag.element),
    `布局调整：${layoutIntent.note}`,
    [],
    metadata,
    null,
    buildSharedGroup(runtime),
    {
      layoutContext: runtime.currentLayoutContext,
      layoutIntent
    }
  );
  runtime.applyToSimilar = false;
  updateUi(runtime);
}

function restoreLayoutMoves(runtime: EditorRuntime): void {
  for (const move of [...runtime.layoutMoves].reverse()) {
    if (!move.element.isConnected || !move.parent.isConnected) {
      continue;
    }

    move.parent.insertBefore(
      move.element,
      move.originalNextSibling?.isConnected ? move.originalNextSibling : null
    );
  }

  runtime.layoutMoves = [];
}

function buildLayoutGuide(drag: LayoutDragState, clientX: number, clientY: number): LayoutGuideOverlay | null {
  const dropInfo = computeLayoutDropInfo(drag, clientX, clientY);

  if (!dropInfo) {
    return null;
  }

  return buildLayoutGuideFromDropInfo(dropInfo);
}

function buildLayoutGuideFromDropInfo(dropInfo: LayoutDropInfo): LayoutGuideOverlay {
  return {
    targetRect: dropInfo.targetRect,
    lineRect: dropInfo.lineRect,
    alignmentLines: dropInfo.alignmentLines,
    label: dropInfo.label
  };
}

function computeLayoutDropInfo(drag: LayoutDragState, clientX: number, clientY: number): LayoutDropInfo | null {
  const swapTarget = findLayoutSwapTarget(drag, clientX, clientY);
  if (!swapTarget) {
    return null;
  }

  const children = getLayoutChildren(drag.parent);
  const insertIndex = children.indexOf(swapTarget);
  const targetRect = rectFromElement(swapTarget);
  const lineRect = buildLayoutSwapGuideLine(drag.flow, targetRect);
  const alignmentLines = buildLayoutAlignmentLines(drag.flow, rectFromElement(drag.element), targetRect, lineRect);

  return {
    insertIndex,
    swapTarget,
    targetRect,
    lineRect,
    alignmentLines,
    label: `交换第 ${insertIndex + 1} 位`
  };
}

function previewLayoutMove(drag: LayoutDragState, dropInfo: LayoutDropInfo): void {
  if (
    dropInfo.swapTarget === drag.previewTarget ||
    !drag.element.isConnected ||
    !drag.parent.isConnected ||
    !dropInfo.swapTarget.isConnected
  ) {
    return;
  }

  animateLayoutChange(drag, () => {
    swapSiblingElements(drag.element, dropInfo.swapTarget);
  });
  drag.previewTarget = dropInfo.swapTarget;
  drag.previewIndex = getLayoutChildren(drag.parent).indexOf(drag.element);
}

function restoreLayoutPreview(drag: LayoutDragState): void {
  if (!drag.element.isConnected || !drag.parent.isConnected) {
    return;
  }

  animateLayoutChange(drag, () => {
    drag.parent.insertBefore(
      drag.element,
      drag.originalNextSibling?.isConnected ? drag.originalNextSibling : null
    );
  });
  drag.previewIndex = drag.originalIndex;
  drag.previewTarget = null;
}

function findLayoutSwapTarget(drag: LayoutDragState, clientX: number, clientY: number): HTMLElement | null {
  const children = new Set(getLayoutChildren(drag.parent));

  for (const element of document.elementsFromPoint(clientX, clientY)) {
    if (!(element instanceof HTMLElement) || element === drag.element || element.id.startsWith("web-visual-ai-editor-")) {
      continue;
    }

    const sibling = findDirectLayoutChild(element, drag.parent);
    if (sibling && sibling !== drag.element && children.has(sibling)) {
      return sibling;
    }
  }

  return findNearestLayoutSibling(drag, clientX, clientY);
}

function findDirectLayoutChild(element: HTMLElement, parent: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current && current.parentElement !== parent) {
    if (current === parent || current.id.startsWith("web-visual-ai-editor-")) {
      return null;
    }
    current = current.parentElement;
  }

  return current?.parentElement === parent ? current : null;
}

function findNearestLayoutSibling(drag: LayoutDragState, clientX: number, clientY: number): HTMLElement | null {
  const siblings = getLayoutChildren(drag.parent).filter((child) => child !== drag.element);
  let nearest: { element: HTMLElement; distance: number; rect: DOMRect } | null = null;

  for (const sibling of siblings) {
    const rect = sibling.getBoundingClientRect();
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    const distance = Math.hypot(centerX - clientX, centerY - clientY);

    if (!nearest || distance < nearest.distance) {
      nearest = { element: sibling, distance, rect };
    }
  }

  if (!nearest) {
    return null;
  }

  const tolerance = Math.max(24, Math.min(96, Math.max(nearest.rect.width, nearest.rect.height) * 0.36));
  const withinExpandedRect =
    clientX >= nearest.rect.x - tolerance &&
    clientX <= nearest.rect.x + nearest.rect.width + tolerance &&
    clientY >= nearest.rect.y - tolerance &&
    clientY <= nearest.rect.y + nearest.rect.height + tolerance;

  return withinExpandedRect ? nearest.element : null;
}

function swapSiblingElements(element: HTMLElement, target: HTMLElement): void {
  const parent = element.parentElement;
  if (!parent || target.parentElement !== parent || element === target) {
    return;
  }

  const elementNext = element.nextSibling;
  const targetNext = target.nextSibling;

  if (elementNext === target) {
    parent.insertBefore(target, element);
    return;
  }

  if (targetNext === element) {
    parent.insertBefore(element, target);
    return;
  }

  parent.insertBefore(element, targetNext);
  parent.insertBefore(target, elementNext);
}

function animateLayoutChange(drag: LayoutDragState, mutate: () => void): void {
  const children = getLayoutChildren(drag.parent);
  const before = new Map<HTMLElement, DOMRect>();

  for (const child of children) {
    before.set(child, child.getBoundingClientRect());
  }

  mutate();

  for (const child of getLayoutChildren(drag.parent)) {
    const previousRect = before.get(child);
    if (!previousRect) {
      continue;
    }

    const nextRect = child.getBoundingClientRect();
    const deltaX = previousRect.x - nextRect.x;
    const deltaY = previousRect.y - nextRect.y;

    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      continue;
    }

    animateLayoutChild(drag, child, deltaX, deltaY);
  }
}

function animateLayoutChild(drag: LayoutDragState, child: HTMLElement, deltaX: number, deltaY: number): void {
  const original = rememberLayoutAnimationStyle(drag, child);
  const timer = drag.animationTimers.get(child);

  if (timer !== undefined) {
    window.clearTimeout(timer);
  }

  child.style.transition = "none";
  child.style.transform = `translate(${Math.round(deltaX)}px, ${Math.round(deltaY)}px) ${original.transform}`.trim();
  child.style.willChange = "transform";

  window.requestAnimationFrame(() => {
    child.style.transition = "transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    child.style.transform = original.transform;
  });

  drag.animationTimers.set(
    child,
    window.setTimeout(() => {
      restoreLayoutAnimationStyle(drag, child);
    }, 180)
  );
}

function rememberLayoutAnimationStyle(drag: LayoutDragState, element: HTMLElement): LayoutAnimationStyle {
  const existing = drag.animationStyles.get(element);
  if (existing) {
    return existing;
  }

  const style = {
    transform: element.style.transform,
    transition: element.style.transition,
    willChange: element.style.willChange
  };
  drag.animationStyles.set(element, style);
  return style;
}

function restoreLayoutAnimationStyle(drag: LayoutDragState, element: HTMLElement): void {
  const original = drag.animationStyles.get(element);
  if (!original) {
    return;
  }

  element.style.transform = original.transform;
  element.style.transition = original.transition;
  element.style.willChange = original.willChange;
  drag.animationStyles.delete(element);
  drag.animationTimers.delete(element);
}

function clearLayoutAnimationStyles(drag: LayoutDragState): void {
  for (const timer of drag.animationTimers.values()) {
    window.clearTimeout(timer);
  }

  for (const element of drag.animationStyles.keys()) {
    restoreLayoutAnimationStyle(drag, element);
  }
}

function buildLayoutSwapGuideLine(flow: LayoutFlow, targetRect: HighlightRect): HighlightRect {
  if (flow === "horizontal") {
    return {
      x: Math.round(targetRect.x + targetRect.width / 2 - 1),
      y: Math.round(targetRect.y),
      width: 2,
      height: Math.max(12, Math.round(targetRect.height))
    };
  }

  return {
    x: Math.round(targetRect.x),
    y: Math.round(targetRect.y + targetRect.height / 2 - 1),
    width: Math.max(12, Math.round(targetRect.width)),
    height: 2
  };
}

function buildLayoutAlignmentLines(
  flow: LayoutFlow,
  selectedRect: HighlightRect,
  targetRect: HighlightRect | null,
  lineRect: HighlightRect
): HighlightRect[] {
  const lines: HighlightRect[] = [];
  const target = targetRect ?? selectedRect;

  if (flow === "horizontal") {
    const insertionX = lineRect.x + lineRect.width / 2;
    lines.push(verticalGuide(insertionX));
    lines.push(horizontalGuide(target.y + target.height / 2));
    lines.push(horizontalGuide(selectedRect.y + selectedRect.height / 2));
  } else {
    const insertionY = lineRect.y + lineRect.height / 2;
    lines.push(horizontalGuide(insertionY));
    lines.push(verticalGuide(target.x + target.width / 2));
    lines.push(verticalGuide(selectedRect.x + selectedRect.width / 2));
  }

  return dedupeGuideLines(lines);
}

function verticalGuide(x: number): HighlightRect {
  return {
    x: Math.round(clampNumber(x, 0, window.innerWidth)),
    y: 0,
    width: 1,
    height: window.innerHeight
  };
}

function horizontalGuide(y: number): HighlightRect {
  return {
    x: 0,
    y: Math.round(clampNumber(y, 0, window.innerHeight)),
    width: window.innerWidth,
    height: 1
  };
}

function dedupeGuideLines(lines: HighlightRect[]): HighlightRect[] {
  const result: HighlightRect[] = [];

  for (const line of lines) {
    const duplicate = result.some((existing) => {
      const sameOrientation = existing.width === line.width && existing.height === line.height;
      return sameOrientation && Math.abs(existing.x - line.x) <= 1 && Math.abs(existing.y - line.y) <= 1;
    });

    if (!duplicate) {
      result.push(line);
    }
  }

  return result;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function readLayoutFlow(parent: HTMLElement): LayoutFlow {
  const style = window.getComputedStyle(parent);

  if (style.display === "flex" || style.display === "inline-flex") {
    return style.flexDirection.startsWith("column") ? "vertical" : "horizontal";
  }

  if (style.display === "grid" || style.display === "inline-grid") {
    return style.gridAutoFlow.includes("column") ? "vertical" : "horizontal";
  }

  return "vertical";
}

function getLayoutChildren(parent: HTMLElement): HTMLElement[] {
  return Array.from(parent.children).filter((child): child is HTMLElement => {
    return child instanceof HTMLElement && !child.id.startsWith("web-visual-ai-editor-");
  });
}

function showRecords(runtime: EditorRuntime): void {
  clearLayoutDrag(runtime);
  runtime.quickCommentTarget = null;
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
    measurement: buildOverlayMeasurement(runtime),
    layoutMode: runtime.interactionMode === "auto-layout",
    layoutGuide: runtime.layoutGuide,
    commentPins: buildCommentPins(runtime)
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
    layoutContext: runtime.currentLayoutContext,
    measurementMode: runtime.measurementMode,
    attachMeasurements: runtime.attachMeasurements,
    similarMatchLevel: runtime.similarMatchLevel,
    similarPrimaryFeature: runtime.similarPrimaryFeature,
    similarTotalMatched: runtime.similarTotalMatched,
    similarTruncated: runtime.similarTruncated,
    similarElements: runtime.similarSnapshots,
    applyToSimilar: runtime.applyToSimilar,
    quickCommentTarget: runtime.quickCommentTarget
  });
}

function buildLayoutComment(intent: LayoutIntent): string {
  const directionLabels = {
    none: "",
    horizontal: "改为横向排列",
    vertical: "改为纵向排列"
  } satisfies Record<LayoutIntent["direction"], string>;
  const alignmentLabels = {
    none: "",
    start: "起点对齐",
    center: "居中对齐",
    end: "终点对齐",
    "space-between": "两端等距"
  } satisfies Record<LayoutIntent["alignment"], string>;
  const parts = [
    directionLabels[intent.direction],
    alignmentLabels[intent.alignment],
    intent.gap ? `目标间距 ${intent.gap}` : "",
    intent.note
  ].filter(Boolean);

  return parts.length > 0 ? `布局意图：${parts.join("；")}` : "布局意图：请优化父容器布局。";
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

function buildCommentPins(runtime: EditorRuntime): CommentPinOverlay[] {
  const grouped = new Map<string, { count: number; element: Element }>();

  for (const record of runtime.session.records) {
    if (!record.element || !record.comment.trim()) {
      continue;
    }

    const existing = grouped.get(record.element.selector);
    if (existing) {
      existing.count += 1;
      continue;
    }

    const element = document.querySelector(record.element.selector);
    if (!element) {
      continue;
    }

    grouped.set(record.element.selector, {
      count: 1,
      element
    });
  }

  return Array.from(grouped.entries()).map(([selector, item]) => ({
    id: selector,
    count: item.count,
    rect: rectFromElement(item.element)
  }));
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

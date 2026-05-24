import { useState } from "react";
import { CommentEditor } from "./components/CommentEditor";
import { ElementInfoPanel } from "./components/ElementInfoPanel";
import { FloatingToolbar, type InteractionMode } from "./components/FloatingToolbar";
import { ImportExportBar } from "./components/ImportExportBar";
import { RecordList } from "./components/RecordList";
import { StyleEditorPanel } from "./components/StyleEditorPanel";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { MeasurementPanel, type MeasurementMode } from "./components/MeasurementPanel";
import { SimilarElementsPanel } from "./components/SimilarElementsPanel";
import { PageCommentPanel } from "./components/PageCommentPanel";
import { LayoutPanel } from "./components/LayoutPanel";
import { QuickCommentPopover, type QuickCommentTarget } from "./components/QuickCommentPopover";
import type {
  EditRecord,
  ElementSnapshot,
  StyleDraft,
  StylePropertySnapshot,
  RecordCategory,
  RecordStatus,
  RecordMetadata,
  Measurements,
  MatchLevel,
  RecordRangeFilter,
  LayoutContext,
} from "../shared/types";
import type { PanelHandlers } from "./panel-root";

export type PanelView = "inspector" | "records";

export type PanelState = {
  enabled: boolean;
  panelView: PanelView;
  interactionMode: InteractionMode;
  selectedElement: ElementSnapshot | null;
  selectedStyleSnapshot: StylePropertySnapshot[];
  selectedStyleSupported: boolean;
  styleDraft: StyleDraft;
  records: EditRecord[];
  statusMessage: string;
  unmatchedRecordIds: Set<string>;
  editingRecord: EditRecord | null;
  filterCategory: RecordCategory | "all";
  filterStatus: RecordStatus | "all";
  filterRange: RecordRangeFilter;
  measurement: Measurements | null;
  measurementMode: MeasurementMode;
  attachMeasurements: boolean;
  similarMatchLevel: MatchLevel | null;
  similarPrimaryFeature: string;
  similarTotalMatched: number;
  similarTruncated: boolean;
  similarElements: ElementSnapshot[];
  applyToSimilar: boolean;
  layoutContext: LayoutContext | null;
  quickCommentTarget: QuickCommentTarget | null;
};

type AppProps = {
  handlers: PanelHandlers;
  state: PanelState;
};

export function App({ handlers, state }: AppProps) {
  const [deleteTarget, setDeleteTarget] = useState<EditRecord | null>(null);
  const hasSelection = state.selectedElement !== null;
  const hasStyleChanges = Object.values(state.styleDraft).some(
    (value) => typeof value === "string" && value.length > 0
  );
  const isMeasuring = state.interactionMode === "measure";
  const isAutoLayout = state.interactionMode === "auto-layout";
  const isCommenting = state.interactionMode === "comment";

  function handleDeleteConfirm() {
    if (deleteTarget) {
      handlers.onDeleteRecord(deleteTarget);
      setDeleteTarget(null);
    }
  }

  const editMode = state.editingRecord
    ? {
        recordId: state.editingRecord.id,
        initialComment: state.editingRecord.comment,
        initialMetadata: {
          category: state.editingRecord.category,
          priority: state.editingRecord.priority,
          status: state.editingRecord.status,
          interactionState: state.editingRecord.interactionState,
          scope: state.editingRecord.scope,
        } as RecordMetadata,
      }
    : undefined;

  return (
    <>
      <FloatingToolbar
        interactionMode={state.interactionMode}
        onAutoLayout={handlers.onAutoLayoutMode}
        onBrowse={handlers.onBrowseMode}
        onCommentMode={handlers.onCommentMode}
        onClose={handlers.onClose}
        onMeasure={handlers.onEnterMeasurementMode}
        onSelectElement={handlers.onSelectMode}
        onShowRecords={handlers.onShowRecords}
        recordCount={state.records.length}
        recordsActive={state.panelView === "records"}
      />
      <main className="wvaie-panel" hidden={!state.enabled}>
        <header className="wvaie-header" title="拖动标题栏移动面板">
          <div>
            <h1 className="wvaie-header-title">Web Visual AI Editor</h1>
            <p className="wvaie-header-mode">
              {isMeasuring ? "测距模式" : isAutoLayout ? "Auto Layout" : isCommenting ? "Comment" : "Inspector"}
            </p>
          </div>
          <span className="wvaie-header-version">V0.8</span>
        </header>
        <nav className="wvaie-panel-tabs" aria-label="面板页面">
          <button
            aria-current={state.panelView === "inspector" ? "page" : undefined}
            className={state.panelView === "inspector" ? "wvaie-tab-active" : ""}
            onClick={handlers.onShowInspector}
            type="button"
          >
            属性
          </button>
          <button
            aria-current={state.panelView === "records" ? "page" : undefined}
            className={state.panelView === "records" ? "wvaie-tab-active" : ""}
            onClick={handlers.onShowRecords}
            type="button"
          >
            记录 <span className="wvaie-count">{state.records.length}</span>
          </button>
        </nav>
        {state.statusMessage && <p className="wvaie-status-message" role="status">{state.statusMessage}</p>}
        <div className="wvaie-scroll">
          {state.panelView === "records" ? (
            <>
              <RecordList
                filterCategory={state.filterCategory}
                filterStatus={state.filterStatus}
                onDelete={(record) => setDeleteTarget(record)}
                onEdit={handlers.onEditRecord}
                onFilterCategoryChange={handlers.onFilterCategoryChange}
                onFilterStatusChange={handlers.onFilterStatusChange}
                onFilterRangeChange={handlers.onFilterRangeChange}
                onHighlightSharedGroup={handlers.onHighlightSharedGroup}
                onLocate={handlers.onLocateRecord}
                onStatusChange={handlers.onStatusChange}
                records={state.records}
                unmatchedRecordIds={state.unmatchedRecordIds}
                filterRange={state.filterRange}
              />
              <ImportExportBar
                disabled={state.records.length === 0}
                onCopyPrompt={handlers.onCopyPrompt}
                onExportJson={handlers.onExportJson}
                onImportJson={handlers.onImportJson}
              />
            </>
          ) : (
            <>
              <PageCommentPanel
                editMode={state.editingRecord?.scope === "page" ? editMode : undefined}
                onCancelEdit={handlers.onCancelEdit}
                onSave={handlers.onSavePageComment}
              />
              <ElementInfoPanel element={state.selectedElement} />
              {hasSelection && state.editingRecord?.scope !== "page" && (
                <SimilarElementsPanel
                  matchLevel={state.similarMatchLevel}
                  applyToSimilar={state.applyToSimilar}
                  onHighlightAll={handlers.onHighlightAllSimilar}
                  onHoverSimilar={handlers.onHoverSimilar}
                  onToggleApplyToSimilar={handlers.onToggleApplyToSimilar}
                  primaryFeature={state.similarPrimaryFeature}
                  similar={state.similarElements}
                  totalMatched={state.similarTotalMatched}
                  truncated={state.similarTruncated}
                />
              )}
              <LayoutPanel
                context={state.layoutContext}
                hasSelection={hasSelection}
                onSave={handlers.onSaveLayoutIntent}
              />
              {isMeasuring ? (
                <MeasurementPanel
                  hasSelection={hasSelection}
                  measurement={state.measurement}
                  measurementMode={state.measurementMode}
                  onEnterMeasurementMode={handlers.onEnterMeasurementMode}
                  onExitMeasurementMode={handlers.onExitMeasurementMode}
                  onResetPairMeasurement={handlers.onResetPairMeasurement}
                />
              ) : (
                <StyleEditorPanel
                  draft={state.styleDraft}
                  hasSelection={hasSelection}
                  onChange={handlers.onStyleDraftChange}
                  onReset={handlers.onResetStylePreview}
                  snapshot={state.selectedStyleSnapshot}
                  supported={state.selectedStyleSupported}
                />
              )}
              {hasSelection && state.editingRecord?.scope !== "page" && (
                <CommentEditor
                  attachMeasurements={state.attachMeasurements}
                  disabled={!hasSelection && !state.editingRecord}
                  editMode={state.editingRecord?.scope === "element" ? editMode : undefined}
                  forceAttachMeasurements={state.measurement?.pair !== null && state.measurement !== null}
                  hasStyleChanges={hasStyleChanges}
                  measurementsAvailable={state.measurement !== null}
                  applyToSimilar={state.applyToSimilar}
                  similarAvailable={state.similarElements.length > 0}
                  similarCount={state.similarTotalMatched}
                  onCancelEdit={handlers.onCancelEdit}
                  onSave={handlers.onSaveComment}
                  onToggleAttachMeasurements={handlers.onToggleAttachMeasurements}
                  onToggleApplyToSimilar={handlers.onToggleApplyToSimilar}
                />
              )}
            </>
          )}
        </div>
        {deleteTarget && (
          <ConfirmDialog
            cancelText="取消"
            confirmText="删除"
            message={`确定要删除这条记录吗？${deleteTarget.element ? `元素：${deleteTarget.element.selector}` : "页面评论"}`}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDeleteConfirm}
            title="删除记录"
          />
        )}
      </main>
      {state.quickCommentTarget && (
        <QuickCommentPopover
          target={state.quickCommentTarget}
          onCancel={handlers.onCancelQuickComment}
          onSave={handlers.onSaveQuickComment}
        />
      )}
    </>
  );
}

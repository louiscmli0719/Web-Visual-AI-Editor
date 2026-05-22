import { CommentEditor } from "./components/CommentEditor";
import { ElementInfoPanel } from "./components/ElementInfoPanel";
import { ImportExportBar } from "./components/ImportExportBar";
import { RecordList } from "./components/RecordList";
import { StyleEditorPanel } from "./components/StyleEditorPanel";
import type {
  EditRecord,
  ElementSnapshot,
  StyleDraft,
  StylePropertySnapshot
} from "../shared/types";
import type { PanelHandlers } from "./panel-root";

export type PanelState = {
  enabled: boolean;
  selectedElement: ElementSnapshot | null;
  selectedStyleSnapshot: StylePropertySnapshot[];
  selectedStyleSupported: boolean;
  styleDraft: StyleDraft;
  records: EditRecord[];
  statusMessage: string;
  unmatchedRecordIds: Set<string>;
};

type AppProps = {
  handlers: PanelHandlers;
  state: PanelState;
};

export function App({ handlers, state }: AppProps) {
  const hasSelection = state.selectedElement !== null;
  const hasStyleChanges = Object.values(state.styleDraft).some(
    (value) => typeof value === "string" && value.length > 0
  );

  return (
    <main className="wvaie-panel" hidden={!state.enabled}>
      <header className="wvaie-header">
        <strong>Web Visual AI Editor</strong>
        <span>V0.2</span>
      </header>
      <div className="wvaie-scroll">
        <section className="wvaie-section">
          <p className="wvaie-status-message">{state.statusMessage}</p>
        </section>
        <ElementInfoPanel element={state.selectedElement} />
        <StyleEditorPanel
          draft={state.styleDraft}
          hasSelection={hasSelection}
          onChange={handlers.onStyleDraftChange}
          onReset={handlers.onResetStylePreview}
          snapshot={state.selectedStyleSnapshot}
          supported={state.selectedStyleSupported}
        />
        <CommentEditor disabled={!hasSelection} hasStyleChanges={hasStyleChanges} onSave={handlers.onSaveComment} />
        <RecordList
          onLocate={handlers.onLocateRecord}
          records={state.records}
          unmatchedRecordIds={state.unmatchedRecordIds}
        />
        <ImportExportBar
          disabled={state.records.length === 0}
          onCopyPrompt={handlers.onCopyPrompt}
          onExportJson={handlers.onExportJson}
          onImportJson={handlers.onImportJson}
        />
      </div>
    </main>
  );
}

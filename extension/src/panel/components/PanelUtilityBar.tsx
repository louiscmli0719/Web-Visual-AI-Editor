type PanelUtilityBarProps = {
  applyToSimilar: boolean;
  recordCount: number;
  recordsActive: boolean;
  similarAvailable: boolean;
  similarCount: number;
  onRefresh(): void;
  onShowRecords(): void;
  onShowInspector(): void;
  onToggleApplyToSimilar(next: boolean): void;
};

export function PanelUtilityBar({
  applyToSimilar,
  recordCount,
  recordsActive,
  similarAvailable,
  similarCount,
  onRefresh,
  onShowRecords,
  onShowInspector,
  onToggleApplyToSimilar,
}: PanelUtilityBarProps) {
  return (
    <div className="wvaie-panel-utility wvaie-panel-drag-handle" title="拖动此区域移动面板">
      <div className="wvaie-panel-utility-pill" role="group" aria-label="面板视图">
        <button
          aria-label="返回属性面板"
          aria-pressed={!recordsActive}
          className={`wvaie-panel-mode-button ${!recordsActive ? "wvaie-panel-mode-button-active" : ""}`}
          onClick={onShowInspector}
          type="button"
        >
          <StyleIcon />
        </button>
        <button
          aria-label={`查看修改记录，共 ${recordCount} 条`}
          aria-pressed={recordsActive}
          className={`wvaie-panel-mode-button wvaie-panel-record-toggle ${recordsActive ? "wvaie-panel-mode-button-active" : ""}`}
          onClick={onShowRecords}
          type="button"
        >
          <RecordIcon />
          <span className="wvaie-panel-record-label">记录</span>
          <span className="wvaie-panel-utility-badge">{recordCount}</span>
        </button>
      </div>
      <label className={`wvaie-panel-shared-pill ${!similarAvailable ? "wvaie-panel-shared-pill-disabled" : ""}`}>
        <span className="wvaie-panel-shared-label">共享元素</span>
        <input
          aria-label={`共享元素${similarAvailable ? `，共 ${similarCount} 个匹配元素` : "，当前不可用"}`}
          checked={applyToSimilar}
          disabled={!similarAvailable}
          onChange={(event) => onToggleApplyToSimilar(event.target.checked)}
          type="checkbox"
        />
      </label>
      <button className="wvaie-panel-refresh-circle" onClick={onRefresh} type="button" aria-label="重置当前样式预览">
        <RefreshIcon />
      </button>
    </div>
  );
}

function StyleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8.36282 3.99414L6.59507 2.22638C6.26965 1.90094 5.74199 1.90094 5.41657 2.22638L3.05954 4.5834C2.7341 4.90882 2.7341 5.43649 3.05954 5.7619L4.82732 7.5297" />
      <path d="M12.0536 15.5893L13.8214 17.357C14.1468 17.6825 14.6745 17.6825 14.9999 17.357L17.3569 15C17.6824 14.6745 17.6824 14.1469 17.3569 13.8215L15.5892 12.0537" />
      <path d="M17.3656 4.99132L15.0086 2.6343C14.6832 2.30886 14.1555 2.30886 13.8301 2.6343L2.63423 13.8302C2.30879 14.1556 2.30879 14.6832 2.63423 15.0087L4.99125 17.3657C5.31669 17.6911 5.84433 17.6911 6.16976 17.3657L17.3656 6.16983C17.6911 5.8444 17.6911 5.31676 17.3656 4.99132Z" />
      <path className="wvaie-panel-icon-fill" d="M9.99999 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 9.99996C10.8333 9.53972 10.4602 9.16663 9.99999 9.16663C9.53975 9.16663 9.16666 9.53972 9.16666 9.99996C9.16666 10.4602 9.53975 10.8333 9.99999 10.8333Z" />
      <path className="wvaie-panel-icon-fill" d="M8.33333 12.5C8.79357 12.5 9.16667 12.1269 9.16667 11.6667C9.16667 11.2065 8.79357 10.8334 8.33333 10.8334C7.8731 10.8334 7.5 11.2065 7.5 11.6667C7.5 12.1269 7.8731 12.5 8.33333 12.5Z" />
      <path className="wvaie-panel-icon-fill" d="M11.6667 9.16667C12.1269 9.16667 12.5 8.79357 12.5 8.33333C12.5 7.8731 12.1269 7.5 11.6667 7.5C11.2064 7.5 10.8333 7.8731 10.8333 8.33333C10.8333 8.79357 11.2064 9.16667 11.6667 9.16667Z" />
    </svg>
  );
}

function RecordIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M14.1666 4.16663V1.66663H3.33325V15.8333L5.83325 14.5833" />
      <path d="M5.83325 18.3333V4.16663H16.6666V18.3333L11.2499 15.7197L5.83325 18.3333Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M17.5 3.33337V10" />
      <path d="M2.5 10V16.6667" />
      <path d="M17.5 10C17.5 5.85787 14.1421 2.5 10 2.5C7.88104 2.5 5.96733 3.37873 4.60338 4.79167M2.5 10C2.5 14.1421 5.85787 17.5 10 17.5C12.0232 17.5 13.8592 16.6989 15.2083 15.3966" />
    </svg>
  );
}

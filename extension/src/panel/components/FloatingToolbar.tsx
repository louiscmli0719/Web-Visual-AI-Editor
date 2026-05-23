export type InteractionMode = "browse" | "select" | "measure";

export type FloatingToolbarProps = {
  interactionMode: InteractionMode;
  recordsActive: boolean;
  recordCount: number;
  exportDisabled: boolean;
  onBrowse(): void;
  onSelectElement(): void;
  onMeasure(): void;
  onShowRecords(): void;
  onExport(): void;
  onClose(): void;
};

export function FloatingToolbar({
  interactionMode,
  recordsActive,
  recordCount,
  exportDisabled,
  onBrowse,
  onSelectElement,
  onMeasure,
  onShowRecords,
  onExport,
  onClose,
}: FloatingToolbarProps) {
  return (
    <nav className="wvaie-floating-toolbar" aria-label="网页检查工具">
      <div className="wvaie-toolbar-group" role="group" aria-label="操作模式">
        <ToolbarButton active={interactionMode === "browse"} icon={<HandIcon />} label="浏览" onClick={onBrowse} />
        <ToolbarButton active={interactionMode === "select"} icon={<CursorIcon />} label="选择" onClick={onSelectElement} />
        <ToolbarButton active={interactionMode === "measure"} icon={<MeasureIcon />} label="测距" onClick={onMeasure} />
      </div>
      <span className="wvaie-toolbar-divider" />
      <div className="wvaie-toolbar-group" role="group" aria-label="结果操作">
        <ToolbarButton
          active={recordsActive}
          badge={recordCount > 0 ? recordCount : undefined}
          icon={<ListIcon />}
          label="记录"
          onClick={onShowRecords}
        />
        <ToolbarButton disabled={exportDisabled} icon={<ExportIcon />} label="导出" onClick={onExport} />
        <button className="wvaie-icon-button" type="button" aria-label="退出编辑器" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
    </nav>
  );
}

type ToolbarButtonProps = {
  active?: boolean;
  badge?: number;
  disabled?: boolean;
  icon: JSX.Element;
  label: string;
  onClick(): void;
};

function ToolbarButton({ active = false, badge, disabled = false, icon, label, onClick }: ToolbarButtonProps) {
  return (
    <button
      className={`wvaie-toolbar-button ${active ? "wvaie-toolbar-button-active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
      aria-pressed={active}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && <span className="wvaie-toolbar-badge">{badge}</span>}
    </button>
  );
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 2.8l11 7-5.1 1.1-2.8 5.2L4 2.8z" />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7.5 9V4.2a1.1 1.1 0 012.2 0v4M9.7 8V3.2a1.1 1.1 0 012.2 0v5M11.9 8V4.2a1.1 1.1 0 012.2 0v6.4M7.5 8.6L6 7.2a1.2 1.2 0 00-1.7 1.7l3.3 5.2c.7 1.1 1.9 1.7 3.2 1.7h1.1c2 0 3.7-1.7 3.7-3.7V8a1.1 1.1 0 00-2.2 0" />
    </svg>
  );
}

function MeasureIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 13.8L13.8 3 17 6.2 6.2 17 3 13.8zM11.6 5.2l3.2 3.2M6 11l1.5 1.5M8.4 8.6l1.5 1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7 5h10M7 10h10M7 15h10M3.5 5h.1M3.5 10h.1M3.5 15h.1" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3v9M6.5 8.5L10 12l3.5-3.5M3.5 14v2.5h13V14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.5 4.5l11 11M15.5 4.5l-11 11" />
    </svg>
  );
}

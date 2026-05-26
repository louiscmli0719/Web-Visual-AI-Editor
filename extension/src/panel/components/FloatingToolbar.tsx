export type InteractionMode = "browse" | "select" | "comment" | "measure" | "auto-layout";

export type FloatingToolbarProps = {
  interactionMode: InteractionMode;
  recordsActive: boolean;
  recordCount: number;
  onBrowse(): void;
  onSelectElement(): void;
  onCommentMode(): void;
  onMeasure(): void;
  onAutoLayout(): void;
  onShowRecords(): void;
  onClose(): void;
};

export function FloatingToolbar({
  interactionMode,
  recordsActive,
  recordCount,
  onBrowse,
  onSelectElement,
  onCommentMode,
  onMeasure,
  onAutoLayout,
  onShowRecords,
  onClose,
}: FloatingToolbarProps) {
  return (
    <div className="wvaie-floating-row">
      <nav className="wvaie-floating-toolbar" aria-label="网页检查工具">
        <div className="wvaie-toolbar-group" role="group" aria-label="操作模式">
          <ToolbarButton active={interactionMode === "browse"} icon={<HandIcon />} label="浏览" onClick={onBrowse} />
          <ToolbarButton active={interactionMode === "select"} icon={<CursorIcon />} label="选择" onClick={onSelectElement} />
          <ToolbarButton active={interactionMode === "measure"} icon={<MeasureIcon />} label="测量" onClick={onMeasure} />
          <ToolbarButton active={interactionMode === "comment"} icon={<CommentIcon />} label="评论" onClick={onCommentMode} />
          <ToolbarButton
            active={interactionMode === "auto-layout"}
            icon={<AutoLayoutIcon />}
            label="自动布局"
            onClick={onAutoLayout}
          />
        </div>
        <div className="wvaie-toolbar-group" role="group" aria-label="结果操作">
          <ToolbarButton
            active={recordsActive}
            badge={recordCount > 0 ? recordCount : undefined}
            icon={<ListIcon />}
            label="记录"
            onClick={onShowRecords}
            variant="record"
          />
          <span className="wvaie-toolbar-divider" />
          <button className="wvaie-icon-button wvaie-toolbar-close" type="button" aria-label="退出编辑器" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </nav>
    </div>
  );
}

type ToolbarButtonProps = {
  active?: boolean;
  badge?: number;
  disabled?: boolean;
  icon: JSX.Element;
  label: string;
  onClick(): void;
  variant?: "icon" | "record";
};

function ToolbarButton({ active = false, badge, disabled = false, icon, label, onClick, variant = "icon" }: ToolbarButtonProps) {
  const showLabel = variant === "record";

  return (
    <button
      className={`wvaie-toolbar-button wvaie-toolbar-button-${variant} ${active ? "wvaie-toolbar-button-active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
      aria-pressed={active}
      aria-label={label}
    >
      {icon}
      {showLabel && <span className="wvaie-toolbar-label">{label}</span>}
      {badge !== undefined && <span className="wvaie-toolbar-badge">{badge}</span>}
    </button>
  );
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.66675 1.66663H1.66675V4.66663H4.66675V1.66663Z" />
      <path d="M4.66675 14.6666H1.66675V17.6666H4.66675V14.6666Z" />
      <path d="M17.6667 1.66663H14.6667V4.66663H17.6667V1.66663Z" />
      <path d="M3 14V5" />
      <path d="M4.66675 2.66663H14.6667" />
      <path d="M8 6L19 12.5L13.0286 13.1842L9.88408 19L8 6Z" />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.99996 14.5891H3.74996H1.66663V3.33868C1.66663 2.87866 2.03972 2.50574 2.49996 2.50574H17.5C17.9602 2.50574 18.3333 2.87866 18.3333 3.33868V14.5891H15" />
      <path d="M10 13.3334L5.83337 17.5H14.1667L10 13.3334Z" />
    </svg>
  );
}

function MeasureIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2.91663 10H17.0833" />
      <path d="M10 2.91663V17.0833" />
      <path className="wvaie-toolbar-icon-fill" d="M3.75004 2.08337H2.08337V3.75004H3.75004V2.08337Z" />
      <path className="wvaie-toolbar-icon-fill" d="M7.50004 2.08337H5.83337V3.75004H7.50004V2.08337Z" />
      <path className="wvaie-toolbar-icon-fill" d="M14.1667 2.08337H12.5V3.75004H14.1667V2.08337Z" />
      <path className="wvaie-toolbar-icon-fill" d="M17.9167 2.08337H16.25V3.75004H17.9167V2.08337Z" />
      <path className="wvaie-toolbar-icon-fill" d="M17.9167 5.83337H16.25V7.50004H17.9167V5.83337Z" />
      <path className="wvaie-toolbar-icon-fill" d="M3.75004 5.83337H2.08337V7.50004H3.75004V5.83337Z" />
      <path className="wvaie-toolbar-icon-fill" d="M3.75004 16.25H2.08337V17.9167H3.75004V16.25Z" />
      <path className="wvaie-toolbar-icon-fill" d="M7.50004 16.25H5.83337V17.9167H7.50004V16.25Z" />
      <path className="wvaie-toolbar-icon-fill" d="M14.1667 16.25H12.5V17.9167H14.1667V16.25Z" />
      <path className="wvaie-toolbar-icon-fill" d="M17.9167 16.25H16.25V17.9167H17.9167V16.25Z" />
      <path className="wvaie-toolbar-icon-fill" d="M17.9167 12.5H16.25V14.1667H17.9167V12.5Z" />
      <path className="wvaie-toolbar-icon-fill" d="M3.75004 12.5H2.08337V14.1667H3.75004V12.5Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M18.3333 9.99996C18.3333 14.6023 14.6023 18.3333 9.99996 18.3333C7.511 18.3333 1.66663 18.3333 1.66663 18.3333C1.66663 18.3333 1.66663 12.1134 1.66663 9.99996C1.66663 5.39758 5.39758 1.66663 9.99996 1.66663C14.6023 1.66663 18.3333 5.39758 18.3333 9.99996Z" />
      <path d="M6 10H14" />
      <path d="M10 6L10 14" />
    </svg>
  );
}

function AutoLayoutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M12.5 4.16663L10 1.66663L7.5 4.16663M10 1.66663V5.83329" />
      <path d="M12.5 15.8333L10 18.3333L7.5 15.8333M10 18.3333V14.1666" />
      <path d="M15.8333 12.5L18.3333 10L15.8333 7.5M18.3333 10H14.1666" />
      <path d="M4.16663 12.5L1.66663 10L4.16663 7.5M1.66663 10H5.83329" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M14.1666 4.16663V1.66663H3.33325V15.8333L5.83325 14.5833" />
      <path d="M5.83325 18.3333V4.16663H16.6666V18.3333L11.2499 15.7197L5.83325 18.3333Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 4L16 16" />
      <path d="M4 16L16 4" />
    </svg>
  );
}

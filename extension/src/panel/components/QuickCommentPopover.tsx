import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ElementSnapshot, RecordCategory, RecordMetadata, RecordPriority } from "../../shared/types";
import {
  DEFAULT_RECORD_METADATA,
  RECORD_CATEGORY_OPTIONS,
  RECORD_PRIORITY_OPTIONS,
} from "../../shared/record-metadata";

export type QuickCommentTarget = {
  element: ElementSnapshot;
  rect: ElementSnapshot["rect"];
};

export type QuickCommentPopoverProps = {
  target: QuickCommentTarget;
  onCancel(): void;
  onSave(comment: string, metadata: RecordMetadata): void;
};

const POPOVER_WIDTH = 302;
const POPOVER_HEIGHT = 253;
const VIEWPORT_GAP = 12;

export function QuickCommentPopover({ target, onCancel, onSave }: QuickCommentPopoverProps) {
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState<RecordCategory>(DEFAULT_RECORD_METADATA.category);
  const [priority, setPriority] = useState<RecordPriority>(DEFAULT_RECORD_METADATA.priority);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commentId = useId();
  const position = useMemo(() => computePopoverPosition(target.rect), [target.rect]);
  const canSave = comment.trim().length > 0;

  useEffect(() => {
    textareaRef.current?.focus();
  }, [target.element.selector]);

  function handleSave(): void {
    if (!canSave) {
      return;
    }

    onSave(comment, {
      category,
      priority,
      status: DEFAULT_RECORD_METADATA.status,
      interactionState: null,
      scope: "element",
    });
  }

  return (
    <aside
      aria-label="快速添加元素评论"
      className="wvaie-quick-comment"
      style={{ left: `${position.left}px`, top: `${position.top}px` }}
    >
      <h2 className="wvaie-quick-comment-title">评论</h2>
      <p className="wvaie-quick-comment-current" title={target.element.selector}>
        当前元素：{target.element.selector}
      </p>
      <textarea
        className="wvaie-textarea wvaie-quick-comment-textarea"
        id={commentId}
        onChange={(event) => setComment(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            handleSave();
          }
        }}
        placeholder="输入评论内容"
        ref={textareaRef}
        rows={3}
        value={comment}
      />
      <div className="wvaie-quick-comment-meta">
        <select
          aria-label="评论类型"
          className="wvaie-select"
          onChange={(event) => setCategory(event.target.value as RecordCategory)}
          value={category}
        >
          {RECORD_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="优先级"
          className="wvaie-select"
          onChange={(event) => setPriority(event.target.value as RecordPriority)}
          value={priority}
        >
          {RECORD_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="wvaie-quick-comment-actions">
        <button className="wvaie-button wvaie-button-primary" disabled={!canSave} type="button" onClick={handleSave}>
          保存评论
        </button>
      </div>
    </aside>
  );
}

function computePopoverPosition(rect: QuickCommentTarget["rect"]): { left: number; top: number } {
  const viewportWidth = window.innerWidth || POPOVER_WIDTH + VIEWPORT_GAP * 2;
  const viewportHeight = window.innerHeight || POPOVER_HEIGHT + VIEWPORT_GAP * 2;
  const preferredLeft = rect.x + rect.width + 14;
  const fallbackLeft = rect.x - POPOVER_WIDTH - 14;
  const left = preferredLeft + POPOVER_WIDTH <= viewportWidth - VIEWPORT_GAP ? preferredLeft : fallbackLeft;
  const preferredTop = rect.y + Math.min(rect.height, 40) - 18;
  const maxTop = viewportHeight - POPOVER_HEIGHT - VIEWPORT_GAP;

  return {
    left: clamp(Math.round(left), VIEWPORT_GAP, viewportWidth - POPOVER_WIDTH - VIEWPORT_GAP),
    top: clamp(Math.round(preferredTop), VIEWPORT_GAP, maxTop),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

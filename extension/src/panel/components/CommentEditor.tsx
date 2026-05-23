import { useId, useState, useEffect } from "react";
import type { RecordCategory, RecordPriority, InteractionState, RecordMetadata } from "../../shared/types";
import {
  RECORD_CATEGORY_OPTIONS,
  RECORD_PRIORITY_OPTIONS,
  INTERACTION_STATE_OPTIONS,
  DEFAULT_RECORD_METADATA,
  shouldShowInteractionState,
} from "../../shared/record-metadata";
import { InspectorSection } from "./InspectorSection";

type CommentEditorProps = {
  disabled: boolean;
  hasStyleChanges: boolean;
  isPageScope?: boolean;
  editMode?: {
    recordId: string;
    initialComment: string;
    initialMetadata: RecordMetadata;
  };
  attachMeasurements?: boolean;
  measurementsAvailable?: boolean;
  forceAttachMeasurements?: boolean;
  onToggleAttachMeasurements?(next: boolean): void;
  applyToSimilar?: boolean;
  similarAvailable?: boolean;
  similarCount?: number;
  onToggleApplyToSimilar?(next: boolean): void;
  embedded?: boolean;
  onSave(comment: string, metadata: RecordMetadata): void;
  onCancelEdit?(): void;
};

export function CommentEditor({
  disabled,
  hasStyleChanges,
  isPageScope = false,
  editMode,
  attachMeasurements = false,
  measurementsAvailable = false,
  forceAttachMeasurements = false,
  onToggleAttachMeasurements,
  applyToSimilar = false,
  similarAvailable = false,
  similarCount = 0,
  onToggleApplyToSimilar,
  embedded = false,
  onSave,
  onCancelEdit,
}: CommentEditorProps) {
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState<RecordCategory>(DEFAULT_RECORD_METADATA.category);
  const [priority, setPriority] = useState<RecordPriority>(DEFAULT_RECORD_METADATA.priority);
  const [interactionState, setInteractionState] = useState<InteractionState | null>(null);
  const [showInteractionState, setShowInteractionState] = useState(false);
  const idPrefix = useId();
  const commentId = `${idPrefix}-comment`;
  const categoryId = `${idPrefix}-category`;
  const priorityId = `${idPrefix}-priority`;
  const interactionStateId = `${idPrefix}-interaction-state`;

  // Initialize from edit mode
  useEffect(() => {
    if (editMode) {
      setComment(editMode.initialComment);
      setCategory(editMode.initialMetadata.category);
      setPriority(editMode.initialMetadata.priority);
      setInteractionState(editMode.initialMetadata.interactionState);
      setShowInteractionState(
        editMode.initialMetadata.interactionState !== null ||
        shouldShowInteractionState(editMode.initialMetadata.category)
      );
    } else {
      setComment("");
      setCategory(DEFAULT_RECORD_METADATA.category);
      setPriority(DEFAULT_RECORD_METADATA.priority);
      setInteractionState(null);
      setShowInteractionState(false);
    }
  }, [editMode]);

  // Auto-show interaction state for interaction/state categories
  useEffect(() => {
    if (shouldShowInteractionState(category)) {
      setShowInteractionState(true);
    }
  }, [category]);

  function handleSave(): void {
    const nextComment = comment.trim();

    if (!nextComment && !hasStyleChanges) {
      return;
    }

    const metadata: RecordMetadata = {
      category,
      priority,
      status: editMode ? editMode.initialMetadata.status : DEFAULT_RECORD_METADATA.status,
      interactionState: showInteractionState ? interactionState : null,
      scope: isPageScope ? "page" : "element",
    };

    onSave(nextComment, metadata);

    if (!editMode) {
      setComment("");
      setCategory(DEFAULT_RECORD_METADATA.category);
      setPriority(DEFAULT_RECORD_METADATA.priority);
      setInteractionState(null);
      setShowInteractionState(false);
    }
  }

  function handleCancel(): void {
    if (onCancelEdit) {
      onCancelEdit();
    }
  }

  const canSave = !disabled && (Boolean(comment.trim()) || hasStyleChanges);

  const content = (
    <>
          {editMode && (
            <div className="wvaie-edit-mode-banner">
              编辑模式：正在修改记录
            </div>
          )}
          <label htmlFor={commentId} className="wvaie-comment-label">
            {isPageScope ? "页面评论" : "元素评论"}
          </label>
          <textarea
            className="wvaie-textarea"
            disabled={disabled}
            id={commentId}
            onChange={(event) => setComment(event.target.value)}
            placeholder={
              isPageScope
                ? "描述页面整体的问题或建议。"
                : "描述这个元素要怎么改，或仅保存样式变化。"
            }
            rows={4}
            value={comment}
          />

          <div className="wvaie-metadata-controls">
            <div className="wvaie-form-row">
              <div className="wvaie-form-field">
                <label htmlFor={categoryId}>类型</label>
                <select
                  id={categoryId}
                  className="wvaie-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RecordCategory)}
                  disabled={disabled}
                >
                  {RECORD_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wvaie-form-field">
                <label htmlFor={priorityId}>优先级</label>
                <select
                  id={priorityId}
                  className="wvaie-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RecordPriority)}
                  disabled={disabled}
                >
                  {RECORD_PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showInteractionState && !isPageScope && (
              <div className="wvaie-form-row">
                <div className="wvaie-form-field">
                  <label htmlFor={interactionStateId}>交互态</label>
                  <select
                    id={interactionStateId}
                    className="wvaie-select"
                    value={interactionState || ""}
                    onChange={(e) =>
                      setInteractionState(e.target.value ? (e.target.value as InteractionState) : null)
                    }
                    disabled={disabled}
                  >
                    <option value="">无</option>
                    {INTERACTION_STATE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {!showInteractionState && !isPageScope && (
              <button
                type="button"
                className="wvaie-button wvaie-button-text"
                onClick={() => setShowInteractionState(true)}
                disabled={disabled}
              >
                + 添加交互态
              </button>
            )}
          </div>

          {!isPageScope && (measurementsAvailable || similarAvailable) && (
            <div className="wvaie-option-checks">
              {measurementsAvailable && (
                <label className="wvaie-attach-measurement">
                  <input
                    type="checkbox"
                    checked={forceAttachMeasurements || attachMeasurements}
                    disabled={disabled || forceAttachMeasurements}
                    onChange={(e) => onToggleAttachMeasurements?.(e.target.checked)}
                  />
                  附加测距数据
                  {forceAttachMeasurements && (
                    <span className="wvaie-attach-measurement-hint">（双元素测距必须附测距）</span>
                  )}
                </label>
              )}
              {similarAvailable && (
                <label className="wvaie-attach-measurement">
                  <input
                    checked={applyToSimilar}
                    disabled={disabled}
                    onChange={(e) => onToggleApplyToSimilar?.(e.target.checked)}
                    type="checkbox"
                  />
                  应用到相似元素（共 {similarCount} 个）
                </label>
              )}
            </div>
          )}

          <div className="wvaie-actions">
            {editMode && (
              <button
                className="wvaie-button"
                onClick={handleCancel}
                type="button"
              >
                取消
              </button>
            )}
            <button
              className="wvaie-button wvaie-button-primary"
              disabled={!canSave}
              onClick={handleSave}
              type="button"
            >
              {editMode ? "保存修改" : isPageScope ? "保存页面评论" : "保存记录"}
            </button>
          </div>
    </>
  );

  if (embedded) {
    return <section className="wvaie-comment-editor wvaie-comment-editor-embedded">{content}</section>;
  }

  return <InspectorSection as="section" className="wvaie-comment-editor">{content}</InspectorSection>;
}

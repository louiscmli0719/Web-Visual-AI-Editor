import { useEffect, useId, useState } from "react";
import { CommentEditor } from "./CommentEditor";
import type { RecordMetadata } from "../../shared/types";
import { InspectorSection } from "./InspectorSection";

type PageCommentPanelProps = {
  editMode?: {
    recordId: string;
    initialComment: string;
    initialMetadata: RecordMetadata;
  };
  onSave(comment: string, metadata: RecordMetadata): void;
  onCancelEdit(): void;
};

export function PageCommentPanel({ editMode, onSave, onCancelEdit }: PageCommentPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();

  useEffect(() => {
    if (editMode) {
      setExpanded(true);
    }
  }, [editMode]);

  if (!expanded) {
    return (
      <InspectorSection as="section" className="wvaie-page-comment-collapsed">
        <button
          aria-controls={bodyId}
          aria-expanded={false}
          type="button"
          className="wvaie-button wvaie-button-text"
          onClick={() => setExpanded(true)}
        >
          + 添加页面评论
        </button>
      </InspectorSection>
    );
  }

  return (
    <InspectorSection as="section" className="wvaie-page-comment-expanded">
      <div className="wvaie-page-comment-header">
        <h2>页面评论</h2>
        <button
          aria-controls={bodyId}
          aria-expanded={true}
          type="button"
          className="wvaie-button wvaie-button-text"
          onClick={() => setExpanded(false)}
        >
          收起
        </button>
      </div>
      <div className="wvaie-page-comment-body" id={bodyId}>
        <p className="wvaie-help-text">
          页面级评论不依赖特定元素，用于描述整体布局、节奏、风格等问题。
        </p>
        <CommentEditor
          disabled={false}
          editMode={editMode}
          embedded
          hasStyleChanges={false}
          isPageScope
          onCancelEdit={onCancelEdit}
          onSave={onSave}
        />
      </div>
    </InspectorSection>
  );
}

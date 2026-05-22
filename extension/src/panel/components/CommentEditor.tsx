import { useState } from "react";

type CommentEditorProps = {
  disabled: boolean;
  hasStyleChanges: boolean;
  onSave(comment: string): void;
};

export function CommentEditor({ disabled, hasStyleChanges, onSave }: CommentEditorProps) {
  const [comment, setComment] = useState("");

  function handleSave(): void {
    const nextComment = comment.trim();

    if (!nextComment && !hasStyleChanges) {
      return;
    }

    onSave(nextComment);
    setComment("");
  }

  const canSave = !disabled && (Boolean(comment.trim()) || hasStyleChanges);

  return (
    <section className="wvaie-section">
      <label htmlFor="wvaie-comment">Comment</label>
      <textarea
        className="wvaie-textarea"
        disabled={disabled}
        id="wvaie-comment"
        onChange={(event) => setComment(event.target.value)}
        placeholder="描述这个元素要怎么改，或仅保存样式变化。"
        rows={4}
        value={comment}
      />
      <div className="wvaie-actions">
        <button
          className="wvaie-button wvaie-button-primary"
          disabled={!canSave}
          onClick={handleSave}
          type="button"
        >
          保存记录
        </button>
      </div>
    </section>
  );
}

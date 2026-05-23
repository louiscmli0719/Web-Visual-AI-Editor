import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm(): void;
  onCancel(): void;
};

export function ConfirmDialog({
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    const dialog = dialogRef.current;
    const root = dialog?.getRootNode();
    const previousFocus = root instanceof ShadowRoot ? root.activeElement : document.activeElement;

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)")
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = root instanceof ShadowRoot ? root.activeElement : document.activeElement;

      if (!first || !last) return;
      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    dialog?.addEventListener("keydown", handleKeyDown);

    return () => {
      dialog?.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <div className="wvaie-dialog-backdrop" onClick={onCancel}>
      <div
        aria-describedby="wvaie-dialog-message"
        aria-labelledby="wvaie-dialog-title"
        aria-modal="true"
        className="wvaie-dialog"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
      >
        <h3 className="wvaie-dialog-title" id="wvaie-dialog-title">{title}</h3>
        <p className="wvaie-dialog-message" id="wvaie-dialog-message">{message}</p>
        <div className="wvaie-dialog-actions">
          <button
            type="button"
            className="wvaie-button"
            onClick={onCancel}
            ref={cancelButtonRef}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="wvaie-button wvaie-button-danger"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

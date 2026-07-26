import { useEffect, useRef } from "react";
import Button from "./Button";

function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    cancelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {message && (
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" ref={cancelRef} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

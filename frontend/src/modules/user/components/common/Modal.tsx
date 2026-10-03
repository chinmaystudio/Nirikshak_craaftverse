import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps): JSX.Element | null {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className="bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline-variant shadow-pop overflow-hidden view-enter"
      >
        {title ? (
          <div className="flex items-center justify-between bg-primary-container text-on-primary px-5 py-3.5">
            <h3 className="text-headline-sm font-headline-sm font-bold">{title}</h3>
            <button onClick={onClose} className="text-surface-variant hover:text-surface-container-lowest" aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text?: string;
  okLabel?: string;
  danger?: boolean;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, text, okLabel = "Confirm", danger = false, icon = "help", onConfirm, onCancel }: ConfirmDialogProps): JSX.Element | null {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? "bg-error-container text-error" : "bg-primary-fixed text-primary"}`}>
            <Icon name={icon} className="text-[22px]" />
          </div>
          <div>
            <h3 className="text-headline-sm font-headline-sm font-bold text-primary">{title}</h3>
            {text ? <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">{text}</p> : null}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded text-label-md font-label-md">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded text-label-md font-label-md font-bold text-on-primary ${danger ? "bg-error hover:bg-on-error-container" : "bg-primary hover:bg-primary-container"}`}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

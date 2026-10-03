import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps): JSX.Element | null {
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
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 bg-primary/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-surface-container-lowest shadow-pop flex flex-col view-enter"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/40">
          <h3 className="text-headline-sm font-bold text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-primary" aria-label="Close panel">
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

import { useToasts, dismissToast, type ToastItem } from "@/hooks/useToast";
import { Icon } from "./Icon";
import { createPortal } from "react-dom";

const TOAST_STYLE: Record<ToastItem["type"], { cls: string; icon: string }> = {
  success: { cls: "bg-success-container text-success border-green-300", icon: "check_circle" },
  error: { cls: "bg-error-container text-on-error-container border-error/40", icon: "error" },
  info: { cls: "bg-info-container text-info border-info/30", icon: "info" }
};

export function ToastViewport(): JSX.Element {
  const toasts = useToasts();
  if (typeof document === "undefined") return <></>;
  return createPortal(
    <div id="toast-root" className="fixed top-16 right-4 z-[90] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      {toasts.map((t) => {
        const style = TOAST_STYLE[t.type];
        return (
          <button
            key={t.id}
            role="status"
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg border shadow-pop text-label-md font-label-md max-w-sm text-left ${style.cls}`}
          >
            <Icon name={style.icon} className="text-[20px] flex-shrink-0" />
            <span>{t.message}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

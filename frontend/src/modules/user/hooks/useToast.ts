import { useSyncExternalStore } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function toast(message: string, type: ToastType = "success"): void {
  const item: ToastItem = { id: nextId++, message, type };
  toasts = [...toasts, item];
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== item.id);
    emit();
  }, 3800);
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts
  );
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

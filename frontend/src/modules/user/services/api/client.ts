import type { ApiErrorShape } from "@/types/api";

export class ApiError extends Error implements ApiErrorShape {
  readonly status?: number;
  readonly code?: string;
  readonly offline: boolean;
  readonly notFound: boolean;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = "ApiError";
    this.status = shape.status;
    this.code = shape.code;
    this.offline = shape.offline ?? false;
    this.notFound = shape.notFound ?? false;
  }
}

export function isOnline(): boolean {
  return navigator.onLine !== false;
}

export function offlineGuard(): void {
  if (!isOnline()) {
    throw new ApiError({
      message: "You appear to be offline. Check your network connection and try again.",
      offline: true
    });
  }
}

export function latency(minMs = 300, maxMs = 600): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function notFound(message: string): ApiError {
  return new ApiError({ message, notFound: true });
}

export function failure(message: string): ApiError {
  return new ApiError({ message });
}

/**
 * Join conditional class names — tiny local clsx replacement.
 */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

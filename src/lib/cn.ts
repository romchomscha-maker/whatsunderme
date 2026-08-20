/** Winziger Klassennamen-Helfer – spart die clsx-Abhängigkeit. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

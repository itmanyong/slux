export function deriveActionName(partial: Record<string, unknown>): string {
  const keys = Object.keys(partial);
  if (keys.length === 0) return "setState";
  keys.sort();
  return `set:${keys.join(",")}`;
}

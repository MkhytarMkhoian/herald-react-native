// Helpers for Herald's own messages. Not exported from the package.

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** How a message names an object: its own `toString`, or else its class name. */
export function nameOf(value: object): string {
  if (value.toString !== Object.prototype.toString) return String(value);
  return value.constructor?.name ?? 'Object';
}

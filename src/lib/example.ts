/**
 * Example module for shared logic.
 * Keeps index.ts thin and encourages testable units.
 */

export function add(a: number, b: number): number {
  return a + b;
}

export function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

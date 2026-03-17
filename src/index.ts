/**
 * Application entry point.
 * Run with: bun run dev | bun run start
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

function main(): void {
  console.log(greet("Bun"));
}

main();

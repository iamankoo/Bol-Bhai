export function logDev(event: string, details?: unknown): void {
  if (import.meta.env.DEV) {
    if (details !== undefined) {
      console.log(`[Bol Bhai Voice Dev] ${event}`, details);
    } else {
      console.log(`[Bol Bhai Voice Dev] ${event}`);
    }
  }
}

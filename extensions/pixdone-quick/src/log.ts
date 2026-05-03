/**
 * Dev-only logging helpers. In production builds (`vite build` / `build`)
 * `import.meta.env.DEV` is `false`, so these compile down to no-ops and the
 * extension never spams the host page's console with internal lifecycle
 * traces — also stops user data (task titles, auth payload shape) from
 * leaking into a long-lived console buffer that crash reporters or the
 * user's screen recorder might capture.
 *
 * For genuine failures keep using `console.warn` / `console.error` directly
 * — those should always reach the console so a real install issue shows up.
 */
const isDev = import.meta.env.DEV === true;

type LogArg = unknown;

export function dlog(...args: LogArg[]): void {
  if (isDev) console.log(...args);
}

export function ddebug(...args: LogArg[]): void {
  if (isDev) console.debug(...args);
}

export function dinfo(...args: LogArg[]): void {
  if (isDev) console.info(...args);
}

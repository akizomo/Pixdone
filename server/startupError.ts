/** registerRoutes 起動失敗を API レスポンスで区別するためのエラー */
export type StartupErrorCode =
  | "ENV_CONFIG"
  | "DB_CONNECT"
  | "AUTH_SETUP"
  | "UNKNOWN";

export class StartupError extends Error {
  readonly code: StartupErrorCode;

  constructor(code: StartupErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StartupError";
    this.code = code;
  }
}

export function isStartupError(e: unknown): e is StartupError {
  return e instanceof StartupError;
}

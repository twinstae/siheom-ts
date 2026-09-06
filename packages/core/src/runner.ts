import { getA11ySnapshot } from "./getA11ySnapshot.js";
import { formatFailureReport, type MessageMap } from "./messages.js";

export function defaultFailureSnapshot(): string {
  if (typeof document === "undefined") {
    return "";
  }

  return getA11ySnapshot(document.body);
}

export function wrapStepError(
  logs: string[],
  error: Error,
  getFailureSnapshot: () => string,
  messages: MessageMap | undefined,
): never {
  throw new Error(formatFailureReport(logs, error, getFailureSnapshot(), messages));
}

export async function runLoggedStep(
  logs: string[],
  log: string,
  handleError: (error: Error) => never,
  run: () => Promise<void>,
): Promise<void> {
  logs.push(log);
  await run().catch(handleError);
}
import { getImeSession, setImeSession } from "./session.js";

export function readMaxLength(element: HTMLInputElement | HTMLTextAreaElement): number | null {
  const limit = element.maxLength;
  return limit < 0 ? null : limit;
}

export function takePendingMaxLengthReject(element: HTMLInputElement | HTMLTextAreaElement) {
  const session = getImeSession(element);
  if (!session?.pendingMaxLengthReject) return undefined;
  const pending = session.pendingMaxLengthReject;
  setImeSession(element, { ...session, pendingMaxLengthReject: undefined });
  return pending;
}

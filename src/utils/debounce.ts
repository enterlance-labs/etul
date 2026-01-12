import { DEBOUNCE_SECONDS } from "../config/env.js";

type DebKey = string;
const debounceMap = new Map<DebKey, number>();

function debounce(userId?: bigint, chatId?: bigint, action?: string) {
  const k = `${userId ?? 0}:${chatId ?? 0}:${action ?? ""}`;
  const now = Date.now() / 1000;
  const last = debounceMap.get(k) || 0;
  if (now - last < DEBOUNCE_SECONDS) return false;
  debounceMap.set(k, now);
  return true;
}

export { debounce };

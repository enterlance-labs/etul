const API_ID = Number(process.env.API_ID);
const API_HASH = process.env.API_HASH || "";
const STRING_SESSION = process.env.STRING_SESSION || "";
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const LOG_CHAT_ID = BigInt(process.env.LOG_CHAT_ID || "0");

const WHITELIST_SOURCE_CHAT_IDS: bigint[] = (process.env.WHITELIST_SOURCE_CHAT_IDS || "")
  .split(",").map((v) => v.trim()).filter(Boolean).map((v) => BigInt(v));

const DEBOUNCE_SECONDS = Number(process.env.DEBOUNCE_SECONDS || "15");
const TOPIC_RECONCILE_MINUTES = Number(process.env.TOPIC_RECONCILE_MINUTES || "30");

if (!API_ID || !API_HASH || !STRING_SESSION || !BOT_TOKEN || !LOG_CHAT_ID) {
  throw new Error("Не заполнены поля в env: API_ID, API_HASH, STRING_SESSION, BOT_TOKEN, LOG_CHAT_ID");
}

export {
  API_ID,
  API_HASH,
  STRING_SESSION,
  BOT_TOKEN,
  LOG_CHAT_ID,
  WHITELIST_SOURCE_CHAT_IDS,
  DEBOUNCE_SECONDS,
  TOPIC_RECONCILE_MINUTES,
};

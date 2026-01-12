import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { API_HASH, API_ID, STRING_SESSION, TOPIC_RECONCILE_MINUTES } from "./config/env.js";
import { reconcileTopics } from "./telegram/reconcile.js";
import { registerUpdateHandlers } from "./telegram/handlers.js";

async function run() {
  const client = new TelegramClient(new StringSession(STRING_SESSION), API_ID, API_HASH, { connectionRetries: 5 });
  await client.connect();
  console.log("✅ > ETUL запущен и подключён к Telegram");

  setInterval(() => {
    reconcileTopics(client).catch(() => {});
  }, TOPIC_RECONCILE_MINUTES * 60 * 1000);

  registerUpdateHandlers(client);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { BOT_TOKEN, LOG_CHAT_ID } from "../config/env.js";

const BOT_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function botCall(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${BOT_BASE}/${method}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method} ошибка: ${JSON.stringify(data)}`);
  return data.result;
}

async function createForumTopic(name: string): Promise<number> {
  try {
    const r = await botCall("createForumTopic", { chat_id: LOG_CHAT_ID.toString(), name: name.slice(0, 128) });
    return r.message_thread_id as number;
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("чат это не форум")) return 0;
    throw e;
  }
}

async function editForumTopic(threadId: number, name: string) {
  if (!threadId || threadId <= 0) return;
  await botCall("editForumTopic", {
    chat_id: LOG_CHAT_ID.toString(),
    message_thread_id: threadId,
    name: name.slice(0, 128),
  });
}

async function probeTopicExists(threadId: number, currentTitle: string): Promise<boolean> {
  if (!threadId || threadId <= 0) return true;
  try {
    await editForumTopic(threadId, currentTitle);
    return true;
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes("не найден тред для сообщений") || msg.includes("MESSAGE_THREAD_NOT_FOUND") || msg.includes("TOPIC_NOT_FOUND")) {
      return false;
    }
    return true;
  }
}

async function sendToTopic(threadId: number, text: string) {
  const payload: any = {
    chat_id: LOG_CHAT_ID.toString(),
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (threadId && threadId > 0) payload.message_thread_id = threadId;
  await botCall("sendMessage", payload);
}

export {
  botCall,
  createForumTopic,
  editForumTopic,
  probeTopicExists,
  sendToTopic,
};

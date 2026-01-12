import { prisma } from "../db/prismaClient.js";
import { createForumTopic, editForumTopic } from "./botApi.js";

const topicLocks = new Map<string, Promise<number>>();

async function withTopicLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = topicLocks.get(key) as any;
  const run = async () => {
    try { return await fn(); }
    finally { topicLocks.delete(key); }
  };
  const p = prev ? prev.then(run) : run();
  topicLocks.set(key, p as any);
  return p;
}

async function ensureDmTopic(userId: bigint, humanLabel: string, username?: string | null) {
  const key = `DM:${userId.toString()}`;
  return withTopicLock<number>(key, async () => {
    const desiredTitle = username ? `👤 ЛС · @${username}` : `👤 ЛС · ${humanLabel}`;
    let row = await prisma.topic.findUnique({ where: { type_sourceId: { type: "DM", sourceId: userId } } });
    if (!row) {
      for (let i = 0; i < 2; i++) {
        try {
          const threadId = await createForumTopic(desiredTitle);
          row = await prisma.topic.create({ data: { type: "DM", sourceId: userId, threadId, title: desiredTitle } });
          break;
        } catch (err) {
          if (i === 1) throw err;
          await new Promise((r) => setTimeout(r, 700));
        }
      }
      if (!row) throw new Error("Не удалось создать тему DM");
      return row.threadId;
    }
    if (row.title !== desiredTitle) {
      try { await editForumTopic(row.threadId, desiredTitle); } catch {}
      await prisma.topic.update({ where: { id: row.id }, data: { title: desiredTitle } });
    }
    return row.threadId;
  });
}

async function ensureGroupTopic(sourceKey: bigint, currentGroupTitle: string) {
  const key = `GR:${sourceKey.toString()}`;
  return withTopicLock<number>(key, async () => {
    const desiredTitle = `👥 Группа · ${currentGroupTitle}`;
    let row = await prisma.topic.findUnique({ where: { type_sourceId: { type: "GROUP", sourceId: sourceKey } } });
    if (!row) {
      for (let i = 0; i < 2; i++) {
        try {
          const threadId = await createForumTopic(desiredTitle);
          row = await prisma.topic.create({ data: { type: "GROUP", sourceId: sourceKey, threadId, title: desiredTitle } });
          break;
        } catch (err) {
          if (i === 1) throw err;
          await new Promise((r) => setTimeout(r, 700));
        }
      }
      if (!row) throw new Error("FНе удалось создать тему группы");
      return row.threadId;
    }
    if (row.title !== desiredTitle) {
      try { await editForumTopic(row.threadId, desiredTitle); } catch {}
      await prisma.topic.update({ where: { id: row.id }, data: { title: desiredTitle } });
    }
    return row.threadId;
  });
}

export { ensureDmTopic, ensureGroupTopic };

import { TelegramClient } from "telegram";
import { prisma } from "../db/prismaClient.js";
import { editForumTopic, probeTopicExists } from "./botApi.js";

async function reconcileTopics(client: TelegramClient) {
  const topics = await prisma.topic.findMany();
  for (const t of topics) {
    const alive = await probeTopicExists(t.threadId, t.title);
    if (!alive) {
      await prisma.topic.delete({ where: { id: t.id } });
      continue;
    }
    if (t.type === "GROUP") {
      try {
        const ent: any = await client.getEntity(t.sourceId as any);
        const actualTitle = ent?.title || ent?.firstName || String(t.sourceId);
        const desired = `👥 Группа · ${actualTitle}`;
        if (desired !== t.title) {
          try { await editForumTopic(t.threadId, desired); } catch {}
          await prisma.topic.update({ where: { id: t.id }, data: { title: desired } });
        }
      } catch {
      }
    }
  }
}

export { reconcileTopics };

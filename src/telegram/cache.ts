import { TelegramClient } from "telegram";
import { prisma } from "../db/prismaClient.js";
import { getPrimaryUsername, groupLinkFromEntity, unpackUserId } from "../utils/telegramUtils.js";

const userLabelMem = new Map<bigint, string>();

async function resolveHumanLabelAndUsername(client: TelegramClient, packedUserId: bigint): Promise<{ bareId: bigint, label: string, username: string | null } | null> {
  try {
    const ent: any = await client.getEntity(packedUserId as any);
    if (ent?.bot) return null;

    const bare = (ent?.id?.value !== undefined) ? BigInt(ent.id.value.toString())
              : (ent?.id !== undefined) ? BigInt(ent.id.toString())
              : unpackUserId(packedUserId);

    const username = getPrimaryUsername(ent);
    const first = ent?.firstName || "";
    const last = ent?.lastName || "";
    const label = (first || last) ? [first, last].filter(Boolean).join(" ")
                : (username ? `@${username}` : `Неизвестный (${bare.toString()})`);

    userLabelMem.set(bare, label);
    await prisma.userCache.upsert({ where: { userId: bare }, update: { label }, create: { userId: bare, label } });

    return { bareId: bare, label, username };
  } catch {
    const bare = unpackUserId(packedUserId);
    const label = `Неизвестный (${bare.toString()})`;
    return { bareId: bare, label, username: null };
  }
}

async function resolveGroupMetaFromUpdate(client: TelegramClient, rawPeerId: bigint): Promise<{ sourceKey: bigint, title: string, link: string }> {
  const sourceKey = rawPeerId;
  try {
    const ent: any = await client.getEntity(rawPeerId as any);
    const title = ent?.title || ent?.firstName || String(rawPeerId);
    const link = groupLinkFromEntity(ent);
    const chatIdForCache = (ent?.id?.value !== undefined) ? BigInt(ent.id.value.toString())
                         : (ent?.id !== undefined) ? BigInt(ent.id.toString())
                         : rawPeerId;
    await prisma.chatCache.upsert({
      where: { chatId: chatIdForCache },
      update: { title, username: getPrimaryUsername(ent) ?? null },
      create: { chatId: chatIdForCache, title, username: getPrimaryUsername(ent) ?? null },
    });
    return { sourceKey, title, link };
  } catch {
    return { sourceKey, title: String(rawPeerId), link: "" };
  }
}

export { userLabelMem, resolveHumanLabelAndUsername, resolveGroupMetaFromUpdate };

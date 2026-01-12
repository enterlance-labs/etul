import { TelegramClient } from "telegram";
import { Api } from "telegram/tl";
import { Raw } from "telegram/events";
import { prisma } from "../db/prismaClient.js";
import { WHITELIST_SOURCE_CHAT_IDS } from "../config/env.js";
import { debounce } from "../utils/debounce.js";
import { ensureDmTopic, ensureGroupTopic } from "./topics.js";
import { sendToTopic } from "./botApi.js";
import { resolveGroupMetaFromUpdate, resolveHumanLabelAndUsername, userLabelMem } from "./cache.js";
import { actionToText, dmLink, escapeHtml, getPrimaryUsername, unpackUserId } from "../utils/telegramUtils.js";

async function resolveGroupAuthorLabel(client: TelegramClient, fromPacked: bigint): Promise<string | null> {
  const fromBare = unpackUserId(fromPacked);
  let label = userLabelMem.get(fromBare);
  if (label) return label;

  try {
    const ent: any = await client.getEntity(fromPacked as any);
    if (ent?.bot) return null;
    const u = getPrimaryUsername(ent);
    const first = ent?.firstName || "";
    const last = ent?.lastName || "";
    label = (first || last) ? [first, last].filter(Boolean).join(" ")
      : (u ? `@${u}` : `Неизвестный (${fromBare.toString()})`);
    userLabelMem.set(fromBare, label);
    await prisma.userCache.upsert({ where: { userId: fromBare }, update: { label }, create: { userId: fromBare, label } });
    return label;
  } catch {
    return `Неизвестный (${fromBare.toString()})`;
  }
}

async function refreshDmTitleIfUnknown(
  client: TelegramClient,
  packedUserId: bigint,
  currentLabel: string,
) {
  if (!currentLabel.startsWith("Неизвестный (")) return;
  await new Promise((r) => setTimeout(r, 500));
  const ident = await resolveHumanLabelAndUsername(client, packedUserId);
  if (!ident) return;
  const { bareId, label, username } = ident;
  if (label === currentLabel) return;
  await ensureDmTopic(bareId, label, username);
}

async function refreshGroupTitleIfUnknown(
  client: TelegramClient,
  rawPeerId: bigint,
  currentTitle: string,
) {
  if (currentTitle !== String(rawPeerId)) return;
  await new Promise((r) => setTimeout(r, 500));
  const meta = await resolveGroupMetaFromUpdate(client, rawPeerId);
  if (!meta) return;
  if (meta.title === currentTitle) return;
  await ensureGroupTopic(meta.sourceKey, meta.title);
}

function registerUpdateHandlers(client: TelegramClient) {
  client.addEventHandler(async (ev: Api.TypeUpdate) => {
    if (ev instanceof Api.UpdateUserTyping) {
      const packed = BigInt((ev.userId as any).value);
      const ident = await resolveHumanLabelAndUsername(client, packed);
      if (!ident) return;
      const { bareId, label, username } = ident;

      const action = actionToText(ev.action);
      if (!debounce(bareId, undefined, action)) return;

      const link = dmLink(bareId, username);
      const threadId = await ensureDmTopic(bareId, label, username);
      const linkPart = link ? ` <a href="${link}">Открыть чат</a>` : "";
      const text = `✉️ <b>${escapeHtml(label)}</b> ${escapeHtml(action)} в ЛС.${linkPart}`;
      await sendToTopic(threadId, text);
      refreshDmTitleIfUnknown(client, packed, label).catch(() => {});
      return;
    }

    if (ev instanceof Api.UpdateChatUserTyping) {
      const rawPeerId = BigInt((ev.chatId as any).value);
      if (WHITELIST_SOURCE_CHAT_IDS.length && !WHITELIST_SOURCE_CHAT_IDS.includes(rawPeerId)) {
        return;
      }

      const fromPacked = (ev.fromId as any)?.userId?.value;
      if (!fromPacked) return;

      const label = await resolveGroupAuthorLabel(client, BigInt(fromPacked));
      if (!label) return;

      const action = actionToText(ev.action);
      if (!debounce(unpackUserId(BigInt(fromPacked)), rawPeerId, action)) return;

      const meta = await resolveGroupMetaFromUpdate(client, rawPeerId);
      const threadId = await ensureGroupTopic(meta.sourceKey, meta.title);
      const link = meta.link || "";

      const linkPart = link ? ` <a href="${link}">Открыть чат</a>` : "";
      const text = `👥 <b>${escapeHtml(label)}</b> ${escapeHtml(action)} в «${escapeHtml(meta.title)}».${linkPart}`;
      await sendToTopic(threadId, text);
      refreshGroupTitleIfUnknown(client, rawPeerId, meta.title).catch(() => {});
      return;
    }
  }, new Raw({}));
}

export { registerUpdateHandlers };

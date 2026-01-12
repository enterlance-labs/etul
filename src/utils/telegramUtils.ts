import { Api } from "telegram/tl";

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");
}

function unpackUserId(packed: bigint): bigint {
  return BigInt.asUintN(32, packed);
}

function actionToText(a: any): string {
  if (a instanceof Api.SendMessageTypingAction) return "печатает";
  if (a instanceof Api.SendMessageRecordAudioAction) return "записывает голосовое";
  if (a instanceof Api.SendMessageUploadPhotoAction) return "загружает фото";
  if (a instanceof Api.SendMessageUploadVideoAction) return "загружает видео";
  if (a instanceof Api.SendMessageUploadDocumentAction) return "загружает файл";
  if (a instanceof Api.SendMessageGeoLocationAction) return "делится локацией";
  if (a instanceof Api.SendMessageChooseContactAction) return "выбирает контакт";
  if (a instanceof Api.SendMessageGamePlayAction) return "играет в игру";
  if (a instanceof Api.SendMessageRecordRoundAction) return "записывает кружочек";
  if (a instanceof Api.SendMessageUploadRoundAction) return "загружает кружочек";
  if (a instanceof Api.SendMessageChooseStickerAction) return "выбирает стикер";
  if (a instanceof Api.SendMessageEmojiInteraction) return "реагирует эмодзи";
  const name = a?.className || a?.constructor?.name || "UnknownAction";
  return `активен (${name})`;
}

function getPrimaryUsername(ent: any): string | null {
  if (ent?.username && typeof ent.username === "string") return ent.username;
  const arr = ent?.usernames;
  if (Array.isArray(arr) && arr.length > 0 && typeof arr[0]?.username === "string") {
    return arr[0].username as string;
  }
  return null;
}

function dmLink(bareUserId?: bigint, username?: string | null) {
  if (username) return `https://t.me/${username}`;
  return bareUserId ? `tg://user?id=${bareUserId.toString()}` : "";
}

function chatIdForLinkFromEntity(ent: any): bigint | null {
  if (ent?.className === "Channel" || ent?.megagroup || ent?.broadcast) {
    const id = ent?.id?.value ?? ent?.id;
    if (id !== undefined) return BigInt(`-100${id.toString()}`);
  }
  if (ent?.className === "Chat") {
    const id = ent?.id?.value ?? ent?.id;
    if (id !== undefined) return BigInt(-Number(id));
  }
  return null;
}

function groupLinkFromEntity(ent: any, msgId?: number) {
  const username = getPrimaryUsername(ent);
  if (username) return msgId ? `https://t.me/${username}/${msgId}` : `https://t.me/${username}`;
  const deepId = chatIdForLinkFromEntity(ent);
  if (!deepId) return "";
  const s = String(deepId);
  if (s.startsWith("-100")) {
    const internal = s.slice(4);
    return msgId ? `https://t.me/c/${internal}/${msgId}` : `tg://user?id=${deepId}`;
  }
  return `tg://openmessage?chat_id=${deepId}`;
}

export {
  escapeHtml,
  unpackUserId,
  actionToText,
  getPrimaryUsername,
  dmLink,
  groupLinkFromEntity,
};

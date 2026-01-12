import 'dotenv/config';
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH!;
const stringSession = new StringSession("");

(async () => {
  console.log("Начинаем генерацию новой StringSession...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => {
      return prompt("Введите номер телефона в формате +7999...:")!;
    },
    password: async () => {
      return prompt("Введите 2FA пароль (если включён):")!;
    },
    phoneCode: async () => {
      return prompt("Введите код из Telegram:")!;
    },
    onError: (err) => console.log("Ошибка авторизации", err),
  });

  console.log("✅ Успешный вход!");
  console.log("Твоя StringSession:");
  console.log(client.session.save());
  process.exit(0);
})();

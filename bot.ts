import { Bot } from "https://deno.land/x/grammy@v1.34.0/mod.ts";

// Ваш токен, полученный от BotFather
const bot = new Bot("7717489452:AAELJ4zQkAGVA6NTTWVlOUzKaMnDcwb832w");

// Команда /start
bot.command("start", (ctx) => {
  ctx.reply("Привет! Я ваш Telegram-бот на Deno!");
});

// Ответ на любое сообщение
bot.on("message", (ctx) => {
  ctx.reply(`Вы написали: ${ctx.message.text}`);
});

console.log("Бот запущен! Откройте его в Telegram.");
// Запускаем бота
bot.start();
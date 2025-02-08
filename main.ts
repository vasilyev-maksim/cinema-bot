// import "jsr:@std/dotenv/load";
import {
  Bot,
  Context,
  InlineKeyboard,
} from "https://deno.land/x/grammy@v1.34.0/mod.ts";
// import { parkCinema } from "./ParkCinema.ts";
import { cinemaPlus } from "./CinemaPlus.ts";
import { Cinema } from "./Cinema.ts";
import { Storage } from "./Storage.ts";
import { Config } from "./models.ts";
import { MessageFormatter } from "./MessageFormatter.ts";

// Ваш токен, полученный от BotFather
const bot = new Bot("7717489452:AAELJ4zQkAGVA6NTTWVlOUzKaMnDcwb832w");
const storage = new Storage();
const formatter = new MessageFormatter();
const lang = "ru";
const cinemas = [
  // parkCinema,
  cinemaPlus,
];
const detailsPrefix = "details:";
const schedulePrefix = "schedule:";
const config: Config = {
  showMovieListAsButtons: true,
};

function getCinemaById(cinemaId: Cinema["id"]): Cinema {
  const found = cinemas.find((x) => x.id === cinemaId);
  if (!found) {
    throw new Error("Cinema with id = [" + cinemaId + "] not found.");
  }
  return found;
}

async function trySendPic(
  ctx: Context,
  picUrl: string,
  message: string,
  onError: (err: unknown) => void,
  keyboardButtons: [string, string][],
) {
  try {
    const keyboard = new InlineKeyboard();
    keyboardButtons.forEach(([text, data]) => {
      keyboard.text(text, data);
    });

    await ctx.replyWithPhoto(
      picUrl,
      { caption: message, parse_mode: "HTML", reply_markup: keyboard },
    );
  } catch (err) {
    onError(err);
    await ctx.reply(
      message,
      { parse_mode: "HTML" },
    );
  }
}

// Команда /start
bot.command("start", (ctx) => {
  cinemas.forEach((cinema) => {
    storage.getMoviesList(cinema.id, () => cinema.getMoviesList(lang)); // warm up cache
  });
  ctx.reply("Привет! Я ваш Telegram-бот на Deno!");
});

// Ответ на любое сообщение
bot.on("message", (ctx) => {
  cinemas.forEach(async (cinema) => {
    const movies = await storage.getMoviesList(
      cinema.id,
      () => cinema.getMoviesList(lang),
    );

    if (config.showMovieListAsButtons) {
      const keyboard = new InlineKeyboard();

      movies.forEach((movie) =>
        keyboard.text(
          formatter.getMovieTitleForList(movie),
          detailsPrefix + movie.cinema.id + "_" + movie.detailsUrlPart,
        ).row()
      );

      await ctx.reply(cinema.toString(), { reply_markup: keyboard });
    } else {
      movies.forEach((movie) => {
        const message = formatter.getMoviePreview(movie);

        trySendPic(
          ctx,
          movie.posterUrl,
          message,
          (err) => {
            console.error(
              "Failed to fetch poster for [" + movie.title + "] movie:\n",
              err,
            );
          },
          [[
            "More info",
            detailsPrefix + movie.cinema.id + "_" + movie.id,
          ]],
        );
      });
    }
  });
});

bot.on("callback_query:data", async (ctx) => {
  if (ctx.callbackQuery.data.startsWith(detailsPrefix)) {
    const [cinemaId, id] = ctx.callbackQuery.data
      .replace(detailsPrefix, "")
      .split("_");
    const cinema = getCinemaById(cinemaId);
    const movie = await storage.getMovieDetails(
      cinemaId,
      id,
      () => cinema.getMovieDetails(id),
    );
    const message = formatter.getMovieDetailsMessage(movie);

    trySendPic(
      ctx,
      movie.posterUrl,
      message,
      (err) => {
        console.error(
          "Failed to fetch poster for [" + movie.title + "] movie:\n",
          err,
        );
      },
      [["Schedule", schedulePrefix + movie.cinema.id + "_" + movie.id]],
    );
    await ctx.answerCallbackQuery(); // remove loading animation
  } else if (ctx.callbackQuery.data.startsWith(schedulePrefix)) {
    const [cinemaId, id] = ctx.callbackQuery.data
      .replace(schedulePrefix, "")
      .split("_");
    const cinema = getCinemaById(cinemaId);
    const movie = await storage.getMovieDetails(
      cinemaId,
      id,
      () => cinema.getMovieDetails(id),
    );
    const schedule = await cinema.getSchedule(lang, movie);
    const message = formatter.getScheduleMessage(movie, schedule);
    ctx.reply(message, { parse_mode: "HTML" });
  }
});

console.log("Bot initialized.");
// Запускаем бота
bot.start();

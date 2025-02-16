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
import { Config, Lang, LANGS } from "./models.ts";
import { MessageFormatter } from "./MessageFormatter.ts";
import { Settings } from "./Settings.ts";

// Ваш токен, полученный от BotFather
const bot = new Bot("7717489452:AAELJ4zQkAGVA6NTTWVlOUzKaMnDcwb832w");
const storage = new Storage();
const formatter = new MessageFormatter();
const cinemas = [
  // parkCinema,
  cinemaPlus,
];
const detailsPrefix = "details:";
const schedulePrefix = "schedule:";
const settingsLangPrefix = "settings:lang:";
const listAllCommand = "list:all";
const config: Config = {
  showMovieListAsButtons: true,
};
const lang = "ru";
const settings = new Settings();

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

// async function langMiddleware(
//   ctx: Context,
//   next: NextFunction, // is an alias for: () => Promise<void>
// ): Promise<void> {
//   const lang = await settings.getUserLang(ctx.from?.id?.toString()!);
//   console.log({ lang });
//   if (!lang) {
//     ctx.reply("you need to set lang");
//   } else {
//     await next(); // make sure to `await`!
//   }
// }

// bot.use(langMiddleware);

// Команда /start
bot.command("start", async (ctx) => {
  const lang = await settings.getUserLang(ctx.from?.id?.toString()!);
  // settings.saveUserLang(ctx.from?.id?.toString()!, null);

  if (!lang) {
    const keyboard = new InlineKeyboard();
    LANGS.forEach((l) =>
      keyboard.text(
        formatter.getFlag(l) + " " + l.toUpperCase(),
        settingsLangPrefix + l,
      )
    );

    ctx.reply("Hey! I'm CinemaAzBot. What language do you prefer?", {
      reply_markup: keyboard,
    });
  } else {
    cinemas.forEach((cinema) => {
      storage.getMoviesList(cinema.id, () => cinema.getMoviesList(lang)); // warm up cache
    });

    const keyboard = new InlineKeyboard();
    keyboard.text("All movies", listAllCommand);

    ctx.reply("Hey! I'm CinemaAzBot. What you like me to help you with?", {
      reply_markup: keyboard,
    });
  }
});

await bot.api.setMyCommands([
  { command: "start", description: "Запустить бота" },
  // { command: "list_all", description: "LIST ALL" },
  // { command: "settings", description: "Настройки" },
]);

// // Ответ на любое сообщение
// bot.command("list_all", (ctx) => {
//   ctx.reply("WOOW", {});
// });

bot.on("callback_query:data", async (ctx) => {
  const query = ctx.callbackQuery.data;
  
  if (query.startsWith(detailsPrefix)) {
    const [cinemaId, id] = query
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
  } else if (query.startsWith(schedulePrefix)) {
    const [cinemaId, id] = query
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
  } else if (query.startsWith(settingsLangPrefix)) {
    const lang = query.replace(settingsLangPrefix, "") as Lang;
    await settings.saveUserLang(ctx.from.id.toString(), lang);
    ctx.reply("Lang set:" + lang, { parse_mode: "HTML" });
  } else if (query === listAllCommand) {
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
  }
});

console.log("Bot initialized.");
// Запускаем бота
bot.start();

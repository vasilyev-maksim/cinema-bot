// import "jsr:@std/dotenv/load";
import {
  Bot,
  Context,
  InlineKeyboard,
} from "https://deno.land/x/grammy@v1.34.0/mod.ts";
// import { parkCinema } from "./ParkCinema.ts";
import { cinemaPlus } from "./CinemaPlus.ts";
import { Cinema } from "./Cinema.ts";
import { ScrapeStorage } from "./Storage.ts";
import { MovieListItem } from "./MovieListItem.ts";

// Ваш токен, полученный от BotFather
const bot = new Bot("7717489452:AAELJ4zQkAGVA6NTTWVlOUzKaMnDcwb832w");
const storage = new ScrapeStorage();
const lang = "ru";
const cinemas = [
  // parkCinema,
  cinemaPlus,
];
const detailsPrefix = "details:";

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
    ctx.reply(
      message,
      { parse_mode: "HTML" },
    );
  }
}

// Команда /start
bot.command("start", (ctx) => {
  cinemas.forEach((cinema) => {
    storage.getListScrape(cinema.id, () => cinema.getMoviesList(lang)); // warm up cache
  });
  ctx.reply("Привет! Я ваш Telegram-бот на Deno!");
});

// Ответ на любое сообщение
bot.on("message", (ctx) => {
  cinemas.forEach(async (cinema) => {
    const movies = await storage.getListScrape(
      cinema.id,
      () => cinema.getMoviesList(lang),
    );
    // const keyboard = new InlineKeyboard();

    // movies.forEach((movie) =>
    //   keyboard.text(
    //     movie.title,
    //     detailsPrefix + movie.cinema.id + "_" + movie.detailsUrlPart,
    //   ).row()
    // );

    // ctx.reply(cinema.toString(), { reply_markup: keyboard });

    movies.forEach((movie) => {
      const message = `<b>${movie.title}</b> 
${movie.cinema}
${movie.attributes.map((x) => `${x.type}_${x.value}`).join(" | ")}`;

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
          detailsPrefix + movie.cinema.id + "_" + movie.detailsUrlPart,
        ]],
      );
    });
  });
});

bot.on("callback_query:data", async (ctx) => {
  if (ctx.callbackQuery.data.startsWith(detailsPrefix)) {
    const [cinemaId, detailsUrlPart] = ctx.callbackQuery.data
      .replace(detailsPrefix, "")
      .split("_");
    const cinema = getCinemaById(cinemaId);
    const details = await storage.getDetailsScrape(
      cinemaId,
      detailsUrlPart,
      () => cinema.getMovieDetails(detailsUrlPart),
    );

    const message = `<b>${details.title}</b> (${cinema})
  
${details.genre}
${details.country}
${details.director}
${details.runPeriod}
${details.duration}
${details.ageRestriction}
  
<a href="${details.trailerUrl}" alt="trailer">🍿 Trailer</a>
  
${details.description}
`;
    trySendPic(
      ctx,
      details.posterUrl,
      message,
      (err) => {
        console.error(
          "Failed to fetch poster for [" + details.title + "] movie:\n",
          err,
        );
      },
      [["Рассписание", "schedule"]],
    );
    await ctx.answerCallbackQuery(); // remove loading animation
  }
});

console.log("Bot initialized.");
// Запускаем бота
bot.start();

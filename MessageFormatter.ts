import { differenceInDays } from "date-fns/differenceInDays";
import { Attribute, Schedule } from "./models.ts";
import { MovieDetails } from "./MovieDetails.ts";
import { MovieListItem } from "./MovieListItem.ts";
import { format, isSameDay } from "date-fns";
import { getToday, getTomorrow } from "./utils.ts";

// this class is responsible only for building some parts of messages,
// not sending messages etc.
export class MessageFormatter {
  public getMovieTitleForList(movie: MovieListItem): string {
    return `${movie.title} (${movie.ageRestriction}) ${
      this.formatLangAttrs(movie).join(" ")
    }`;
  }

  // title + poster + attrs, single movie in message
  public getMoviePreview(movie: MovieListItem): string {
    return `<b>${movie.title}</b>

${movie.cinema}
${movie.attributes.map((attr) => this.formatAttr(attr)).join(" | ")}
`;
  }

  public formatLangAttrs(movie: MovieListItem): string[] {
    return movie.attributes.filter((x) => x.type === "lang").map((x) =>
      this.formatAttr(x)
    );
  }

  public formatAttr(attr: Attribute): string {
    if (attr.type === "format") {
      return attr.value;
    }

    if (attr.type === "lang") {
      return this.getFlag(attr.value);
      // return `${attr.value.toUpperCase()} ${flag}`;
    }

    if (attr.type === "subtitles") {
      return "💬" + attr.value.toUpperCase();
    }

    return "";
  }

  public getFlag(value: "az" | "ru" | "tr" | "en") {
    const flagsMap = {
      az: "🇦🇿",
      ru: "🇷🇺",
      tr: "🇹🇷",
      en: "🇬🇧",
    };
    return flagsMap[value];
  }

  // all movies as buttons list
  public getMovieDetailsMessage(movie: MovieDetails): string {
    const today = new Date();
    const daysLeft = differenceInDays(movie.runPeriod.end, today);
    const formatAttrs = movie.attributes.filter((x) => x.type === "format").map(
      (x) => this.formatAttr(x),
    ).join(", ");
    const langAttrs = this.formatLangAttrs(movie).join(" ");
    const subtitlesAttr = movie.attributes.filter((x) => x.type === "subtitles")
      .map((x) => this.formatAttr(x)).join(", ");
    const attrs = "- " + langAttrs +
      (subtitlesAttr ? " | " : "") +
      subtitlesAttr + "\n- " + formatAttrs;

    const message = `<b>${movie.title}</b> (${movie.ageRestriction})
${movie.cinema}

${attrs}
- ${movie.genre}
- ${movie.country}
- ${movie.director}
- ${movie.duration}
- ${movie.ageRestriction}
- ${movie.runPeriod.start.toLocaleDateString()} - ${movie.runPeriod.end.toLocaleDateString()} (${daysLeft} days left)
  
<a href="${movie.trailerUrl}" alt="trailer">🍿 Trailer</a> | <a href="${movie.originalLink}" alt="movie original link">🔗 ${movie.cinema.name} link</a>
${
      movie.schedule.length > 0
        ? `\n📋 Upcoming sessions:

${
          movie.schedule.slice(0, 10).map((x) =>
            `- ${this.formatScheduleItem(x)}`
          ).join("\n")
        }\n${
          movie.schedule.length > 10
            ? "- ...for more use button below 👇\n"
            : ""
        }`
        : ""
    }
${movie.description}`;
    return message;
  }

  private formatScheduleItem(
    { date, theater, price, attributes }: Schedule[0],
  ): string {
    return `${format(date, "HH:mm")} - ${theater} - ${price} ₼ - ${
      attributes.map((x) => this.formatAttr(x)).join(" ")
    }`;
  }

  public getScheduleMessage(
    movie: MovieListItem,
    schedule: { date: Date; schedule: Schedule }[],
  ) {
    const today = getToday();
    const tomorrow = getTomorrow();

    return `<b>${movie.title}</b>\n\n` +
      schedule.map(({ date, schedule }) => {
        const isToday = isSameDay(date, today);
        const isTomorrow = isSameDay(date, tomorrow);
        const day = format(date, "dd MMM");
        const weekday = format(date, "EEE");
        const table = schedule.map((row) => this.formatScheduleItem(row))
          .join("\n");
        return `${day} (${
          isToday ? "Today, " : isTomorrow ? "Tomorrow, " : ""
        }${weekday})\n\n${table}`;
      }).join("\n\n");
  }
}

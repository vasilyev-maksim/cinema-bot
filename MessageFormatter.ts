import { differenceInDays } from "date-fns/differenceInDays";
import { Attribute, Schedule } from "./models.ts";
import { MovieDetails } from "./MovieDetails.ts";
import { MovieListItem } from "./MovieListItem.ts";
import { differenceInHours, format, formatDate, isSameDay } from "date-fns";
import { ITimeManager } from "./TimeManager.ts";

// this class is responsible for building some parts of messages,
// not sending messages etc.
export class MessageFormatter {
  public constructor(private readonly timeManager: ITimeManager) {}

  public getMovieTitleForList(movie: MovieListItem): string {
    return `${
      this.wrapStr(
        this.formatContentTypeAttrs(movie.attributes),
        (x) => x + " ",
      )
    }${movie.title} | ${movie.ageRestriction} ${
      this.formatAudioLangAttrs(movie.attributes)
    }`;
  }

  // title + poster + attrs, single movie in message
  public getMoviePreview(movie: MovieListItem): string {
    return `<b>${movie.title}</b>

${movie.cinema}
${this.formatAllLangAttrsTogether(movie.attributes)} | ${
      this.formatFormatAttrs(movie.attributes)
    }
`;
  }

  public getMovieDetailsMessage(movie: MovieDetails): string {
    const message = `${
      this.wrapStr(
        this.formatContentTypeAttrs(movie.attributes),
        (x) => x + " ",
      )
    }<b>${movie.title}</b> (${movie.ageRestriction})
${movie.cinema}

- ${this.formatAllLangAttrsTogether(movie.attributes)} | ${
      this.formatFormatAttrs(movie.attributes)
    }
- ${movie.genre}
- ${movie.country}
- ${movie.director}
- ${movie.duration}
- ${movie.ageRestriction}
- ${this.formatRunPeriod(movie)}
  
<a href="${movie.trailerUrl}" alt="trailer">🍿 Trailer</a> | <a href="${movie.originalLink}" alt="movie original link">🔗 ${movie.cinema.name} link</a>
${
      movie.schedule.length > 0
        ? `\n📋 Upcoming sessions:

${
          movie.schedule.slice(0, 10)
            .map((x) => `- ${this.formatScheduleItem(x)}`).join("\n")
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
      this.formatAllLangAttrsTogether(attributes)
    }`;
  }

  public getScheduleMessage(
    movie: MovieListItem,
    schedule: { date: Date; schedule: Schedule }[],
  ) {
    const today = this.timeManager.getToday();
    const tomorrow = this.timeManager.getTomorrow();

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

  public getFlag(value: "az" | "ru" | "tr" | "en") {
    const flagsMap = {
      az: "🇦🇿",
      ru: "🇷🇺",
      tr: "🇹🇷",
      en: "🇬🇧",
    };
    return flagsMap[value];
  }

  public formatRunPeriod(movie: Pick<MovieDetails, "runPeriod">): string {
    const today = this.timeManager.getToday();
    const hoursTillEnd = differenceInHours(movie.runPeriod.end, today);
    const hoursBeforeStart = differenceInHours(movie.runPeriod.start, today);
    const startStr = formatDate(movie.runPeriod.start, "d MMM yyyy");
    const endStr = formatDate(movie.runPeriod.end, "d MMM yyyy");
    const daysRange = `${startStr} - ${endStr}`;
    const verbalDescription = hoursBeforeStart > 0
      ? `Starts in ${Math.floor(hoursBeforeStart / 24)} days`
      : hoursTillEnd > 0
      ? `${Math.floor(hoursTillEnd / 24)} days left`
      : "";

    return this.wrapStr(
      verbalDescription,
      (x) => `${x} (${daysRange})`,
      daysRange,
    );
  }

  private formatAudioLangAttrs(attributes: Attribute[]): string {
    return attributes.filter((x) => x.type === "lang")
      .map(({ value }) => this.getFlag(value)).join("");
  }

  private formatFormatAttrs(attributes: Attribute[]): string {
    return attributes.filter((x) => x.type === "format")
      .map(({ value }) => value).join(", ");
  }

  private formatSubtitlesLangAttrs(attributes: Attribute[]): string {
    const filtered = attributes.filter((x) => x.type === "subtitles");
    return filtered.length > 0
      ? "💬" + filtered.map(({ value }) => this.getFlag(value)).join("")
      : "";
  }

  private formatAllLangAttrsTogether(attributes: Attribute[]): string {
    return this.formatAudioLangAttrs(attributes) +
      this.wrapStr(this.formatSubtitlesLangAttrs(attributes), (x) => ` (${x})`);
  }

  private formatContentTypeAttrs(attributes: Attribute[]): string {
    return attributes.some((x) =>
        x.type === "contentType" && x.value === "football"
      )
      ? "⚽️"
      : "";
  }

  private wrapStr(
    target: string | null | undefined,
    templateFn: (target: string) => string,
    fallback?: string,
  ): string {
    return target ? templateFn(target) : fallback ?? "";
  }
}

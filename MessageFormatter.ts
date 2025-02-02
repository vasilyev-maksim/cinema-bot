import { differenceInDays } from "date-fns/differenceInDays";
import { Attribute } from "./models.ts";
import { MovieDetails } from "./MovieDetails.ts";
import { MovieListItem } from "./MovieListItem.ts";

// this class is responsible only for building some parts of messages,
// not sending messages etc.
export class MessageFormatter {
  // title + poster + attrs, single movie in message
  public getMoviePreview(movie: MovieListItem): string {
    return `<b>${movie.title}</b>

${movie.cinema}
${movie.attributes.map((attr) => this.formatAttr(attr)).join(" | ")}
`;
  }

  public formatAttr(attr: Attribute): string {
    if (attr.type === "format") {
      return attr.value;
    }

    if (attr.type === "lang") {
      const flagsMap = {
        az: "🇦🇿",
        ru: "🇷🇺",
        tr: "🇹🇷",
        en: "🇬🇧",
      };
      const flag = flagsMap[attr.value];

      return flag;
      // return `${attr.value.toUpperCase()} ${flag}`;
    }

    if (attr.type === "subtitles") {
      return "💬" + attr.value.toUpperCase();
    }

    return "";
  }

  // all movies as buttons list
  public getMovieDetailsMessage(movie: MovieDetails): string {
    const today = new Date();
    const daysLeft = differenceInDays(movie.runPeriod.end, today);

    const message = `<b>${movie.title}</b>
${movie.cinema}
  
- ${movie.genre}
- ${movie.country}
- ${movie.director}
- ${movie.duration}
- ${movie.ageRestriction}
- ${movie.runPeriod.start.toLocaleDateString()} - ${movie.runPeriod.end.toLocaleDateString()} (${daysLeft} days left)
  
<a href="${movie.trailerUrl}" alt="trailer">🍿 Trailer</a> | <a href="${movie.originalLink}" alt="movie original link">🔗 ${movie.cinema.name} link</a>
  
${movie.description}`;
    return message;
  }
}

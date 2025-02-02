import { MoviesListScrape } from "./scrape.ts";

export function debugFormat(result: MoviesListScrape) {
  return result.cinema + ":\n\n" + result.movies.map((x) => x.title).join("\n");
}

export function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

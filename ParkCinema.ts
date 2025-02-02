import { Cinema } from "./Cinema.ts";
import { Lang } from "./models.ts";
import { MovieListItem } from "./MovieListItem.ts";
import * as cheerio from "cheerio";

export class ParkCinema extends Cinema {
  public constructor() {
    super("pc", "Park Cinema", "🔴");
  }

  public override async getMoviesList(lang: Lang): Promise<MovieListItem[]> {
    const url = this.getMoviesListUrl(lang);
    const resp = await fetch(url);
    const html = (await resp?.text()) ?? "";
    const $ = cheerio.load(html);
    const movies = $('div.movies[rel="today"] .normal .m-i-d-title')
      .map((_, el) => $(el).text()).get().map((x) =>
        new MovieListItem(x.trim(), x.trim())
      );
    return movies;
  }

  public override getMovieDetails(): Promise<MovieListItem> {
    throw new Error("Method not implemented.");
  }

  protected override getMoviesListUrl(lang: Lang): string {
    return `https://parkcinema.az/?lang=${lang}`;
  }
}

export const parkCinema = new ParkCinema();

import { attr } from "cheerio";
import { Cinema } from "./Cinema.ts";
import { Lang } from "./models.ts";
import { MovieDetails } from "./MovieDetails.ts";
import { Attribute, MovieListItem } from "./MovieListItem.ts";
import * as cheerio from "cheerio";

export class CinemaPlus extends Cinema {
  private static BASE_URL = "https://cinemastercard.az";

  public constructor() {
    super("cp", "CineMastercard", "🔵");
  }

  public override async getMoviesList(lang: Lang): Promise<MovieListItem[]> {
    const url = this.getMoviesListUrl(lang);
    const resp = await fetch(url);
    const html = (await resp?.text()) ?? "";
    const $ = cheerio.load(html);
    const movieBlocks = $("div[data-cinema][data-lang]");
    const movies = movieBlocks
      .map((_, root) => {
        const detailsUrlPart = $(".movie_image a", root).attr("href") ?? "";
        const posterUrlPart = $(".movie_image img", root).attr("src") ?? "";
        const posterUrl = this.getPosterUrl(posterUrlPart);
        const title = $("h2", root).text();
        const attrImgs = $(".poster_icons .cc_tooltip img", root).map((_, el) =>
          $(el).attr("src")
        ).get();
        const attributes = this.extractMovieAttributes(attrImgs);

        return new MovieListItem({
          id: detailsUrlPart,
          title,
          detailsUrlPart,
          posterUrl,
          cinema: this,
          attributes,
        });
      }).get();
    return movies;
  }

  public override async getMovieDetails(
    detailsUrlPart: string,
  ): Promise<MovieDetails> {
    const url = this.getMovieDetailsUrl(detailsUrlPart);
    const resp = await fetch(url);
    const html = (await resp?.text()) ?? "";
    const $ = cheerio.load(html);
    const title = $(".sessions_table td a").first().text();
    const posterUrlPart = $(".left_banner img").first().attr("src") ?? "";
    const trailerUrl = $(".trailer iframe").first().attr("src") ?? "";
    const posterUrl = this.getPosterUrl(posterUrlPart);
    const description = $(".desc_film p").first().text();
    const detailsItems = $(".movie_details li div.detail").get();
    const runPeriod = $(detailsItems[1]).text().trim();
    const country = $(detailsItems[2]).text().trim();
    const director = $(detailsItems[3]).text().trim();
    const duration = $(detailsItems[5]).text().trim();
    const genre = $(detailsItems[6]).text().trim();
    const ageRestriction = $(detailsItems[7]).text().trim();
    const details = new MovieDetails({
      id: detailsUrlPart, // as ID
      detailsUrlPart,
      title,
      posterUrl,
      description,
      country,
      runPeriod,
      duration,
      genre,
      director,
      ageRestriction,
      trailerUrl,
      cinema: this,
      attributes: [],
    });
    return details;
  }

  protected extractMovieAttributes(srcs: string[]): Attribute[] {
    const attrs = [];

    if (srcs.some((x) => x.includes("/az."))) {
      attrs.push({ type: "lang", value: "az" });
    }

    if (srcs.some((x) => x.includes("/tr."))) {
      attrs.push({ type: "lang", value: "tr" });
    }

    if (srcs.some((x) => x.includes("/en."))) {
      attrs.push({ type: "lang", value: "en" });
    }

    if (srcs.some((x) => x.includes("/ru."))) {
      attrs.push({ type: "lang", value: "ru" });
    }

    if (srcs.some((x) => x.includes("threed"))) {
      attrs.push({ type: "format", value: "3D" });
    }

    if (srcs.some((x) => x.includes("twod"))) {
      attrs.push({ type: "format", value: "2D" });
    }

    if (srcs.some((x) => x.includes("fourdx"))) {
      attrs.push({ type: "format", value: "4DX" });
    }

    if (srcs.some((x) => x.includes("screenx"))) {
      attrs.push({ type: "format", value: "ScreenX" });
    }

    if (srcs.some((x) => x.includes("azsub"))) {
      attrs.push({ type: "subtitles", value: "az" });
    }

    return attrs;
  }

  protected override getMovieDetailsUrl(detailsUrlPart: string): string {
    return `${CinemaPlus.BASE_URL}/${detailsUrlPart}`;
  }

  protected override getMoviesListUrl(lang: Lang): string {
    return `${CinemaPlus.BASE_URL}/${lang}`;
  }

  protected override getPosterUrl(posterUrlPart: string): string {
    return `${CinemaPlus.BASE_URL}${posterUrlPart}`;
  }
}

export const cinemaPlus = new CinemaPlus();

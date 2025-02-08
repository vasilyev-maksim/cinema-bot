import { Cinema } from "./Cinema.ts";
import { Attribute, Lang, RunPeriod, Schedule } from "./models.ts";
import { MovieDetails } from "./MovieDetails.ts";
import { MovieListItem } from "./MovieListItem.ts";
import * as cheerio from "cheerio";
import { format, parse } from "date-fns";
import { getToday } from "./utils.ts";

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
        const originalLink = this.getMovieDetailsUrl(detailsUrlPart);
        const posterUrlPart = $(".movie_image img", root).attr("src") ?? "";
        const posterUrl = this.getPosterUrl(posterUrlPart);
        const title = $("h2", root).text();
        const attrImgs = $(".poster_icons .cc_tooltip img", root).map((_, el) =>
          $(el).attr("src")
        ).get();
        const attributes = this.parseMovieAttributes(attrImgs);
        const ageRestriction = $(".movie_class", root).text();

        return new MovieListItem({
          id: detailsUrlPart,
          title,
          detailsUrlPart,
          posterUrl,
          cinema: this,
          attributes,
          originalLink,
          ageRestriction,
        });
      }).get();
    return movies;
  }

  public override async getMovieDetails(
    detailsUrlPart: string,
  ): Promise<MovieDetails> {
    const originalLink = this.getMovieDetailsUrl(detailsUrlPart);
    const resp = await fetch(originalLink);
    const html = (await resp?.text()) ?? "";
    const $ = cheerio.load(html);
    const title = $(".sessions_table td a").first().text();
    const posterUrlPart = $(".left_banner img").first().attr("src") ?? "";
    const trailerUrl = $(".trailer iframe").first().attr("src") ?? "";
    const posterUrl = this.getPosterUrl(posterUrlPart);
    const description = $(".desc_film p").first().text();
    const detailsItems = $(".movie_details li div.detail").get();
    const attrImgs = $(detailsItems[0]).find(".cc_tooltip img").map((_, el) =>
      $(el).attr("src")
    ).get();
    const attributes = this.parseMovieAttributes(attrImgs);
    const runPeriod = this.parseRunPeriod($(detailsItems[1]).text().trim());
    const country = $(detailsItems[2]).text().trim();
    const director = $(detailsItems[3]).text().trim();
    const duration = $(detailsItems[5]).text().trim();
    const genre = $(detailsItems[6]).text().trim();
    const ageRestriction = $(detailsItems[7]).text().trim();
    const externalId = $("input#moviepage").val() as string;
    const schedule = await this.getScheduleForDate(
      "ru",
      externalId,
      getToday(),
    );
    const availableScheduleDays = $(
      ".home_date_sessions option:not([disabled])",
    ).map((_, el) => parse($(el).attr("value")!, "dd.MM.yyyy", getToday()))
      .get();

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
      originalLink,
      schedule,
      externalId,
      attributes,
      availableScheduleDays,
    });
    return details;
  }

  public async getScheduleForDate(
    lang: Lang,
    externalId: string,
    date: Date,
  ): Promise<Schedule> {
    const fullLang = {
      en: "english",
      ru: "russian",
      az: "default",
    }[lang];
    const formattedDate = format(date, "dd.MM.yyyy");
    const originalLink =
      `https://cinemastercard.az/get_sessions_by_date.php?home=yes&lang=${fullLang}&datex=${formattedDate}&movie=${externalId}`;
    const resp = await fetch(originalLink);
    const html = (await resp?.text()) ?? "";
    const $ = cheerio.load(html, null, false);
    const schedule = $("tr").map((_, el) => {
      const tds = $(el).find("td");
      const dateStr = $(el).attr("data-date")?.trim();
      const timeStr = tds.eq(1).text().trim();
      const theater = tds.eq(2).find("a").text().trim();
      const hall = tds.eq(3).text().trim();
      const price = parseFloat(tds.eq(5).text().replace("AZN", "").trim());
      const attrImgs = tds.eq(4).find(".cc_tooltip img").map((_, el) =>
        $(el).attr("src")
      ).get();
      const attributes = this.parseMovieAttributes(attrImgs);
      const date = parse(
        dateStr + " " + timeStr,
        "dd.MM.yyyy HH:mm",
        getToday(),
      );

      return {
        date,
        theater,
        hall,
        price,
        attributes,
      };
    }).toArray();

    return schedule;
  }

  public async getSchedule(
    lang: Lang,
    movie: MovieDetails,
  ): Promise<{ date: Date; schedule: Schedule }[]> {
    return await Promise.all(movie.availableScheduleDays.map(async (day) => ({
      date: day,
      schedule: await this.getScheduleForDate(lang, movie.externalId, day),
    })));
  }

  private parseRunPeriod(runPeriodRaw: string): RunPeriod {
    const [start, end] = runPeriodRaw.split("-").map((x) =>
      parse(x.trim(), "dd.MM.yyyy", getToday())
    );
    return { start, end };
  }

  private parseMovieAttributes(srcs: string[]): Attribute[] {
    const attrs: Attribute[] = [];

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

  private getMovieDetailsUrl(detailsUrlPart: string): string {
    return `${CinemaPlus.BASE_URL}/${detailsUrlPart}`;
  }

  private getMoviesListUrl(lang: Lang): string {
    return `${CinemaPlus.BASE_URL}/${lang}`;
  }

  private getPosterUrl(posterUrlPart: string): string {
    return `${CinemaPlus.BASE_URL}${posterUrlPart}`;
  }
}

export const cinemaPlus = new CinemaPlus();

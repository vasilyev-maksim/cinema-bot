import { Cinema } from "./Cinema.ts";
import { Attribute, Lang, RunPeriod, Schedule } from "./models.ts";
import { MovieDetails } from "./MovieDetails.ts";
import { MovieListItem } from "./MovieListItem.ts";
import * as cheerio from "cheerio";
import { format, parse } from "date-fns";
import { type Element } from "domhandler";

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

        return new MovieListItem({
          id: detailsUrlPart,
          title,
          detailsUrlPart,
          posterUrl,
          cinema: this,
          attributes,
          originalLink,
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
    const runPeriod = this.parseRunPeriod($(detailsItems[1]).text().trim());
    const country = $(detailsItems[2]).text().trim();
    const director = $(detailsItems[3]).text().trim();
    const duration = $(detailsItems[5]).text().trim();
    const genre = $(detailsItems[6]).text().trim();
    const ageRestriction = $(detailsItems[7]).text().trim();
    const externalId = $("input#moviepage").val() as string;
    const schedule = await this.fetchSchedule("ru", externalId, new Date());

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
      originalLink,
      schedule,
      externalId,
    });
    return details;
  }

  private async fetchSchedule(
    lang: Lang,
    movieId: string,
    date: Date,
  ): Promise<Schedule> {
    const fullLang = {
      en: "english",
      ru: "russian",
      az: "default",
    }[lang];
    const formattedDate = format(date, "dd.MM.yyyy");
    const originalLink =
      `https://cinemastercard.az/get_sessions_by_date.php?home=yes&lang=${fullLang}&datex=${formattedDate}&movie=${movieId}`;
    const resp = await fetch(originalLink);
    const html = (await resp?.text()) ?? "";
    const $ = cheerio.load(html, null, false);
    const schedule = $("tr").map((_, el) => {
      const tds = $(el).find("td");
      const dateStr = $(el).attr("data-date");
      const timeStr = tds.eq(1).text();
      const theater = tds.eq(2).find("a").text();
      const hall = tds.eq(3).text();
      const price = parseFloat(tds.eq(5).text().replace("AZN", "").trim());
      const attrImgs = tds.eq(4).find(".cc_tooltip img").map((_, el) =>
        $(el).attr("src")
      ).get();
      const attributes = this.parseMovieAttributes(attrImgs);

      return {
        dateStr,
        timeStr,
        theater,
        hall,
        price,
        attributes,
      };
    }).toArray();

    console.log(schedule);

    return [];
  }

  // <input type="hidden" id="moviepage" value="3509931">

  // curl 'https://cinemastercard.az/get_sessions_by_date.php?home=yes&lang=russian&datex=13.02.2025&movie=3509931' \
  // -H 'accept: */*' \
  // -H 'accept-language: en-US,en;q=0.9,ru;q=0.8' \
  // -H 'cookie: _ym_uid=1724772379964074189; _ym_d=1724772379; _cc_id=f529f9f4807cc80920c9045504682b3a; wires=pbuf4h6tmvm127at4as8pju8ha; fpestid=xWDaic26PDKDPRm1gd2OtjViCSFnJAvI-_CWkurOvMBTn53MZvrHe4CWVxN2_7m2MqBQWg; _gid=GA1.2.1329778080.1738531416; _ym_isad=1; _ym_visorc=w; _ga=GA1.1.1972135094.1724772380; _ga_KJQWTW5FQV=GS1.1.1738699464.23.1.1738699571.0.0.0' \
  // -H 'priority: u=1, i' \
  // -H 'referer: https://cinemastercard.az/ru/films/kapitan-amerika-novyi-mir/' \
  // -H 'sec-ch-ua: "Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"' \
  // -H 'sec-ch-ua-mobile: ?0' \
  // -H 'sec-ch-ua-platform: "macOS"' \
  // -H 'sec-fetch-dest: empty' \
  // -H 'sec-fetch-mode: cors' \
  // -H 'sec-fetch-site: same-origin' \
  // -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36' \
  // -H 'x-requested-with: XMLHttpRequest'

  private parseRunPeriod(runPeriodRaw: string): RunPeriod {
    const [start, end] = runPeriodRaw.split("-").map((x) =>
      parse(x.trim(), "dd.MM.yyyy", new Date())
    );
    return { start, end };
  }

  private parseSchedule(
    container: cheerio.Cheerio<Element>,
    $: cheerio.CheerioAPI,
  ): Schedule {
    const textRows = container
      .find("tbody tr")
      .map((_, tr) => [ // this extra array wrapping [] is necessary because `map` method flattens 2d arrays
        $(tr).find("td").map((_, td) => $(td).text().trim()).toArray().filter(
          Boolean,
        ),
      ]).toArray();
    console.log(textRows);
    // const schedule= textRows.map((row) => {
    //   const
    // });
    return [];
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

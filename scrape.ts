import * as cheerio from 'cheerio';

type Lang = 'en' | 'ru' | 'az';

export async function scrapeCP(lang: Lang = 'az'): Promise<ScrapedCinema> {
  const URL = `https://cinemastercard.az/${lang}/`;
  const resp = await fetch(URL);
  const html = (await resp?.text()) ?? "";
  const $ = cheerio.load(html);
  const movies = $('div[data-cinema][data-lang] h2').map((_, el) => $(el).text()).get().map(x => ({ title: x }));
  return {
    cinema: 'Cinema Plus',
    movies,
  };
}

export async function scrapePC(lang: Lang = 'az'): Promise<ScrapedCinema> {
  const URL = `https://parkcinema.az/?lang=${lang}`;
  const resp = await fetch(URL);
  const html = (await resp?.text()) ?? "";
  const $ = cheerio.load(html);
  const movies = $('div.movies .m-i-d-title').map((_, el) => $(el).text()).get().map(x => ({ title: x }));
  return {
    cinema: 'Cinema Plus',
    movies,
  };
}

type ScrapedMovie = {
  title: string;
};

type ScrapedCinema = {
  cinema: string,
  movies: ScrapedMovie[],
};

type ScrapeResult = ScrapedCinema[];

export async function scrape(lang: Lang): Promise<ScrapeResult> {
  return [
    await scrapeCP(lang),
    await scrapePC(lang)
  ];
}

export function format(result: ScrapeResult) {
  return result.map(x => x.cinema + ': \n\n' + x.movies.map(z => z.title).join('\n')).join('\n\n-------------\n\n');
}
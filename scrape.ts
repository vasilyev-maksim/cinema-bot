import * as cheerio from 'cheerio';

export async function scrape() {
  const URL = 'https://cinemastercard.az/';
  let resp;
  try {
    resp = await fetch(URL);
  } catch (e) {
    console.log('error: ', e);
  }
  const html = (await resp?.text()) ?? "";
  const $ = cheerio.load(html);
  const result = $('footer a').first().text();
  return result;
}
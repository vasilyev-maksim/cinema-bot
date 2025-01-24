// import "." from 'fs:';
import * as cheerio from 'cheerio';


// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const URL = 'https://cinemastercard.az/';
  const resp = await fetch(URL);
  const html = await resp.text();
  const $ = cheerio.load(html);
  console.log($('footer a').first().text());
}

// import "." from 'fs:';
import * as cheerio from 'cheerio';

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await Deno.serve({ port: 3000 }, async () => {
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
    return new Response(result, {
      headers: { "Content-Type": "text/plain" },
    });
  });
}

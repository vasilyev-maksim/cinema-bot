import { format, scrape } from "./scrape.ts";

console.log(format(await scrape('ru')));
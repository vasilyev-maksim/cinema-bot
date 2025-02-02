import { Lang } from "./models.ts";
import { Cinema } from "./Cinema.ts";
import { debugFormat } from "./utils.ts";
// import { parkCinema } from "./ParkCinema.ts";
import { cinemaPlus } from "./CinemaPlus.ts";
import { MovieListItem } from "./MovieListItem.ts";

export type MoviesListScrape = {
  cinema: Cinema;
  movies: MovieListItem[];
};

export async function scrape(lang: Lang): Promise<MoviesListScrape[]> {
  return [
    // {
    //   cinema: parkCinema,
    //   movies: await parkCinema.getMoviesList(lang),
    // },
    {
      cinema: cinemaPlus,
      movies: await cinemaPlus.getMoviesList(lang),
    },
  ];
}

if (import.meta.main) {
  const res = await scrape("ru");
  res.forEach((x) => {
    console.log(debugFormat(x));
    console.log("\n-----------------\n");
  });
}

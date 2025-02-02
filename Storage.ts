import { Cache } from "./Cache.ts";
import { Cinema } from "./Cinema.ts";
import { cinemaPlus } from "./CinemaPlus.ts";
import { MovieDetails } from "./MovieDetails.ts";
import { MovieListItem } from "./MovieListItem.ts";
import { parkCinema } from "./ParkCinema.ts";

type CinemaId = Cinema["id"];
type MovieId = MovieListItem["id"];

export class ScrapeStorage {
  private static readonly expirationPeriodInMS = 60 * 60 * 1000; // 1 hour

  private listScrapes: Record<CinemaId, Cache<MovieListItem[]>> = {
    [parkCinema.id]: new Cache<MovieListItem[]>(
      ScrapeStorage.expirationPeriodInMS,
    ),
    [cinemaPlus.id]: new Cache<MovieListItem[]>(
      ScrapeStorage.expirationPeriodInMS,
    ),
  };

  private detailsScrapes: Record<
    CinemaId,
    Record<MovieId, Cache<MovieDetails>>
  > = {
    [parkCinema.id]: {},
    [cinemaPlus.id]: {},
  };

  // considers `listScrapesLastUpdate` before calling fetcher
  public getListScrape(
    cinemaId: CinemaId,
    fetcher: () => Promise<MovieListItem[]>,
  ): Promise<MovieListItem[]> {
    return this.listScrapes[cinemaId].getValue(fetcher);
  }

  public getDetailsScrape(
    cinemaId: CinemaId,
    movieId: MovieId,
    fetcher: () => Promise<MovieDetails>,
  ): Promise<MovieDetails> {
    if (!this.detailsScrapes[cinemaId][movieId]) {
      this.detailsScrapes[cinemaId][movieId] = new Cache(
        ScrapeStorage.expirationPeriodInMS,
      );
    }
    return this.detailsScrapes[cinemaId][movieId].getValue(fetcher);
  }
}

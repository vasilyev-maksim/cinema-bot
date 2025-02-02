import { Cache } from "./Cache.ts";
import { Cinema } from "./Cinema.ts";
import { cinemaPlus } from "./CinemaPlus.ts";
import { MovieDetails } from "./MovieDetails.ts";
import { MovieListItem } from "./MovieListItem.ts";
import { parkCinema } from "./ParkCinema.ts";

type CinemaId = Cinema["id"];
type MovieId = MovieListItem["id"];

export class Storage {
  private static readonly expirationPeriodInMS = 60 * 60 * 1000; // 1 hour

  private movieListItems: Record<CinemaId, Cache<MovieListItem[]>> = {
    [parkCinema.id]: new Cache<MovieListItem[]>(
      Storage.expirationPeriodInMS,
    ),
    [cinemaPlus.id]: new Cache<MovieListItem[]>(
      Storage.expirationPeriodInMS,
    ),
  };

  private movieDetails: Record<
    CinemaId,
    Record<MovieId, Cache<MovieDetails>>
  > = {
    [parkCinema.id]: {},
    [cinemaPlus.id]: {},
  };

  // considers `listScrapesLastUpdate` before calling fetcher
  public getMoviesList(
    cinemaId: CinemaId,
    fetcher: () => Promise<MovieListItem[]>,
  ): Promise<MovieListItem[]> {
    return this.movieListItems[cinemaId].getValue(fetcher);
  }

  public getMovieDetails(
    cinemaId: CinemaId,
    movieId: MovieId,
    fetcher: () => Promise<MovieDetails>,
  ): Promise<MovieDetails> {
    if (!this.movieDetails[cinemaId][movieId]) {
      this.movieDetails[cinemaId][movieId] = new Cache(
        Storage.expirationPeriodInMS,
      );
    }
    return this.movieDetails[cinemaId][movieId].getValue(fetcher);
  }
}

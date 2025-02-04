import { Lang } from "./models.ts";
import { MovieListItem } from "./MovieListItem.ts";
import { MovieDetails } from "./MovieDetails.ts";

export abstract class Cinema {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly colorEmoji: string,
  ) {}

  public toString() {
    return this.colorEmoji + " " + this.name;
  }

  public abstract getMoviesList(lang: Lang): Promise<MovieListItem[]>;
  public abstract getMovieDetails(
    detailsUrlPart: string,
  ): Promise<MovieDetails>;
}

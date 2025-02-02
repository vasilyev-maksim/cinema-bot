import { Cinema } from "./Cinema.ts";
import { Attribute, MovieListItem } from "./MovieListItem.ts";

export class MovieDetails extends MovieListItem {
  public readonly description: string;
  public readonly country: string;
  public readonly runPeriod: string;
  public readonly duration: string;
  public readonly genre: string;
  public readonly director: string;
  public readonly ageRestriction: string;
  public readonly trailerUrl: string;

  public constructor(args: {
    id: string;
    detailsUrlPart: string;
    title: string;
    posterUrl: string;
    description: string;
    country: string;
    runPeriod: string;
    duration: string;
    genre: string;
    director: string;
    ageRestriction: string;
    trailerUrl: string;
    cinema: Cinema;
    attributes: Attribute[];
  }) {
    super(args);
    this.description = args.description;
    this.country = args.country;
    this.runPeriod = args.runPeriod;
    this.duration = args.duration;
    this.genre = args.genre;
    this.director = args.director;
    this.ageRestriction = args.ageRestriction;
    this.trailerUrl = args.trailerUrl;
  }
}

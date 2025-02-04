import { Cinema } from "./Cinema.ts";
import { Attribute, RunPeriod, Schedule } from "./models.ts";
import { MovieListItem } from "./MovieListItem.ts";

export class MovieDetails extends MovieListItem {
  public readonly description: string;
  public readonly country: string;
  public readonly runPeriod: RunPeriod;
  public readonly duration: string;
  public readonly genre: string;
  public readonly director: string;
  public readonly ageRestriction: string;
  public readonly trailerUrl: string;
  public readonly schedule: Schedule;
  public readonly externalId: string;

  public constructor(args: {
    id: string;
    detailsUrlPart: string;
    title: string;
    posterUrl: string;
    description: string;
    country: string;
    runPeriod: RunPeriod;
    duration: string;
    genre: string;
    director: string;
    ageRestriction: string;
    trailerUrl: string;
    cinema: Cinema;
    attributes: Attribute[];
    originalLink: string;
    schedule: Schedule;
    externalId: string;
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
    this.schedule = args.schedule;
    this.externalId = args.externalId;
  }
}

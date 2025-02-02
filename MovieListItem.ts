import { Cinema } from "./Cinema.ts";
import { Attribute } from "./models.ts";

export class MovieListItem {
  public readonly id: string;
  public readonly detailsUrlPart: string;
  public readonly title: string;
  public readonly posterUrl: string;
  public readonly cinema: Cinema;
  public readonly attributes: Attribute[];
  public readonly originalLink: string;

  public constructor(args: {
    id: string;
    detailsUrlPart: string;
    title: string;
    posterUrl: string;
    cinema: Cinema;
    attributes: Attribute[];
    originalLink: string;
  }) {
    this.id = args.id;
    this.detailsUrlPart = args.detailsUrlPart;
    this.title = args.title;
    this.posterUrl = args.posterUrl;
    this.cinema = args.cinema;
    this.attributes = args.attributes;
    this.originalLink = args.originalLink;
  }
}

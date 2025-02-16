export type Lang = "en" | "ru" | "az" | "tr";
export const LANGS: Lang[] = ["en", "ru", "az"];

export type Config = {
  showMovieListAsButtons: boolean;
};

export type LangAttribute = {
  type: "lang";
  value: "az" | "ru" | "tr" | "en";
};

export type FormatAttribute = {
  type: "format";
  value: "3D" | "2D" | "4DX" | "ScreenX";
};

export type SubtitlesAttribute = {
  type: "subtitles";
  value: "az";
};

export type ContentTypeAttribute = {
  type: "contentType";
  value: "football";
};

export type Attribute =
  | LangAttribute
  | FormatAttribute
  | SubtitlesAttribute
  | ContentTypeAttribute;

export type RunPeriod = {
  start: Date;
  end: Date;
};

export type Schedule = {
  date: Date;
  theater: string;
  hall: string;
  attributes: Attribute[];
  price: number;
}[];

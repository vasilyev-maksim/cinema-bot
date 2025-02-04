export type Lang = "en" | "ru" | "az";

export type Config = {
  showMovieListAsButtons: boolean;
};

export type Attribute = {
  type: "lang";
  value: "az" | "ru" | "tr" | "en";
} | {
  type: "format";
  value:
    | "3D"
    | "2D"
    | "4DX"
    | "ScreenX";
} | {
  type: "subtitles";
  value: "az";
};

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

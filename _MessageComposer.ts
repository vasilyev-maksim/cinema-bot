// import { MovieListItem } from "./MovieListItem.ts";

// export type Message = {
//   imageUrl: string;
//   message: string;
//   keyboardButtons: [string, string][];
// };

// export class MessageComposer {
//   const detailsPrefix = "details:";

//   // title + poster + attrs, single movie in message
//   public getMoviePreviewMessage(movie: MovieListItem): Message {
//     const message = `<b>${movie.title}</b>
//     ${movie.cinema}
//     ${movie.attributes.map((x) => `${x.type}_${x.value}`).join(" | ")}`;
//     trySendPic(
//       ctx,
//       movie.posterUrl,
//       message,
//       [[
//         "More info",
//         detailsPrefix + movie.cinema.id + "_" + movie.detailsUrlPart,
//       ]],
//     );
//     return { message, imageUrl: movie.posterUrl, keyboardButtons: [[
//       "More info",
//       detailsPrefix + movie.cinema.id + "_" + movie.detailsUrlPart,
//     ]] };
//   }

//   // all movies as buttons list
//   public getMoviesListMessage(): Message {
//   }
// }

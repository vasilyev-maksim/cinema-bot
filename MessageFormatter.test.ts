import { assertEquals } from "jsr:@std/assert";
import { describe, test } from "jsr:@std/testing/bdd";
import { MessageFormatter } from "./MessageFormatter.ts";
import { addDays } from "date-fns/addDays";
import { ITimeManager } from "./TimeManager.ts";
import { addHours } from "date-fns/addHours";

describe("MessageFormatter", () => {
  describe.skip("formatRunPeriod", () => {
    const testCases = [
      {
        description: ">1 days till release",
        hoursTillRelease: 5 * 24,
        movieRunningDays: 20,
        expected: `Starts in 5 days (6 Jan 2025 - 26 Jan 2025)`,
      },
      {
        description: "release is TOMORROW",
        hoursTillRelease: 13, // "now" is 12:00
        movieRunningDays: 25,
        expected: `Starts tomorrow (2 Jan 2025 - 27 Jan 2025)`,
      },
      {
        description: "release is LATER today",
        hoursTillRelease: 2,
        movieRunningDays: 20,
        expected: `Starts today (14:00 - 26 Jan 2025)`,
      },
      {
        description: "release WAS today",
        hoursTillRelease: -2,
        movieRunningDays: 20,
        expected: `Ends in 20 days (6 Jan 2025 - 26 Jan 2025)`,
      },
      {
        description: "release was yesterday",
        hoursTillRelease: -1 * 24,
        movieRunningDays: 20,
        expected: `Ends in 19 days (6 Jan 2025 - 26 Jan 2025)`,
      },
      {
        description: "release was 20 days ago",
        hoursTillRelease: -20 * 24,
        movieRunningDays: 30,
        expected: `Ends in 10 days (10 Dec 2024 - 10 Jan 2025)`, // TODO: fix, I've made an error here
      },
      {
        description: "movie release ended",
        hoursTillRelease: -25 * 24,
        movieRunningDays: 20,
        expected: `Ended`,
      },
    ];

    testCases.forEach(
      ({ hoursTillRelease, movieRunningDays, expected, description }) => {
        test(description, () => {
          const timeManager: ITimeManager = {
            getNow: () => {
              return new Date("1 Jan 2025 12:00:00");
            },
            getToday: () => {
              return new Date("1 Jan 2025");
            },
            getTomorrow: () => {
              return new Date("2 Jan 2025");
            },
          };
          const sut = new MessageFormatter(timeManager);
          const today = timeManager.getToday();
          const start = addHours(today, hoursTillRelease);
          const end = addDays(start, movieRunningDays);

          assertEquals(
            sut.formatRunPeriod({
              runPeriod: {
                start,
                end,
              },
            }),
            expected,
          );
        });
      },
    );
  });
});

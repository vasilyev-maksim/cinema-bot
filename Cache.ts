export class Cache<T> {
  private valuePromise: Promise<T> | null = null;
  private lastUpdate: Date | null = null;

  public constructor(private readonly expirationPeriodInMS: number) {}

  public getValue(
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cacheMiss = !this.valuePromise;
    const expired = this.lastUpdate &&
      this.lastUpdate.getTime() <
        (Date.now() - this.expirationPeriodInMS);

    if (cacheMiss || expired) {
      this.valuePromise = fetcher();
      this.lastUpdate = new Date();
      console.log("cache update", { cacheMiss, expired });
    }

    return this.valuePromise!;
  }
}

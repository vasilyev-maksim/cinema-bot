import { Lang } from "./models.ts";

export class Settings {
  private kv: Promise<Deno.Kv>;

  public constructor() {
    this.kv = Deno.openKv();
  }

  private async useKv<T>(cb: (kv: Deno.Kv) => T): Promise<T> {
    return cb(await this.kv);
  }

  public async getUserLang(userId: string): Promise<Lang | null> {
    return (await this.useKv((kv) => kv.get<Lang>([userId, "lang"]))).value;
  }

  public saveUserLang(userId: string, lang: Lang) {
    return this.useKv((kv) => kv.set([userId, "lang"], lang));
  }
}

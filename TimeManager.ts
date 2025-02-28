export interface ITimeManager {
  getNow(): Date;
  getToday(): Date;
  getTomorrow(): Date;
}

export class TimeManager implements ITimeManager {
  public getNow(): Date {
    return new Date();
  }

  public getToday(): Date {
    return this.getNow();
  }

  public getTomorrow(): Date {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}

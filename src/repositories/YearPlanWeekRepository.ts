import { getDb } from "../db";
import { YearPlanWeek } from "../models";
import { UniqueIdHelper } from "../helpers";

export class YearPlanWeekRepository {
  public save(week: YearPlanWeek) {
    if (UniqueIdHelper.isMissing(week.id)) return this.create(week);
    else return this.update(week);
  }

  public async create(week: YearPlanWeek) {
    week.id = UniqueIdHelper.shortId();
    await getDb().insertInto("yearPlanWeeks").values({
      id: week.id,
      churchId: week.churchId,
      yearPlanId: week.yearPlanId,
      week: week.week,
      lessonId: week.lessonId,
      externalProviderId: week.externalProviderId,
      programId: week.programId,
      studyId: week.studyId,
      venueId: week.venueId,
      studyName: week.studyName,
      lessonName: week.lessonName,
      venueName: week.venueName
    }).execute();
    return week;
  }

  public async update(week: YearPlanWeek) {
    await getDb().updateTable("yearPlanWeeks").set({
      week: week.week,
      lessonId: week.lessonId,
      externalProviderId: week.externalProviderId,
      programId: week.programId,
      studyId: week.studyId,
      venueId: week.venueId,
      studyName: week.studyName,
      lessonName: week.lessonName,
      venueName: week.venueName
    }).where("id", "=", week.id).where("churchId", "=", week.churchId).execute();
    return week;
  }

  public async loadByPlanId(yearPlanId: string): Promise<YearPlanWeek[]> {
    return await getDb().selectFrom("yearPlanWeeks").selectAll().where("yearPlanId", "=", yearPlanId).orderBy("week").execute() as YearPlanWeek[];
  }

  public async loadByPlanIds(yearPlanIds: string[]): Promise<YearPlanWeek[]> {
    if (yearPlanIds.length === 0) return [];
    return await getDb().selectFrom("yearPlanWeeks").selectAll().where("yearPlanId", "in", yearPlanIds).orderBy("week").execute() as YearPlanWeek[];
  }

  public async replaceForPlan(churchId: string, yearPlanId: string, weeks: YearPlanWeek[]): Promise<YearPlanWeek[]> {
    await getDb().deleteFrom("yearPlanWeeks").where("yearPlanId", "=", yearPlanId).where("churchId", "=", churchId).execute();
    const saved: YearPlanWeek[] = [];
    for (const week of weeks) {
      saved.push(await this.create({
        churchId,
        yearPlanId,
        week: week.week,
        lessonId: week.lessonId,
        externalProviderId: week.externalProviderId,
        programId: week.programId,
        studyId: week.studyId,
        venueId: week.venueId,
        studyName: week.studyName,
        lessonName: week.lessonName,
        venueName: week.venueName
      }));
    }
    return saved;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("yearPlanWeeks").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

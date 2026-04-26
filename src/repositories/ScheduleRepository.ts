import { sql } from "kysely";
import { getDb } from "../db";
import { Schedule } from "../models";
import { UniqueIdHelper } from "../helpers";

// MySQL `date` columns reject full ISO timestamps. Coerce whatever the caller
// sends (Date, ISO string, or YYYY-MM-DD string) to YYYY-MM-DD.
function toMysqlDate(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export class ScheduleRepository {
  public save(schedule: Schedule) {
    if (UniqueIdHelper.isMissing(schedule.id)) return this.create(schedule);
    else return this.update(schedule);
  }

  public async create(schedule: Schedule) {
    schedule.id = UniqueIdHelper.shortId();
    await getDb().insertInto("schedules").values({
      id: schedule.id,
      churchId: schedule.churchId,
      classroomId: schedule.classroomId,
      scheduledDate: toMysqlDate(schedule.scheduledDate),
      externalProviderId: schedule.externalProviderId,
      programId: schedule.programId,
      studyId: schedule.studyId,
      lessonId: schedule.lessonId,
      venueId: schedule.venueId,
      displayName: schedule.displayName
    }).execute();
    return schedule;
  }

  public async update(schedule: Schedule) {
    await getDb().updateTable("schedules").set({
      classroomId: schedule.classroomId,
      scheduledDate: toMysqlDate(schedule.scheduledDate),
      externalProviderId: schedule.externalProviderId,
      programId: schedule.programId,
      studyId: schedule.studyId,
      lessonId: schedule.lessonId,
      venueId: schedule.venueId,
      displayName: schedule.displayName
    }).where("id", "=", schedule.id).where("churchId", "=", schedule.churchId).execute();
    return schedule;
  }

  public async loadByChurchIdClassroomId(churchId: string, classroomId: string): Promise<Schedule[]> {
    return await getDb().selectFrom("schedules").selectAll().where("churchId", "=", churchId).where("classroomId", "=", classroomId).orderBy("scheduledDate").execute() as Schedule[];
  }

  public async loadByClassroomId(classroomId: string): Promise<Schedule[]> {
    return await getDb().selectFrom("schedules").selectAll().where("classroomId", "=", classroomId).orderBy("scheduledDate").execute() as Schedule[];
  }

  public async loadCurrent(classroomId: string, date: Date): Promise<Schedule> {
    return (await getDb().selectFrom("schedules").selectAll()
      .where("classroomId", "=", classroomId)
      .where("scheduledDate", ">", sql<Date>`(${date} - INTERVAL 1 DAY)`)
      .orderBy("scheduledDate")
      .limit(1)
      .executeTakeFirst() ?? null) as Schedule;
  }

  public async load(id: string): Promise<Schedule> {
    return await getDb().selectFrom("schedules").selectAll().where("id", "=", id).executeTakeFirst() as Schedule;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("schedules").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

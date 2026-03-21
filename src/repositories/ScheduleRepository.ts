import { sql } from "kysely";
import { getDb } from "../db";
import { Schedule } from "../models";
import { UniqueIdHelper } from "../helpers";

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
      scheduledDate: schedule.scheduledDate,
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
      scheduledDate: schedule.scheduledDate,
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
    const result = await sql<any>`
      SELECT * FROM schedules
      WHERE classroomId=${classroomId} AND scheduledDate > (${date} - INTERVAL 1 DAY)
      ORDER BY scheduledDate LIMIT 1
    `.execute(getDb());
    return (result.rows[0] ?? null) as Schedule;
  }

  public async load(id: string): Promise<Schedule> {
    return await getDb().selectFrom("schedules").selectAll().where("id", "=", id).executeTakeFirst() as Schedule;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("schedules").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

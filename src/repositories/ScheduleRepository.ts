import { DB } from "@churchapps/apihelper"
import { Schedule } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ScheduleRepository {

  public save(schedule: Schedule) {
    if (UniqueIdHelper.isMissing(schedule.id)) return this.create(schedule); else return this.update(schedule);
  }

  public async create(schedule: Schedule) {
    schedule.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO schedules (id, churchId, classroomId, scheduledDate, externalProviderId, programId, studyId, lessonId, venueId, displayName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [schedule.id, schedule.churchId, schedule.classroomId, schedule.scheduledDate, schedule.externalProviderId, schedule.programId, schedule.studyId, schedule.lessonId, schedule.venueId, schedule.displayName];
    await DB.query(sql, params);
    return schedule;
  }

  public async update(schedule: Schedule) {
    const sql = "UPDATE schedules SET classroomId=?, scheduledDate=?, externalProviderId=?, programId=?, studyId=?, lessonId=?, venueId=?, displayName=? WHERE id=? AND churchId=?";
    const params = [schedule.classroomId, schedule.scheduledDate, schedule.externalProviderId, schedule.programId, schedule.studyId, schedule.lessonId, schedule.venueId, schedule.displayName, schedule.id, schedule.churchId];
    await DB.query(sql, params);
    return schedule;
  }

  public loadByChurchIdClassroomId(churchId: string, classroomId: string): Promise<Schedule[]> {
    return DB.query("SELECT * FROM schedules WHERE churchId=? AND classroomId=? ORDER BY scheduledDate", [churchId, classroomId]) as Promise<Schedule[]>
  }

  public loadByClassroomId(classroomId: string): Promise<Schedule[]> {
    return DB.query("SELECT * FROM schedules WHERE classroomId=? ORDER BY scheduledDate", [classroomId]) as Promise<Schedule[]>
  }

  public loadCurrent(classroomId: string, date:Date): Promise<Schedule> {
    return DB.queryOne("SELECT * FROM schedules WHERE classroomId=? AND scheduledDate > (? - INTERVAL 1 DAY) ORDER BY scheduledDate LIMIT 1", [classroomId, date]);
  }

  public load(id: string): Promise<Schedule> {
    return DB.queryOne("SELECT * FROM schedules WHERE id=?", [id]) as Promise<Schedule>
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM schedules WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }

}

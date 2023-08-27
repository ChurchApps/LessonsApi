import { DB } from "@churchapps/apihelper"
import { Schedule } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ScheduleRepository {

  public save(schedule: Schedule) {
    if (UniqueIdHelper.isMissing(schedule.id)) return this.create(schedule); else return this.update(schedule);
  }

  public async create(schedule: Schedule) {
    schedule.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO schedules (id, churchId, classroomId, scheduledDate, lessonId, venueId, displayName) VALUES (?, ?, ?, ?, ?, ?, ?);";
    const params = [schedule.id, schedule.churchId, schedule.classroomId, schedule.scheduledDate, schedule.lessonId, schedule.venueId, schedule.displayName];
    await DB.query(sql, params);
    return schedule;
  }

  public async update(schedule: Schedule) {
    const sql = "UPDATE schedules SET classroomId=?, scheduledDate=?, lessonId=?, venueId=?, displayName=? WHERE id=? AND churchId=?";
    const params = [schedule.classroomId, schedule.scheduledDate, schedule.lessonId, schedule.venueId, schedule.displayName, schedule.id, schedule.churchId];
    await DB.query(sql, params);
    return schedule;
  }

  public loadByChurchIdClassroomId(churchId: string, classroomId: string): Promise<Schedule[]> {
    return DB.query("SELECT * FROM schedules WHERE churchId=? AND classroomId=? ORDER BY scheduledDate", [churchId, classroomId]);
  }

  public loadByClassroomId(classroomId: string): Promise<Schedule[]> {
    return DB.query("SELECT * FROM schedules WHERE classroomId=? ORDER BY scheduledDate", [classroomId]);
  }

  public loadCurrent(classroomId: string): Promise<Schedule> {
    return DB.queryOne("SELECT * FROM schedules WHERE classroomId=? AND scheduledDate > (now() - INTERVAL 2 DAY) ORDER BY scheduledDate LIMIT 1;", [classroomId]);
  }

  public load(id: string): Promise<Schedule> {
    return DB.queryOne("SELECT * FROM schedules WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<Schedule> {
    return DB.query("DELETE FROM schedules WHERE id=? AND churchId=?", [id, churchId]);
  }

}

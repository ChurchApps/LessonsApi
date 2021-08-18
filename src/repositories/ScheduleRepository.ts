import { DB } from "../apiBase/db";
import { Schedule } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ScheduleRepository {

  public save(schedule: Schedule) {
    if (UniqueIdHelper.isMissing(schedule.id)) return this.create(schedule); else return this.update(schedule);
  }

  public async create(schedule: Schedule) {
    schedule.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO schedules (id, churchId, classroomId, scheduleDate, lessonId) VALUES (?, ?, ?, ?, ?);";
    const params = [schedule.id, schedule.churchId, schedule.classroomId, schedule.scheduleDate, schedule.lessonId];
    await DB.query(sql, params);
    return schedule;
  }

  public async update(schedule: Schedule) {
    const sql = "UPDATE schedules SET classroomId=?, scheduleDate=?, lessonId=? WHERE id=? AND churchId=?";
    const params = [schedule.classroomId, schedule.scheduleDate, schedule.lessonId, schedule.id, schedule.churchId];
    await DB.query(sql, params);
    return schedule;
  }

  public loadByClassroomId(churchId: string, classroomId: string): Promise<Schedule[]> {
    return DB.query("SELECT * FROM schedules WHERE churchId=? AND classroomId=? ORDER BY scheduleDate", [churchId, classroomId]);
  }

  public load(id: string): Promise<Schedule> {
    return DB.queryOne("SELECT * FROM schedules WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<Schedule> {
    return DB.query("DELETE FROM schedules WHERE id=? AND churchId=?", [id, churchId]);
  }

}

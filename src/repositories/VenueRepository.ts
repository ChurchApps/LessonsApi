import { DB } from "../apiBase/db";
import { Venue } from "../models";
import { UniqueIdHelper } from "../helpers";

export class VenueRepository {

  public save(venue: Venue) {
    if (UniqueIdHelper.isMissing(venue.id)) return this.create(venue); else return this.update(venue);
  }

  public async create(venue: Venue) {
    venue.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO venues (id, churchId, lessonId, name, sort) VALUES (?, ?, ?, ?, ?);";
    const params = [venue.id, venue.churchId, venue.lessonId, venue.name, venue.sort];
    await DB.query(sql, params);
    return venue;
  }

  public async update(venue: Venue) {
    const sql = "UPDATE venues SET lessonId=?, name=?, sort=? WHERE id=? AND churchId=?";
    const params = [venue.lessonId, venue.name, venue.sort, venue.id, venue.churchId];
    await DB.query(sql, params);
    return venue;
  }

  public loadNamesForClassroom(churchId: string, lessonId: string): Promise<string[]> {
    const sql = "select v.name"
      + " from schedules s"
      + " inner join venues v on v.lessonId=s.lessonId"
      + " where s.churchId=? AND s.classroomId=?"
      + " group by v.name"
      + " order by v.name;"
    return DB.query(sql, [churchId, lessonId]);
  }

  public loadByLessonId(churchId: string, lessonId: string): Promise<Venue[]> {
    return DB.query("SELECT * FROM venues WHERE churchId=? AND lessonId=? ORDER BY sort", [churchId, lessonId]);
  }

  public loadPublicByLessonId(lessonId: string): Promise<Venue[]> {
    return DB.query("SELECT * FROM venues WHERE lessonId=? ORDER BY sort", [lessonId]);
  }

  public loadPublic(id: string): Promise<Venue> {
    return DB.queryOne("SELECT * FROM venues WHERE id=?", [id]);
  }


  public load(churchId: string, id: string): Promise<Venue> {
    return DB.queryOne("SELECT * FROM venues WHERE id=? AND churchId=?", [id, churchId]);
  }

  public loadAll(churchId: string): Promise<Venue[]> {
    return DB.query("SELECT * FROM venues WHERE churchId=? ORDER BY sort", [churchId]);
  }

  public delete(churchId: string, id: string): Promise<Venue> {
    return DB.query("DELETE FROM venues WHERE id=? AND churchId=?", [id, churchId]);
  }

}

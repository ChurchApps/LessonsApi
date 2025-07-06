import { DB } from "@churchapps/apihelper"
import { Venue } from "../models";
import { UniqueIdHelper } from "../helpers";

export class VenueRepository {

  public async loadTimeline(venueIds: string[]) {
    const sql = "select 'venue' as postType, v.id as postId, s.name as studyName, l.name, l.description, l.image, concat('/', p.slug, '/', s.slug, '/', l.slug) as slug"
    + " from venues v"
    + " inner join lessons l on l.id=v.lessonId"
    + " inner join studies s on s.id=l.studyId"
    + " inner join programs p on p.id=s.programId"
    + " where v.id in (?)";

    const params = [venueIds];
    const result = await DB.query(sql, params);
    return result;
  }

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
    return DB.query(sql, [churchId, lessonId]) as Promise<string[]>;
  }

  public loadByLessonId(churchId: string, lessonId: string): Promise<Venue[]> {
    return DB.query("SELECT * FROM venues WHERE churchId=? AND lessonId=? ORDER BY sort", [churchId, lessonId]) as Promise<Venue[]>
  }

  public loadPublicByLessonId(lessonId: string): Promise<Venue[]> {
    return DB.query("SELECT * FROM venues WHERE lessonId=? ORDER BY sort", [lessonId]) as Promise<Venue[]>
  }

  public loadPublic(id: string): Promise<Venue> {
    return DB.queryOne("SELECT * FROM venues WHERE id=?", [id]) as Promise<Venue>
  }

  public loadPublicAll(): Promise<Venue[]> {
    return DB.query("SELECT * FROM venues order by name", []) as Promise<Venue[]>
  }

  public load(churchId: string, id: string): Promise<Venue> {
    return DB.queryOne("SELECT * FROM venues WHERE id=? AND churchId=?", [id, churchId]) as Promise<Venue>
  }

  public loadAll(churchId: string): Promise<Venue[]> {
    return DB.query("SELECT * FROM venues WHERE churchId=? ORDER BY sort", [churchId]) as Promise<Venue[]>
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM venues WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }

}

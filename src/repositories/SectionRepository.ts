import { DB } from "../apiBase/db";
import { Section } from "../models";
import { UniqueIdHelper } from "../helpers";

export class SectionRepository {

  public save(section: Section) {
    return section.id ? this.update(section) : this.create(section);
  }

  private async create(section: Section) {
    section.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO sections (id, churchId, lessonId, venueId, name, sort) VALUES (?, ?, ?, ?, ?, ?);";
    const params = [section.id, section.churchId, section.lessonId, section.venueId, section.name, section.sort];
    await DB.query(sql, params);
    return section;
  }

  private async update(section: Section) {
    const sql = "UPDATE sections SET lessonId=?, venueId=?, name=?, sort=? WHERE id=? AND churchId=?";
    const params = [section.lessonId, section.venueId, section.name, section.sort, section.id, section.churchId];
    await DB.query(sql, params);
    return section;
  }

  public loadByLessonId(lessonId: string): Promise<Section[]> {
    return DB.query("SELECT * FROM sections WHERE lessonId=? ORDER BY sort", [lessonId]);
  }

  public load(id: string): Promise<Section> {
    return DB.queryOne("SELECT * FROM sections WHERE id=?", [id]);
  }

  public delete(churchId: string, id: string): Promise<Section> {
    return DB.query("DELETE FROM sections WHERE id=? AND churchId=?", [id, churchId]);
  }

}

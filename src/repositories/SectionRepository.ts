import { DB } from "@churchapps/apihelper";
import { Section } from "../models";
import { UniqueIdHelper } from "../helpers";

export class SectionRepository {
  public save(section: Section) {
    if (UniqueIdHelper.isMissing(section.id)) return this.create(section);
    else return this.update(section);
  }

  public async create(section: Section) {
    section.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO sections (id, churchId, lessonId, venueId, name, sort, materials) VALUES (?, ?, ?, ?, ?, ?, ?);";
    const params = [section.id, section.churchId, section.lessonId, section.venueId, section.name, section.sort, section.materials];
    await DB.query(sql, params);
    return section;
  }

  public async update(section: Section) {
    const sql = "UPDATE sections SET lessonId=?, venueId=?, name=?, sort=?, materials=? WHERE id=? AND churchId=?";
    const params = [section.lessonId, section.venueId, section.name, section.sort, section.materials, section.id, section.churchId];
    await DB.query(sql, params);
    return section;
  }

  public loadByVenueId(churchId: string, venueId: string): Promise<Section[]> {
    return DB.query("SELECT * FROM sections WHERE churchId=? AND venueId=? ORDER BY sort", [churchId, venueId]) as Promise<Section[]>;
  }

  public loadForPlaylist(churchId: string, venueId: string, classRoomChurchId: string): Promise<Section[]> {
    const sql = "SELECT s.* FROM sections s" + " left join customizations sectionSort on sectionSort.churchId=? AND sectionSort.venueId=s.venueId AND sectionSort.action='sort' AND sectionSort.contentId=s.id" + " WHERE s.churchId=? AND s.venueId=?" + " ORDER BY IFNULL(cast(sectionSort.actionContent as unsigned), s.sort)";
    return DB.query(sql, [classRoomChurchId, churchId, venueId]) as Promise<Section[]>;
  }

  public loadByVenueIdPublic(venueId: string): Promise<Section[]> {
    return DB.query("SELECT * FROM sections WHERE venueId=? ORDER BY sort", [venueId]) as Promise<Section[]>;
  }

  public loadByLessonId(lessonId: string): Promise<Section[]> {
    return DB.query("SELECT * FROM sections WHERE lessonId=? ORDER BY sort", [lessonId]) as Promise<Section[]>;
  }

  public loadPublicAll(): Promise<Section[]> {
    return DB.query("SELECT * FROM sections ORDER BY sort", []) as Promise<Section[]>;
  }

  public load(id: string): Promise<Section> {
    return DB.queryOne("SELECT * FROM sections WHERE id=?", [id]) as Promise<Section>;
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM sections WHERE id=? AND churchId=?", [id, churchId]) as Promise<any>;
  }
}

import { sql } from "kysely";
import { getDb } from "../db";
import { Section } from "../models";
import { UniqueIdHelper } from "../helpers";

export class SectionRepository {
  public save(section: Section) {
    if (UniqueIdHelper.isMissing(section.id)) return this.create(section);
    else return this.update(section);
  }

  public async create(section: Section) {
    section.id = UniqueIdHelper.shortId();
    await getDb().insertInto("sections").values({
      id: section.id,
      churchId: section.churchId,
      lessonId: section.lessonId,
      venueId: section.venueId,
      name: section.name,
      sort: section.sort,
      materials: section.materials
    }).execute();
    return section;
  }

  public async update(section: Section) {
    await getDb().updateTable("sections").set({ lessonId: section.lessonId, venueId: section.venueId, name: section.name, sort: section.sort, materials: section.materials }).where("id", "=", section.id).where("churchId", "=", section.churchId).execute();
    return section;
  }

  public async loadByVenueId(churchId: string, venueId: string): Promise<Section[]> {
    return await getDb().selectFrom("sections").selectAll().where("churchId", "=", churchId).where("venueId", "=", venueId).orderBy("sort").execute() as Section[];
  }

  public async loadForPlaylist(churchId: string, venueId: string, classRoomChurchId: string): Promise<Section[]> {
    const result = await sql<any>`
      SELECT s.* FROM sections s
      LEFT JOIN customizations sectionSort
        ON sectionSort.churchId=${classRoomChurchId}
        AND sectionSort.venueId=s.venueId
        AND sectionSort.action='sort'
        AND sectionSort.contentId=s.id
      WHERE s.churchId=${churchId} AND s.venueId=${venueId}
      ORDER BY IFNULL(CAST(sectionSort.actionContent AS UNSIGNED), s.sort)
    `.execute(getDb());
    return result.rows as Section[];
  }

  public async loadByVenueIdPublic(venueId: string): Promise<Section[]> {
    return await getDb().selectFrom("sections").selectAll().where("venueId", "=", venueId).orderBy("sort").execute() as Section[];
  }

  public async loadByLessonId(lessonId: string): Promise<Section[]> {
    return await getDb().selectFrom("sections").selectAll().where("lessonId", "=", lessonId).orderBy("sort").execute() as Section[];
  }

  public async loadPublicAll(): Promise<Section[]> {
    return await getDb().selectFrom("sections").selectAll().orderBy("sort").execute() as Section[];
  }

  public async load(id: string): Promise<Section> {
    return await getDb().selectFrom("sections").selectAll().where("id", "=", id).executeTakeFirst() as Section;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("sections").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

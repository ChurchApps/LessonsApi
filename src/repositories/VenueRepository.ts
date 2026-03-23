import { sql } from "kysely";
import { getDb } from "../db";
import { Venue } from "../models";
import { UniqueIdHelper } from "../helpers";

export class VenueRepository {
  public async loadTimeline(venueIds: string[]) {
    if (venueIds.length === 0) return [];
    const result = await sql<any>`
      SELECT 'venue' as postType, v.id as postId, s.name as studyName, l.name, l.description, l.image,
        CONCAT('/', p.slug, '/', s.slug, '/', l.slug) as slug
      FROM venues v
      INNER JOIN lessons l ON l.id=v.lessonId
      INNER JOIN studies s ON s.id=l.studyId
      INNER JOIN programs p ON p.id=s.programId
      WHERE v.id IN (${sql.join(venueIds)})
    `.execute(getDb());
    return result.rows;
  }

  public save(venue: Venue) {
    if (UniqueIdHelper.isMissing(venue.id)) return this.create(venue);
    else return this.update(venue);
  }

  public async create(venue: Venue) {
    venue.id = UniqueIdHelper.shortId();
    await getDb().insertInto("venues").values({ id: venue.id, churchId: venue.churchId, lessonId: venue.lessonId, name: venue.name, sort: venue.sort }).execute();
    return venue;
  }

  public async update(venue: Venue) {
    await getDb().updateTable("venues").set({ lessonId: venue.lessonId, name: venue.name, sort: venue.sort }).where("id", "=", venue.id).where("churchId", "=", venue.churchId).execute();
    return venue;
  }

  public async loadNamesForClassroom(churchId: string, lessonId: string): Promise<string[]> {
    const rows = await getDb().selectFrom("schedules as s")
      .innerJoin("venues as v", "v.lessonId", "s.lessonId")
      .select("v.name")
      .where("s.churchId", "=", churchId)
      .where("s.classroomId", "=", lessonId)
      .groupBy("v.name")
      .orderBy("v.name")
      .execute();
    return rows.map(r => r.name) as string[];
  }

  public async loadByLessonId(churchId: string, lessonId: string): Promise<Venue[]> {
    return await getDb().selectFrom("venues").selectAll().where("churchId", "=", churchId).where("lessonId", "=", lessonId).orderBy("sort").execute() as Venue[];
  }

  public async loadPublicByLessonId(lessonId: string): Promise<Venue[]> {
    return await getDb().selectFrom("venues").selectAll().where("lessonId", "=", lessonId).orderBy("sort").execute() as Venue[];
  }

  public async loadPublic(id: string): Promise<Venue> {
    return await getDb().selectFrom("venues").selectAll().where("id", "=", id).executeTakeFirst() as Venue;
  }

  public async loadPublicAll(): Promise<Venue[]> {
    return await getDb().selectFrom("venues").selectAll().orderBy("name").execute() as Venue[];
  }

  public async load(churchId: string, id: string): Promise<Venue> {
    return await getDb().selectFrom("venues").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Venue;
  }

  public async loadAll(churchId: string): Promise<Venue[]> {
    return await getDb().selectFrom("venues").selectAll().where("churchId", "=", churchId).orderBy("sort").execute() as Venue[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("venues").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

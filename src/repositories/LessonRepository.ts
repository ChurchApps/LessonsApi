import { getDb } from "../db";
import { Lesson } from "../models";
import { UniqueIdHelper } from "../helpers";

export class LessonRepository {
  public save(lesson: Lesson) {
    if (UniqueIdHelper.isMissing(lesson.id)) return this.create(lesson);
    else return this.update(lesson);
  }

  public async create(lesson: Lesson) {
    lesson.id = UniqueIdHelper.shortId();
    await getDb().insertInto("lessons").values({
      id: lesson.id,
      churchId: lesson.churchId,
      studyId: lesson.studyId,
      name: lesson.name,
      slug: lesson.slug,
      title: lesson.title,
      sort: lesson.sort,
      image: lesson.image,
      live: lesson.live,
      description: lesson.description,
      videoEmbedUrl: lesson.videoEmbedUrl
    }).execute();
    return lesson;
  }

  public async update(lesson: Lesson) {
    await getDb().updateTable("lessons").set({
      studyId: lesson.studyId,
      name: lesson.name,
      slug: lesson.slug,
      title: lesson.title,
      sort: lesson.sort,
      image: lesson.image,
      live: lesson.live,
      description: lesson.description,
      videoEmbedUrl: lesson.videoEmbedUrl
    }).where("id", "=", lesson.id).where("churchId", "=", lesson.churchId).execute();
    return lesson;
  }

  public async tempLessonsNeedingVideoFiles(): Promise<Lesson[]> {
    return await getDb().selectFrom("lessons as l")
      .leftJoin("externalVideos as ev", (join) =>
        join.onRef("ev.contentId", "=", "l.id").on("ev.contentType", "=", "lesson"))
      .selectAll("l")
      .where("l.churchId", "=", "L8fupS4MSOo")
      .where("l.videoEmbedUrl", "is not", null)
      .where("ev.id", "is", null)
      .execute() as Lesson[];
  }

  public async loadByStudyId(churchId: string, studyId: string): Promise<Lesson[]> {
    return await getDb().selectFrom("lessons").selectAll().where("churchId", "=", churchId).where("studyId", "=", studyId).orderBy("sort").execute() as Lesson[];
  }

  public async loadPublicByStudyId(studyId: string): Promise<Lesson[]> {
    return await getDb().selectFrom("lessons").selectAll().where("studyId", "=", studyId).where("live", "=", true).orderBy("sort").execute() as Lesson[];
  }

  public async loadPublicByStudyIds(ids: string[]): Promise<Lesson[]> {
    if (ids.length === 0) return [];
    return await getDb().selectFrom("lessons").selectAll().where("studyId", "in", ids).where("live", "=", true).orderBy("sort").execute() as Lesson[];
  }

  public async loadPublicBySlug(studyId: string, slug: string): Promise<Lesson> {
    return await getDb().selectFrom("lessons").selectAll().where("studyId", "=", studyId).where("slug", "=", slug).where("live", "=", true).executeTakeFirst() as Lesson;
  }

  public async loadPublicByIds(ids: string[]): Promise<Lesson[]> {
    if (ids.length === 0) return [];
    return await getDb().selectFrom("lessons").selectAll().where("id", "in", ids).where("live", "=", true).execute() as Lesson[];
  }

  public async loadPublic(id: string): Promise<Lesson> {
    return await getDb().selectFrom("lessons").selectAll().where("id", "=", id).where("live", "=", true).executeTakeFirst() as Lesson;
  }

  public async load(churchId: string, id: string): Promise<Lesson> {
    return await getDb().selectFrom("lessons").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Lesson;
  }

  public async loadPublicAll(): Promise<Lesson[]> {
    return await getDb().selectFrom("lessons").selectAll().where("live", "=", true).orderBy("sort").execute() as Lesson[];
  }

  public async loadAll(churchId: string): Promise<Lesson[]> {
    return await getDb().selectFrom("lessons").selectAll().where("churchId", "=", churchId).orderBy("sort").execute() as Lesson[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("lessons").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

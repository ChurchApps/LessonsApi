import { getDb } from "../db";
import { Study } from "../models";
import { UniqueIdHelper } from "../helpers";

export class StudyRepository {
  public save(study: Study) {
    if (UniqueIdHelper.isMissing(study.id)) return this.create(study);
    else return this.update(study);
  }

  public async create(study: Study) {
    study.id = UniqueIdHelper.shortId();
    await getDb().insertInto("studies").values({
      id: study.id,
      churchId: study.churchId,
      programId: study.programId,
      name: study.name,
      slug: study.slug,
      image: study.image,
      shortDescription: study.shortDescription,
      description: study.description,
      videoEmbedUrl: study.videoEmbedUrl,
      sort: study.sort,
      live: study.live
    }).execute();
    return study;
  }

  public async update(study: Study) {
    await getDb().updateTable("studies").set({
      name: study.name,
      slug: study.slug,
      image: study.image,
      shortDescription: study.shortDescription,
      description: study.description,
      videoEmbedUrl: study.videoEmbedUrl,
      sort: study.sort,
      live: study.live
    }).where("id", "=", study.id).where("churchId", "=", study.churchId).execute();
    return study;
  }

  public async loadByProgramId(churchId: string, programId: string): Promise<Study[]> {
    return await getDb().selectFrom("studies").selectAll().where("churchId", "=", churchId).where("programId", "=", programId).orderBy("sort").execute() as Study[];
  }

  public async loadPublicByProgramId(programId: string): Promise<Study[]> {
    return await getDb().selectFrom("studies as s").selectAll("s")
      .select((eb) => eb.selectFrom("lessons").whereRef("lessons.studyId", "=", "s.id").select((eb2) => eb2.fn.countAll().as("count")).as("lessonCount"))
      .where("programId", "=", programId).where("live", "=", true).orderBy("sort").execute() as Study[];
  }

  public async loadPublicByProgramIds(programIds: string[]): Promise<Study[]> {
    if (programIds.length === 0) return [];
    return await getDb().selectFrom("studies").selectAll().where("programId", "in", programIds).where("live", "=", true).orderBy("sort").execute() as Study[];
  }

  public async load(churchId: string, id: string): Promise<Study> {
    return await getDb().selectFrom("studies").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Study;
  }

  public async loadPublicBySlug(programId: string, slug: string): Promise<Study> {
    return await getDb().selectFrom("studies").selectAll().where("programId", "=", programId).where("slug", "=", slug).where("live", "=", true).orderBy("sort").executeTakeFirst() as Study;
  }

  public async loadPublicByIds(ids: string[]): Promise<Study[]> {
    if (ids.length === 0) return [];
    return await getDb().selectFrom("studies").selectAll().where("id", "in", ids).where("live", "=", true).execute() as Study[];
  }

  public async loadPublicAll(): Promise<Study[]> {
    return await getDb().selectFrom("studies").selectAll().where("live", "=", true).execute() as Study[];
  }

  public async loadPublic(id: string): Promise<Study> {
    return await getDb().selectFrom("studies").selectAll().where("id", "=", id).where("live", "=", true).orderBy("sort").executeTakeFirst() as Study;
  }

  public async loadAll(churchId: string): Promise<Study[]> {
    return await getDb().selectFrom("studies").selectAll().where("churchId", "=", churchId).orderBy("sort").execute() as Study[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("studies").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

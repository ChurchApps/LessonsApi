import { getDb } from "../db";
import { Resource } from "../models";
import { UniqueIdHelper } from "../helpers";

export class ResourceRepository {
  public save(resource: Resource) {
    if (UniqueIdHelper.isMissing(resource.id)) return this.create(resource);
    else return this.update(resource);
  }

  public async create(resource: Resource) {
    resource.id = UniqueIdHelper.shortId();
    await getDb().insertInto("resources").values({
      id: resource.id,
      churchId: resource.churchId,
      name: resource.name,
      category: resource.category,
      bundleId: resource.bundleId,
      loopVideo: resource.loopVideo
    }).execute();
    return resource;
  }

  public async update(resource: Resource) {
    await getDb().updateTable("resources").set({ name: resource.name, category: resource.category, bundleId: resource.bundleId, loopVideo: resource.loopVideo }).where("id", "=", resource.id).where("churchId", "=", resource.churchId).execute();
    return resource;
  }

  public async loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Resource[]> {
    return await getDb().selectFrom("resources").selectAll()
      .where("bundleId", "in", getDb().selectFrom("bundles").select("id")
        .where("churchId", "=", churchId).where("contentType", "=", contentType).where("contentId", "=", contentId))
      .orderBy("name")
      .execute() as Resource[];
  }

  public async loadByBundleId(churchId: string, bundleId: string): Promise<Resource[]> {
    return await getDb().selectFrom("resources").selectAll().where("churchId", "=", churchId).where("bundleId", "=", bundleId).orderBy("name").execute() as Resource[];
  }

  public async loadPublicForLesson(lessonId: string): Promise<Resource[]> {
    return await getDb().selectFrom("resources").selectAll()
      .where("id", "in", getDb().selectFrom("actions").select("resourceId").where("lessonId", "=", lessonId))
      .execute() as Resource[];
  }

  public async load(churchId: string, id: string): Promise<Resource> {
    return await getDb().selectFrom("resources").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Resource;
  }

  public async loadWithoutChurchId(id: string): Promise<Resource> {
    return await getDb().selectFrom("resources").selectAll().where("id", "=", id).executeTakeFirst() as Resource;
  }

  public async loadNeedingWebm(): Promise<any[]> {
    return await getDb().selectFrom("files as f")
      .innerJoin("variants as v", "v.fileId", "f.id")
      .innerJoin("resources as r", "r.id", "v.resourceId")
      .leftJoin("variants as v2", (join) =>
        join.onRef("v2.resourceId", "=", "v.resourceId").on("v2.name", "=", "WEBM"))
      .select(["r.churchId", "r.id", "r.name", "f.contentPath"])
      .where("f.contentPath", "like", "%.mp4%")
      .where("v2.id", "is", null)
      .execute() as any[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("resources").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

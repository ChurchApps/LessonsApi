import { getDb } from "../db";
import { Bundle } from "../models";
import { UniqueIdHelper } from "../helpers";

export class BundleRepository {
  public save(bundle: Bundle) {
    if (UniqueIdHelper.isMissing(bundle.id)) return this.create(bundle);
    else return this.update(bundle);
  }

  public async create(bundle: Bundle) {
    bundle.id = UniqueIdHelper.shortId();
    await getDb().insertInto("bundles").values({
      id: bundle.id,
      churchId: bundle.churchId,
      contentType: bundle.contentType,
      contentId: bundle.contentId,
      name: bundle.name,
      fileId: bundle.fileId,
      pendingUpdate: bundle.pendingUpdate
    }).execute();
    return bundle;
  }

  public async update(bundle: Bundle) {
    await getDb().updateTable("bundles").set({
      contentType: bundle.contentType,
      contentId: bundle.contentId,
      name: bundle.name,
      fileId: bundle.fileId,
      pendingUpdate: bundle.pendingUpdate
    }).where("id", "=", bundle.id).where("churchId", "=", bundle.churchId).execute();
    return bundle;
  }

  public async loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Bundle[]> {
    return await getDb().selectFrom("bundles").selectAll()
      .where("churchId", "=", churchId).where("contentType", "=", contentType).where("contentId", "=", contentId)
      .orderBy("name").execute() as Bundle[];
  }

  public async loadPendingUpdate(limit: number): Promise<Bundle[]> {
    return await getDb().selectFrom("bundles").selectAll().where("pendingUpdate", "=", true).limit(limit).execute() as Bundle[];
  }

  public async loadAll(churchId: string): Promise<Bundle[]> {
    return await getDb().selectFrom("bundles").selectAll().where("churchId", "=", churchId).orderBy("name").execute() as Bundle[];
  }

  public async loadAvailable(churchId: string, programId: string, studyId: string): Promise<Bundle[]> {
    let query = getDb().selectFrom("labelledBundles").selectAll().where("churchId", "=", churchId);
    if (studyId) {
      query = query.where((eb) => eb.or([
        eb("programId", "=", programId),
        eb("studyId", "=", studyId)
      ]));
    } else {
      query = query.where("programId", "=", programId);
    }
    return await query.execute() as Bundle[];
  }

  public async loadPublicForLesson(lessonId: string): Promise<Bundle[]> {
    return await getDb().selectFrom("bundles").selectAll()
      .where("id", "in", getDb().selectFrom("resources").select("bundleId")
        .where("id", "in", getDb().selectFrom("actions").select("resourceId").where("lessonId", "=", lessonId))).execute() as Bundle[];
  }

  public async load(churchId: string, id: string): Promise<Bundle> {
    return await getDb().selectFrom("bundles").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Bundle;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("bundles").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

import { sql } from "kysely";
import { getDb } from "../db";
import { Variant } from "../models";
import { UniqueIdHelper } from "../helpers";

export class VariantRepository {
  public save(variant: Variant) {
    if (UniqueIdHelper.isMissing(variant.id)) return this.create(variant);
    else return this.update(variant);
  }

  public async create(variant: Variant) {
    variant.id = UniqueIdHelper.shortId();
    await getDb().insertInto("variants").values({
      id: variant.id,
      churchId: variant.churchId,
      resourceId: variant.resourceId,
      fileId: variant.fileId,
      name: variant.name,
      downloadDefault: variant.downloadDefault,
      playerDefault: variant.playerDefault,
      hidden: variant.hidden
    }).execute();
    return variant;
  }

  public async update(variant: Variant) {
    await getDb().updateTable("variants").set({
      resourceId: variant.resourceId,
      fileId: variant.fileId,
      name: variant.name,
      downloadDefault: variant.downloadDefault,
      playerDefault: variant.playerDefault,
      hidden: variant.hidden
    }).where("id", "=", variant.id).where("churchId", "=", variant.churchId).execute();
    return variant;
  }

  public async loadByResourceId(churchId: string, resourceId: string): Promise<Variant[]> {
    return await getDb().selectFrom("variants").selectAll().where("churchId", "=", churchId).where("resourceId", "=", resourceId).orderBy("name").execute() as Variant[];
  }

  public async loadByResourceIds(churchId: string, resourceIds: string[]): Promise<Variant[]> {
    if (resourceIds.length === 0) return [];
    return await getDb().selectFrom("variants").selectAll().where("churchId", "=", churchId).where("resourceId", "in", resourceIds).orderBy("name").execute() as Variant[];
  }

  public async loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Variant[]> {
    return await getDb().selectFrom("variants").selectAll()
      .where("churchId", "=", churchId)
      .where("resourceId", "in", getDb().selectFrom("resources as r")
        .innerJoin("bundles as b", "b.id", "r.bundleId")
        .select("r.id")
        .where("b.churchId", "=", churchId)
        .where("b.contentType", "=", contentType)
        .where("b.contentId", "=", contentId))
      .orderBy("name")
      .execute() as Variant[];
  }

  public async load(churchId: string, id: string): Promise<Variant> {
    return await getDb().selectFrom("variants").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Variant;
  }

  public async loadPlaylist(resourceIds: string[]): Promise<any> {
    if (resourceIds.length === 0) return [];
    const result = await sql<any>`
      SELECT f.contentPath, r.id as resourceId, r.name as resourceName, '' as assetId,
        f.fileType, f.seconds, r.loopVideo
      FROM resources r
      INNER JOIN variants v ON v.resourceId=r.id
      INNER JOIN files f ON f.id=v.fileId
      WHERE r.id IN (${sql.join(resourceIds)})
    `.execute(getDb());
    return result.rows;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("variants").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

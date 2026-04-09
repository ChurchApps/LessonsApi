import { sql } from "kysely";
import { getDb } from "../db";
import { Asset } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AssetRepository {
  public save(asset: Asset) {
    if (UniqueIdHelper.isMissing(asset.id)) return this.create(asset);
    else return this.update(asset);
  }

  public async create(asset: Asset) {
    asset.id = UniqueIdHelper.shortId();
    await getDb().insertInto("assets").values({ id: asset.id, churchId: asset.churchId, resourceId: asset.resourceId, fileId: asset.fileId, name: asset.name, sort: asset.sort }).execute();
    return asset;
  }

  public async update(asset: Asset) {
    await getDb().updateTable("assets").set({ resourceId: asset.resourceId, fileId: asset.fileId, name: asset.name, sort: asset.sort }).where("id", "=", asset.id).where("churchId", "=", asset.churchId).execute();
    return asset;
  }

  public async loadByResourceId(churchId: string, resourceId: string): Promise<Asset[]> {
    return await getDb().selectFrom("assets").selectAll().where("churchId", "=", churchId).where("resourceId", "=", resourceId).orderBy("sort").execute() as Asset[];
  }

  public async loadByResourceIds(churchId: string, resourceIds: string[]): Promise<Asset[]> {
    if (resourceIds.length === 0) return [];
    return await getDb().selectFrom("assets").selectAll().where("churchId", "=", churchId).where("resourceId", "in", resourceIds).orderBy("sort").execute() as Asset[];
  }

  public async loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Asset[]> {
    return await getDb().selectFrom("assets").selectAll()
      .where("churchId", "=", churchId)
      .where("resourceId", "in", getDb().selectFrom("resources as r")
        .innerJoin("bundles as b", "b.id", "r.bundleId")
        .select("r.id")
        .where("b.churchId", "=", churchId)
        .where("b.contentType", "=", contentType)
        .where("b.contentId", "=", contentId))
      .orderBy("sort")
      .execute() as Asset[];
  }

  public async load(churchId: string, id: string): Promise<Asset> {
    return await getDb().selectFrom("assets").selectAll().where("id", "=", id).where("churchId", "=", churchId).executeTakeFirst() as Asset;
  }

  public async loadPlaylist(resourceIds: string[]): Promise<any> {
    if (resourceIds.length === 0) return [];
    const result = await sql<any>`
      SELECT f.contentPath, r.id as resourceId, CONCAT(r.name, ' - ', a.name) as resourceName,
        a.id as assetId, f.fileType, f.seconds
      FROM resources r
      INNER JOIN assets a ON a.resourceId=r.id
      INNER JOIN files f ON f.id=a.fileId
      WHERE r.id IN (${sql.join(resourceIds)})
      ORDER BY sort
    `.execute(getDb());
    return result.rows;
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("assets").where("id", "=", id).where("churchId", "=", churchId).execute();
  }
}

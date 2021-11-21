import { DB } from "../apiBase/db";
import { Variant } from "../models";
import { UniqueIdHelper } from "../helpers";
import { ArrayHelper } from "../apiBase";

export class VariantRepository {

  public save(variant: Variant) {
    if (UniqueIdHelper.isMissing(variant.id)) return this.create(variant); else return this.update(variant);
  }

  public async create(variant: Variant) {
    variant.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO variants (id, churchId, resourceId, fileId, name, downloadDefault, playerDefault, hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    const params = [variant.id, variant.churchId, variant.resourceId, variant.fileId, variant.name, variant.downloadDefault, variant.playerDefault, variant.hidden];
    await DB.query(sql, params);
    return variant;
  }

  public async update(variant: Variant) {
    const sql = "UPDATE variants SET resourceId=?, fileId=?, name=?, downloadDefault=?, playerDefault=?, hidden=? WHERE id=? AND churchId=?";
    const params = [variant.resourceId, variant.fileId, variant.name, variant.downloadDefault, variant.playerDefault, variant.hidden, variant.id, variant.churchId];
    await DB.query(sql, params);
    return variant;
  }

  public loadByResourceId(churchId: string, resourceId: string): Promise<Variant[]> {
    return DB.query("SELECT * FROM variants WHERE churchId=? AND resourceId=? ORDER BY name", [churchId, resourceId]);
  }

  public loadByResourceIds(churchId: string, resourceIds: string[]): Promise<Variant[]> {
    const sql = "SELECT * FROM variants WHERE churchId=? AND resourceId IN (" + ArrayHelper.fillArray("?", resourceIds.length) + ") ORDER BY name";
    return DB.query(sql, [churchId].concat(resourceIds));
  }

  public loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Variant[]> {
    const subQuery = "SELECT r.id from resources r INNER JOIN bundles b on b.id=r.bundleId WHERE b.churchId=? AND b.contentType=? AND b.contentId=?";
    return DB.query("SELECT * FROM variants WHERE churchId=? AND resourceId in (" + subQuery + ") order by name", [churchId, churchId, contentType, contentId]);
  }

  public load(churchId: string, id: string): Promise<Variant> {
    return DB.queryOne("SELECT * FROM variants WHERE id=? AND churchId=?", [id, churchId]);
  }

  public loadPlaylist(resourceIds: string[]): Promise<any> {
    const sql = "select f.contentPath, r.id as resourceId, r.name as resourceName, '' as assetId, f.fileType from resources r"
      + " inner join variants v on v.resourceId=r.id"
      + " inner join files f on f.id=v.fileId"
      + " where r.id in (" + ArrayHelper.fillArray("?", resourceIds.length).join(", ") + ");"
    return DB.query(sql, resourceIds);
  }

  public delete(churchId: string, id: string): Promise<Variant> {
    return DB.query("DELETE FROM variants WHERE id=? AND churchId=?", [id, churchId]);
  }


}

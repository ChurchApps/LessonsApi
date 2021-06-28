import { DB } from "../apiBase/db";
import { Variant } from "../models";
import { UniqueIdHelper } from "../helpers";

export class VariantRepository {

  public save(variant: Variant) {
    if (UniqueIdHelper.isMissing(variant.id)) return this.create(variant); else return this.update(variant);
  }

  public async create(variant: Variant) {
    variant.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO variants (id, churchId, resourceId, fileId, name, downloadDefault, playerDefault) VALUES (?, ?, ?, ?, ?, ?, ?);";
    const params = [variant.id, variant.churchId, variant.resourceId, variant.fileId, variant.name, variant.downloadDefault, variant.playerDefault];
    await DB.query(sql, params);
    return variant;
  }

  public async update(variant: Variant) {
    const sql = "UPDATE variants SET resourceId=?, fileId=?, name=?, downloadDefault=?, playerDefault=? WHERE id=? AND churchId=?";
    const params = [variant.resourceId, variant.fileId, variant.name, variant.downloadDefault, variant.playerDefault, variant.id, variant.churchId];
    await DB.query(sql, params);
    return variant;
  }

  public loadByResourceId(resourceId: string): Promise<Variant[]> {
    return DB.query("SELECT * FROM variants WHERE resourceId=? ORDER BY sort", [resourceId]);
  }

  public load(churchId: string, id: string): Promise<Variant> {
    return DB.queryOne("SELECT * FROM variants WHERE id=? AND churchId=?", [id, churchId]);
  }

  public delete(churchId: string, id: string): Promise<Variant> {
    return DB.query("DELETE FROM variants WHERE id=? AND churchId=?", [id, churchId]);
  }

}

import { DB } from "../apiBase/db";
import { Asset } from "../models";
import { UniqueIdHelper } from "../helpers";
import { ArrayHelper } from "../apiBase";
import { ConfigurationServicePlaceholders } from "aws-sdk/lib/config_service_placeholders";

export class AssetRepository {

  public save(asset: Asset) {
    if (UniqueIdHelper.isMissing(asset.id)) return this.create(asset); else return this.update(asset);
  }

  public async create(asset: Asset) {
    asset.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO assets (id, churchId, resourceId, fileId, name, sort) VALUES (?, ?, ?, ?, ?, ?);";
    const params = [asset.id, asset.churchId, asset.resourceId, asset.fileId, asset.name, asset.sort];
    await DB.query(sql, params);
    return asset;
  }

  public async update(asset: Asset) {
    const sql = "UPDATE assets SET resourceId=?, fileId=?, name=?, sort=? WHERE id=? AND churchId=?";
    const params = [asset.name, asset.resourceId, asset.fileId, asset.name, asset.sort, asset.id, asset.churchId];
    await DB.query(sql, params);
    return asset;
  }

  public loadByResourceId(churchId: string, resourceId: string): Promise<Asset[]> {
    return DB.query("SELECT * FROM assets WHERE churchId=? AND resourceId=? ORDER BY sort", [churchId, resourceId]);
  }

  public loadByResourceIds(churchId: string, resourceIds: string[]): Promise<Asset[]> {
    const sql = "SELECT * FROM assets WHERE churchId=? AND resourceId IN (" + ArrayHelper.fillArray("?", resourceIds.length) + ") ORDER BY sort";
    return DB.query(sql, [churchId].concat(resourceIds));
  }

  public loadByContentTypeId(churchId: string, contentType: string, contentId: string): Promise<Asset[]> {
    const subQuery = "SELECT id from resources WHERE churchId=? AND contentType=? AND contentId=?";
    return DB.query("SELECT * FROM assets WHERE churchId=? AND resourceId in (" + subQuery + ") order by sort", [churchId, churchId, contentType, contentId]);
  }

  public load(churchId: string, id: string): Promise<Asset> {
    return DB.queryOne("SELECT * FROM assets WHERE id=? and churchId=?", [id, churchId]);
  }

  public delete(churchId: string, id: string): Promise<Asset> {
    return DB.query("DELETE FROM assets WHERE id=? AND churchId=?", [id, churchId]);
  }

}
